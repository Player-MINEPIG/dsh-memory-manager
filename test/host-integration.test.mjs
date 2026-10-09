import assembler from 'dsh-prompt-assembler/plugin'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import * as managerPlugin from '../src/index.js'
const coreRoot=process.env.DSH_MEMORY_CORE
const runtime=process.env.DSH_MEMORY_RUNTIME,tavernRoot=process.env.DSH_MEMORY_TAVERN
// Uses real DSH core and Tavern modules; only the provider transport and resource are synthetic.
test('actual DSH request contains managed resource and version evidence; unload preserves native execution',{skip:!runtime||!tavernRoot||!coreRoot,timeout:30000},async()=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SystemPrompt}=await load('@deepseek-ai/dsh-system-prompt'),llm=await load('@deepseek-ai/dsh-llm')
 const tavern=await import(pathToFileURL(join(tavernRoot,'packages/tavern-loader/src/index.js')).href)
 const ctx=new Context(),dir=await mkdtemp(join(tmpdir(),'dmm-host-')),requests=[],errors=[]
 try{
  for(const id of ['sessionController','workspaceController','directoryPickerController'])ctx.provide(id,id==='sessionController'?{inspect:async sessionId=>{const session=ctx.sessions.get(sessionId);return {meta:session.header,events:session.snapshotEvents(),inheritedEventCount:0}}}:{})
  await ctx.plugin(SystemPrompt,{personaPrefix:'OFFICIAL'})
  for(const name of ['session','agent','session-projection','llm','tools','agent-loop'])await ctx.plugin((await load('@deepseek-ai/dsh-'+name)).default,name==='agent-loop'?{agents:[]}:{} )
  assert.equal(ctx.agentLoop.requestAssemblyVersion,1)
  ctx.on('agent/error',e=>errors.push(e.error))
  class Provider extends llm.LlmAdapter{async resolveModel(provider,id){return {provider,id,name:id,systemPromptUpdate:'in-history'}}async *stream(request){requests.push(structuredClone(request.messages));yield{type:'block-start',index:0,blockType:'text'};yield{type:'text-delta',index:0,text:'ANSWER'};yield{type:'block-end',index:0,block:{type:'text',text:'ANSWER'}};yield{type:'finish',reason:{kind:'stop'}}}}
  ctx.llm.registerAdapter(['test'],new Provider())
  let store
  await ctx.plugin(assembler,{storageDir:join(dir,'assembler')})
  await ctx.plugin((await import(pathToFileURL(join(coreRoot,'src/plugin.js')).href)).default)
  await ctx.plugin({name:tavern.name,inject:tavern.inject,apply(c){store=tavern.apply(c,{storageDir:join(dir,'tavern')})}})
  const configPath=join(dir,'config.json')
  await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,entries:[{id:'acceptance:1',adapterId:'acceptance',type:'text',whitelist:[{global:true}],blacklist:[],retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'memory.read_content'},{operation:'memory.to_text'}]}}],presets:{}}))
  const plugin=ctx.plugin(managerPlugin,{storageDir:dir,configPath});await plugin
  ctx.dshMemoryManager.registerAdapter({id:'acceptance',authority:'acceptance',list:async()=>[{id:'acceptance:1',type:'text',revision:4}],read:async()=>({id:'acceptance:1',type:'text',content:'MANAGED_RESOURCE_BODY',revision:4})})
  const handle=await ctx.agents.create({sessionId:'memory-real-host',agentOptions:{provider:'test',model:'test'}}),agent=handle.agent
  const preset=store.assemblyPresets.get('builtin-st');preset.id='memory-acceptance';preset.name='Memory acceptance';// Keep the synthetic contribution isolated under complete system snapshot projection.
  preset.rules=preset.rules.map(r=>r.kind==='native-system'?{...r,enabled:false}:r);preset.rules.push({id:'memory',kind:'memory-manager.resources',enabled:true,role:'system',lifetime:'request',depth:null,text:'',name:'Managed resources'})
  const saved=store.assemblyPresets.save(preset);store.assemblyPresets.apply(agent.id,saved.id)
  const turn=async text=>{agent.followup(llm.createUserMessage({content:[{type:'text',text}],source:{kind:'user'}}));await agent.whenIdle();assert.deepEqual(errors,[])}
  await turn('ONE')
  assert(requests[0].some(m=>m.content.some(b=>b.text==='MANAGED_RESOURCE_BODY')))
  const traces=ctx.dshMemoryManager.traces;assert.equal(traces.filter(t=>t.phase==='applied').length,1);assert.equal(traces[0].revision,4);assert.equal(traces[0].configRevision,1)
  // Native Skill registry + official filesystem provider through the same real request path.
  const skillRoot=join(dir,'skills'),skillFile=join(skillRoot,'request-proof','SKILL.md')
  await mkdir(join(skillRoot,'request-proof'),{recursive:true})
  const saveSkill=body=>writeFile(skillFile,'---\nname: request-proof\ndescription: Synthetic request proof\n---\n'+body+'\n')
  await saveSkill('NATIVE_SKILL_BODY_ONE')
  const skillPlugin=ctx.plugin((await load('@deepseek-ai/dsh-skill')).default,{});await skillPlugin
  const filesPlugin=ctx.plugin(await load('@deepseek-ai/dsh-skill-filesystem'),{providerName:'acceptance-files',includeDefaultRoots:false,customSkillDirs:[skillRoot],watch:false});await filesPlugin
  const rows=await ctx.dshMemoryManager.query()
  const skill=rows.rows.find(r=>r.name==='request-proof');assert(skill,JSON.stringify({catalogs:rows.catalogs,diagnostics:rows.diagnostics}))
  const doc=structuredClone(ctx.dshMemoryManager.configuration.document);doc.revision=2;doc.entries.push({id:skill.id,adapterId:'dsh.skills',type:'skill',whitelist:[{global:true}],blacklist:[],retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'memory.read_content'},{operation:'memory.to_text'}]}})
  await writeFile(configPath,JSON.stringify(doc));await ctx.dshMemoryManager.reload()
  await turn('NATIVE ONE')
  assert(requests.at(-1).some(m=>m.content.some(b=>b.text?.includes('NATIVE_SKILL_BODY_ONE'))))
  const firstRevision=ctx.dshMemoryManager.traces.findLast(t=>t.id===skill.id&&t.phase==='applied').revision
  await saveSkill('NATIVE_SKILL_BODY_TWO')
  // Reload provider to invalidate its catalog cache without changing the file identity.
  await filesPlugin.dispose()
  const newFiles=ctx.plugin(await load('@deepseek-ai/dsh-skill-filesystem'),{providerName:'acceptance-files',includeDefaultRoots:false,customSkillDirs:[skillRoot],watch:false});await newFiles
  await turn('NATIVE TWO')
  assert(requests.at(-1).some(m=>m.content.some(b=>b.text?.includes('NATIVE_SKILL_BODY_TWO'))))
  assert.notEqual(ctx.dshMemoryManager.traces.findLast(t=>t.id===skill.id&&t.phase==='applied').revision,firstRevision)
  await newFiles.dispose();await skillPlugin.dispose()
  await turn('SOURCE ABSENT')
  assert(requests.at(-1).some(m=>m.content.some(b=>b.text==='MANAGED_RESOURCE_BODY')))
  assert(!requests.at(-1).some(m=>m.content.some(b=>b.text?.includes('NATIVE_SKILL_BODY_TWO'))))
  await plugin.dispose()
  assert(!ctx.tavernRequestSources.list().some(s=>s.id==='memory-manager.resources'))
  await turn('TWO')
  assert(!requests.at(-1).some(m=>m.content.some(b=>b.text==='MANAGED_RESOURCE_BODY')))
  assert(agent.session.deriveMessages().some(m=>m.content?.some(b=>b.text==='ONE')))
 }finally{await ctx.fiber.dispose();await rm(dir,{recursive:true,force:true})}
})
