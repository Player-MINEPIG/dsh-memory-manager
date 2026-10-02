import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
import * as plugin from '../src/index.js'
const root=process.env.DSH_MEMORY_MVU,runtime=process.env.DSH_MEMORY_RUNTIME
const loadSource=()=>import(pathToFileURL(join(resolve(root),'packages/mvu-adapter/src/index.js')).href)
const adapterId='tavern.mvu',cardStrategy=[{operation:'validate_card_update'},{operation:'apply_card_update'}]
async function setupManager(t,service){
 const dir=await mkdtemp(join(tmpdir(),'manager-mvu-'));t.after(()=>rm(dir,{recursive:true,force:true}))
 const configPath=join(dir,'config.json');await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,presets:{},entries:[]}))
 const manager=await new MemoryManager({configPath}).init(),usage=new Usage(manager),dispose=installMvu(manager,service,usage)
 t.after(async()=>{dispose();await manager.dispose();service.dispose()})
 const configure=async entries=>{await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:manager.configuration.document.revision+1,presets:{},entries}));await manager.reload()}
 return {manager,usage,dispose,configure}
}

test('frozen real MVU adapter shares current identity across scopes and preserves CAS/copy ownership',{skip:!root},async t=>{
 const {MvuService}=await loadSource(),dir=await mkdtemp(join(tmpdir(),'source-mvu-'));t.after(()=>rm(dir,{recursive:true,force:true}))
 const service=new MvuService({storageDir:dir,resources:[{id:'mvu:shared',sessionIds:['s','t'],initial:{stat_data:{hp:10}}}]})
 const {manager:m}=await setupManager(t,service),request={adapterId,id:'mvu:shared'},a=await m.read({...request,scope:{sessionId:'s'}}),b=await m.read({...request,scope:{sessionId:'t'}})
 assert.deepEqual(a.content,b.content);assert.equal(a.revision,b.revision)
 const first=await m.update({...request,scope:{sessionId:'s'},content:{...a.content,stat_data:{hp:8}},expectedRevision:a.revision,operationId:'edit'})
 assert.equal((await m.read({...request,scope:{sessionId:'t'}})).content.stat_data.hp,8)
 await assert.rejects(()=>m.update({...request,scope:{sessionId:'t'},content:b.content,expectedRevision:b.revision,operationId:'stale'}),{code:'REVISION_CONFLICT'})
 const copy=await m.copy({...request,scope:{sessionId:'t'},newId:'mvu:copy'})
 assert.equal(copy.content.stat_data.hp,8);assert.notEqual(copy.id,first.id)
 await m.update({adapterId,id:copy.id,scope:{sessionId:'t'},content:{...copy.content,stat_data:{hp:4}},expectedRevision:copy.revision,operationId:'copy-edit'})
 assert.equal((await m.read({...request,scope:{sessionId:'s'}})).content.stat_data.hp,8)
 const global=await m.query();assert.equal(global.rows.length,2);assert.equal(global.diagnostics.length,0)
 assert.equal((await m.query({scope:{sessionId:'unauthorized'}})).rows.length,0)
 await assert.rejects(()=>m.read({...request,scope:{authority:'remote',sessionId:'s'}}),{code:'MVU_AUTHORITY'})
 const mode=await m.setManagementMode({...request,scope:{sessionId:'s'},mode:'managed',expectedRevision:first.revision,operationId:'manage'})
 assert.equal(mode.managementMode,'managed');assert.equal(mode.revision,first.revision+1)
})

