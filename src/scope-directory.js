import {clone,fail,safe} from './config.js'
export const scopeKinds={global:'所有作用域',sessionId:'会话',workspaceId:'Workspace',characterId:'角色卡',presetId:'Tavern 预设',userId:'Persona / 用户角色'}
export class ScopeDirectory {
 providers=new Map();generation=0;disabled=new Set()
 register(provider){
  if(!provider?.id||this.providers.has(provider.id)||!Array.isArray(provider.kinds)||provider.kinds.some(k=>!Object.hasOwn(scopeKinds,k)||k==='global')||typeof provider.search!=='function')fail('INVALID_DIRECTORY','目录需要唯一 ID、已知实体种类和分页 search。')
  this.providers.set(provider.id,provider);this.generation++
  return()=>{if(this.providers.get(provider.id)===provider){this.providers.delete(provider.id);this.generation++}}
 }
 catalog(){return [...this.providers.values()].map(p=>({id:p.id,label:p.label??p.id,kinds:p.kinds,enabled:!this.disabled.has(p.id),description:p.description??''}))}
 setEnabled(id,enabled){if(!this.providers.has(id))fail('DIRECTORY_UNAVAILABLE','目录 adapter 已卸载。');if(typeof enabled!=='boolean')fail('INVALID_REQUEST','enabled 必须为布尔值。');enabled?this.disabled.delete(id):this.disabled.add(id);this.generation++;return this.catalog()}
 async search({providerId,kind,query='',cursor,limit=30,workspaceId,signal,refresh=false}){
  const provider=this.providers.get(providerId),generation=this.generation
  if(!provider||this.disabled.has(providerId))fail('DIRECTORY_UNAVAILABLE','目录 adapter 不可用或已停用。')
  if(!provider.kinds.includes(kind)||typeof query!=='string'||query.length>200||!Number.isInteger(limit)||limit<1||limit>50||cursor!==undefined&&(typeof cursor!=='string'||cursor.length>500))fail('INVALID_DIRECTORY_QUERY','目录查询参数无效。')
  signal?.throwIfAborted()
  const result=await provider.search({kind,query,cursor,limit,workspaceId,signal,refresh})
  if(this.generation!==generation||this.providers.get(providerId)!==provider)fail('DIRECTORY_CHANGED','目录 adapter 已变化，请重试。')
  signal?.throwIfAborted();safe(result)
  if(!Array.isArray(result.items)||result.items.length>limit||result.items.some(r=>typeof r.id!=='string'||!r.id||typeof r.label!=='string')||result.nextCursor!==undefined&&typeof result.nextCursor!=='string')fail('INVALID_DIRECTORY_RESULT','来源没有返回有界实体目录。')
  return {items:result.items.map(r=>({id:r.id,label:r.label,...(typeof r.workspaceId==='string'?{workspaceId:r.workspaceId}:{}),...(typeof r.workspaceLabel==='string'?{workspaceLabel:r.workspaceLabel}:{}),...(['cached','live','unnamed'].includes(r.labelState)?{labelState:r.labelState}:{})})),...(result.nextCursor?{nextCursor:result.nextCursor}:{}),description:provider.description??'',...(result.range?{range:Object.fromEntries(Object.entries(result.range).filter(([k])=>['limited','retained','bytes','maxRecords','maxBytes','expiresAt','source','message'].includes(k)))}:{})}
 }
 async context(scope,{trustedSource=false}={}){
  const result={...scope},checks=[],generation=this.generation,sessionId=scope?.sessionId,resolved=new Map()
  if(!trustedSource)for(const k of ['workspaceId','characterId','presetId','userId'])delete result[k]
  for(const k of ['workspaceId','characterId','presetId','userId'])if(Object.hasOwn(result,k)){const value=result[k]==null?undefined:result[k];resolved.set(k,value);if(value===undefined)delete result[k]}
  // Facts come only from trusted Host services, never selector labels or caller claims.
  for(const p of this.providers.values())if(!this.disabled.has(p.id)&&p.context){
   const lease=await p.context(clone(result));safe(lease.scope)
   if(!lease.scope||typeof lease.scope!=='object'||Array.isArray(lease.scope)||typeof lease.checkCurrent!=='function')fail('INVALID_SCOPE_CONTEXT','来源必须提供作用域对象及 lease。')
   // sessionId is the bound lookup anchor, not an optional enrichment field.
   if(Object.hasOwn(lease.scope,'sessionId')&&lease.scope.sessionId!==sessionId)fail('SCOPE_CONTEXT_CONFLICT','目录返回的会话与当前绑定不一致。')
   checks.push(lease.checkCurrent)
   for(const k of p.kinds){
    if(k==='sessionId')continue
    const value=lease.scope[k]==null?undefined:lease.scope[k]
    if(value!==undefined&&(typeof value!=='string'||!value))fail('INVALID_SCOPE_CONTEXT','目录作用域事实必须为稳定 ID。')
    if(resolved.has(k)&&resolved.get(k)!==value)fail('SCOPE_CONTEXT_CONFLICT','可信来源的作用域事实冲突：'+k)
    resolved.set(k,value);delete result[k];if(value!==undefined)result[k]=value
   }
  }
  return {scope:result,checkCurrent:()=>this.generation===generation&&checks.every(check=>check()===true)}
 }
}
