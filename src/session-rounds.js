export const statusLabels={running:'正在触发',past:'曾触发',never:'未记录触发'}
export const policySkipReasons=row=>[...new Set((row.facts??[]).filter(f=>f.phase==='skipped'&&f.code==='WORLD_BOOK_POLICY_SKIPPED').map(f=>f.reason||'具体原因未记录'))].join(' / ')
export const resourceStatus=row=>row.status==='running'?statusLabels.running:row.applied?'已应用':policySkipReasons(row)?'策略跳过':statusLabels[row.status]??'未确认'
const triggered=new Set(['started','triggered','applied'])
const kinds={human:'人类输入',task:'任务上下文',system:'系统',unknown:'未确认来源'}
const roundOf=fact=>fact.turn==null?null:String(fact.turn)
export function sessionRounds(data,selected=[]){
 const turns=[...new Set(selected.length?selected.map(String):data.facets?.turns??[])].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}))
 const unclassified=data.rows.some(row=>[...(row.facts??[]),...(row.activeFacts??[])].some(fact=>roundOf(fact)===null))
 return [...turns,...(!selected.length&&(unclassified||!turns.length)?[null]:[])].map(turn=>({turn,key:turn===null?'unknown':'turn:'+turn,label:turn===null?(unclassified?'未确认轮次':'尚无轮次记录'):`第 ${turn} 轮`}))
}
export function roundRows(data,turn,status=[]){
 return data.rows.map(row=>{
  const facts=(row.facts??[]).filter(f=>roundOf(f)===turn),activeFacts=(row.activeFacts??[]).filter(f=>roundOf(f)===turn)
  const state=activeFacts.length?'running':facts.some(f=>triggered.has(f.phase))?'past':'never'
  return {...row,facts,activeFacts,status:state,applied:facts.some(f=>f.phase==='applied'),interrupted:facts.some(f=>f.interrupted)}
 }).filter(row=>!status.length||status.includes(row.status))
}
export function roundKinds(rows){return [...new Set(rows.flatMap(row=>row.facts??[]).map(f=>kinds[f.turnKind]??kinds.unknown))].join(' / ')}
export function roundVisibleCount(data,selected=[],status=[]){
 if(!status.length)return data.rows.length
 const turns=new Set(sessionRounds(data,selected).map(group=>group.turn))
 return data.rows.filter(row=>{
  const active=new Set((row.activeFacts??[]).map(roundOf).filter(turn=>turns.has(turn)))
  const past=new Set((row.facts??[]).filter(f=>triggered.has(f.phase)).map(roundOf).filter(turn=>turns.has(turn)&&!active.has(turn)))
  return status.includes('running')&&active.size>0||status.includes('past')&&past.size>0||status.includes('never')&&turns.size>active.size+past.size
 }).length
}
