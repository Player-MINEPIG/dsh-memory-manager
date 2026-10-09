import assembler from 'dsh-prompt-assembler/plugin'
import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import * as managerPlugin from '../src/index.js'
import {roundRows,resourceStatus} from '../src/session-rounds.js'
import {createTavernHistoryReader,withHistoryFacts} from '../src/client-history.js'
const runtime=process.env.DSH_MEMORY_RUNTIME,tavernRoot=process.env.DSH_MEMORY_TAVERN

test('stock native MVU macro reads are observed and restored from exact historical references',{skip:!runtime||!tavernRoot,timeout:30000},async()=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SystemPrompt}=await load('@deepseek-ai/dsh-system-prompt'),llm=await load('@deepseek-ai/dsh-llm')
 const tavern=await import(pathToFileURL(join(tavernRoot,'packages/tavern-loader/src/index.js')).href)
 const ctx=new Context(),dir=await mkdtemp(join(tmpdir(),'dmm-mvu-native-')),requests=[],errors=[]
 try{
  for(const id of ['sessionController','workspaceController','directoryPickerController'])ctx.provide(id,id==='sessionController'?{inspect:async sessionId=>{const session=ctx.sessions.get(sessionId);return {meta:session.header,events:session.snapshotEvents(),inheritedEventCount:0}}}:{})
  await ctx.plugin(SystemPrompt,{personaPrefix:'OFFICIAL'})
  for(const name of ['session','agent','session-projection','llm','tools','agent-loop'])await ctx.plugin((await load('@deepseek-ai/dsh-'+name)).default,name==='agent-loop'?{agents:[]}:{} )
  ctx.on('agent/error',event=>errors.push(event.error))
  class Provider extends llm.LlmAdapter{async resolveModel(provider,id){return {provider,id,name:id,systemPromptUpdate:'in-history'}}async *stream(request){requests.push(structuredClone(request.messages));yield{type:'block-start',index:0,blockType:'text'};yield{type:'block-end',index:0,block:{type:'text',text:'ANSWER'}};yield{type:'finish',reason:{kind:'stop'}}}}
  ctx.llm.registerAdapter(['test'],new Provider())
  let store
  await ctx.plugin(assembler,{storageDir:join(dir,'assembler')})
  await ctx.plugin({name:tavern.name,inject:tavern.inject,apply(c){store=tavern.apply(c,{storageDir:join(dir,'tavern'),mvu:{resources:[{sharing:'shared',id:'mvu:fixture',sessionIds:['*'],initial:{stat_data:{hp:100}}}]}})}})
  const configPath=join(dir,'config.json');await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,entries:[],presets:{}}))
  const managerHandle=ctx.plugin(managerPlugin,{storageDir:dir,configPath});await managerHandle
  const book=store.worldBookStore.import({entries:{0:{uid:0,content:'STATE {{format_message_variable::stat_data}}',constant:true}}},{name:'MVU fixture'})
  const {agent}=await ctx.agents.create({sessionId:'mvu-proof',agentOptions:{provider:'test',model:'test'}})
  store.sessionSelections.set(agent.id,{worldBookIds:[book.id]})
  const preset=store.assemblyPresets.get('builtin-native-slots')
  const strategy=store.assemblyPresets.save({...preset,id:'mvu-macro-proof',rules:preset.rules.map(rule=>rule.kind==='tavern.mvu/state'?{...rule,enabled:false}:rule)})
  store.assemblyPresets.apply(agent.id,strategy.id)
  const {createPromptTraceApi}=await import(pathToFileURL(join(tavernRoot,'packages/tavern-loader/src/prompt-trace-api.js')).href)
  const {createNativeRequestReader}=await import(pathToFileURL(join(tavernRoot,'packages/tavern-trace/src/native-request-reader.js')).href)
  const nativeReader=createNativeRequestReader({assemblies:store.assemblyStore,sessionController:ctx.get('sessionController'),sessions:()=>ctx.sessions})
  const publicApi=createPromptTraceApi({assemblies:store.assemblyStore,legacyStore:store.traceStore,readBodies:nativeReader.readBodies})
  const read=async url=>{let payload;const response={setHeader(){},end(body){payload=JSON.parse(body)}};await publicApi({url,method:'GET'},response);assert.equal(response.statusCode,200);return payload}
  const history=createTavernHistoryReader(read)
  for(const input of ['ONE','TWO']){
   agent.followup(llm.createUserMessage({content:[{type:'text',text:input}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
   assert.match(requests.at(-1).flatMap(m=>m.content.filter(b=>b.type==='text').map(b=>b.text)).join('\n'),/hp: 100/)
   const events=agent.session.snapshotEvents(),turn=events.findLast(e=>e.type==='turn/start').data.turn
   assert.equal(events.filter(e=>e.type==='request/assembly').length,0,'stock native path has no core request assembly metadata')
   const row=roundRows(await ctx.dshMemoryManager.query({scope:{sessionId:agent.id}}),String(turn)).find(r=>r.id==='mvu:fixture')
   assert(row,'MVU row is discoverable');assert.equal(resourceStatus(row,'retrieve'),'已触发')
   const live=row.facts.filter(f=>f.mode==='retrieve');assert(live.some(f=>f.phase==='triggered'));assert(live.every(f=>f.turn===turn&&f.on==='before_model_request'))
   const projected=(await history(agent.id)).facts.filter(f=>f.id==='mvu:fixture'&&f.turn===turn)
   assert.equal(projected.length,1);assert.equal(projected[0].mode,'retrieve');assert.equal(projected[0].revision,live[0].revision);assert.equal(projected[0].requestId,live.find(f=>f.evidence==='request-included').requestId)
   const merged=withHistoryFacts({rows:[{...row,facts:[],activeFacts:[]}],facets:{turns:[]}},projected)
   assert.equal(resourceStatus(merged.rows[0],'retrieve'),'已触发','history works independently of the observation journal')
  }
  const snapshot=structuredClone(agent.session.snapshotEvents());await history(agent.id);assert.deepEqual(agent.session.snapshotEvents(),snapshot,'queries never replay or write user history')
  const before=ctx.dshMemoryManager.traces.filter(f=>f.id==='mvu:fixture'&&f.evidence==='request-included').length
  const withoutRead=store.assemblyPresets.save({...strategy,rules:strategy.rules.map(rule=>rule.kind==='worldbook'?{...rule,enabled:false}:rule)})
  store.assemblyPresets.apply(agent.id,withoutRead.id)
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'NO STATE SOURCE'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  assert.equal(ctx.dshMemoryManager.traces.filter(f=>f.id==='mvu:fixture'&&f.evidence==='request-included').length,before,'bound state without a delivered source does not count as retrieval')
  const direct=store.assemblyPresets.save({...withoutRead,rules:[...withoutRead.rules,{id:'direct-mvu',kind:'tavern.mvu/state',enabled:true,role:'system',lifetime:'request'}]})
  store.assemblyPresets.apply(agent.id,direct.id)
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'DIRECT STATE'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  assert.match(requests.at(-1).flatMap(m=>m.content.filter(b=>b.type==='text').map(b=>b.text)).join('\n'),/"hp":100/)
  const directTurn=agent.session.snapshotEvents().findLast(e=>e.type==='turn/start').data.turn
  assert.equal(resourceStatus(roundRows(await ctx.dshMemoryManager.query({scope:{sessionId:agent.id}}),String(directTurn)).find(r=>r.id==='mvu:fixture'),'retrieve'),'已触发')
  assert.equal((await history(agent.id)).facts.filter(f=>f.id==='mvu:fixture'&&f.turn===directTurn).length,1,'direct native state reads also retain historical evidence')

 }finally{await ctx.fiber.dispose();await rm(dir,{recursive:true,force:true})}
})
