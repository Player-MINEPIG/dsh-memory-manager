import {observationMode,operationTriggered} from './observation-modes.js'
// Project version metadata only when the corresponding source node was included.
export function requestResourceFacts(assembly,{sessionId,requestId,turn,turnKind='unknown',at,origin}={}){
 if(!assembly||assembly.preview)return []
 const nodes=[],result=[]
 const flatten=items=>{for(const node of items??[]){nodes.push(node);flatten(node.children)}};flatten(assembly.nodes)
 for(const diagnostic of assembly.diagnostics??[]){
  let adapterId,id,revision=diagnostic.revision,match
  if(['MVU_RESOURCE_VERSION','WORLD_BOOK_MVU_VARIABLE_VERSION'].includes(diagnostic.code)){
   adapterId='tavern.mvu';id=diagnostic.resourceId
   const book=diagnostic.code==='WORLD_BOOK_MVU_VARIABLE_VERSION'
   match=node=>node.source?.resourceId===(book?diagnostic.blockResourceId:id)&&(!book||node.source.sourceId==='worldbook')
  }else if(['TAVERN_MEMORY_RESOURCE_VERSION','TAVERN_MEMORY_DEPENDENCY_VERSION'].includes(diagnostic.code)){
   adapterId=diagnostic.adapterId;id=diagnostic.resourceId
   if(adapterId==='tavern.mvu'?!Number.isSafeInteger(revision):typeof revision!=='string')continue
   match=node=>node.source?.sourceId===diagnostic.sourceId&&(diagnostic.consumerField?node.source.field===diagnostic.consumerField:node.source.resourceId===(diagnostic.consumerId??diagnostic.blockResourceId??id))
  }else if(diagnostic.code==='MEMORY_RESOURCE_VERSION'){
   adapterId=diagnostic.adapterId;id=diagnostic.entityId;revision=diagnostic.resourceRevision
   match=node=>node.source?.sourceId==='memory-manager.resources'&&node.source.resourceId===id
  }else continue
  if(typeof adapterId!=='string'||typeof id!=='string'||typeof diagnostic.blockId!=='string'||!nodes.some(node=>match(node)&&(node.id?.endsWith(`:${diagnostic.blockId}`)||node.name===diagnostic.blockId)))continue
  result.push({evidence:'request-included',mode:'retrieve',on:'before_model_request',adapterId,id,eventId:`${requestId}:${diagnostic.blockId}`,requestId,sessionId,turn,turnKind,revision,configRevision:diagnostic.configRevision??null,...(at!==undefined?{at}:{}),...(origin?{origin}:{}),phase:'triggered',detail:'资源内容已进入当次 DSH 请求；模型提供方送达未确认。'})
 }
 return result
}
export function assemblyObservations(events,sessionId){
 const result=[]
 for(const event of events){
  const data=event.data,assembly=data?.metadata?.assembly
  if(event.type!=='request/assembly'||!Number.isSafeInteger(event.seq)||!Array.isArray(data?.messages)||!['pmp-dsh-tavern','dsh-prompt-assembler'].includes(data.metadata?.owner)||!assembly||assembly.preview)continue
  const identity={sessionId,requestId:`${sessionId}:${event.seq}`,turn:data.turn,at:event.at??event.timestamp,origin:'dsh-history'}
  result.push(...requestResourceFacts(assembly,identity))
  for(const fact of assembly.diagnostics??[])if(fact.code==='WORLD_BOOK_POLICY_SKIPPED'&&fact.adapterId==='tavern.world-books'&&fact.sourceId==='worldbook'&&typeof fact.resourceId==='string'&&fact.resourceId.startsWith('world-book:')&&typeof fact.revision==='string'&&typeof fact.reason==='string')result.push({...identity,id:fact.resourceId,adapterId:fact.adapterId,eventId:`${identity.requestId}:worldbook-policy:${fact.resourceId}`,mode:'retrieve',on:'before_model_request',phase:'skipped',revision:fact.revision,configRevision:fact.configRevision??null,code:fact.code,reason:fact.reason,detail:'来源在已记录装配中明确跳过此世界书。'})
 }
 return result.slice(-2000)
}
export function mergeObservations(journal,history){return [...journal,...history.filter(fact=>!journal.some(existing=>existing.adapterId===fact.adapterId&&existing.id===fact.id&&existing.sessionId===fact.sessionId&&existing.requestId===fact.requestId&&observationMode(existing)===observationMode(fact)&&(observationMode(fact)!=='retrieve'||fact.phase==='skipped'&&existing.phase==='skipped'||operationTriggered(existing,'retrieve'))))]}
