import {conditionReferences} from './capabilities.js'
// The catalog retains provider availability; draft-dependent gates are recomputed
// on every render so changing type or preset can enable a previously invalid choice.
function descriptorStatus(option,{adapterId,mode,type}){
 if(option.available===false)return {available:false,reason:option.reason??'当前来源不支持'}
 if(adapterId&&option.adapterIds?.length&&!option.adapterIds.includes(adapterId))return {available:false,reason:'此能力不适用于当前来源。'}
 if(option.modes?.length&&!option.modes.includes(mode))return {available:false,reason:'此能力不适用于当前模式。'}
 if(option.types?.length&&!option.types.includes(type))return {available:false,reason:type?'此能力不适用于当前生效类型：'+type:'请先选择兼容的类型或预设。'}
 return {available:true}
}
export function contextualCatalog(catalog,{mode,type,filter=false}={}){
 const context={adapterId:catalog.adapterId,mode,type}
 const adjust=options=>options.map(o=>({...o,...(filter?{available:true}:descriptorStatus(o,context))}))
 return {...catalog,conditions:adjust(catalog.conditions),operations:adjust(catalog.operations)}
}
export function optionAvailability(option,field,catalog,{type,localType}={}){
 const mode=field.split('.')[0],context={adapterId:catalog.adapterId,mode,type}
 const status=descriptorStatus(option,context);if(!status.available)return status
 const references=(value,child,ctx)=>{
  const refs=child==='rule'?conditionReferences(value):child==='strategy'?(typeof value==='string'?[{operation:value}]:value??[]).map(s=>({id:s.operation})):[]
  if(child==='strategy'&&catalog.adapters.find(a=>a.id===catalog.adapterId)?.strategyOwner==='source')return {available:true}
  for(const ref of refs){const descriptor=(child==='rule'?catalog.conditions:catalog.operations).find(o=>o.id===ref.id);if(!descriptor)return {available:false,reason:'引用的能力尚未注册：'+ref.id};const result=descriptorStatus(descriptor,ctx);if(!result.available)return result}
  return {available:true}
 }
 if(field==='preset'){
  const config=option.configuration??{},presetType=Object.hasOwn(config,'type')?config.type:localType
  for(const m of ['store','retrieve'])for(const child of ['rule','strategy']){const result=references(config[m]?.[child],child,{...context,mode:m,type:presetType});if(!result.available)return result}
  return status
 }
 return references(option.value,field.split('.')[1],context)
}
