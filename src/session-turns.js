// Turn existence comes from durable DSH events, independently of resource use.
export function recordedSessionTurns(events){
 return [...new Set(events.filter(event=>event.type==='turn/start'&&Number.isSafeInteger(event.data?.turn)&&event.data.turn>0).map(event=>String(event.data.turn)))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))
}