async function cardFixture(t){
 const {MvuService}=await loadSource(),dir=await mkdtemp(join(tmpdir(),'source-card-'));t.after(()=>rm(dir,{recursive:true,force:true}))
 const scope={playthroughId:'p',sessionId:'s',nodeId:'n',variantId:'v',endEventId:1,sessionFormatVersion:4},text="_.add('hp',-1);",fingerprint=createHash('sha256').update(JSON.stringify(text)).digest('hex'),sourceIdentity={version:1,sha256:'a'.repeat(64),scope}
 let granted=false,active=true
 const events=[{seq:0,type:'turn/start',data:{turn:1}},{seq:1,type:'assistant/message',data:{turn:1,message:{id:'reply',content:[{type:'text',text}]}}},{seq:2,type:'turn/end',data:{turn:1,reason:{kind:'completed'}}}]
 const service=new MvuService({storageDir:dir,resources:[{id:'mvu:card',sessionIds:['s'],initial:{stat_data:{hp:10}},schemaSource:'const Schema=z.object({hp:z.number().min(0)});'}],resolveScope:async input=>{assert.deepEqual(input,scope);return {writableHead:active,messageId:'reply',fingerprint}},authorizeCardWrite:async ({grantId,sourceIdentity:identity})=>granted&&grantId==='grant'&&JSON.stringify(identity)===JSON.stringify(sourceIdentity)?{valid:true,write:true,scope,checkCurrent:()=>granted}:null})
 await service.ingest({id:'s',header:{id:'s',version:4},inheritedEventCount:0,snapshotEvents:()=>events});service.inspect=async()=>({header:{id:'s',version:4},events})
 const state=await setupManager(t,service)
 await state.manager.setManagementMode({adapterId,id:'mvu:card',mode:'managed',scope:{sessionId:'s'},expectedRevision:1,operationId:'manage'})
 const policy={id:'mvu:card',adapterId,type:'mvu-state',whitelist:[{sessionId:'s'}],blacklist:[],store:{on:'card_variable_update',rule:{condition:{id:'mvu_card_write_cause',params:{cause:'user-interaction'}}},strategy:cardStrategy}}
 return {...state,service,scope,policy,grant:()=>{granted=true},revoke:()=>{granted=false},leave:()=>{active=false},bind:()=>service.createCardBinding({scope,grantId:'grant',sourceIdentity})}
}
test('real MVU card transaction requires grant and manager policy, exposes source receipts, rejects revoked and unloaded access',{skip:!root},async t=>{
 const f=await cardFixture(t),m=f.manager
 await f.configure([f.policy]);await assert.rejects(f.bind(),{code:'MVU_WRITE_DENIED'})
 f.grant();const {capability}=await f.bind(),request={capability,operation:'patch',value:[{op:'delta',path:'/hp',value:-2}],expectedRevision:2,operationId:'click',cause:'user-interaction'}
 await f.configure([]);await assert.rejects(()=>f.service.cardWrite(request),{code:'MVU_USAGE_DENIED'})
 await f.configure([f.policy]);await assert.rejects(()=>f.service.cardWrite({...request,operationId:'timer',cause:'interval'}),{code:'MVU_USAGE_DENIED'})
 const result=await f.service.cardWrite(request);assert.equal(result.variables.stat_data.hp,7);assert.equal(result.revision,3)
 assert.deepEqual(await f.service.cardWrite(request),result)
 const applied=m.traces.filter(e=>e.phase==='applied');assert.equal(applied.length,1);assert.equal(applied[0].detail,'state-committed');assert.equal(applied[0].on,'card_variable_update');assert.equal(applied[0].configRevision,m.configuration.document.revision)
 assert(m.traces.some(e=>e.phase==='skipped'&&e.cause==='interval'))
 const replacement={capability,operation:'replace',value:{stat_data:{hp:-1}},expectedRevision:3,operationId:'replace',cause:'user-interaction'}
 await assert.rejects(()=>f.service.cardWrite(replacement),{code:'MVU_SCHEMA'})
 assert.equal((await f.service.read({id:'mvu:card',scope:{sessionId:'s'}})).revision,3)
 const replaced=await f.service.cardWrite({...replacement,value:{stat_data:{hp:6}}});assert.equal(replaced.variables.stat_data.hp,6);assert.ok(replaced.variables.mvu_schema);assert.equal(replaced.revision,4)
 assert.equal(m.traces.filter(e=>e.phase==='applied').length,2)
 const historical=await m.read({adapterId,id:'mvu:card',scope:f.scope});assert.equal(historical.historical,true);assert.equal(historical.revision,4);assert.equal(historical.currentRevision,4)
 await assert.rejects(()=>m.update({adapterId,id:'mvu:card',scope:f.scope,content:historical.content,expectedRevision:4,operationId:'history-edit'}),{code:'MVU_SCOPE'})
 f.revoke();await assert.rejects(()=>f.service.cardWrite({...request,expectedRevision:4,operationId:'revoked'}),{code:'MVU_WRITE_DENIED'})
 f.grant();f.dispose();await assert.rejects(()=>f.service.cardWrite({...request,expectedRevision:4,operationId:'manager-removed'}),{code:'MVU_USAGE_DENIED'})
 assert.equal((await f.service.read({id:'mvu:card',scope:{sessionId:'s'}})).content.stat_data.hp,6)
})
test('real source cancels writes when manager unloads or write grant changes during awaited policy',{skip:!root},async t=>{
 for(const action of ['unload','revoke','cancel','final-revoke'])await t.test(action,async sub=>{
  const f=await cardFixture(sub);f.grant();const {capability}=await f.bind()
  if(action==='final-revoke'){const resolveScope=f.service.resolveScope;let calls=0;f.service.resolveScope=async scope=>{const evidence=await resolveScope(scope);if(++calls===2)f.revoke();return evidence}}
  let enter,release;const entered=new Promise(r=>enter=r)
  f.usage.registerCondition({id:'await-review',test:async()=>{enter();await new Promise(r=>release=r);return true}})
  f.policy.store.rule='await-review';await f.configure([f.policy]);const controller=new AbortController()
  const pending=f.service.cardWrite({capability,operation:'patch',value:[{op:'delta',path:'/hp',value:-2}],expectedRevision:2,operationId:'pending',cause:'script',signal:controller.signal})
  await entered;if(action==='unload')f.dispose();else if(action==='revoke')f.revoke();else if(action==='cancel')controller.abort();release();await assert.rejects(()=>pending)
  assert.equal((await f.service.read({id:'mvu:card',scope:{sessionId:'s'}})).content.stat_data.hp,9);assert(!f.manager.traces.some(e=>e.phase==='applied'))
 })
})

