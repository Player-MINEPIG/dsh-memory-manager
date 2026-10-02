import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {skillAdapter} from '../src/adapters/skills.js'
const row=id=>({id,type:'text',content:'body',revision:1})
const manager=()=>new MemoryManager({configPath:'/unused'})
const rejected=()=>Object.assign(Error('not committed'),{code:'VALIDATION_FAILED'})

test('each rejected mutation releases only new reservations and preserves confirmed ownership',async()=>{
 for(const method of ['copy','update','setManagementMode']){
  const m=manager();m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async({id})=>row(id),[method]:async()=>{throw rejected()}})
  m.registerAdapter({id:'b',authority:'b',list:async()=>[],read:async({id})=>row(id)})
  await m.read({adapterId:'a',id:'known'})
  for(const id of ['known','fresh'])await assert.rejects(()=>m[method]({adapterId:'a',id,newId:'destination',content:'x',expectedRevision:1,operationId:id,mode:'managed'}),{code:'VALIDATION_FAILED'})
  assert.equal(m.reservations.size,0)
  assert.equal((await m.read({adapterId:'b',id:'fresh'})).id,'fresh')
  if(method==='copy')assert.equal((await m.read({adapterId:'b',id:'destination'})).id,'destination')
  await assert.rejects(()=>m.read({adapterId:'b',id:'known'}),{code:'OWNERSHIP_CONFLICT'})
 }
})

test('concurrent reservations cannot be released by a sibling rejection',async()=>{
 const m=manager(),releases=[]
 m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async({id})=>row(id),copy:()=>new Promise((resolve,reject)=>releases.push({resolve,reject}))})
 let writes=0;m.registerAdapter({id:'b',authority:'b',list:async()=>[],read:async({id})=>row(id),copy:async()=>{writes++;return row('target')}})
 const args={adapterId:'a',id:'source',newId:'target'}
 const first=m.copy(args),second=m.copy(args)
 const failure=assert.rejects(()=>first,{code:'VALIDATION_FAILED'});releases[0].reject(rejected());await failure
 await assert.rejects(()=>m.copy({adapterId:'b',id:'other',newId:'target'}),{code:'OWNERSHIP_CONFLICT'});assert.equal(writes,0)
 releases[1].resolve(row('target'));await second
 assert.equal(m.reservations.size,0)
 await assert.rejects(()=>m.read({adapterId:'b',id:'target'}),{code:'OWNERSHIP_CONFLICT'})
})

test('unknown copy result is not a confirmed owner and requires source reconciliation',async()=>{
 const m=manager();m.registerAdapter({id:'a',authority:'a',list:async()=>[],read:async()=>null,copy:async()=>{throw Error('transport lost')}})
 m.registerAdapter({id:'b',authority:'b',list:async()=>[],read:async({id})=>row(id)})
 await assert.rejects(()=>m.copy({adapterId:'a',id:'source',newId:'target'}),/transport lost/)
 assert.equal(m.owners.has('target'),false);assert(m.reservations.get('target').uncertain)
 await assert.rejects(()=>m.read({adapterId:'b',id:'target'}),{code:'OWNERSHIP_CONFLICT'})
 assert.equal(await m.read({adapterId:'a',id:'target'}),null)
 assert.equal((await m.read({adapterId:'b',id:'target'})).id,'target')
})

test('declared virtual identity survives body changes and adapter recreation; policy remains bound',async()=>{
 let content='one';const definition=()=>({name:'virtual',provider:'runtime',content,metadata:{dshResourceIdentity:{version:1,namespace:'test.skills',id:'stable'}}})
 const registry={list:async()=>[{name:'virtual',provider:'runtime'}],get:async()=>definition()},ctx={skills:registry,get:()=>undefined}
 const a=skillAdapter(ctx),before=(await a.list({scope:{}}))[0]
 const m=manager(),u=new Usage(m);m.registerAdapter(a)
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[{id:before.id,adapterId:'dsh.skills',type:'skill',whitelist:[{global:true}],blacklist:[],retrieve:{on:'request',rule:true,strategy:'read'}}]}
 u.registerOperation({id:'read',readOnly:true,run:({value})=>value.content})
 content='two';const b=skillAdapter(ctx),after=(await b.list({scope:{}}))[0]
 assert.equal(after.id,before.id);assert.notEqual(after.revision,before.revision);assert.equal(after.capabilities.bind,true)
 assert.equal((await u.trigger({id:before.id,preview:true,event:{on:'request',eventId:'proof',scope:{}}})).value,'two')
})

test('undeclared virtual skills have view-only handles, diagnostics and a fail-closed policy gate',async()=>{
 let content='one';const ctx={skills:{list:async()=>[{name:'virtual',provider:'runtime'}],get:async()=>({name:'virtual',provider:'runtime',content})},get:()=>undefined}
 const m=manager(),a=skillAdapter(ctx);m.registerAdapter(a);const q=await m.query(),before=q.rows[0]
 assert.equal(before.capabilities.bind,false);assert(q.diagnostics.some(d=>d.code==='SKILL_STABLE_ID_REQUIRED'))
 content='two';const after=(await m.query()).rows[0];assert.equal(after.id,before.id);assert.notEqual(after.revision,before.revision)
 assert.equal((await m.read({adapterId:'dsh.skills',id:before.id})).content,'two')
 assert.notEqual((await skillAdapter(ctx).list({scope:{}}))[0].id,before.id)
 const u=new Usage(m);let calls=0;u.registerOperation({id:'read',readOnly:true,run:()=>++calls})
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[{id:before.id,adapterId:'dsh.skills',type:'skill',whitelist:[{global:true}],blacklist:[],retrieve:{on:'request',rule:true,strategy:'read'}}]}
 await assert.rejects(()=>u.trigger({id:before.id,preview:true,event:{on:'request',eventId:'proof',scope:{}}}),{code:'SKILL_STABLE_ID_REQUIRED'});assert.equal(calls,0)
})
