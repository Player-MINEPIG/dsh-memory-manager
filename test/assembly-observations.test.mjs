import test from 'node:test'
import assert from 'node:assert/strict'
import {assemblyObservations,mergeObservations} from '../src/assembly-observations.js'
import {MemoryManager} from '../src/manager.js'
const id='world-book:own',adapterId='tavern.world-books'
const event={type:'request/assembly',seq:3,data:{turn:2,messages:[{role:'system',content:[]}],metadata:{owner:'dsh-prompt-assembler',assembly:{nodes:[{id:'own:block',source:{sourceId:'worldbook',resourceId:id}}],diagnostics:[{code:'TAVERN_MEMORY_RESOURCE_VERSION',adapterId,sourceId:'worldbook',resourceId:id,blockId:'block',revision:'r1'}]}}}}
test('recorded resource evidence restores historical trigger status with no journal or history writes',async t=>{
 const m=new MemoryManager({configPath:'/unused'});t.after(()=>m.dispose())
 m.registerAdapter({id:adapterId,authority:'fixture',list:()=>[],listBound:()=>({revision:'r1',checkCurrent:()=>true,items:[{id,adapterId,type:'world-book',binding:{sessionId:'self',kind:'fixture'}}]}),read:()=>{throw Error('no body reads')}})
 const before=structuredClone(event);m.readSessionEvents=async sessionId=>{assert.equal(sessionId,'self');return [event]}
 const query=await m.query({scope:{sessionId:'self'}})
 assert.equal(query.rows[0].status,'past');assert.equal(query.rows[0].applied,false);assert.equal(query.rows[0].facts[0].origin,'dsh-history');assert.deepEqual(query.facets.turns,['2']);assert.deepEqual(m.traces,[]);assert.deepEqual(event,before)
 const fact={...query.rows[0].facts[0],phase:'applied'};m.recordTrace(fact)
 const next=await m.query({scope:{sessionId:'self'}});assert.equal(next.rows[0].facts.length,1);assert.equal(next.rows[0].applied,true)
})
test('previews, missing node correlation and unrelated source evidence are not triggers',()=>{
 for(const mutate of [e=>e.data.metadata.assembly.preview=true,e=>e.data.metadata.owner='unknown',e=>e.data.metadata.assembly.nodes=[],e=>e.data.metadata.assembly.nodes[0].source.resourceId='other',e=>e.data.metadata.assembly.diagnostics[0].revision=undefined]){const e=structuredClone(event);mutate(e);assert.deepEqual(assemblyObservations([e],'self'),[])}
 const e=structuredClone(event);e.data.metadata.assembly.diagnostics[0]={...e.data.metadata.assembly.diagnostics[0],code:'WORLD_BOOK_POLICY_SKIPPED',reason:'rule'}
 const [fact]=assemblyObservations([e],'self');assert.equal(fact.phase,'skipped');assert.equal(fact.reason,'rule');assert.equal(mergeObservations([], [fact]).length,1)
})

test('history retrieval is independent of a store receipt at the same request coordinates',()=>{
 const read={adapterId:'tavern.world-books',id:'world-book:book',requestId:'s:3',sessionId:'s',mode:'retrieve',phase:'triggered',evidence:'request-included'}
 assert.equal(mergeObservations([{...read,mode:'store'}],[read]).length,2)
 assert.equal(mergeObservations([read],[read]).length,1)
})


test('core history projects MVU macro and direct-state reads independently of storage',()=>{
 const e=structuredClone(event);e.data.metadata.assembly.nodes=[{id:'worldbook:block',source:{sourceId:'worldbook',resourceId:'book'}}]
 const diagnostic={code:'WORLD_BOOK_MVU_VARIABLE_VERSION',resourceId:'mvu:state',blockResourceId:'book',blockId:'block',revision:1,configRevision:2}
 e.data.metadata.assembly.diagnostics=[diagnostic]
 const [fact]=assemblyObservations([e],'self');assert.equal(fact.adapterId,'tavern.mvu');assert.equal(fact.mode,'retrieve');assert.equal(fact.turn,2)
 e.data.metadata.assembly.nodes[0].source.resourceId='wrong';assert.deepEqual(assemblyObservations([e],'self'),[])
 e.data.metadata.assembly.nodes=[{id:'state:block',source:{sourceId:'tavern.mvu/state',resourceId:'mvu:state'}}]
 e.data.metadata.assembly.diagnostics=[{...diagnostic,code:'MVU_RESOURCE_VERSION'}]
 assert.equal(assemblyObservations([e],'self').length,1)
})
