import {createHash,createHmac,randomUUID} from 'node:crypto'
import {fail} from '../config.js'
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const error=(code,message)=>Object.assign(Error(message),{code})
const identity=h=>[h.id,h.createdAt,h.cwd,h.version??h.formatVersion,h.isSeeded,h.parentSession]
const cancellable=(promise,signal)=>new Promise((resolve,reject)=>{const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(v=>{signal.removeEventListener('abort',abort);signal.aborted?reject(signal.reason):resolve(v)},e=>{signal.removeEventListener('abort',abort);reject(e)});if(signal.aborted)abort()})
const defaults={maxRecords:2000,maxBytes:1_000_000,timeoutMs:3000,ttlMs:15000}
export function dshScopes(ctx,limits={},options={}){
 const bounds={...defaults,...limits};for(const [key,value] of Object.entries(bounds))if(!Number.isSafeInteger(value)||value<1||value>defaults[key]*10)fail('INVALID_DIRECTORY_LIMIT',key+' 超出目录边界。')
 const secret=randomUUID(),spaces=()=>ctx.workspaceRegistry.list(),querySource=()=>options.cold===false?undefined:ctx.get?.('sessionQuery')??ctx.sessionQuery,persistence=()=>options.cold===false?undefined:ctx.get?.('sessionPersistence')??ctx.sessionPersistence
 let epoch=0,cache=null,pending=null,expiry=null,disposed=false
 const invalidate=()=>{epoch++;cache=null;clearTimeout(expiry);pending?.controller.abort(error('DIRECTORY_CHANGED','目录已变化，请刷新。'));pending=null}
 const stops=[];if(ctx.on){stops.push(ctx.on('session/created',invalidate),ctx.on('session/disposed',invalidate),ctx.on('api-session/removed',invalidate),ctx.on('session/appended',(_s,e)=>{if(e.type==='session/title')invalidate()}))}
 const sourcesCurrent=s=>ctx.get?(!s.source||!!querySource())&&(!s.persistence||s.persistence.identity===persistence()?.identity):s.source===querySource()&&s.persistence===persistence()
 const valid=s=>!disposed&&s.epoch===epoch&&sourcesCurrent(s)&&Date.now()<s.expiresAt&&s.workspaceHash===hash(spaces().map(w=>[w.id,w.title,w.sessionIds]))
 async function build(signal,currentEpoch){
  const source=querySource(),store=persistence(),workspaces=spaces(),workspaceHash=hash(workspaces.map(w=>[w.id,w.title,w.sessionIds]))
  signal.throwIfAborted();const records=source?await source.listSessions(signal):ctx.sessions.list().map(s=>({header:s.header,live:true,persisted:false}));signal.throwIfAborted()
  if(!Array.isArray(records))fail('INVALID_DIRECTORY_RESULT','来源未返回会话 header 目录。')
  const rows=[];let bytes=0,limited=records.length>bounds.maxRecords
  for(const record of records.slice(0,bounds.maxRecords)){signal.throwIfAborted();if(rows.length>=bounds.maxRecords){limited=true;break}const h=record.header;if(!h?.cwd||typeof h.id!=='string')continue
   const live=ctx.sessions.get?.(h.id),projections=live?(ctx.get?.('sessionProjections')??ctx.sessionProjections)?.cachedSnapshot(live,['title']):(ctx.get?.('sessionProjectionCache')??ctx.sessionProjectionCache)?.cachedSnapshot(h,['title'])??(ctx.get?.('sessionProjectionCache')??ctx.sessionProjectionCache)?.cachedPredecessorTitle(h)
   const title=projections?.values.title,w=workspaces.find(w=>w.sessionIds.includes(h.id)),row={id:h.id,label:typeof title==='string'&&title?title:'未命名会话',labelState:typeof title==='string'&&title?(live?'live':'cached'):'unnamed',...(w?{workspaceId:w.id,workspaceLabel:w.title??w.id}:{}),_identity:Object.freeze(identity(h)),_persisted:record.persisted}
   const size=Buffer.byteLength(JSON.stringify(row));if(bytes+size>bounds.maxBytes){limited=true;break}bytes+=size;rows.push(Object.freeze(row))
  }
  if(currentEpoch!==epoch||!sourcesCurrent({source,persistence:store}))fail('DIRECTORY_CHANGED','来源已变化，请刷新目录。')
  const range={limited,retained:rows.length,bytes,maxRecords:bounds.maxRecords,maxBytes:bounds.maxBytes,expiresAt:Date.now()+bounds.ttlMs,source:source?'visible-header-snapshot':'loaded-only',message:(limited?'目录达到记录或字节上限，仅搜索当前保留范围；不是全部会话。':'当前来源可见会话 header 快照。')+(source?'冷会话名称为缓存标题，可能陈旧；缺标题显示未命名。':'此部署未提供公开冷会话 header 服务，仅列已加载会话。')}
  return Object.freeze({epoch:currentEpoch,token:randomUUID(),source,persistence:store,workspaceHash,expiresAt:range.expiresAt,rows:Object.freeze(rows),range:Object.freeze(range)})
 }
 function acquire(signal,refresh){
  signal?.throwIfAborted();if(disposed)fail('DIRECTORY_UNAVAILABLE','目录已卸载。');if(refresh)invalidate();if(cache&&!valid(cache))invalidate();if(cache)return Promise.resolve(cache)
  if(!pending){const job={controller:new AbortController(),waiters:0};pending=job;const currentEpoch=epoch
   const timer=setTimeout(()=>job.controller.abort(error('DIRECTORY_TIMEOUT','会话元数据目录超时；范围未加载，请刷新重试。')),bounds.timeoutMs)
   const aborted=new Promise((_,reject)=>job.controller.signal.addEventListener('abort',()=>reject(job.controller.signal.reason),{once:true}))
   job.promise=(async()=>{try{const result=await Promise.race([build(job.controller.signal,currentEpoch),aborted]);job.controller.signal.throwIfAborted();if(!valid(result))fail('DIRECTORY_CHANGED','目录已变化，请刷新。');cache=result;expiry=setTimeout(()=>{if(cache===result)invalidate()},bounds.ttlMs);expiry.unref?.();return result}finally{clearTimeout(timer);if(pending===job)pending=null}})();job.promise.catch(()=>{})
  }
  const job=pending;job.waiters++
  return new Promise((resolve,reject)=>{let done=false;const release=()=>{if(done)return false;done=true;signal?.removeEventListener('abort',cancel);if(--job.waiters===0&&pending===job){job.controller.abort(error('DIRECTORY_CANCELLED','目录请求已取消。'));pending=null}return true};const cancel=()=>{if(release())reject(signal.reason??error('DIRECTORY_CANCELLED','目录请求已取消。'))};signal?.addEventListener('abort',cancel,{once:true});job.promise.then(v=>{if(release())resolve(v)},e=>{if(release())reject(e)});if(signal?.aborted)cancel()})
 }
 const sign=data=>createHmac('sha256',secret).update(JSON.stringify(data)).digest('base64url')
 function cursorData(cursor,s,key){let token;try{token=JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{fail('INVALID_CURSOR','目录游标无效。')}if(token.mac!==sign(token.data)||token.data?.snapshot!==s.token||token.data?.key!==key||!Number.isSafeInteger(token.data?.expiresAt)||token.data.expiresAt<=Date.now()||!Number.isSafeInteger(token.data?.offset)||token.data.offset<0)fail('DIRECTORY_CHANGED','目录、搜索或 Workspace 已变化，请刷新。');return token.data.offset}
 return {id:'dsh.scopes',label:'DSH 会话与 Workspace',kinds:['sessionId','workspaceId'],description:'公开可见 header 与零 I/O 缓存标题；不读取事件正文或激活会话。快照有 TTL、记录/字节/时间上限，超限会标明保留范围。',
  async search({kind,query='',cursor,limit=30,workspaceId,signal,refresh=false}){
   const deadline=AbortSignal.timeout(bounds.timeoutMs);signal=signal?AbortSignal.any([signal,deadline]):deadline
   // Workspace selection uses only the public workspace registry, without enumerating session headers.
   if(kind==='workspaceId'){
    signal.throwIfAborted();if(disposed)fail('DIRECTORY_UNAVAILABLE','目录已卸载。')
    const workspaces=spaces(),token='workspaces:'+epoch+':'+hash(workspaces.map(w=>[w.id,w.title,w.sessionIds])),key=hash([kind,query,workspaceId??null]),s={token},offset=cursor?cursorData(cursor,s,key):0,expiresAt=cursor?JSON.parse(Buffer.from(cursor,'base64url').toString()).data.expiresAt:Date.now()+bounds.ttlMs
    const retained=[];let bytes=0,limited=workspaces.length>bounds.maxRecords
    for(const w of workspaces.slice(0,bounds.maxRecords)){const row={id:w.id,label:w.title??w.id},size=Buffer.byteLength(JSON.stringify(row));if(bytes+size>bounds.maxBytes){limited=true;break}bytes+=size;retained.push(row)}
    const needle=query.toLocaleLowerCase(),found=retained.filter(r=>(r.label+' '+r.id).toLocaleLowerCase().includes(needle)),next=offset+limit<found.length?{snapshot:token,key,offset:offset+limit,expiresAt}:null
    return {items:found.slice(offset,offset+limit),...(next?{nextCursor:Buffer.from(JSON.stringify({data:next,mac:sign(next)})).toString('base64url')}:{ }),range:{limited,retained:retained.length,bytes,maxRecords:bounds.maxRecords,maxBytes:bounds.maxBytes,expiresAt,source:'visible-workspaces',message:limited?'Workspace 目录达到上限，仅显示保留范围；不是全部 Workspace。':'当前来源可见 Workspace 目录。'}}
   }
   const s=await acquire(signal,refresh);signal?.throwIfAborted();if(!valid(s)){invalidate();fail('DIRECTORY_CHANGED','目录已变化，请刷新。')}
   const key=hash([kind,query,workspaceId??null]),offset=cursor?cursorData(cursor,s,key):0,needle=query.toLocaleLowerCase()
   const all=kind==='workspaceId'?spaces().map(w=>({id:w.id,label:w.title??w.id})):s.rows
   const found=all.filter(r=>(!workspaceId||r.workspaceId===workspaceId)&&(r.label+' '+r.id+' '+(r.workspaceLabel??'')).toLocaleLowerCase().includes(needle)),page=found.slice(offset,offset+limit)
   if(kind==='sessionId'&&s.persistence)for(const row of page)if(row._persisted){const stat=await cancellable(s.persistence.stat(row.id,{signal}),signal);if(!stat||hash(identity(stat.header))!==hash(row._identity)){invalidate();fail('DIRECTORY_CHANGED','会话已删除或身份变化，请刷新目录。')}}
   signal?.throwIfAborted();if(!valid(s)){invalidate();fail('DIRECTORY_CHANGED','目录已变化，请刷新。')}
   const next=offset+limit<found.length?{snapshot:s.token,key,offset:offset+limit,expiresAt:s.expiresAt}:null
   return {items:page.map(({_identity,_persisted,...row})=>({...row})),...(next?{nextCursor:Buffer.from(JSON.stringify({data:next,mac:sign(next)})).toString('base64url')}:{ }),range:{...s.range}}
  },
  context({sessionId}){const find=()=>sessionId?spaces().find(w=>w.sessionIds.includes(sessionId))?.id:undefined,id=find(),e=epoch;return {scope:id?{workspaceId:id}:{},checkCurrent:()=>!disposed&&epoch===e&&find()===id}},
  invalidate,
  dispose(){disposed=true;invalidate();for(const stop of stops)stop?.()},
 }
}