test('real DSH request and durable MVU reply pass through actual manager usage and observation adapters',{skip:!root||!runtime,timeout:30000},async()=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SystemPrompt}=await load('@deepseek-ai/dsh-system-prompt'),llm=await load('@deepseek-ai/dsh-llm'),tavern=await import(pathToFileURL(join(resolve(root),'packages/tavern-loader/src/index.js')).href)
 const ctx=new Context(),dir=await mkdtemp(join(tmpdir(),'manager-mvu-host-')),requests=[],errors=[];let store
 try{
  for(const id of ['sessionController','workspaceController','directoryPickerController'])ctx.provide(id,{})
  await ctx.plugin(SystemPrompt,{personaPrefix:'SYNTHETIC'})
  for(const n of ['session','agent','session-projection','llm','tools','agent-loop'])await ctx.plugin((await load('@deepseek-ai/dsh-'+n)).default,n==='agent-loop'?{agents:[]}:{} )
  ctx.on('agent/error',e=>errors.push(e.error))
  class Provider extends llm.LlmAdapter{async *stream(request){requests.push(structuredClone(request.messages));const text="_.add('hp', -5);";yield{type:'block-start',index:0,blockType:'text'};yield{type:'text-delta',index:0,text};yield{type:'block-end',index:0,block:{type:'text',text}};yield{type:'finish',reason:{kind:'stop'}}}}
  ctx.llm.registerAdapter(['test'],new Provider())
  await ctx.plugin({name:tavern.name,inject:tavern.inject,apply(c){store=tavern.apply(c,{storageDir:join(dir,'tavern'),mvu:{resources:[{id:'mvu:host',sessionIds:['*'],managementMode:'managed',initial:{stat_data:{hp:100}}}]}})}})
  const entry={id:'mvu:host',adapterId,type:'mvu-state',whitelist:[{sessionId:'mvu-host'}],blacklist:[],store:{on:'assistant_message_committed',rule:'contains_mvu_update',strategy:[{operation:'parse_mvu_update'},{operation:'validate_update'},{operation:'apply_update'}]},retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'read_content'},{operation:'render_state_and_update_instructions'},{operation:'provide_to_model'}]}}
  await writeFile(join(dir,'config.json'),JSON.stringify({schemaVersion:1,revision:1,entries:[entry],presets:{}}));const managerPlugin=ctx.plugin(plugin,{storageDir:dir});await managerPlugin
  const {agent}=await ctx.agents.create({sessionId:'mvu-host',agentOptions:{provider:'test',model:'test'}}),service=ctx.tavernMvu,m=ctx.dshMemoryManager
  const preset=store.assemblyPresets.save({...store.assemblyPresets.get('builtin-cache'),rules:[...store.assemblyPresets.get('builtin-cache').rules,{id:'mvu',kind:'tavern.mvu/state',role:'system',lifetime:'request'}]});store.assemblyPresets.apply(agent.id,preset.id)
  const turn=async text=>{agent.followup(llm.createUserMessage({content:[{type:'text',text}],source:{kind:'user'}}));await agent.whenIdle();await service.flush();assert.deepEqual(errors,[])}
  await turn('ONE');assert(requests[0].some(m=>m.content.some(b=>b.text?.startsWith('{"hp":100}'))))
  assert.equal((await m.read({adapterId,id:'mvu:host',scope:{sessionId:agent.id}})).content.stat_data.hp,95)
  assert(m.traces.some(f=>f.phase==='applied'&&f.detail==='dsh-request-observed'&&f.revision===0))
  assert(m.traces.some(f=>f.phase==='applied'&&f.detail==='state-committed'&&f.revision===1))
  await managerPlugin.dispose();await turn('TWO')
  assert(!requests.at(-1).some(m=>m.content.some(b=>b.text?.startsWith('{"hp":95}'))))
  assert.equal((await service.read({id:'mvu:host',scope:{sessionId:agent.id}})).content.stat_data.hp,95)
  assert(agent.session.deriveMessages().some(m=>m.content?.some(b=>b.text==='ONE')))
 }finally{await ctx.fiber.dispose();await rm(dir,{recursive:true,force:true})}
})
