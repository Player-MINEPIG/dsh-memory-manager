import {observationMode,operationTriggered} from './observation-modes.js'
// Compose the existing public Tavern history API in the browser. Native DSH
// request events do not carry assembler metadata; verified v3 provenance does.
export function nativeResourceObservations(record,sessionId){
 if(record?.sessionId!==sessionId||record.status!=='request-observed'||record.requestContentStatus!=='available'||record.nativeProvenance?.provenance!=='recorded-references')return []
 const nodes=[],facts=[],seen=new Set()
 const flatten=items=>{for(const node of items??[]){nodes.push(node);flatten(node.children)}};flatten(record.nativeProvenance.nodes)
 const requestId=Number.isSafeInteger(record.requestAssemblyRef?.seq)?`${sessionId}:${record.requestAssemblyRef.seq}`:Number.isSafeInteger(record.nativeRequestRef?.stepStartSeq)?`${sessionId}:native:${record.nativeRequestRef.stepStartSeq}`:`tavern:${sessionId}:${record.id}`
 for(const node of nodes){
  for(const read of [...node.memoryReads??[],...node.mvuReads??[]]){
   if(typeof read.adapterId!=='string'||typeof read.id!=='string'||typeof read.blockId!=='string'||seen.has(read.adapterId+':'+read.id))continue
   seen.add(read.adapterId+':'+read.id)
   facts.push({...read,evidence:'request-included',mode:'retrieve',on:'before_model_request',eventId:`${requestId}:native-memory:${read.blockId}`,requestId,sessionId,turn:record.turn,turnKind:'unknown',phase:'triggered',at:record.recordedAt,origin:'tavern-history',detail:'Tavern 已核验的当次请求来源确认资源内容进入本轮请求；模型提供方送达未确认。'})
  }
  const source=node.source
  if(source?.plugin!=='pmp-dsh-tavern'||source.sourceId!=='worldbook'||typeof source.resourceId!=='string'||!source.resourceId||seen.has('tavern.world-books:world-book:'+source.resourceId))continue
  seen.add('tavern.world-books:world-book:'+source.resourceId)
  facts.push({evidence:'request-included',mode:'retrieve',on:'before_model_request',id:'world-book:'+source.resourceId,adapterId:'tavern.world-books',eventId:`${requestId}:native-worldbook:${source.resourceId}`,requestId,sessionId,turn:record.turn,turnKind:'unknown',phase:'triggered',at:record.recordedAt,origin:'tavern-history',detail:'Tavern 已核验的当次请求来源确认世界书读取已触发；模型提供方送达未确认。'})
 }
 return facts
}
export const nativeWorldBookObservations=nativeResourceObservations
export function withHistoryFacts(data,history,{turn=[],turnKind=[],status=[]}={}){
 const matches=(values,value)=>!values.length||values.includes(String(value))
 const rows=data.rows.map(row=>{
  const original=row.facts??[],additional=history.filter(f=>f.adapterId===row.adapterId&&f.id===row.id&&!original.some(old=>old.requestId===f.requestId&&observationMode(old)===observationMode(f)&&(observationMode(f)!=='retrieve'||f.phase==='skipped'&&old.phase==='skipped'||operationTriggered(old,'retrieve'))))
  const facts=[...original,...additional].filter(f=>matches(turn,f.turn)&&matches(turnKind,f.turnKind)),activeFacts=(row.activeFacts??[]).filter(f=>matches(turn,f.turn)&&matches(turnKind,f.turnKind))
  const state=activeFacts.length?'running':facts.some(f=>['started','triggered','applied'].includes(f.phase))?'past':'never'
  return {...row,facts,activeFacts,status:state,applied:facts.some(f=>f.phase==='applied'),interrupted:facts.some(f=>f.interrupted)}
 })
 const turns=[...new Set([...(data.facets?.turns??[]),...history.filter(f=>data.rows.some(row=>row.id===f.id&&row.adapterId===f.adapterId)).filter(f=>f.turn!=null).map(f=>String(f.turn))])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))
 return {...data,rows:rows.filter(row=>matches(status,row.status)),facets:{...data.facets,turns}}
}
export function createTavernHistoryReader(read){
 // Keep only projected facts, never cache resource or request bodies.
 const cache=new Map()
 return async(sessionId,signal)=>{
  const base='/pmp-dsh-tavern/api/v3/sessions/'+encodeURIComponent(sessionId)+'/assemblies'
  const index=await read(base,signal)
  if(index?.ok!==true||index.sessionId!==sessionId||!Array.isArray(index.records))throw Error('Tavern 资源历史索引不可用。')
  const records=index.records.filter(row=>row.sessionId===sessionId&&row.status==='request-observed'&&row.nativeRequestRef).slice(-256)
  const keep=new Set(records.map(row=>sessionId+':'+row.id));for(const key of cache.keys())if(!keep.has(key))cache.delete(key)
  const result=[],errors=[];let cursor=0
  const worker=async()=>{while(cursor<records.length){const summary=records[cursor++],key=sessionId+':'+summary.id,token=JSON.stringify([summary.requestAssemblyRef,summary.nativeRequestRef,summary.sessionRef])
   try{let saved=cache.get(key);if(saved?.token!==token){const response=await read(base+'/'+encodeURIComponent(summary.id),signal);if(response?.ok!==true||response.record?.id!==summary.id||response.record.sessionId!==sessionId)throw Error('Tavern 资源历史详情不可用。');const record=response.record;if(record.requestContentStatus!=='available'||!record.nativeProvenance)throw Error('资源历史请求的来源引用未能核验。');saved={token,facts:nativeResourceObservations(record,sessionId)};cache.set(key,saved)}result.push(...saved.facts)}catch(error){signal?.throwIfAborted();errors.push(error)}
  }}
  await Promise.all(Array.from({length:Math.min(4,records.length)},worker))
  return {facts:result,diagnostics:errors.length?[{code:'TAVERN_HISTORY_UNAVAILABLE',message:`${errors.length} 条资源历史记录暂无法核验，触发状态可能不完整。`}]:[]}
 }
}
