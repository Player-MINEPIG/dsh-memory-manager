import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
const strategy=[{operation:'parse_mvu_update'},{operation:'validate_update'},{operation:'apply_update'}]
function setup(){
 const m=new MemoryManager({configPath:'/unused'}),usage=new Usage(m);let callback,observer,writes=0
 const service={protocolVersion:1,list:async()=>[],read:async()=>null,update:async()=>{writes++},registerUsage:h=>{callback=h;return()=>{}},observe:h=>{observer=h;return()=>{}},validateConfig:c=>{if(c.store?.on!=='assistant_message_committed')throw Error('unsupported');assert.deepEqual(c.store.strategy,strategy)}}
 const dispose=installMvu(m,service,usage)
 const config={id:'mvu:card',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[{sessionId:'bound-session'}],blacklist:[],store:{on:'assistant_message_committed',rule:'contains_mvu_update',strategy}}
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[config]}
 const request={id:config.id,on:'assistant_message_committed',managementMode:'managed',scope:{sessionId:'bound-session'},event:{operationId:'card-op',expectedRevision:3,cause:'user-interaction',operation:'patch',sourceIdentity:'approved-source',containsMvuUpdate:true}}
 return {m,usage,dispose,config,request,decide:r=>callback(r),observe:e=>observer(e),writes:()=>writes}
}
test('assistant updates use store timing and source evidence; policy permission never performs a mutation',async()=>{
 const t=setup(),r=await t.decide(t.request);assert.equal(r.enabled,true);assert.deepEqual(r.strategy,strategy);assert.equal(r.configRevision,1)
 assert.equal((await t.decide({...t.request,event:{...t.request.event,containsMvuUpdate:false}})).enabled,false)
 assert.equal((await t.decide({...t.request,on:'card_variable_update'})).enabled,false)
 assert.equal((await t.decide({...t.request,scope:{sessionId:'different'}})).enabled,false)
 assert.equal((await t.decide({...t.request,on:'before_model_request'})).enabled,false)
 assert.equal((await t.decide({...t.request,on:'invented_event'})).enabled,false)
 assert.equal(t.writes(),0);assert.equal(t.m.traces.length,0)
 t.config.blacklist=[{sessionId:'bound-session'}];assert.equal((await t.decide(t.request)).enabled,false)
})
test('card policy fails closed for missing/error config, empty whitelist and in-flight unload/reload',async()=>{
 const t=setup();t.config.whitelist=[];assert.equal((await t.decide(t.request)).enabled,false)
 t.m.configuration.document.entries=[];assert.equal((await t.decide(t.request)).enabled,false)
 assert.equal(await t.decide({...t.request,managementMode:'native'}),undefined)
 t.m.configuration.document.entries=[t.config];t.config.whitelist=[{global:true}];t.m.configuration.error={code:'INVALID_CONFIG'};assert.equal((await t.decide(t.request)).enabled,false);t.m.configuration.error=null
 let enter,release;const entered=new Promise(r=>enter=r);t.usage.registerCondition({id:'wait',test:async()=>{enter();await new Promise(r=>release=r);return true}});t.config.store.rule='wait'
 const pending=t.decide(t.request);await entered;t.dispose();release();assert.equal((await pending).enabled,false)
 const second=setup();second.usage.registerCondition({id:'reload',test:()=>{second.m.configuration.document.revision++;return true}});second.config.store.rule='reload';assert.equal((await second.decide(second.request)).reason,'config-changed')
})
test('source denied and committed card facts remain separate and preserve cause and operation identity',()=>{
 const t=setup(),base={id:'mvu:card',sessionId:'bound-session',on:'card_variable_update',cause:'interval'}
 t.observe({...base,eventId:'denied',phase:'skipped',reason:'write-capability-denied'})
 assert.equal(t.m.traces[0].mode,'store');assert.equal(t.m.traces[0].phase,'skipped');assert.equal(t.m.traces[0].cause,'interval');assert(!t.m.traces.some(f=>f.phase==='applied'))
 t.observe({...base,eventId:'committed',cause:'user-interaction',phase:'applied',detail:'state-committed',revision:4})
 assert.equal(t.m.traces.at(-1).detail,'state-committed');assert.equal(t.m.traces.at(-1).on,'card_variable_update');assert.equal(t.writes(),0)
})

test('allowed MVU decisions carry a private synchronous lease invalidated by reload and unload',async()=>{
 const t=setup(),decision=await t.decide(t.request)
 assert.equal(decision.enabled,true);assert.equal(decision.checkCurrent(),true);assert.equal(typeof decision.checkCurrent(),'boolean')
 t.m.configuration.pending=Promise.resolve();assert.equal(decision.checkCurrent(),false)
 const current=await t.decide(t.request);assert.equal(current.checkCurrent(),true)
 t.dispose();assert.equal(current.checkCurrent(),false)
})

test('same-function condition re-registration never revives a revoked policy lease or old disposer',async()=>{
 const t=setup(),sameFunction=()=>true
 const remove=t.usage.registerCondition({id:'review-condition',test:sameFunction});t.config.store.rule='review-condition'
 const old=await t.decide(t.request);assert.equal(old.checkCurrent(),true)
 remove();assert.equal(old.checkCurrent(),false)
 const removeNew=t.usage.registerCondition({id:'review-condition',test:sameFunction})
 assert.equal(old.checkCurrent(),false,'An old policy lease must remain revoked after same-function re-registration')
 const current=await t.decide(t.request);assert.equal(current.checkCurrent(),true)
 remove();assert.equal(current.checkCurrent(),true,'An old disposer cannot remove a new registration')
 removeNew();assert.equal(current.checkCurrent(),false);t.dispose()
})
