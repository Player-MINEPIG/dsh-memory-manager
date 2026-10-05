import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {registerRequestSource,observeTavernRequest,SOURCE_ID} from 'dsh-prompt-assembler/adapters/memory-manager'
test('request resolver is read-only and version identity survives assembly evidence',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m)
 m.configuration.document={schemaVersion:1,revision:2,entries:[{id:'s:1',adapterId:'source',type:'text',whitelist:[{global:true}],blacklist:[],retrieve:{on:'before_model_request',rule:true,strategy:'text'}}],presets:{}}
 m.registerAdapter({id:'source',authority:'source',list:async()=>[],read:async()=>({id:'s:1',type:'text',content:'native resource',revision:3})});u.registerOperation({id:'text',readOnly:true,run:({value})=>value.content})
 let source;registerRequestSource(m,{version:1,register:s=>{source=s;return()=>{}}},u)
 const a=await source.resolve({sessionId:'s',turn:1,step:1,nativeMessages:[]}),b=await source.resolve({sessionId:'s',turn:1,step:1,nativeMessages:[]})
 assert.deepEqual(a,b);assert.equal(m.traces.length,0);assert.deepEqual(source.lifetimes,['request'])
 const messages=[{role:'system',content:[{type:'text',text:a.blocks[0].text}]}]
 const event={seq:10,type:'request/assembly',data:{turn:1,messages,metadata:{owner:'pmp-dsh-tavern',assembly:{preview:false,diagnostics:a.diagnostics,nodes:[{id:'rule:'+a.blocks[0].id,source:{sourceId:SOURCE_ID,resourceId:'s:1'}}]}}}}
 const session={id:'s',snapshotEvents:()=>[event]}
 observeTavernRequest(m,session,{messages:[{role:'user',content:[]}]});assert.equal(m.traces.length,0)
 observeTavernRequest(m,session,{messages});assert.equal(m.traces[0].phase,'applied');assert.equal(m.traces[0].revision,3);assert.equal(m.traces[0].configRevision,2)
 m.configuration.document.revision=3;assert.notEqual((await source.resolve({sessionId:'s'})).blocks[0].id,a.blocks[0].id)
})
test('public assembly snapshot is detached, excludes source-owned routes and denies invalid configuration', () => {
 const m=new MemoryManager({configPath:'/unused'})
 m.configuration.document={schemaVersion:1,revision:4,entries:[{id:'plain',adapterId:'plain',whitelist:[{global:true}],retrieve:{on:'before_model_request'}},{id:'book',adapterId:'book'},{id:'mvu',adapterId:'tavern.mvu'}],presets:{}}
 m.adapters.set('book',{strategyOwner:'source'})
 const result=m.requestAssemblyResources()
 assert.deepEqual(result.entries.map(e=>e.id),['plain'])
 assert.equal(result.entries[0].configurationSnapshot.revision,4)
 result.entries[0].configurationSnapshot.config.whitelist.length=0
 assert.equal(m.configuration.document.entries[0].whitelist.length,1)
 m.configuration.error=new Error('invalid')
 assert.deepEqual(m.requestAssemblyResources(),{available:false,entries:[]})
})
