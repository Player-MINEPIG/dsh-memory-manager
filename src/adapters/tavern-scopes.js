import {fail} from '../config.js'
export function tavernScopes(service){
 if(service.protocolVersion!==1||typeof service.searchScopes!=='function'||typeof service.resolveScopeContext!=='function')fail('INVALID_DIRECTORY','需要 Tavern scope catalog v1。')
 return {id:'tavern.scopes',label:'Tavern 角色卡 / 预设 / Persona',kinds:['characterId','presetId','userId'],description:'Persona 是角色扮演身份；不是登录账号。目录可见性由 Tavern 来源校验，选择名单不授予内容访问或 prompt 使用权。',
  async search({kind,...args}){const result=await service.searchScopes({...args,field:kind});return {items:result.items.map(r=>({id:r.id,label:r.name})),...(result.nextCursor?{nextCursor:result.nextCursor}:{})}},
  async context({sessionId}){if(!sessionId)return {scope:{},checkCurrent:()=>true};const result=await service.resolveScopeContext({sessionId});if(result.scope?.sessionId!==sessionId||typeof result.checkCurrent!=='function')fail('INVALID_SCOPE_CONTEXT','来源没有返回作用域 lease。');return result},
 }
}
