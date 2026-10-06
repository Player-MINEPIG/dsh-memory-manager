import {strictPreset,presetLibrary} from './preset-library.js'
import {capabilityErrors} from './capabilities.js'
import {createHash} from 'node:crypto'
import {clone,safe,fail} from './config.js'
import {builtinPresets} from './builtin-presets.js'
import {validateParameterSchema} from './option-schema.js'
import {canonical} from './filters.js'
export function normalizeRegistration(id,metadata={}){
 const result={id,label:metadata.label??id,description:metadata.description??'',adapterIds:metadata.adapterIds??[],types:metadata.types??[],modes:metadata.modes??[],parameters:metadata.parameters??null}
 safe(result)
 if(JSON.stringify(result).length>64000)fail('INVALID_OPTION_SCHEMA','能力描述超过 64 KB。')
 if(typeof result.label!=='string'||typeof result.description!=='string'||!Array.isArray(result.adapterIds)||result.adapterIds.some(v=>typeof v!=='string'))fail('INVALID_OPTION_SCHEMA','能力描述必须包含文本名称与来源 ID 数组。')
 if(!Array.isArray(result.types)||result.types.some(v=>typeof v!=='string')||!Array.isArray(result.modes)||result.modes.some(v=>!['store','retrieve'].includes(v)))fail('INVALID_OPTION_SCHEMA','类型或模式范围无效。')
 if(result.parameters)validateParameterSchema(result.parameters)
 return clone(result)
}
export function validateAdapterCatalog(catalog){
 if(!catalog)return
 safe(catalog)
 if(JSON.stringify(catalog).length>256000||Object.keys(catalog).some(k=>!['version','types','events','strategies','presets','modes'].includes(k)))fail('INVALID_OPTION_SCHEMA','选项目录过大或包含未知属性。')
 if(catalog.version!==1)fail('INVALID_OPTION_SCHEMA','Unsupported option catalog version')
 for(const key of ['types','events','strategies','presets']){
  const seen=new Set()
  if(catalog[key]!==undefined&&(!Array.isArray(catalog[key])||catalog[key].length>200))fail('INVALID_OPTION_SCHEMA',key+' must be an array')
  for(const option of catalog[key]??[]){
   const allowed=['id','label','description',...({types:[],events:['mode'],strategies:['mode','events','value'],presets:['configuration']}[key])]
   if(!option||Object.keys(option).some(k=>!allowed.includes(k))||option.description!==undefined&&typeof option.description!=='string')fail('INVALID_OPTION_SCHEMA','选项包含不支持的字段。')
   if(typeof option.id!=='string'||!option.id||seen.has(option.id)||typeof option.label!=='string')fail('INVALID_OPTION_SCHEMA','选项需要唯一 ID 与名称。');seen.add(option.id)
   if(key==='presets')strictPreset({...option,adapterIds:['catalog-adapter']})
   if(['events','strategies'].includes(key)&&!['store','retrieve'].includes(option.mode))fail('INVALID_OPTION_SCHEMA','选项 mode 无效。')
   if(key==='strategies'&&(!Array.isArray(option.events)||option.events.some(id=>typeof id!=='string'||!(catalog.events??[]).some(event=>event.id===id&&event.mode===option.mode))||!Array.isArray(option.value)||option.value.some(v=>typeof v.operation!=='string')))fail('INVALID_OPTION_SCHEMA','策略需要事件与真实操作链。')
  }
 }
 if(catalog.modes&&Object.keys(catalog.modes).some(k=>!['store','retrieve'].includes(k)))fail('INVALID_OPTION_SCHEMA','模式名称无效。')
 for(const mode of Object.values(catalog.modes??{}))if(!mode||Object.keys(mode).some(k=>!['supported','reason','onSelection','strategySelection'].includes(k))||mode.reason!==undefined&&typeof mode.reason!=='string'||typeof mode.supported!=='boolean'||(mode.onSelection&&!['single','multiple'].includes(mode.onSelection))||(mode.strategySelection&&!['fixed','chain'].includes(mode.strategySelection)))fail('INVALID_OPTION_SCHEMA','模式能力声明无效。')
}
const at=(object,path)=>path.split('.').reduce((v,k)=>v?.[k],object)
export function optionCatalog(manager,{adapterId,id,sessionId}={}){
 const adapters=[...manager.adapters.values()],selected=manager.adapters.get(adapterId)
 const available=(adapterIds=[])=>!adapterId||!adapterIds.length||adapterIds.includes(adapterId)
 const conditions=[...(manager.usage?.conditions??[])].map(([id,fn])=>({...clone(fn.option??normalizeRegistration(id)),available:available(fn.option?.adapterIds)}))
 const operations=[...(manager.usage?.operations??[])].map(([id,op])=>({...clone(op.option??normalizeRegistration(id)),readOnly:op.readOnly,available:available(op.option?.adapterIds)}))
 const providerStatus=(ids,sourceRequired=false)=>{const matching=ids.length?adapters.filter(a=>ids.includes(a.id)):adapters;if(!matching.length)return {available:false,reason:'提供方未接入。'};if(!available(ids))return {available:false,reason:'该选项属于其他资源提供方。'};if(sourceRequired&&!matching.some(a=>a.strategyOwner==='source'&&a.registerUsage))return {available:false,reason:'当前来源仅支持原生只读查看，未提供管理策略接口。'};return {available:true}}
 const compatible=configuration=>adapters.filter(a=>(configuration.type===undefined?[undefined,...(a.optionCatalog?.types??[]).map(t=>t.id)]:[configuration.type]).some(type=>!capabilityErrors(a,{...configuration,type},manager.usage?.conditions??new Map(),manager.usage?.operations??new Map(),{catalogStrategies:true}).length)).map(a=>a.id)
 const presets=presetLibrary(manager).map(item=>{const {id:key,configuration}=item,meta=item;const declared=meta.adapterIds??[],ids=compatible(configuration).filter(id=>!declared.length||declared.includes(id));return {id:key,label:meta.label??key,description:meta.description??'',adapterIds:ids.length?ids:declared,configuration:clone(configuration),origin:item.origin,...(ids.length?providerStatus(ids,meta.requiresSourcePolicy??builtinPresets[key]?.requiresSourcePolicy):{available:false,reason:'当前没有兼容此预设的已注册来源与能力。'})}})
 const fields={type:[],preset:presets.map(p=>({...p,value:p.id})),whitelist:[],blacklist:[],'store.on':[],'retrieve.on':[],'store.rule':[],'retrieve.rule':[],'store.strategy':[],'retrieve.strategy':[]}
 const append=(field,option)=>{const index=fields[field].findIndex(o=>canonical(o.value)===canonical(option.value)&&canonical(o.adapterIds)===canonical(option.adapterIds));if(index<0)fields[field].push(option);else fields[field][index].presetIds=[...new Set([...fields[field][index].presetIds,...option.presetIds])]}
 for(const adapter of adapters){
  const catalog=adapter.optionCatalog??{},status=providerStatus([adapter.id])
  for(const type of catalog.types??[])append('type',{...clone(type),value:type.id,adapterIds:[adapter.id],presetIds:[],...status})
  for(const event of catalog.events??[])append(event.mode+'.on',{...clone(event),value:event.id,adapterIds:[adapter.id],presetIds:[],...status})
  for(const strategy of catalog.strategies??[])append(strategy.mode+'.strategy',{...clone(strategy),adapterIds:[adapter.id],presetIds:[],...status})
 }
 for(const mode of ['store','retrieve']){
  fields[mode+'.rule'].push({id:'always',label:'始终满足',value:true,adapterIds:[],presetIds:[],available:true},{id:'never',label:'始终不满足',value:false,adapterIds:[],presetIds:[],available:true})
  for(const condition of conditions)fields[mode+'.rule'].push({...condition,value:condition.id,presetIds:[],kind:'condition'})
 }
 for(const preset of presets)for(const field of Object.keys(fields).filter(f=>!['preset','adapterId'].includes(f))){
  const value=at(preset.configuration,field);if(value===undefined)continue
  const values=field.endsWith('.on')&&Array.isArray(value)?value:[value]
  for(const v of values)append(field,{id:`preset:${preset.id}:${field}:${canonical(v)}`,label:preset.label+' · '+field,value:clone(v),adapterIds:preset.adapterIds,presetIds:[preset.id],available:preset.available,reason:preset.reason})
 }
 for(const [kind,field] of [['rules','rule'],['strategies','strategy']])for(const option of manager.configuration.document.catalog?.[kind]??[])for(const mode of option.modes??['store','retrieve']){const ids=compatible({[mode]:{[field]:option.value}}).filter(id=>!option.adapterIds?.length||option.adapterIds.includes(id));append(mode+'.'+field,{...clone(option),adapterIds:ids.length?ids:option.adapterIds??[],presetIds:[],origin:'local',...(ids.length?providerStatus(ids):{available:false,reason:'组合引用的能力未注册或与来源不兼容。'})})}
 for(const mode of ['store','retrieve'])if(selected&&selected.optionCatalog?.modes?.[mode]?.supported!==true)for(const child of ['on','rule','strategy'])fields[mode+'.'+child]=fields[mode+'.'+child].map(option=>({...option,available:false,reason:selected.optionCatalog?.modes?.[mode]?.reason??'当前来源不支持此模式。'}))
 fields.adapterId=adapters.map(a=>({id:a.id,label:a.name??a.id,value:a.id,adapterIds:[],presetIds:[],available:manager.isAdapterEnabled(a.id),reason:manager.isAdapterEnabled(a.id)?undefined:'adapter 已停用；可选择草稿，保存会明确拒绝。'}))
 const scopes=[{id:'global',label:'所有作用域',value:{global:true},description:'匹配所有范围；并非资源访问授权。'},...(sessionId?[{id:'session',label:'当前会话',value:{sessionId}}]:[])]
 for(const field of ['whitelist','blacklist'])fields[field]=scopes.map(s=>({...s,value:[s.value],adapterIds:[],presetIds:[],available:true}))
 const catalogRevision=createHash('sha256').update(JSON.stringify([manager.catalogGeneration??0,conditions,operations,presets,manager.configuration.document.catalog??null,adapters.map(a=>[a.id,manager.isAdapterEnabled(a.id),a.optionCatalog??null])])).digest('hex')
 return {directories:manager.scopeDirectory.catalog(),scopeKinds:{global:'所有作用域',sessionId:'会话',workspaceId:'Workspace',characterId:'角色卡',presetId:'Tavern 预设',userId:'Persona / 用户角色'},version:1,catalogRevision,revision:manager.configuration.document.revision,id,adapterId,adapters:adapters.map(a=>({id:a.id,label:a.name??a.id,strategyOwner:a.strategyOwner??'manager',enabled:manager.isAdapterEnabled(a.id),modes:clone(a.optionCatalog?.modes??{})})),fields,conditions,operations,presets,modes:clone(selected?.optionCatalog?.modes??{}),requestSourceAvailable:!!manager.requestSourceAvailable,documentation:'/api/dsh-memory-manager/options-documentation'}
}
