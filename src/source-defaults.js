import {clone,effective,applies,fail,safe,validateDocument} from './config.js'

// Defaults are source policy, not a persisted/global scope grant. Their lease
// remains Host-only and is checked alongside the source's actual-use checks.
export function sourceConfiguration(manager,id,{adapterId,scope={},document=manager.configuration.document}={}){
 const local=document.entries.find(entry=>entry.id===id)
 const sourceId=adapterId??local?.sourceAdapterId??local?.adapterId??manager.owners.get(id)?.id
 const adapter=manager.adapters.get(sourceId),lifetime=manager.lifetimes.get(adapter)
 let snapshot=null,sourceDefault={available:false,reason:adapter?'SOURCE_DEFAULTS_UNSUPPORTED':'SOURCE_UNAVAILABLE'}
 if(adapter&&manager.isAdapterEnabled(adapter.id)&&typeof adapter.getManagementDefaults==='function')try{
  snapshot=adapter.getManagementDefaults({id,scope:Object.fromEntries(['sessionId','authority'].filter(key=>Object.hasOwn(scope,key)).map(key=>[key,scope[key]]))})
  if(snapshot===null)sourceDefault={available:false,reason:'SOURCE_DEFAULTS_UNAVAILABLE'}
  else{
   if(!snapshot||snapshot.protocolVersion!==1||typeof snapshot.revision!=='string'||!snapshot.revision||snapshot.scopePolicy!=='source-bound'||typeof snapshot.checkCurrent!=='function')fail('INVALID_SOURCE_DEFAULTS','来源默认配置缺少版本、绑定范围或有效 lease。')
   const configuration=snapshot.configuration
   safe(configuration)
   if(!configuration||Array.isArray(configuration)||Object.keys(configuration).some(key=>!['type','store','retrieve'].includes(key))||JSON.stringify(configuration).length>32000)fail('INVALID_SOURCE_DEFAULTS','来源默认配置只能包含有界 type/store/retrieve 规则。')
   validateDocument({schemaVersion:1,revision:1,entries:[{id,adapterId:sourceId,...configuration}],presets:{}})
   if(snapshot.previewScope!==undefined&&(scope.sessionId||!snapshot.previewScope||typeof snapshot.previewScope!=='object'||Array.isArray(snapshot.previewScope)||Object.entries(snapshot.previewScope).some(([key,value])=>!['characterId','presetId','userId'].includes(key)||typeof value!=='string'||!value)))fail('INVALID_SOURCE_DEFAULTS','Invalid sessionless preview binding.')
   if(snapshot.checkCurrent()!==true)fail('SOURCE_DEFAULTS_CHANGED','来源默认配置或资源绑定已变化。')
   sourceDefault={available:true,revision:snapshot.revision,scopePolicy:snapshot.scopePolicy,configuration:clone(configuration)}
  }
 }catch(error){snapshot=null;sourceDefault={available:false,reason:error.code??'INVALID_SOURCE_DEFAULTS',message:error.message}}
 else if(adapter&&!manager.isAdapterEnabled(adapter.id))sourceDefault={available:false,reason:'SOURCE_DISABLED'}
 const sameRoute=!local||local.adapterId===sourceId
 const base=sourceDefault.available&&sameRoute?{id,adapterId:sourceId,...sourceDefault.configuration}:null
 const composed=effective(document,id,base)
 const scopePolicy=base&&['default','source-default'].includes(composed.origins.whitelist)?'source-bound':'whitelist'
 if(scopePolicy==='source-bound')composed.origins.whitelist='source-default'
 const checkCurrent=()=>{
  try{return !adapter||manager.adapters.get(sourceId)===adapter&&manager.lifetimes.get(adapter)===lifetime&&!lifetime?.signal.aborted&&manager.isAdapterEnabled(sourceId)&&(!snapshot||snapshot.checkCurrent()===true)}catch{return false}
 }
 return {...composed,scopePolicy,sourceDefault,checkCurrent,...(base&&snapshot?.previewScope?{previewScope:clone(snapshot.previewScope)}:{})}
}

export function policyApplies(policy,scope={},trustedSource=false,preview=false){
 if(!policy.config||!policy.checkCurrent())return false
 if(applies(policy.config,scope))return true
 if(!trustedSource||policy.scopePolicy!=='source-bound')return false
 if(!(typeof scope.sessionId==='string'&&scope.sessionId)&&!(preview===true&&policy.previewScope))return false
 return !policy.config.blacklist.some(selector=>Object.entries(selector).every(([key,value])=>key==='global'?value===true:scope[key]===value))
}
