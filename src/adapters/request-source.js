import {createHash} from 'node:crypto'
import {effective} from '../config.js'
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const SOURCE_ID='memory-manager.resources'
export function registerRequestSource(manager,registry,usage){
 if(registry.version!==1)throw Error('Unsupported Tavern source protocol')
 return registry.register({id:SOURCE_ID,pluginId:'dsh-memory-manager',name:'记忆管理资源',version:1,lifetimes:['request'],resolve:async context=>{
  if(manager.configuration.error)return {blocks:[],diagnostics:[{code:'MEMORY_CONFIG_UNAVAILABLE'}]}
  const doc=structuredClone(manager.configuration.document),blocks=[],diagnostics=[]
  for(const entry of doc.entries){
   // MVU owns its native source and commit path; never emit or update it twice.
   if(entry.adapterId==='tavern.mvu')continue
   const snapshot=effective(doc,entry.id)
   const result=await usage.trigger({id:entry.id,configurationSnapshot:snapshot,mode:'retrieve',preview:true,signal:context.signal,event:{on:'before_model_request',eventId:'readonly-resolver',scope:{sessionId:context.sessionId},turn:context.turn,step:context.step,nativeMessages:context.nativeMessages}})
   if(!result.matched)continue
   const text=typeof result.value==='string'?result.value:result.value?.text
   if(typeof text!=='string'||!text)continue
   const tuple={entityId:entry.id,resourceRevision:result.resourceRevision,configRevision:snapshot.revision,strategyRevision:result.strategyRevision}
   const blockId='v1-'+hash(tuple)
   blocks.push({id:blockId,type:'text',text,role:'system',source:{resourceId:entry.id,field:'content'}})
   diagnostics.push({code:'MEMORY_RESOURCE_VERSION',blockId,adapterId:entry.adapterId,...tuple})
  }
  return {blocks,diagnostics}
 }})
}
export function observeTavernRequest(manager,session,options){
 const request=session?.snapshotEvents?.().findLast(e=>e.type==='request/assembly'),data=request?.data
 if(!data||data.metadata?.owner!=='pmp-dsh-tavern'||hash(data.messages)!==hash(options.messages))return
 const assembly=data.metadata.assembly
 if(assembly.preview)return
 const facts=assembly.diagnostics?.filter(d=>d.code==='MEMORY_RESOURCE_VERSION')??[]
 const flatten=nodes=>nodes.flatMap(n=>[n,...flatten(n.children??[])])
 const nodes=flatten(assembly.nodes??[])
 for(const fact of facts){
  const node=nodes.find(n=>n.source?.sourceId===SOURCE_ID&&n.source.resourceId===fact.entityId&&(n.id.endsWith(':'+fact.blockId)||n.name===fact.blockId))
  if(!node)continue
  const requestId=`${session.id}:${request.seq}`
  manager.recordTrace({adapterId:fact.adapterId,id:fact.entityId,eventId:requestId,requestId,phase:'applied',sessionId:session.id,turn:data.turn,turnKind:'unknown',revision:fact.resourceRevision,configRevision:fact.configRevision,strategyRevision:fact.strategyRevision,detail:'已进入 DSH 请求（llm/stream 观察；不代表网络送达）'})
 }
}
