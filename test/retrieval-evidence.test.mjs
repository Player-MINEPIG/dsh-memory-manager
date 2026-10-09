import test from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {operationStatus,evidenceLabel} from '../src/observation-modes.js'
import {mergeObservations} from '../src/assembly-observations.js'
const adapter={id:'fixture',authority:'test',list:()=>[],read:()=>({id:'r',type:'text',revision:1,content:'BODY'}),update:async args=>({id:args.id,type:'text',revision:2,content:args.content})}
function fixture(t,mode='retrieve'){
 const manager=new MemoryManager({configPath:'/unused'}),usage=new Usage(manager);t.after(()=>manager.dispose());manager.registerAdapter(adapter)
 manager.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[{id:'r',adapterId:'fixture',type:'text',whitelist:[{global:true}],[mode]:{on:'event',rule:true,strategy:[]}}]}
 return {manager,usage,event:{eventId:'e',on:'event',turn:1,scope:{sessionId:'s'}}}
}
test('successful resource retrieval and later failure remain distinct from final request inclusion',async t=>{
 const {manager,usage,event}=fixture(t)
 await usage.trigger({id:'r',event})
 assert.equal(operationStatus({facts:manager.traces},'retrieve'),'unknown')
 assert(manager.traces.some(f=>evidenceLabel(f)==='正文读取成功'))
 const included={adapterId:'fixture',id:'r',eventId:'final',requestId:'e',sessionId:'s',turn:1,mode:'retrieve',phase:'applied',evidence:'request-included'}
 assert.equal(mergeObservations(manager.traces,[included]).length,manager.traces.length+1,'an earlier successful read cannot suppress final request proof')
 assert.equal(operationStatus({facts:mergeObservations(manager.traces,[included])},'retrieve'),'triggered')
 manager.traces=[];manager.configuration.document.entries[0].retrieve.strategy=[{operation:'render'}]
 usage.registerOperation({id:'render',readOnly:true,run:()=>{throw Error('render failed')}})
 await assert.rejects(usage.trigger({id:'r',event:{...event,eventId:'failed'}}),/render failed/)
 assert(manager.traces.some(f=>f.evidence==='content-read'));assert.equal(operationStatus({facts:manager.traces},'retrieve'),'unknown')
})
test('storage requires a source commit; completing an empty strategy is not a write',async t=>{
 const {manager,usage,event}=fixture(t,'store')
 await usage.trigger({id:'r',mode:'store',event});assert.equal(operationStatus({facts:manager.traces},'store'),'unknown')
 manager.configuration.document.entries[0].store.strategy=[{operation:'write'}]
 usage.registerOperation({id:'write',run:({id,operationId,event})=>manager.update({adapterId:'fixture',id,scope:event.scope,operationId,expectedRevision:1,content:'NEW'})})
 await usage.trigger({id:'r',mode:'store',event:{...event,eventId:'write'}})
 assert(manager.traces.some(f=>f.evidence==='write-committed'));assert.equal(operationStatus({facts:manager.traces},'store'),'triggered')
})
test('readonly preview and request preparation have explicitly different observation behavior',async t=>{
 const {manager,usage,event}=fixture(t)
 await usage.trigger({id:'r',event,preview:true});assert.equal(manager.traces.length,0)
 await usage.trigger({id:'r',event,preview:true,observeRead:true});assert.equal(manager.traces.length,1);assert.equal(manager.traces[0].evidence,'content-read')
 assert.equal(operationStatus({facts:manager.traces},'retrieve'),'unknown')
})
