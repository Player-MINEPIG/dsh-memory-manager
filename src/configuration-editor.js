import {capabilityErrors} from './capabilities.js'
import {parameterErrors} from './option-schema.js'
import {presetLibrary} from './preset-library.js'
import {presetDefinitions} from './builtin-presets.js'
import {readFile,open,unlink} from 'node:fs/promises'
import {readFileSync,renameSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {isDeepStrictEqual} from 'node:util'
import {clone,fail,validateDocument} from './config.js'

function identity({id,adapterId,entry}){
 if(typeof id!=='string'||!id||typeof adapterId!=='string'||!adapterId)fail('INVALID_CONFIG','资源 ID 和提供方不能为空。')
 if(entry&&(entry.id!==id||(entry.sourceAdapterId??entry.adapterId)!==adapterId))fail('IDENTITY_CONFLICT','资源 ID 和权威来源必须保留；更换条目 adapter 只设置规则路由，不迁移正文。')
}
export function configurationSnapshot(manager,{id,adapterId,sessionId}){
 identity({id,adapterId})
 const doc=manager.configuration.document,local=doc.entries.find(e=>e.id===id)??null
 if(local&&(local.sourceAdapterId??local.adapterId)!==adapterId)fail('OWNERSHIP_CONFLICT','该资源已绑定其他提供方。')
 const {checkCurrent,...policy}=manager.getConfig(id,{adapterId,scope:sessionId?{sessionId}:{}})
 return {id,adapterId,revision:doc.revision,local:clone(local),...policy,presets:Object.fromEntries(presetLibrary(manager).map(p=>[p.id,clone(p.configuration)])),configError:manager.configuration.error,sourceAvailable:manager.isAdapterEnabled(adapterId)}
}
function proposedDocument(manager,{id,adapterId,entry,expectedRevision}){
 identity({id,adapterId,entry})
 const doc=manager.configuration.document
 if(!manager.configuration.loaded)fail('CONFIG_UNAVAILABLE','尚未成功读取管理配置文件，请先修复文件并重新读取。')
 if(!Number.isInteger(expectedRevision)||expectedRevision!==doc.revision)fail('REVISION_CONFLICT',`配置已变化：编辑版本 ${expectedRevision??'未提供'}，当前版本 ${doc.revision}。请重新载入后合并修改。`)
 if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('INVALID_CONFIG','本地配置必须是 JSON 对象。')
 const existing=doc.entries.find(e=>e.id===id)
 if(existing&&(existing.sourceAdapterId??existing.adapterId)!==adapterId)fail('OWNERSHIP_CONFLICT','该资源已绑定其他提供方。')
 const entries=existing?doc.entries.map(e=>e.id===id?clone(entry):e):[...doc.entries,clone(entry)]
 const presets=clone(doc.presets),presetMetadata=clone(doc.presetMetadata??{}),defaultPreset=presetLibrary(manager).find(p=>p.id===entry.preset)
 if(defaultPreset&&!Object.hasOwn(presetDefinitions(doc),entry.preset)){presets[defaultPreset.id]=clone(defaultPreset.configuration);presetMetadata[defaultPreset.id]={label:defaultPreset.label,description:defaultPreset.description,adapterIds:defaultPreset.adapterIds}}
 return validateDocument({...clone(doc),entries,presets,...(Object.keys(presetMetadata).length?{presetMetadata}:{})})
}
function conditionReferences(rule){
 if(typeof rule==='string')return [{id:rule,params:{}}]
 if(!rule||typeof rule!=='object')return []
 if(rule.condition)return [{id:rule.condition.id,params:rule.condition.params??{}}]
 if(rule.not!==undefined)return conditionReferences(rule.not)
 return (rule.all??rule.any??rule.at_least?.conditions??[]).flatMap(conditionReferences)
}
async function inspect(manager,args,{duringSave=false}={}){
 const doc=manager.configuration.document,epoch=manager.configuration.pending,diagnostics=[],catalogRevision=manager.optionCatalog({id:args.id,adapterId:args.entry?.adapterId??args.adapterId}).catalogRevision
 const add=(level,code,field,message)=>diagnostics.push({level,code,field,message})
 let next
 try{if(args.expectedCatalogRevision&&args.expectedCatalogRevision!==catalogRevision)fail('CATALOG_CHANGED','选项能力已变化，请重新查看并校验草稿。');next=proposedDocument(manager,args)}catch(e){return {report:{valid:false,revision:doc.revision,diagnostics:[{level:'error',code:e.code??'INVALID_CONFIG',field:'configuration',message:e.message}]},checkCurrent:()=>false}}
 const composed=manager.getConfig(args.id,{adapterId:args.adapterId,scope:args.sessionId?{sessionId:args.sessionId}:{},document:next}),adapter=manager.adapters.get(args.entry.adapterId),source=manager.adapters.get(args.adapterId),lifetime=manager.lifetimes.get(adapter),sourceLifetime=manager.lifetimes.get(source),usage=manager.usage
 const conditions=new Map(usage?.conditions??[]),operations=new Map(usage?.operations??[])
 const owns=()=>{try{manager.assertOwner(source,args.id);return true}catch{return false}}
 const checkCurrent=()=>composed.checkCurrent()&&manager.optionCatalog({id:args.id,adapterId:args.entry?.adapterId??args.adapterId}).catalogRevision===catalogRevision&&owns()&&manager.configuration.document===doc&&(duringSave||manager.configuration.pending===epoch)&&manager.adapters.get(args.entry.adapterId)===adapter&&manager.isAdapterEnabled(adapter?.id)&&manager.lifetimes.get(adapter)===lifetime&&!lifetime?.signal.aborted&&manager.adapters.get(args.adapterId)===source&&manager.isAdapterEnabled(source?.id)&&manager.lifetimes.get(source)===sourceLifetime&&!sourceLifetime?.signal.aborted&&conditions.size===(usage?.conditions.size??0)&&[...conditions].every(([k,v])=>usage.conditions.get(k)===v)&&operations.size===(usage?.operations.size??0)&&[...operations].every(([k,v])=>usage.operations.get(k)===v)
 if(!source||!manager.isAdapterEnabled(args.adapterId))add('error','SOURCE_UNAVAILABLE','resource','权威来源已卸载或停用；不迁移资源正文。')
 else if(typeof source.getManagementDefaults==='function'&&!composed.sourceDefault.available)add('error',composed.sourceDefault.reason,'configuration',composed.sourceDefault.message??'来源未提供当前资源与范围的有效默认配置，请重新读取来源状态。')
 if(adapter&&args.entry.adapterId!==args.adapterId){
  if(adapter.strategyOwner==='source'||typeof adapter.validateResourceRoute!=='function')add('error','ROUTE_UNSUPPORTED','adapterId','所选 adapter 未提供跨源资源路由验证；草稿可保留，无法保存此组合。')
  else try{const route=await manager.invoke(adapter,'validateResourceRoute',{id:args.id,sourceAdapterId:args.adapterId,scope:args.sessionId?{sessionId:args.sessionId}:{}});if(route?.supported!==true||route.id!==args.id||route.sourceAdapterId!==args.adapterId)throw Error('未确认真实资源 ID 与权威来源');add('info','RESOURCE_ROUTE_VALIDATED','adapterId','规则通过所选 adapter 执行；正文仍由原来源读取并校验权限。')}catch(e){add('error',e.code??'ROUTE_UNSUPPORTED','adapterId',e.message)}
 }
 if(!adapter||!manager.isAdapterEnabled(adapter.id))add('error','SOURCE_UNAVAILABLE','adapterId','提供方当前未注册，无法判定组合是否受支持；配置未保存。')
 else if(typeof adapter.validateConfig!=='function')add('error','VALIDATION_UNAVAILABLE','adapterId','提供方没有只读配置校验接口，可行性不可判定；配置未保存。')
 else try{manager.assertOwner(source,args.id);await adapter.validateConfig(clone(composed.config));add('info','SOURCE_VALIDATED','adapterId','提供方配置校验通过。')}catch(e){add('error',e.code??'SOURCE_VALIDATION_FAILED','configuration',`提供方拒绝此配置：${e.message}`)}
 if(adapter)for(const error of capabilityErrors(adapter,composed.config,conditions,operations))add('error','CAPABILITY_MISMATCH',error.field,error.message)
 for(const mode of ['store','retrieve']){
  const behavior=composed.config[mode]
  if(!behavior)continue
  for(const ref of conditionReferences(behavior.rule)){const condition=conditions.get(ref.id);if(!condition)add('error','CONDITION_UNREGISTERED',`${mode}.rule`,`条件尚未注册：${ref.id}`);else if(condition.option?.parameters)for(const message of parameterErrors(condition.option.parameters,ref.params,ref.id))add('error','INVALID_PARAMETERS',`${mode}.rule`,message)}
  if(adapter?.strategyOwner!=='source')for(const step of typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy??[]){const operation=operations.get(step.operation);if(!operation)add('error','OPERATION_UNREGISTERED',`${mode}.strategy`,`操作尚未注册：${step.operation}`);else if(operation.option?.parameters)for(const message of parameterErrors(operation.option.parameters,step.params??{},step.operation))add('error','INVALID_PARAMETERS',`${mode}.strategy`,message)}
  if(behavior.on!==undefined)add('unknown','EVENT_CONTEXT_UNCHECKED',`${mode}.on`,'已检查配置格式；此校验不触发事件，实际事件可达性和所需上下文须运行时确认。')
 }
 if(composed.scopePolicy==='source-bound')add('info','SOURCE_BOUND_DEFAULT','whitelist','继承来源默认绑定范围；实际选择、资源绑定和权限继续由来源验证。未生成全会话白名单。')
 else if(!composed.config.whitelist.length)add('info','EMPTY_WHITELIST','whitelist','白名单为空，当前配置不会在任何范围生效。')
 add('unknown','RUNTIME_AUTHORIZATION_UNCHECKED','resource','未读取或修改资源，也未运行条件或操作。资源存在性、内容兼容性及当前权限由来源在实际执行时检查；校验通过不授予权限或接管原生行为。')
 if(!checkCurrent())add('error','VALIDATION_STALE','configuration','校验期间配置、提供方或能力注册发生变化，请重新校验。')
 return {report:{valid:!diagnostics.some(d=>d.level==='error'),revision:doc.revision,local:clone(args.entry),effective:composed.config,origins:composed.origins,scopePolicy:composed.scopePolicy,sourceDefault:composed.sourceDefault,diagnostics},next,checkCurrent}
}
export async function validateEntry(manager,args){return (await inspect(manager,args)).report}

export function saveEntry(manager,args){
 // Share the reload queue/epoch. Merely starting a save revokes older runtime
 // leases, but dry-run inspection does not touch this queue.
 const configuration=manager.configuration
 const job=configuration.pending.catch(()=>{}).then(async()=>{
  const {report,next,checkCurrent}=await inspect(manager,args,{duringSave:true})
  if(!report.valid)throw Object.assign(new Error('配置校验未通过；未保存。'),{code:report.diagnostics.some(d=>d.code==='REVISION_CONFLICT')?'REVISION_CONFLICT':'VALIDATION_FAILED',diagnostics:report.diagnostics})
  const current=configuration.document
  const assertDisk=text=>{let disk;try{disk=validateDocument(JSON.parse(text))}catch{fail('REVISION_CONFLICT','磁盘配置无法校验，可能已被外部修改。请先修复并重新读取；没有覆盖文件。')}if(!isDeepStrictEqual(disk,current))fail('REVISION_CONFLICT','磁盘配置已被外部修改。请先重新读取并合并修改；没有覆盖文件。')}
  assertDisk(await readFile(configuration.path,'utf8'))
  if(!checkCurrent())fail('VALIDATION_STALE','校验期间配置或来源能力变化；未保存。')
  if(isDeepStrictEqual(next,current)){configuration.error=null;return {...configurationSnapshot(manager,args),unchanged:true,validation:report}}
  next.revision=current.revision+1
  if(!Number.isSafeInteger(next.revision))fail('REVISION_CONFLICT','配置版本已超出可安全递增的范围。')
  // Revision growth changes the serialized document too (e.g. 9 -> 10).
  // Validate the exact final document before creating any temporary file.
  validateDocument(next)
  const temp=configuration.path+'.tmp-'+randomUUID()
  let file
  try{
   file=await open(temp,'wx',0o600);await file.writeFile(JSON.stringify(next,null,2)+'\n');await file.sync();await file.close();file=null
   // No JS yield between final disk/generation check and atomic publication.
   assertDisk(readFileSync(configuration.path,'utf8'))
   if(!checkCurrent())fail('VALIDATION_STALE','保存前配置或来源能力变化；未保存。')
   renameSync(temp,configuration.path)
   configuration.document=next;configuration.loaded=true;configuration.error=null
   return {...configurationSnapshot(manager,args),unchanged:false,validation:report}
  }finally{await file?.close();await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
 })
 configuration.pending=job
 return job
}
