import {createHash,randomUUID} from 'node:crypto'
import {fail} from '../config.js'
// Public SessionStore and WorkspaceRegistry projections; no event-log reads,
// persistence.list, SessionController.search or Agent activation.
export function dshScopes(ctx){
 const generation=randomUUID(),workspaces=()=>ctx.workspaceRegistry.list()
 return {id:'dsh.scopes',label:'DSH 会话与 Workspace',kinds:['sessionId','workspaceId'],description:'仅 Host 已加载的会话标题和 Workspace 注册元数据；不会扫描持久会话正文。未加载会话需来源提供分页元数据接口。',
  search({kind,query,cursor,limit,workspaceId,signal}){
   signal?.throwIfAborted()
   const spaces=workspaces(),needle=query.toLocaleLowerCase()
   const rows=kind==='workspaceId'?spaces.map(w=>({id:w.id,label:w.title??w.id})):ctx.sessions.list().map(s=>{const w=spaces.find(w=>w.sessionIds.includes(s.id));return {id:s.id,label:(ctx.get?.('sessionProjections')??ctx.sessionProjections)?.cachedSnapshot(s,['title'])?.values.title??s.id,...(w?{workspaceId:w.id,workspaceLabel:w.title??w.id}:{})}})
   const found=rows.filter(r=>(!workspaceId||r.workspaceId===workspaceId)&&(r.label+' '+r.id+' '+(r.workspaceLabel??'')).toLocaleLowerCase().includes(needle))
   const key=createHash('sha256').update(JSON.stringify([generation,kind,query,workspaceId,found])).digest('hex')
   let offset=0
   if(cursor){let decoded;try{decoded=JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{fail('INVALID_CURSOR','目录游标无效。')}if(decoded.key!==key||!Number.isSafeInteger(decoded.offset)||decoded.offset<0)fail('DIRECTORY_CHANGED','目录或搜索条件已变化，请重新搜索。');offset=decoded.offset}
   return {items:found.slice(offset,offset+limit),...(offset+limit<found.length?{nextCursor:Buffer.from(JSON.stringify({key,offset:offset+limit})).toString('base64url')}:{})}
  },
  context({sessionId}){const find=()=>sessionId?workspaces().find(w=>w.sessionIds.includes(sessionId))?.id:undefined,id=find();return {scope:id?{workspaceId:id}:{},checkCurrent:()=>find()===id}},
 }
}
