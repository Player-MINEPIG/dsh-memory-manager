import {open,unlink} from 'node:fs/promises'
import {readFileSync,renameSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {isDeepStrictEqual} from 'node:util'
import {clone,fail,safe,validateDocument} from './config.js'
import {builtinPresets} from './builtin-presets.js'
import {capabilityErrors,conditionReferences} from './capabilities.js'
import {canonical} from './canonical.js'
export const PRESET_FORMAT='dsh-memory-manager-presets'
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const keys=(x,allowed,path)=>{if(!object(x)||Object.keys(x).some(k=>!allowed.includes(k)))fail('INVALID_PRESET',`${path} 包含未知字段或不是对象。`)}
function strictRule(value){
 if(typeof value==='boolean'||typeof value==='string')return
 keys(value,['all','any','not','at_least','condition'],'条件')
 if(value.condition){keys(value.condition,['id','params'],'注册条件');if(value.condition.params!==undefined&&!object(value.condition.params))fail('INVALID_PRESET','条件参数必须是对象。')}
 if(value.at_least)keys(value.at_least,['count','conditions'],'至少满足条件')
 if(value.not!==undefined)strictRule(value.not)
 for(const child of value.all??value.any??value.at_least?.conditions??[])strictRule(child)
}
export function strictPreset(preset){
 safe(preset);keys(preset,['id','label','description','adapterIds','configuration'],'预设')
 if(typeof preset.id!=='string'||!preset.id.trim()||preset.id.length>256||typeof preset.label!=='string'||!preset.label.trim()||preset.label.length>200||preset.description!==undefined&&typeof preset.description!=='string')fail('INVALID_PRESET','预设需要有界 ID、名称和文本说明。')
 if(!Array.isArray(preset.adapterIds)||!preset.adapterIds.length||new Set(preset.adapterIds).size!==preset.adapterIds.length||preset.adapterIds.some(id=>typeof id!=='string'||!id))fail('INVALID_PRESET','必须明确选择一个或多个 adapter。')
 const c=preset.configuration;keys(c,['type','store','retrieve'],'预设存取组合')
 if(!Object.hasOwn(c,'store')&&!Object.hasOwn(c,'retrieve'))fail('INVALID_PRESET','预设必须包含存储或读取组合。')
 for(const mode of ['store','retrieve'])if(c[mode]!==undefined){keys(c[mode],['on','rule','strategy'],mode);if(c[mode].rule!==undefined)strictRule(c[mode].rule);if(Array.isArray(c[mode].strategy))for(const step of c[mode].strategy){keys(step,['operation','params'],'策略步骤');if(step.params!==undefined&&!object(step.params))fail('INVALID_PRESET','操作参数必须是对象。')}}
 validateDocument({schemaVersion:1,revision:1,entries:[],presets:{[preset.id]:c}})
 return clone(preset)
}
export function presetLibrary(manager){
 const items=new Map(Object.entries(builtinPresets).filter(([,p])=>!p.legacy).map(([id,p])=>[id,{id,label:p.label,description:p.description??'',adapterIds:p.adapterIds,configuration:clone(p.configuration),origin:'builtin'}]))
 for(const adapter of manager.adapters.values())for(const p of adapter.optionCatalog?.presets??[]){const id=Object.hasOwn(builtinPresets,p.id)&&builtinPresets[p.id].adapterIds.includes(adapter.id)?p.id:`adapter:${adapter.id}:${p.id}`;items.set(id,{...clone(p),id,description:p.description??'',adapterIds:[adapter.id],origin:'adapter'})}
 const doc=manager.configuration.document
 for(const [id,configuration] of Object.entries(doc.presets)){const old=items.get(id),meta=doc.presetMetadata?.[id];items.set(id,{id,label:meta?.label??old?.label??id,description:meta?.description??old?.description??'',adapterIds:meta?.adapterIds??old?.adapterIds??[],configuration:clone(configuration),origin:'local'})}
 return [...items.values()]
}
export async function validatePresets(manager,bundle){
 safe(bundle);keys(bundle,['format','version','presets'],'导入文件')
 if(bundle.format!==PRESET_FORMAT||bundle.version!==1||!Array.isArray(bundle.presets)||!bundle.presets.length||bundle.presets.length>200)fail('INVALID_PRESET','需要 version 1 的存取预设文件（1–200 项）。')
 const seen=new Set(),conditions=manager.usage?.conditions??new Map(),operations=manager.usage?.operations??new Map(),generation=manager.catalogGeneration,document=manager.configuration.document
 const registrations=[...manager.adapters.values()],conditionSnapshot=[...conditions],operationSnapshot=[...operations],presets=[]
 for(const raw of bundle.presets){const p=strictPreset(raw);if(seen.has(p.id))fail('INVALID_PRESET','导入文件中预设 ID 重复。');seen.add(p.id)
  for(const id of p.adapterIds){const adapter=manager.adapters.get(id);if(!adapter||!manager.isAdapterEnabled(id)||!adapter.optionCatalog)fail('PRESET_ADAPTER_UNAVAILABLE',`adapter 未接入、停用或未声明选项能力：${id}`)
   const errors=capabilityErrors(adapter,p.configuration,conditions,operations,{catalogStrategies:true})
   for(const mode of ['store','retrieve']){
    const behavior=p.configuration[mode];if(!behavior)continue
    for(const ref of conditionReferences(behavior.rule))if(Object.keys(ref.params).length&&!conditions.get(ref.id)?.option?.parameters)errors.push({field:mode+'.rule',message:'条件参数未由能力描述声明。'})
    if(adapter.strategyOwner!=='source')for(const step of typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy??[])if(Object.keys(step.params??{}).length&&!operations.get(step.operation)?.option?.parameters)errors.push({field:mode+'.strategy',message:'操作参数未由能力描述声明。'})
   }
   // Source-owned chains must use steps actually declared by that source.
   if(adapter.strategyOwner==='source')for(const mode of ['store','retrieve']){const behavior=p.configuration[mode];if(!behavior?.strategy)continue;const steps=typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy;const declared=(adapter.optionCatalog.strategies??[]).filter(s=>s.mode===mode).flatMap(s=>s.value);if(steps.some(step=>!declared.some(value=>canonical(value)===canonical(step))))errors.push({field:mode+'.strategy',message:'操作或参数未由当前来源声明。'})}
   if(errors.length)throw Object.assign(Error(`预设 ${p.label} 不适用于 ${id}；未导入。`),{code:'INVALID_PRESET',diagnostics:errors})
   await adapter.validatePreset?.(clone(p.configuration))
  }
  presets.push(p)
 }
 const checkCurrent=()=>manager.configuration.document===document&&manager.catalogGeneration===generation&&registrations.length===manager.adapters.size&&registrations.every(a=>manager.adapters.get(a.id)===a)&&conditionSnapshot.length===conditions.size&&conditionSnapshot.every(([k,v])=>conditions.get(k)===v)&&operationSnapshot.length===operations.size&&operationSnapshot.every(([k,v])=>operations.get(k)===v)&&presets.every(p=>p.adapterIds.every(id=>manager.isAdapterEnabled(id)))
 if(!checkCurrent())fail('VALIDATION_STALE','校验期间配置或能力发生变化；未导入。')
 return {presets,checkCurrent}
}
export function savePresets(manager,{bundle,expectedRevision,replace=false}){
 if(typeof replace!=='boolean')fail('INVALID_PRESET','replace 必须是布尔值。')
 const config=manager.configuration
 const job=config.pending.catch(()=>{}).then(async()=>{
  if(!config.loaded)fail('CONFIG_UNAVAILABLE','管理配置尚未成功读取。')
  const current=config.document;if(expectedRevision!==current.revision)fail('REVISION_CONFLICT','预设版本已变化，请重新载入。')
  const {presets,checkCurrent}=await validatePresets(manager,bundle),next=clone(current)
  next.presetMetadata??={}
  for(const p of presets){if(!replace&&presetLibrary(manager).some(x=>x.id===p.id))fail('PRESET_EXISTS',`预设 ID 已存在：${p.id}；请使用新 ID 或明确编辑。`);next.presets[p.id]=p.configuration;next.presetMetadata[p.id]={label:p.label,description:p.description??'',adapterIds:p.adapterIds}}
  const assertDisk=()=>{let disk;try{disk=validateDocument(JSON.parse(readFileSync(config.path,'utf8')))}catch{fail('REVISION_CONFLICT','磁盘配置无法校验，未覆盖。')}if(!isDeepStrictEqual(disk,current))fail('REVISION_CONFLICT','磁盘配置已被其他编辑修改；未覆盖。')}
  assertDisk();if(!checkCurrent())fail('VALIDATION_STALE','预设校验已失效。')
  if(isDeepStrictEqual(next,current))return {revision:current.revision,unchanged:true,presets:presetLibrary(manager)}
  // Editing a referenced preset must preserve every affected resource's contract.
  for(const entry of next.entries.filter(e=>presets.some(p=>p.id===e.preset))){const policy=manager.getConfig(entry.id,{adapterId:entry.sourceAdapterId??entry.adapterId,document:next}),adapter=manager.adapters.get(entry.adapterId);if(!adapter||!manager.isAdapterEnabled(adapter.id)||typeof adapter.validateConfig!=='function')fail('PRESET_IN_USE_UNAVAILABLE','被引用预设的资源来源当前无法校验，未保存。');const errors=capabilityErrors(adapter,policy.config,manager.usage?.conditions??new Map(),manager.usage?.operations??new Map(),{catalogStrategies:true});if(errors.length)throw Object.assign(Error('预设与引用资源不兼容，未保存。'),{code:'INVALID_PRESET',diagnostics:errors});await adapter.validateConfig(clone(policy.config))}
  if(!checkCurrent())fail('VALIDATION_STALE','资源校验期间能力或配置发生变化。')
  next.revision++;if(!Number.isSafeInteger(next.revision))fail('REVISION_CONFLICT','配置版本无法安全递增。');validateDocument(next)
  const temp=config.path+'.tmp-'+randomUUID();let file
  try{file=await open(temp,'wx',0o600);await file.writeFile(JSON.stringify(next,null,2)+'\n');await file.sync();await file.close();file=null;assertDisk();if(!checkCurrent())fail('VALIDATION_STALE','保存前能力已变化。');renameSync(temp,config.path);config.document=next;config.error=null;return {revision:next.revision,unchanged:false,presets:presetLibrary(manager)}}finally{await file?.close();await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
 })
 config.pending=job;return job
}
