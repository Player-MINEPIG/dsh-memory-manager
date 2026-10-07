import assembler from 'dsh-prompt-assembler/plugin'
import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import * as managerPlugin from '../src/index.js'
import {roundRows,resourceStatus,policySkipReasons} from '../src/session-rounds.js'
const runtime=process.env.DSH_MEMORY_RUNTIME,tavernRoot=process.env.DSH_MEMORY_TAVERN

test('source-owned world-book receipts reach the manager with defaults and explicit denial',{skip:!runtime||!tavernRoot,timeout:30000},async()=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SystemPrompt}=await load('@deepseek-ai/dsh-system-prompt'),llm=await load('@deepseek-ai/dsh-llm')
 const tavern=await import(pathToFileURL(join(tavernRoot,'packages/tavern-loader/src/index.js')).href)
 const ctx=new Context(),dir=await mkdtemp(join(tmpdir(),'dmm-worldbook-host-')),requests=[],errors=[]
 try{
  for(const id of ['sessionController','workspaceController','directoryPickerController'])ctx.provide(id,{})
  await ctx.plugin(SystemPrompt,{personaPrefix:'OFFICIAL'})
  for(const name of ['session','agent','session-projection','llm','tools','agent-loop'])await ctx.plugin((await load('@deepseek-ai/dsh-'+name)).default,name==='agent-loop'?{agents:[]}:{} )
  assert.equal(ctx.agentLoop.requestAssemblyVersion,1,'This check requires the prepared DSH request assembly runtime')
  ctx.on('agent/error',event=>errors.push(event.error))
  class Provider extends llm.LlmAdapter{async resolveModel(provider,id){return {provider,id,name:id,systemPromptUpdate:'in-history'}}async *stream(request){requests.push(structuredClone(request.messages));yield{type:'block-start',index:0,blockType:'text'};yield{type:'text-delta',index:0,text:'ANSWER'};yield{type:'block-end',index:0,block:{type:'text',text:'ANSWER'}};yield{type:'finish',reason:{kind:'stop'}}}}
  ctx.llm.registerAdapter(['test'],new Provider())
  let store
  await ctx.plugin(assembler,{storageDir:join(dir,'assembler')})
  await ctx.plugin({name:tavern.name,inject:tavern.inject,apply(c){store=tavern.apply(c,{storageDir:join(dir,'tavern')})}})
  const configPath=join(dir,'config.json');await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,entries:[],presets:{}}))
  const managerHandle=ctx.plugin(managerPlugin,{storageDir:dir,configPath});await managerHandle
  store.characterStore.import(Buffer.from(JSON.stringify({spec:'chara_card_v2',spec_version:'2.0',data:{name:'Fixture',character_book:{entries:[{id:1,keys:[],content:'EMBEDDED_WORLD_BOOK_BODY',enabled:true,constant:true,position:'before_char'}]}}})),{id:'fixture'})
  const book=store.worldBookStore.import({entries:{0:{uid:0,content:'STANDALONE_WORLD_BOOK_BODY',constant:true}}},{name:'Fixture Book'})
  const {agent}=await ctx.agents.create({sessionId:'worldbook-proof',agentOptions:{provider:'test',model:'test'}})
  store.sessionSelections.set(agent.id,{characterCardId:'fixture',worldBookIds:[book.id]});store.assemblyPresets.apply(agent.id,'builtin-st')
  const ids=['world-book:character:fixture:embedded-world-book','world-book:'+book.id]
  const query=()=>ctx.dshMemoryManager.query({scope:{sessionId:agent.id}})
  assert((await query()).rows.filter(row=>ids.includes(row.id)).every(row=>row.sourceDefault.available&&!row.applied&&row.facts.length===0))
  for(const input of ['ONE','TWO']){
   agent.followup(llm.createUserMessage({content:[{type:'text',text:input}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
   const texts=requests.at(-1).flatMap(message=>message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n')
   assert.match(texts,/EMBEDDED_WORLD_BOOK_BODY/);assert.match(texts,/STANDALONE_WORLD_BOOK_BODY/)
   const event=agent.session.snapshotEvents().findLast(event=>event.type==='request/assembly'),rows=roundRows(await query(),String(event.data.turn))
   for(const id of ids){const row=rows.find(row=>row.id===id);assert(row,id);assert.equal(row.managementMode,'managed');assert.equal(row.origins['retrieve.rule'],'source-default');assert.equal(row.applied,true,`${id}: ${JSON.stringify(event.data.metadata.assembly.diagnostics)}`);assert.equal(row.facts.filter(fact=>fact.phase==='applied').length,1);assert.equal(row.facts[0].requestId,`${agent.id}:${event.seq}`)}
   await ctx.dshMemoryManager.pending
   const journal=JSON.parse(await readFile(join(dir,'observations.json'),'utf8'))
   for(const id of ids){const row=rows.find(row=>row.id===id);assert.deepEqual(journal.filter(fact=>fact.id===id&&fact.adapterId===row.adapterId&&fact.requestId===`${agent.id}:${event.seq}`&&fact.phase==='applied'),row.facts.filter(fact=>fact.phase==='applied'))}
  }
  const source=ctx.tavernMemorySources.worldBooks,id='world-book:'+book.id,before=source.read({id})
  source.setManagementMode({id,mode:'managed',expectedRevision:before.revision,operationId:'explicit-managed-fixture'})
  await ctx.dshMemoryManager.saveEntry({id,adapterId:'tavern.world-books',sessionId:agent.id,entry:{id,adapterId:'tavern.world-books',retrieve:{rule:false}},expectedRevision:1})
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'MANAGED DENY'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  const event=agent.session.snapshotEvents().findLast(event=>event.type==='request/assembly'),skipped=roundRows(await query(),String(event.data.turn)).find(row=>row.id===id)
  assert.equal(skipped.applied,false);assert.equal(resourceStatus(skipped),'策略跳过');assert.equal(policySkipReasons(skipped),'rule')
  assert.equal(skipped.facts.filter(fact=>fact.phase==='skipped').length,1);assert.equal(skipped.managementMode,'managed');assert.equal(skipped.config.retrieve.rule,false)
  assert.equal(skipped.facts[0].requestId,`${agent.id}:${event.seq}`)
  await ctx.dshMemoryManager.pending
  const journal=JSON.parse(await readFile(join(dir,'observations.json'),'utf8'))
  assert.deepEqual(journal.filter(fact=>fact.id===id&&fact.adapterId===skipped.adapterId&&fact.requestId===`${agent.id}:${event.seq}`&&fact.phase==='skipped'),skipped.facts)
  assert.equal(JSON.parse(await readFile(configPath,'utf8')).entries.length,1)
  const savedConfiguration=await readFile(configPath,'utf8')
  await managerHandle.dispose()
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'AFTER UNINSTALL'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  const restoredTexts=requests.at(-1).flatMap(message=>message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n')
  assert.match(restoredTexts,/EMBEDDED_WORLD_BOOK_BODY/);assert.match(restoredTexts,/STANDALONE_WORLD_BOOK_BODY/)
  assert.equal(await readFile(configPath,'utf8'),savedConfiguration,'uninstall retains optional manager configuration')
  assert(agent.session.deriveMessages().some(message=>message.content?.some(block=>block.text==='ONE')))
  const reinstalled=ctx.plugin(managerPlugin,{storageDir:dir,configPath});await reinstalled
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'AFTER REINSTALL'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  const managedTexts=requests.at(-1).flatMap(message=>message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n')
  assert.match(managedTexts,/EMBEDDED_WORLD_BOOK_BODY/);assert.doesNotMatch(managedTexts,/STANDALONE_WORLD_BOOK_BODY/)
  assert.equal(await readFile(configPath,'utf8'),savedConfiguration,'reinstall reuses the saved manager rules')
 }finally{await ctx.fiber.dispose();await rm(dir,{recursive:true,force:true})}
})
