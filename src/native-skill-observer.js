import {createHash} from 'node:crypto'
import {requestIdentity} from './request-observer.js'
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const text=value=>value.filter(block=>block.type==='text').map(block=>block.text).join('')
export function installNativeSkillObserver(ctx,manager,adapter){
 const pinned=new WeakMap(),stops=[],report=error=>manager.diagnostics.push({adapterId:adapter.id,code:'SKILL_OBSERVATION_UNAVAILABLE',message:error.message})
 const readReceipt=(session,skill,ref,eventId)=>{
  const events=session.snapshotEvents(),turn=events.findLast(e=>e.type==='turn/start')?.data.turn
  manager.recordTrace({adapterId:adapter.id,id:skill.id,mode:'retrieve',on:'before_model_request',evidence:'content-read',phase:'completed',eventId,requestId:eventId,sessionId:session.id,turn,turnKind:'unknown',revision:createHash('sha256').update(skill.skill.content).digest('hex'),messageRef:ref,detail:'Skill 正文读取成功；是否进入本轮请求另行核验。'})
 }
 stops.push(ctx.on('tools/pre-execute',async(exec,next)=>{
  const decision=await next()
  if(exec.name==='skill'&&exec.agent&&decision.kind==='allow')try{pinned.set(exec,await adapter.invocation({scope:{sessionId:exec.agent.id},name:exec.arguments?.name,signal:exec.signal}))}catch(error){report(error)}
  return decision
 }))
 stops.push(ctx.on('tools/result',(exec,result)=>{
  const candidate=pinned.get(exec),value=result.value
  if(!candidate||result.isError||value?.name!==candidate.skill.name||value.provider!==candidate.skill.provider||typeof value.content!=='string'||JSON.stringify(value.resourceBase)!==JSON.stringify(candidate.skill.resourceBase))return
  const tool=ctx.get('tools')?.get('skill',exec.agent)
  const included=tool?.output?.render&&text(tool.output.render(exec.arguments,value))===text(result.content)
  readReceipt(exec.agent.session,{...candidate,skill:value},included?{kind:'tool-result',callId:exec.callId,contentHash:hash(result.content)}:undefined,`skill-load:${exec.callId}`)
 }))
 stops.push(ctx.on('agent/pre-step',async(payload,next)=>{
  const decision=await next()
  if(decision.kind==='reject')return decision
  for(const message of decision.messages??[]){
   if(message.source?.kind!=='skill-invocation'||message.source.form!=='instructions'||payload.agent.session.deriveMessages().some(old=>old.id===message.id))continue
   try{
    const candidate=await adapter.invocation({scope:{sessionId:payload.agent.id},name:message.source.name,signal:payload.signal,read:true}),tool=ctx.get('tools')?.get('skill',payload.agent)
    if(!candidate||!tool?.output?.render)continue
    if(text(tool.output.render({},candidate.skill))!==text(message.content))continue
    readReceipt(payload.agent.session,candidate,{kind:'skill-invocation',messageId:message.id,contentHash:hash(message.content)},`skill-load:${message.id}`)
   }catch(error){report(error)}
  }
  return decision
 },{prepend:true}))
 stops.push(ctx.on('llm/stream',async function*(options,next){
  const session=ctx.get('sessions')?.get(options.sessionId),identity=requestIdentity(options,session)
  if(identity){
   const seen=new Set()
   for(const fact of manager.traces.filter(f=>f.adapterId===adapter.id&&f.sessionId===session.id&&f.evidence==='content-read'&&f.messageRef)){
    const ref=fact.messageRef,message=options.messages.find(m=>!m.isError&&hash(m.content)===ref.contentHash&&(ref.kind==='tool-result'?m.role==='tool'&&m.toolCallId===ref.callId:m.role==='user'&&m.id===ref.messageId&&m.source?.kind==='skill-invocation'))
    if(!message||seen.has(fact.id+':'+message.id))continue
    seen.add(fact.id+':'+message.id)
    manager.recordTrace({adapterId:adapter.id,id:fact.id,mode:'retrieve',on:'before_model_request',evidence:'request-included',phase:'applied',eventId:`${identity.requestId}:skill:${message.id}`,requestId:identity.requestId,sessionId:session.id,turn:identity.turn,turnKind:'unknown',revision:fact.revision,messageRef:{...ref,messageId:message.id},detail:'Skill 正文已核验进入本轮实际请求；模型提供方送达未确认。'})
   }
  }
  yield* next()
 }))
 return ()=>{for(const stop of stops.reverse())stop()}
}
