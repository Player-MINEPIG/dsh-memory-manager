import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import * as plugin from '../src/index.js'
import {sessionRounds} from '../src/session-rounds.js'
import {operationStatus,observationEvidence} from '../src/observation-modes.js'
const runtime=process.env.DSH_MEMORY_RUNTIME

test('stock native Skill tool and explicit invocation distinguish loaded content from request inclusion',{skip:!runtime,timeout:30000},async()=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SystemPrompt}=await load('@deepseek-ai/dsh-system-prompt'),llm=await load('@deepseek-ai/dsh-llm')
 const ctx=new Context(),dir=await mkdtemp(join(tmpdir(),'dmm-native-skill-')),errors=[],requests=[]
 try{
  await ctx.plugin(SystemPrompt,{personaPrefix:'FIXTURE'})
  for(const name of ['session','agent','session-projection','llm','tools','agent-loop','skill'])await ctx.plugin((await load('@deepseek-ai/dsh-'+name)).default,name==='agent-loop'?{agents:[]}:{} )
  const root=join(dir,'skills'),folder=join(root,'proof-skill');await mkdir(folder,{recursive:true});await writeFile(join(folder,'SKILL.md'),'---\nname: proof-skill\ndescription: Fixture native skill\n---\nNATIVE_SKILL_PROOF\n')
  await ctx.plugin(await load('@deepseek-ai/dsh-skill-filesystem'),{providerName:'proof-files',includeDefaultRoots:false,customSkillDirs:[root],watch:false})
  await ctx.plugin(await load('@deepseek-ai/dsh-tool-skill'),{})
  let invoke=false
  class Provider extends llm.LlmAdapter{async resolveModel(provider,id){return {provider,id,name:id}}async *stream(request){requests.push(structuredClone(request.messages));if(invoke){invoke=false;const block={type:'tool-call',id:'proof-call',name:'skill',arguments:{name:'proof-skill'}};yield{type:'block-start',index:0,blockType:'tool-call'};yield{type:'block-end',index:0,block};yield{type:'finish',reason:{kind:'tool-calls'}};return}yield{type:'block-start',index:0,blockType:'text'};yield{type:'block-end',index:0,block:{type:'text',text:'DONE'}};yield{type:'finish',reason:{kind:'stop'}}}}
  ctx.llm.registerAdapter(['test'],new Provider());ctx.on('agent/error',e=>errors.push(e.error))
  ctx.provide('sessionQuery',{observeSession:async sessionId=>({events:ctx.sessions.get(sessionId).snapshotEvents(),[Symbol.dispose](){}})})
  await ctx.plugin(plugin,{storageDir:join(dir,'manager')})
  const {agent}=await ctx.agents.create({sessionId:'skill-proof',agentOptions:{provider:'test',model:'test'}})
  const manager=ctx.dshMemoryManager
  const resource=(await manager.query({scope:{sessionId:agent.id}})).rows.find(r=>r.name==='proof-skill');assert(resource)
  assert.equal(manager.traces.length,0,'directory lookup does not count as a Skill read')
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'ORDINARY TURN'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  assert.equal(manager.traces.length,0)
  assert.deepEqual(sessionRounds(await manager.query({scope:{sessionId:agent.id}})).map(group=>group.turn),['1'],'native turn without Skill/MVU activity remains visible')
  invoke=true
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'LOAD'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  let facts=manager.traces.filter(f=>f.id===resource.id);assert(facts.some(f=>f.evidence==='content-read'),JSON.stringify({facts,diagnostics:manager.diagnostics}))
  assert(facts.some(f=>f.evidence==='request-included'),JSON.stringify({facts,keys:requests.at(-1).map(m=>({role:m.role,keys:Object.keys(m),callId:m.callId}))}))
  assert.equal(operationStatus({facts},'retrieve'),'triggered')
  const body=await manager.read({adapterId:'dsh.skills',id:resource.id,scope:{sessionId:agent.id}})
  assert(facts.every(f=>f.revision===body.revision),'native observations use the source content revision')
  assert.equal(operationStatus({facts:facts.filter(f=>f.evidence==='content-read')},'retrieve'),'unknown','successful load alone cannot confirm retrieval')
  assert(facts.every(f=>!JSON.stringify(f).includes('NATIVE_SKILL_PROOF')),'receipts never copy Skill bodies')
  agent.followup(llm.createUserMessage({content:[{type:'text',text:'Use /proof-skill'}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])
  facts=manager.traces.filter(f=>f.id===resource.id&&f.turn===3)
  assert(facts.some(f=>f.messageRef?.kind==='skill-invocation'&&f.evidence==='content-read'),JSON.stringify({facts,diagnostics:manager.diagnostics,sources:requests.at(-1).map(m=>({source:m.source,role:m.role,id:m.id})),toolOutput:!!ctx.tools.get('skill',agent)?.output?.render}))
  assert(facts.some(f=>f.messageRef?.kind==='skill-invocation'&&f.evidence==='request-included'))
  assert.equal(agent.session.snapshotEvents().filter(e=>e.type==='request/assembly').length,0,'this test exercises stock native requests')
  assert.deepEqual(sessionRounds(await manager.query({scope:{sessionId:agent.id}})).map(group=>group.turn),['3','2','1'])
  assert.deepEqual(sessionRounds(await manager.query({scope:{sessionId:agent.id},adapterId:'filtered-out'})).map(group=>group.turn),['3','2','1'])
  ctx.on('tools/post-execute',async(exec,result,next)=>{const decision=await next();return exec.name==='skill'?{...decision,content:[{type:'text',text:'FILTERED_SKILL_OUTPUT'}]}:decision})
  const {agent:filtered}=await ctx.agents.create({sessionId:'skill-filtered-proof',agentOptions:{provider:'test',model:'test'}})
  invoke=true
  filtered.followup(llm.createUserMessage({content:[{type:'text',text:'LOAD FILTERED'}],source:{kind:'user'}}));await filtered.whenIdle();assert.deepEqual(errors,[])
  const filteredFacts=manager.traces.filter(f=>f.id===resource.id&&f.sessionId===filtered.id)
  assert(filteredFacts.some(f=>f.evidence==='content-read'),'the source body loaded successfully')
  assert(!filteredFacts.some(f=>f.evidence==='request-included'),'replaced model-facing output must not claim Skill body inclusion')
  assert.equal(operationStatus({facts:filteredFacts},'retrieve'),'unknown')
  const filteredText=requests.at(-1).flatMap(m=>m.content.filter(b=>b.type==='text').map(b=>b.text)).join('\n')
  assert.match(filteredText,/FILTERED_SKILL_OUTPUT/);assert.doesNotMatch(filteredText,/NATIVE_SKILL_PROOF/)

 }finally{await ctx.fiber.dispose();await rm(dir,{recursive:true,force:true})}
})
