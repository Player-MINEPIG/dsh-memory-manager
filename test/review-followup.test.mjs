// Targeted offline review; synthetic providers only, no Host/network/browser.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {registerRequestSource} from '../src/adapters/request-source.js'
import {tavernWorldBooks} from '../src/adapters/tavern.js'
import {skillAdapter} from '../src/adapters/skills.js'
const record=(id='r',content='synthetic')=>({id,type:'text',content,revision:1})
const manager=()=>new MemoryManager({configPath:'/tmp/unused-manager-followup'})
const entry=(id,adapterId,rule=true)=>({id,adapterId,type:'text',whitelist:[{global:true}],blacklist:[],retrieve:{on:'request',rule,strategy:'read'}})
const config=(m,entries)=>{m.configuration.document={schemaVersion:1,revision:1,presets:{},entries}}

test('copy and management mode reject known conflicting owners before provider mutation',async()=>{
  const m=manager();let writes=0
  m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async({id})=>record(id)})
  m.registerAdapter({id:'b',authority:'b',list:async()=>[],read:async({id})=>record(id),copy:async()=>{writes++;return record('destination')},setManagementMode:async()=>{writes++;return record('source')}})
  await m.read({adapterId:'a',id:'source'});await m.read({adapterId:'a',id:'destination'})
  await assert.rejects(()=>m.copy({adapterId:'b',id:'source',newId:'fresh'}),{code:'OWNERSHIP_CONFLICT'})
  await assert.rejects(()=>m.copy({adapterId:'b',id:'own-source',newId:'destination'}),{code:'OWNERSHIP_CONFLICT'})
  await assert.rejects(()=>m.setManagementMode({adapterId:'b',id:'source',mode:'managed'}),{code:'OWNERSHIP_CONFLICT'})
  assert.equal(writes,0)
})

test('failed copy does not permanently claim a never-created destination',async()=>{
  const m=manager()
  m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async({id})=>record(id),copy:async()=>{throw Object.assign(Error('No state was created'),{code:'VALIDATION_FAILED'})}})
  m.registerAdapter({id:'b',authority:'b',list:async()=>[],read:async({id})=>record(id)})
  await assert.rejects(()=>m.copy({adapterId:'a',id:'source',newId:'destination'}),{code:'VALIDATION_FAILED'})
  assert.equal((await m.read({adapterId:'b',id:'destination'})).id,'destination')
})

test('condition await cannot switch an in-flight usage into a replacement provider',async()=>{
  const m=manager(),u=new Usage(m);config(m,[entry('r','a','wait')])
  let enter,release;const entered=new Promise(resolve=>enter=resolve)
  const unregister=m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async()=>record('r','old'),validateConfig:()=>{}})
  u.registerCondition({id:'wait',test:async()=>{enter();await new Promise(resolve=>release=resolve);return true}})
  let operations=0;u.registerOperation({id:'read',readOnly:true,run:({value})=>{operations++;return value.content}})
  const pending=u.trigger({id:'r',mode:'retrieve',preview:true,event:{eventId:'event',on:'request',scope:{}}})
  await entered;unregister()
  m.registerAdapter({id:'a',authority:'replacement',list:async()=>[],read:async()=>record('r','replacement'),validateConfig:()=>{throw Object.assign(Error('Replacement rejects config'),{code:'UNSUPPORTED_POLICY'})}})
  release()
  await assert.rejects(()=>pending)
  assert.equal(operations,0)
})

test('resolver isolates unavailable and invalid sources while returning valid resource content',async()=>{
  const m=manager(),u=new Usage(m)
  const entries=[entry('absent','absent'),entry('invalid','invalid'),entry('good','good')]
  for(const e of entries)e.retrieve.on='before_model_request'
  config(m,entries)
  let badReads=0
  m.registerAdapter({id:'invalid',authority:'invalid',list:async()=>[],read:async()=>{badReads++;return record('invalid')},validateConfig:()=>{throw Object.assign(Error('Invalid source policy'),{code:'UNSUPPORTED_POLICY'})}})
  m.registerAdapter({id:'good',authority:'good',list:async()=>[],read:async()=>record('good','GOOD')})
  u.registerOperation({id:'read',readOnly:true,run:({value})=>value.content})
  let source;registerRequestSource(m,{version:1,register:s=>{source=s;return()=>{}}},u)
  const output=await source.resolve({sessionId:'s',nativeMessages:[]})
  assert.deepEqual(output.blocks.map(x=>x.text),['GOOD'])
  assert.equal(output.diagnostics.filter(x=>x.code==='MEMORY_RESOURCE_UNAVAILABLE').length,2)
  assert.equal(badReads,0)
  const controller=new AbortController();controller.abort()
  await assert.rejects(()=>source.resolve({sessionId:'s',signal:controller.signal}),{name:'AbortError'})
})

test('worldbook catalog includes explicit, effective and historical public resources',async()=>{
  const fixture={
    '/world-book-selection':{worldBooks:[{id:'explicit',name:'Explicit'}]},
    '/active':{resources:{worldBooks:[{id:'effective',name:'Effective'}]}},
    '/traces':{records:[{id:'trace-1',worldBooks:[{resource:{id:'historical',name:'Historical'},decisions:[{decision:'included'}]}]}]},
  }
  const adapter=tavernWorldBooks({baseUrl:'http://127.0.0.1:1',fetchImpl:async url=>({ok:true,json:async()=>({ok:true,...fixture[new URL(url).pathname.replace('/pmp-dsh-tavern/api/v1','')]})})})
  const rows=await adapter.list({scope:{sessionId:'synthetic'}})
  assert.deepEqual(rows.map(x=>x.id).sort(),['world-book:effective','world-book:explicit','world-book:historical'])
  assert.equal(rows.find(x=>x.id==='world-book:historical').facts[0].phase,'triggered')
})

test('virtual skill content changes keep entity identity while changing revision',async()=>{
  let content='version-one'
  const definition=()=>({provider:'synthetic-runtime',name:'shared',resourceBase:'synthetic-stable-base',content})
  const registry={list:async()=>[{provider:'synthetic-runtime',name:'shared'}],get:async()=>definition()}
  const adapter=skillAdapter({skills:registry,get:()=>undefined})
  const before=(await adapter.list({scope:{}}))[0]
  content='version-two'
  const after=(await adapter.list({scope:{}}))[0]
  assert.equal(after.id,before.id,'same native skill acquired a new entity ID after a content edit')
  assert.notEqual(after.revision,before.revision)
  assert.equal((await adapter.read({id:before.id,scope:{}})).content,'version-two')
})
