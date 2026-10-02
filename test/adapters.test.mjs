import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
import {skillAdapter} from '../src/adapters/skills.js'
const manager=()=>new MemoryManager({configPath:'/missing-test-config'})
test('native skills use actual Agent scope and never fall back for unknown session',async()=>{const agent={session:{header:{cwd:'/workspace'}}};let seen;const ctx={get:()=>({get:id=>id==='s'?agent:undefined}),skills:{list:async opts=>{seen=opts;return [{name:'test',provider:'fs',path:'/workspace/SKILL.md',description:'x'}]},get:async()=>({name:'test',provider:'fs',path:'/workspace/SKILL.md',content:'body'})}};const adapter=skillAdapter(ctx);const [r]=await adapter.list({scope:{sessionId:'s'}});assert.equal(seen.scope,agent);assert.equal((await adapter.read({id:r.id,scope:{sessionId:'s'}})).content,'body');await assert.rejects(()=>adapter.list({scope:{sessionId:'remote'}}),{code:'AGENT_UNAVAILABLE'})})
test('MVU three ownership states, config errors and deny-by-default scope',async()=>{const m=manager(),usage=new Usage(m);let handler;const service={protocolVersion:1,list:async()=>[],read:async()=>null,validateConfig:()=>{},registerUsage:h=>{handler=h;return()=>{}},observe:()=>()=>{}};const dispose=installMvu(m,service,usage);assert.equal(await handler({id:'mvu:x',managementMode:'native'}),undefined);assert.equal((await handler({id:'mvu:x',managementMode:'managed'})).enabled,false);m.configuration.document={schemaVersion:1,revision:2,presets:{},entries:[{id:'mvu:x',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[],blacklist:[],retrieve:{on:'before_model_request',rule:true,strategy:'read_content'}}]};assert.equal((await handler({id:'mvu:x',managementMode:'managed',on:'before_model_request',scope:{}})).enabled,false);m.configuration.document.entries[0].whitelist=[{global:true}];assert.equal((await handler({id:'mvu:x',managementMode:'managed',on:'before_model_request',scope:{}})).enabled,true);m.configuration.error={code:'INVALID_CONFIG'};assert.equal((await handler({id:'mvu:x',managementMode:'managed'})).enabled,false);dispose();assert.equal(m.adapters.size,0)})
test('unload cancels in-flight read and old generation cannot populate result',async()=>{const m=manager();let resolve;const stop=m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:()=>new Promise(r=>resolve=r)});const job=m.read({adapterId:'a',id:'a:1'});stop();m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async()=>null});resolve({id:'a:1',type:'text',content:'obsolete'});await assert.rejects(()=>job,{name:'AbortError'})})
test('duplicate identity ownership and invalid JSON are rejected',async()=>{const m=manager();for(const id of ['a','b'])m.registerAdapter({id,authority:id,list:async()=>[{id:'same',type:'text'}],read:async()=>({id:'same',type:'text',content:'x'})});const q=await m.query();assert(q.diagnostics.some(d=>d.code==='OWNERSHIP_CONFLICT'));await assert.rejects(()=>m.read({adapterId:'b',id:'same'}),{code:'OWNERSHIP_CONFLICT'})})
test('source edits preserve CAS and operation identity without local optimistic mutation',async()=>{const m=manager();let content='initial',revision=0;const operations=new Map();m.registerAdapter({id:'a',authority:'a',list:async()=>[{id:'a:1',type:'text'}],read:async()=>({id:'a:1',type:'text',content,revision}),update:async request=>{if(operations.has(request.operationId)){const previous=operations.get(request.operationId);if(previous.content!==request.content)throw Error('IDEMPOTENCY_CONFLICT');return previous}if(request.expectedRevision!==revision)throw Error('REVISION_CONFLICT');content=request.content;revision++;const result={id:'a:1',type:'text',content,revision};operations.set(request.operationId,result);return result}});const request={adapterId:'a',id:'a:1',content:'changed',expectedRevision:0,operationId:'edit'};assert.equal((await m.update(request)).revision,1);assert.equal((await m.update(request)).revision,1);await assert.rejects(()=>m.update({...request,content:'wrong'}),/IDEMPOTENCY_CONFLICT/);await assert.rejects(()=>m.update({...request,operationId:'edit2'}),/REVISION_CONFLICT/);assert.equal((await m.read(request)).content,'changed')})

test('global virtual skill identity is shared; preset shadow uses its own definition',async()=>{
 const definition={name:'shared',provider:'runtime',description:'x',content:'global',metadata:{dshResourceIdentity:{version:1,namespace:'test',id:'global'}}}
 const registry={list:async()=>[definition],get:async()=>definition},shadow={...definition,content:'preset',metadata:{dshResourceIdentity:{version:1,namespace:'test',id:'preset'}}}
 const scoped={list:async()=>[shadow],get:async()=>shadow},agents={get:id=>({id})}
 const adapter=skillAdapter({skills:registry,get:key=>key==='agents'?agents:key==='agentPresets'?{serviceFor:agent=>agent.id==='shadow'?scoped:registry}:undefined})
 const global=(await adapter.list({scope:{}}))[0],session=(await adapter.list({scope:{sessionId:'a'}}))[0],other=(await adapter.list({scope:{sessionId:'shadow'}}))[0]
 assert.equal(global.id,session.id);assert.notEqual(global.id,other.id)
 assert.equal((await adapter.read({id:other.id,scope:{sessionId:'shadow'}})).content,'preset')
})

test('re-registering the same adapter object rejects its previous observer generation',()=>{
 const m=manager(),callbacks=[],a={id:'a',authority:'a',list:async()=>[],read:async()=>null,observe:cb=>{callbacks.push(cb);return()=>{}}}
 const old=m.registerAdapter(a);old();m.registerAdapter(a);old()
 callbacks[0]({id:'a:1',eventId:'old',phase:'applied'});assert.equal(m.traces.length,0)
 callbacks[1]({id:'a:1',eventId:'new',phase:'applied'});assert.equal(m.traces.length,1)
})

import {tavernWorldBooks} from '../src/adapters/tavern.js'
test('world books include automatic and historical resources; only trace decisions mark triggering',async()=>{
 const values={'/world-book-selection':{worldBooks:[]},'/active':{resources:{worldBooks:[{id:'automatic',name:'Bound book'}]}},'/traces':{records:[{id:'trace',worldBooks:[{resource:{id:'historical'},decisions:[{decision:'included'}]}]}]}}
 const a=tavernWorldBooks({baseUrl:'http://127.0.0.1',fetchImpl:async url=>({ok:true,json:async()=>({ok:true,...values[url.pathname.slice('/pmp-dsh-tavern/api/v1'.length)]})})})
 const m=manager();m.registerAdapter(a);const q=await m.query({scope:{sessionId:'s'}})
 assert.equal(q.diagnostics.length,0);assert.equal(q.rows.find(r=>r.id==='world-book:automatic').status,'never');const historical=q.rows.find(r=>r.id==='world-book:historical');assert.equal(historical.status,'past');assert.equal(historical.applied,false)
})
