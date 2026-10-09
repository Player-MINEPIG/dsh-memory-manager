// Direction comes from execution receipts, never current configuration or IDs.
const eventModes={assistant_message_committed:'store',card_variable_update:'store',manual_update:'store',before_model_request:'retrieve'}
export function observationMode(fact){
 if(['store','retrieve'].includes(fact.mode))return fact.mode
 if(eventModes[fact.on])return eventModes[fact.on]
 if(fact.detail==='已进入 DSH 请求（llm/stream 观察；不代表网络送达）'&&fact.strategyRevision&&fact.configRevision!==undefined)return 'retrieve'
 // Compatibility with verified Tavern v1 receipt emitters that omitted `on`.
 if(fact.adapterId==='tavern.mvu'){
  if(fact.detail==='dsh-request-observed')return 'retrieve'
  if(['state-committed','manual-update'].includes(fact.detail))return 'store'
 }
 if(['tavern.world-books','tavern.prompt-templates'].includes(fact.adapterId)&&(fact.detail==='Observed in durable DSH request; provider delivery not established'||fact.code==='WORLD_BOOK_POLICY_SKIPPED'))return 'retrieve'
 return null
}
export function withObservationMode(fact){const mode=observationMode(fact);return mode?{...fact,mode}:fact}
// Evidence describes what was actually observed, independently of execution phase.
export function observationEvidence(fact){
 if(fact.evidence)return fact.evidence
 const mode=observationMode(fact)
 if(mode==='retrieve'&&['triggered','applied'].includes(fact.phase)){
  if(['dsh-history','tavern-history'].includes(fact.origin)||fact.detail==='dsh-request-observed'||fact.detail==='Observed in durable DSH request; provider delivery not established'||fact.detail==='已进入 DSH 请求（llm/stream 观察；不代表网络送达）')return 'request-included'
 }
 if(mode==='store'&&(fact.phase==='applied'||fact.on==='manual_update'&&fact.phase==='completed'&&fact.detail==='manual-update'))return 'write-committed'
 return null
}
export function operationTriggered(fact,mode=observationMode(fact)){
 return observationMode(fact)===mode&&observationEvidence(fact)===(mode==='retrieve'?'request-included':'write-committed')&&['triggered','applied','completed'].includes(fact.phase)
}
export const evidenceLabels={'content-read':'正文读取成功','request-included':'已进入本轮请求','write-committed':'来源写入已确认','source-evaluated':'规则命中或来源求值'}
export function evidenceLabel(fact){return evidenceLabels[observationEvidence(fact)]??({started:'开始执行',triggered:'执行已发起',applied:'执行回执，证据未确认',completed:'执行结束',skipped:'已跳过',failed:'执行失败'}[fact.phase]??'证据未确认')}
export const triggerLabels={triggered:'已触发',processing:'处理中',skipped:'已跳过',unrecorded:'未记录触发',unknown:'未确认'}
export function operationStatus(row,mode){
 const facts=(row.facts??[]).filter(f=>observationMode(f)===mode),active=(row.activeFacts??[]).filter(f=>observationMode(f)===mode)
 if(facts.some(f=>operationTriggered(f,mode)))return 'triggered'
 if(active.length)return 'processing'
 if(facts.some(f=>f.phase==='failed'||f.interrupted))return 'unknown'
 if(facts.some(f=>f.phase==='skipped'))return 'skipped'
 if(facts.length||[...(row.facts??[]),...(row.activeFacts??[])].some(f=>!observationMode(f)))return 'unknown'
 return 'unrecorded'
}
export function operationReasons(row,mode){return [...new Set((row.facts??[]).filter(f=>observationMode(f)===mode&&['skipped','failed'].includes(f.phase)).map(f=>f.reason??f.detail).filter(Boolean))].join(' / ')}
export function matchesOperationFilters(row,filters={}){return ['store','retrieve'].every(mode=>!filters[mode+'Status']?.length||filters[mode+'Status'].includes(operationStatus(row,mode)))}
