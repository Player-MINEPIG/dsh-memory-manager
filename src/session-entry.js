// Only the main conversation selects this frame-wide control. Catalog presence,
// retained side panels and the most recently updated Session are not selection.
export function currentSessionId(snapshot){
 return Object.values(snapshot?.byId??{}).find(session=>(session.retainedBy?.mainView??0)>0)?.id??null
}
