import test from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
import {installMvu} from '../src/adapters/mvu.js'
const row=(id,adapterId='tavern.world-books',sessionId='SELF_SESSION')=>({id,adapterId,type:'world-book',name:id,binding:{sessionId,kind:'selected-world-book'}})
function setup(t){const m=new MemoryManager({configPath:'/unused-self-authored'});t.after(()=>m.dispose());return m}
function adapter(m,id,extra={}){const a={id,authority:'local',list:()=>{throw Error('global list must not run for a session')},read:()=>{throw Error('body read forbidden')},...extra};m.registerAdapter(a);return a}
function binding(items,checkCurrent=()=>true){return {revision:'self',items,checkCurrent}}
function aggregate(m,read){m.boundMemorySource={adapters:[...m.adapters.values()].filter(a=>a.id.startsWith('tavern.')),listBound:read}}

test('session catalog uses authoritative current bindings, never global rules or old observations; global still includes them',async t=>{
 const m=setup(t),a='tavern.world-books';let globalCalls=0,reads=0,ids=['SELF_BOOK_A']
 adapter(m,a,{list:()=>{globalCalls++;return [row('SELF_BOOK_A'),row('SELF_BOOK_B')]},read:()=>{reads++;throw Error('no body')}})
 m.configuration.document.entries=[{id:'SELF_BOOK_B',adapterId:a,type:'world-book',whitelist:[{global:true}]},{id:'SELF_CONFIG_ONLY',adapterId:a,type:'world-book',whitelist:[{sessionId:'SELF_SESSION'}]}]
 for(const id of ['SELF_BOOK_A','SELF_BOOK_B','SELF_OLD'])m.recordTrace({adapterId:a,id,eventId:id,sessionId:'SELF_SESSION',turn:id==='SELF_BOOK_A'?1:9,phase:'applied'})
 aggregate(m,async()=>binding(ids.map(id=>row(id))))
 let result=await m.query({scope:{sessionId:'SELF_SESSION',characterId:'SPOOF_CARD_B'}})
 assert.deepEqual(result.rows.map(r=>r.id),['SELF_BOOK_A']);assert.deepEqual(result.facets.turns,['1']);assert.equal(result.rows[0].status,'past');assert.equal(result.rows[0].config,null);assert.equal(globalCalls,0);assert.equal(reads,0)
 ids=['SELF_BOOK_B'];result=await m.query({scope:{sessionId:'SELF_SESSION'}})
 assert.deepEqual(result.rows.map(r=>r.id),['SELF_BOOK_B']);assert.deepEqual(result.facets.turns,['9'])
 assert.deepEqual((await m.query()).rows.map(r=>r.id),['SELF_BOOK_A','SELF_BOOK_B','SELF_CONFIG_ONLY','SELF_OLD']);assert.equal(globalCalls,1)
})
test('missing source binding API is explicit despite configured and traced IDs; no global/body callback',async t=>{
 const m=setup(t);adapter(m,'tavern.world-books')
 m.configuration.document.entries=[{id:'SELF_OTHER',adapterId:'tavern.world-books',type:'world-book',whitelist:[{global:true}]}]
 m.recordTrace({id:'SELF_OTHER',adapterId:'tavern.world-books',eventId:'old',sessionId:'SELF_SESSION',turn:7,phase:'applied'})
 const result=await m.query({scope:{sessionId:'SELF_SESSION'}})
 assert.deepEqual(result.rows,[]);assert.deepEqual(result.facets.turns,[]);assert.equal(result.catalogs[0].binding,'unconfirmed');assert.equal(result.diagnostics[0].code,'SESSION_BINDINGS_UNAVAILABLE')
})
test('existing service aggregator is read once, confirms empty sets and preserves actual source/instance pairs',async t=>{
 const m=setup(t);for(const id of ['tavern.world-books','tavern.mvu','tavern.prompt-templates'])adapter(m,id)
 let calls=0;aggregate(m,async()=>{calls++;return binding([{...row('SELF_INSTANCE','tavern.mvu'),type:'mvu-state',binding:{sessionId:'SELF_SESSION',kind:'state-instance',characterId:'SELF_CARD'}}])})
 const result=await m.query({scope:{sessionId:'SELF_SESSION'}})
 assert.equal(calls,1);assert.deepEqual(result.rows.map(r=>r.id),['SELF_INSTANCE']);assert.equal(result.rows[0].binding.characterId,'SELF_CARD');assert.deepEqual(result.catalogs.map(c=>[c.adapterId,c.count]),[['tavern.world-books',0],['tavern.mvu',1],['tavern.prompt-templates',0]])
})
test('final snapshot rejects selection changes, service replacement and adapter ABA after another source await',async t=>{
 for(const revoke of ['selection','service','adapter']){
  const m=setup(t);let current=true,release;const a=adapter(m,'tavern.world-books')
  adapter(m,'slow',{listBound:()=>new Promise(resolve=>release=()=>resolve(binding([])))})
  aggregate(m,async()=>binding([row('SELF_BOOK')],()=>current))
  const pending=m.query({scope:{sessionId:'SELF_SESSION'}});while(!release)await new Promise(resolve=>setImmediate(resolve))
  if(revoke==='selection')current=false;else if(revoke==='service')m.boundMemorySource={...m.boundMemorySource};else{m.setAdapterEnabled({id:a.id,enabled:false});m.setAdapterEnabled({id:a.id,enabled:true})}
  release();const result=await pending;assert.deepEqual(result.rows,[]);assert(result.diagnostics.some(d=>d.code==='SESSION_BINDINGS_CHANGED'))
 }
})
test('metadata rejects wrong session, source, duplicate IDs, bodies and oversized sets; remote authority is never replaced',async t=>{
 for(const items of [[row('SELF_BOOK','tavern.world-books','WRONG_SESSION')],[row('SELF_BOOK','wrong-source')],[row('SELF_BOOK'),row('SELF_BOOK')],[{...row('SELF_BOOK'),content:'SELF_PRIVATE_BODY'}],Array.from({length:2001},(_,i)=>row('SELF_'+i))]){
  const m=setup(t);adapter(m,'tavern.world-books',{listBound:()=>binding(items)})
  const result=await m.query({scope:{sessionId:'SELF_SESSION'}});assert.deepEqual(result.rows,[]);assert.equal(result.diagnostics[0].code,'INVALID_SESSION_BINDINGS')
 }
 const m=setup(t);let seen;adapter(m,'own',{listBound:({scope})=>{seen=scope;throw Object.assign(Error('local only'),{code:'SOURCE_BOUND_SCOPE'})}})
 const result=await m.query({scope:{sessionId:'SELF_SESSION',authority:'remote',characterId:'UNTRUSTED'}});assert.deepEqual(seen,{sessionId:'SELF_SESSION',authority:'remote'});assert.equal(result.diagnostics[0].code,'SOURCE_BOUND_SCOPE')
 await assert.rejects(m.query({scope:{sessionId:0}}),{code:'INVALID_SCOPE'})
})
test('disabled bound sources stay absent despite config/trace and re-enable uses a fresh snapshot',async t=>{
 const m=setup(t);let calls=0;adapter(m,'own',{listBound:({scope})=>{calls++;return binding([row('SELF_OWN','own',scope.sessionId)])}})
 assert.equal((await m.query({scope:{sessionId:'SELF_SESSION'}})).rows.length,1)
 m.configuration.document.entries=[{id:'SELF_OWN',adapterId:'own',type:'text',whitelist:[{global:true}]}]
 m.recordTrace({adapterId:'own',id:'SELF_OWN',eventId:'old',sessionId:'SELF_SESSION',turn:1,phase:'applied'})
 m.setAdapterEnabled({id:'own',enabled:false});assert.deepEqual((await m.query({scope:{sessionId:'SELF_SESSION'}})).rows,[])
 m.setAdapterEnabled({id:'own',enabled:true});assert.equal((await m.query({scope:{sessionId:'SELF_SESSION'}})).rows.length,1);assert.equal(calls,2)
})
test('managed-source service lifetime and MVU public forwarding preserve metadata capability without executing usage',async t=>{
 const m=setup(t),usage=new Usage(m),a={id:'tavern.world-books',authority:'local',strategyOwner:'source',list:()=>[],read:()=>null,validateConfig:()=>{},registerUsage:()=>()=>{}}
 const service={protocolVersion:1,adapters:[a],listBound:()=>binding([row('SELF_BOOK')])},stop=installManagedSources(m,service,usage)
 assert.equal(m.boundMemorySource,service);assert.equal((await m.query({scope:{sessionId:'SELF_SESSION'}})).rows.length,1)
 stop();assert.equal(m.boundMemorySource,undefined)
 const stopMvu=installMvu(m,{protocolVersion:1,list:()=>[],read:()=>null,listBound:({scope})=>binding([{...row('SELF_INSTANCE','tavern.mvu',scope.sessionId),type:'mvu-state'}]),validateConfig:()=>{},registerUsage:()=>()=>{}},usage)
 assert.equal((await m.query({scope:{sessionId:'SELF_SESSION'}})).rows[0].id,'SELF_INSTANCE');stopMvu()
})
