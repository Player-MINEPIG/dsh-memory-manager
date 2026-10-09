import {createHash} from 'node:crypto'
import {requestResourceFacts} from './assembly-observations.js'
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
export function requestIdentity(options,session){
 if(!session||!Object.isFrozen(options)||hash(options.messages)!==hash(session.deriveMessages()))return null
 const events=session.snapshotEvents(),request=events.findLast(e=>e.type==='request/assembly')
 const core=request&&['pmp-dsh-tavern','dsh-prompt-assembler'].includes(request.data.metadata?.owner)&&hash(request.data.messages)===hash(options.messages)
 const boundary=core?request.seq:events.findLast(e=>e.type==='step/start')?.seq
 if(!Number.isSafeInteger(boundary))return null
 return {sessionId:session.id,requestId:core?`${session.id}:${boundary}`:`${session.id}:native:${boundary}`,turn:core?request.data.turn:events.findLast(e=>e.type==='turn/start')?.data.turn,turnKind:'unknown',assembly:core?request.data.metadata.assembly:null}
}
export function installRequestObserver(ctx,manager){
 return ctx.on('llm/stream',async function*(options,next){
  const session=ctx.get('sessions')?.get(options.sessionId),identity=requestIdentity(options,session)
  if(identity){
   const assembly=identity.assembly??ctx.get('dshPromptAssembler')?.runtime.observeNativeRequest(options,session)
   // Generic Manager resources already have an assembler-owned observer.
   for(const fact of requestResourceFacts(assembly,identity))if(fact.adapterId.startsWith('tavern.')&&manager.adapters.has(fact.adapterId))manager.recordTrace({...fact,phase:'applied'})
  }
  yield* next()
 })
}
