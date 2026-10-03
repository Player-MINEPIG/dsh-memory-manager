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
 async search({providerId,kind,query='',cursor,limit=30,workspaceId,signal}){
  const provider=this.providers.get(providerId),generation=this.generation
  if(!provider||this.disabled.has(providerId))fail('DIRECTORY_UNAVAILABLE','目录 adapter 不可用或已停用。')
  if(!provider.kinds.includes(kind)||typeof query!=='string'||query.length>200||!Number.isInteger(limit)||limit<1||limit>50||cursor!==undefined&&(typeof cursor!=='string'||cursor.length>500))fail('INVALID_DIRECTORY_QUERY','目录查询参数无效。')
  signal?.throwIfAborted()
  const result=await provider.search({kind,query,cursor,limit,workspaceId,signal})
  if(this.generation!==generation||this.providers.get(providerId)!==provider)fail('DIRECTORY_CHANGED','目录 adapter 已变化，请重试。')
  signal?.throwIfAborted();safe(result)
  if(!Array.isArray(result.items)||result.items.length>limit||result.items.some(r=>typeof r.id!=='string'||!r.id||typeof r.label!=='string')||result.nextCursor!==undefined&&typeof result.nextCursor!=='string')fail('INVALID_DIRECTORY_RESULT','来源没有返回有界实体目录。')
  return {items:result.items.map(r=>({id:r.id,label:r.label,...(typeof r.workspaceId==='string'?{workspaceId:r.workspaceId}:{}),...(typeof r.workspaceLabel==='string'?{workspaceLabel:r.workspaceLabel}:{})})),...(result.nextCursor?{nextCursor:result.nextCursor}:{}),description:provider.description??''}
 }
 async context(scope,{trustedSource=false}={}){
  const result={...scope},checks=[],generation=this.generation
  if(!trustedSource)for(const k of ['workspaceId','characterId','presetId','userId'])delete result[k]
  // Facts come only from trusted Host services, never selector labels or caller claims.
  for(const p of this.providers.values())if(!this.disabled.has(p.id)&&p.context){const lease=await p.context(clone(scope));safe(lease.scope);if(typeof lease.checkCurrent!=='function')fail('INVALID_SCOPE_CONTEXT','来源必须提供作用域 lease。');checks.push(lease.checkCurrent);for(const k of p.kinds){delete result[k];if(typeof lease.scope[k]==='string')result[k]=lease.scope[k]}}
  return {scope:result,checkCurrent:()=>this.generation===generation&&checks.every(check=>check())}
 }
}
