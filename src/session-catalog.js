import {clone,fail,safe} from './config.js'

const fields=['id','adapterId','type','name','revision','managementMode','enabled','sourceError','capabilities','diagnostics','binding']
function metadata(items,sessionId,adapterId){
 if(!Array.isArray(items)||items.length>2000)fail('INVALID_SESSION_BINDINGS','来源没有返回有界的资源绑定 metadata。')
 safe(items)
 if(JSON.stringify(items).length>1_000_000)fail('INVALID_SESSION_BINDINGS','资源绑定 metadata 超出范围。')
 const seen=new Set()
 return items.map(item=>{
  const key=JSON.stringify([item?.adapterId,item?.id])
  if(!item||typeof item.id!=='string'||!item.id||typeof item.type!=='string'||!item.type||typeof item.adapterId!=='string'||!item.adapterId||(adapterId!==undefined&&item.adapterId!==adapterId)||seen.has(key)||item.binding?.sessionId!==sessionId||typeof item.binding.kind!=='string'||!item.binding.kind||Object.hasOwn(item,'content')||Object.hasOwn(item,'facts')||Object.hasOwn(item,'activeFacts')||Object.hasOwn(item,'variables'))fail('INVALID_SESSION_BINDINGS','绑定目录必须提供当前会话、唯一稳定 ID、真实来源和 metadata，不含正文或历史。')
  seen.add(key)
  return Object.fromEntries(fields.filter(key=>Object.hasOwn(item,key)).map(key=>[key,clone(item[key])]))
 })
}
// This snapshot lives only for one query. Source binding facts never grant usage
// or become a configuration entry, and do not come from browser scope claims.
export async function sessionCatalog(manager,{scope,adapters,signal}){
 const result=new Map(),source=manager.boundMemorySource,catalogGeneration=manager.catalogGeneration
 const request={scope:{sessionId:scope.sessionId,...(scope.authority?{authority:scope.authority}:{})},signal}
 let shared
 for(const adapter of adapters){
  const lifetime=manager.lifetimes.get(adapter)
  try{
   signal?.throwIfAborted()
   let value,aggregate=false
   const allSessions=adapter.catalogScope==='all-sessions'
   if(allSessions){
    value={items:await manager.invoke(adapter,'list',request),checkCurrent:()=>true}
   }else if(typeof source?.listBound==='function'&&(source.adapters.includes(adapter)||adapter.id==='tavern.mvu')){
    aggregate=true
    shared??=Promise.resolve().then(()=>source.listBound(request))
    value=await shared
   }else{
    if(typeof adapter.listBound!=='function')fail('SESSION_BINDINGS_UNAVAILABLE','来源未确认当前会话的资源绑定；不使用全局目录、白名单或历史记录代替。')
    value=await manager.invoke(adapter,'listBound',request)
   }
   if(!value||(!allSessions&&typeof value.revision!=='string')||typeof value.checkCurrent!=='function'||!Array.isArray(value.items))fail('INVALID_SESSION_BINDINGS','来源没有返回当前资源绑定 metadata 和有效 lease。')
   const checkCurrent=value.checkCurrent,items=allSessions?clone(value.items):metadata(value.items,scope.sessionId,aggregate?undefined:adapter.id).filter(item=>item.adapterId===adapter.id)
   const check=()=>{
    try{return !signal?.aborted&&manager.catalogGeneration===catalogGeneration&&manager.adapters.get(adapter.id)===adapter&&manager.lifetimes.get(adapter)===lifetime&&!lifetime.signal.aborted&&manager.isAdapterEnabled(adapter.id)&&(adapter.catalogScope==='all-sessions')===allSessions&&(!aggregate||manager.boundMemorySource===source)&&checkCurrent.call(value)===true}catch{return false}
   }
   result.set(adapter.id,{items,check,catalogScope:allSessions?'all-sessions':'bound'})
  }catch(error){result.set(adapter.id,{error})}
 }
 signal?.throwIfAborted()
 return id=>{
  const row=result.get(id)
  if(row.error)throw row.error
  if(!row.check())fail('SESSION_BINDINGS_CHANGED','会话资源绑定在读取期间变化，请重新读取。')
  return {items:row.items,catalogScope:row.catalogScope}
 }
}
