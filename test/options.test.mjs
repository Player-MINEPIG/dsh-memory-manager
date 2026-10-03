import {test} from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {effective,validateDocument} from '../src/config.js'
import {parameterErrors,validateParameterSchema} from '../src/option-schema.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
const empty=()=>({schemaVersion:1,revision:1,presets:{},entries:[]})
const options={version:1,types:[{id:'text',label:'Text'}],events:[{id:'before_model_request',label:'Before request',mode:'retrieve'}],strategies:[{id:'fixed',label:'Source fixed chain',mode:'retrieve',events:['before_model_request'],value:[{operation:'render'}]}],modes:{store:{supported:false,reason:'readonly'},retrieve:{supported:true,onSelection:'single',strategySelection:'fixed'}}}
test('catalog reflects actual registrations, source capabilities and ABA generations without executing resource access',()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let effects=0
 const stop=m.registerAdapter({id:'a',authority:'test',optionCatalog:options,list:()=>{effects++;return []},read:()=>{effects++},validateConfig:()=>{effects++}})
 const test=()=>{effects++;return true},off=u.registerCondition({id:'named',label:'Named condition',test,parameters:{type:'object',properties:{level:{type:'integer',minimum:1,maximum:3}},required:['level']}})
 const before=m.optionCatalog({adapterId:'a'});assert(before.conditions.find(o=>o.id==='named'));assert.equal(before.modes.store.supported,false);assert.equal(before.fields.type[0].value,'text');assert.equal(effects,0)
 off();const off2=u.registerCondition({id:'named',test});assert.notEqual(m.optionCatalog({adapterId:'a'}).catalogRevision,before.catalogRevision);off();assert.equal(u.conditions.size,1);off2();stop();assert.equal(m.optionCatalog().adapters.length,0)
})
test('installed presets preserve local overrides, ongoing composition and no automatic scope',()=>{
 const doc=empty();doc.entries=[{id:'skill:1',adapterId:'dsh.skills',whitelist:[{sessionId:'s'}],preset:'builtin:skill-retrieve',retrieve:{rule:false}}]
 assert.doesNotThrow(()=>validateDocument(doc));const current=effective(doc,'skill:1');assert.equal(current.config.retrieve.rule,true);assert.deepEqual(current.config.whitelist,[{sessionId:'s'}]);assert.equal(current.origins['retrieve.rule'],'preset:builtin:skill-retrieve')
 doc.presets['builtin:skill-retrieve']={type:'custom',retrieve:{rule:false}};assert.equal(effective(doc,'skill:1').config.retrieve.rule,false)
 const m=new MemoryManager({configPath:'/unused'});assert.equal(m.optionCatalog().fields.preset.find(p=>p.id==='builtin:worldbook-retrieve').available,false);assert.deepEqual(m.configuration.document.entries,[])
})
test('typed parameters and local declarative combinations validate without JSON execution',async()=>{
 const schema={type:'object',properties:{enabled:{type:'boolean'},n:{type:'integer',minimum:1,maximum:5},mode:{type:'string',enum:['a','b']}},required:['n']};assert.doesNotThrow(()=>validateParameterSchema(schema));assert.deepEqual(parameterErrors(schema,{n:3,mode:'a'}),[]);assert(parameterErrors(schema,{n:8,extra:true}).length===2)
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let calls=0;u.registerCondition({id:'typed',parameters:schema,test:()=>{calls++;return true}})
 await assert.rejects(u.rule({condition:{id:'typed',params:{n:9}}},{}),{code:'INVALID_PARAMETERS'});assert.equal(calls,0)
 const doc={...empty(),catalog:{rules:[{id:'two',label:'Two',value:{all:[true,false]}}],strategies:[{id:'chain',label:'Chain',value:[{operation:'registered'}]}]}};assert.doesNotThrow(()=>validateDocument(doc));assert.throws(()=>validateDocument({...doc,catalog:{rules:[{id:'bad',label:'Bad',value:{eval:'no'}}]}}),{code:'INVALID_CONFIG'})
})
test('source-owned bridge uses actual config leases and never repeats source execution',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let listener;const adapter={id:'a',authority:'test',strategyOwner:'source',optionCatalog:options,list:async()=>[],read:async()=>null,validateConfig:()=>{},registerUsage:fn=>{listener=fn;return()=>{}}}
 const stop=installManagedSources(m,{protocolVersion:1,adapters:[adapter]},u)
 m.configuration.document={...empty(),entries:[{id:'a:1',adapterId:'a',type:'text',whitelist:[{global:true}],retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'render'}]}}]}
 assert.equal(await listener({id:'a:1',managementMode:'native'}),undefined)
 const request={id:'a:1',managementMode:'managed',on:'before_model_request',scope:{sessionId:'s'},event:{}}
 const permit=await listener(request);assert.equal(permit.enabled,true);assert.equal(permit.checkCurrent(),true)
 m.configuration.pending=Promise.resolve();assert.equal(permit.checkCurrent(),false)
 const permit2=await listener(request);stop();assert.equal(permit2.checkCurrent(),false);assert.equal((await listener(request)).reason,'manager-unloaded')
})

test('descriptor boundaries reject executable keywords, invalid defaults and multiplicative defaults',()=>{
 for(const schema of [{type:'string',$ref:'https://example.invalid'},{type:'integer',default:1.2},{type:'array',items:{type:'boolean'},maxItems:101},{type:'string',minLength:4,maxLength:2}])assert.throws(()=>validateParameterSchema(schema),{code:'INVALID_OPTION_SCHEMA'})
 let nested={type:'boolean'};for(let i=0;i<5;i++)nested={type:'array',items:nested,minItems:100,maxItems:100}
 assert.throws(()=>validateParameterSchema(nested),{code:'INVALID_OPTION_SCHEMA'})
 assert.throws(()=>validateParameterSchema({type:'object',properties:{optional:nested.items}}),{code:'INVALID_OPTION_SCHEMA'})
 assert.throws(()=>validateParameterSchema({type:'array',items:nested.items,minItems:0}),{code:'INVALID_OPTION_SCHEMA'})
 assert(parameterErrors({type:'string'},'a'.repeat(10001)).length)
})
test('incompatible registrations fail static and runtime checks without executing callbacks',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);m.configuration.loaded=true
 m.registerAdapter({id:'a',authority:'test',optionCatalog:{...options,modes:{retrieve:{supported:true,onSelection:'single',strategySelection:'chain'}}},list:async()=>[],read:async()=>{throw Error('must not read')},validateConfig:()=>{}})
 let calls=0;u.registerCondition({id:'b-condition',adapterIds:['b'],test:()=>{calls++;return true}});u.registerOperation({id:'b-op',adapterIds:['b'],run:()=>{calls++}})
 const entry={id:'a:1',adapterId:'a',type:'text',whitelist:[{global:true}],retrieve:{on:'before_model_request',rule:'b-condition',strategy:[{operation:'b-op'}]}};m.configuration.document={...empty(),entries:[entry]}
 assert.equal((await m.validateEntry({id:entry.id,adapterId:'a',entry,expectedRevision:1})).valid,false)
 await assert.rejects(u.trigger({id:entry.id,event:{eventId:'x',on:'before_model_request'}}),{code:'CAPABILITY_MISMATCH'});assert.equal(calls,0)
})
test('awaited conditions cannot resume operations after same-function ABA, and presets track compatibility',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);m.registerAdapter({id:'a',authority:'test',list:async()=>[],read:async()=>({id:'a:1',type:'text',content:'safe'}),validateConfig:()=>{}})
 let enter,release,calls=0;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r),run=()=>{calls++;return 'old'}
 u.registerCondition({id:'gate',test:async()=>{enter();await gate;return true}});const stop=u.registerOperation({id:'op',run})
 m.configuration.document={...empty(),entries:[{id:'a:1',adapterId:'a',whitelist:[{global:true}],retrieve:{on:'test',rule:'gate',strategy:[{operation:'op'}]}}]}
 const pending=u.trigger({id:'a:1',event:{eventId:'x',on:'test'}});await entered;stop();u.registerOperation({id:'op',run});release()
 await assert.rejects(pending,{code:'CAPABILITY_CHANGED'});assert.equal(calls,0)
})
test('catalog revision is scope independent and old catalog cannot validate after registration ABA',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);m.configuration.loaded=true
 m.registerAdapter({id:'a',authority:'test',optionCatalog:options,list:()=>[],read:()=>null,validateConfig:()=>{}})
 const first=m.optionCatalog({adapterId:'a'});assert.equal(m.optionCatalog({adapterId:'a',sessionId:'s'}).catalogRevision,first.catalogRevision)
 const stop=u.registerCondition({id:'new',test:()=>true});stop()
 const report=await m.validateEntry({id:'a:1',adapterId:'a',entry:{id:'a:1',adapterId:'a'},expectedRevision:1,expectedCatalogRevision:first.catalogRevision})
 assert.equal(report.valid,false);assert.equal(report.diagnostics[0].code,'CATALOG_CHANGED')
})
test('source leases are revoked by resource ownership conflict and metadata changes',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let decide
 const adapter={id:'a',authority:'test',strategyOwner:'source',optionCatalog:structuredClone(options),list:()=>[],read:()=>null,validateConfig:()=>{},registerUsage:fn=>{decide=fn;return()=>{}}};installManagedSources(m,{protocolVersion:1,adapters:[adapter]},u)
 m.configuration.document={...empty(),entries:[{id:'a:1',adapterId:'a',whitelist:[{global:true}],retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'render'}]}}]}
 const request={id:'a:1',managementMode:'managed',on:'before_model_request',scope:{},event:{}}
 const lease=await decide(request);adapter.optionCatalog.types[0].label='Changed';assert.equal(lease.checkCurrent(),false)
 const next=await decide(request);m.registerAdapter({id:'b',authority:'test',list:()=>[{id:'a:1',type:'text'}],read:()=>null});await m.query({adapterId:'b'})
 assert.equal(next.checkCurrent(),false);await assert.rejects(decide(request),{code:'OWNERSHIP_CONFLICT'})
})
test('dependency event cannot borrow consumer permission and its own lease expires on rule change',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let decide
 const adapter={id:'a',authority:'test',strategyOwner:'source',optionCatalog:options,list:()=>[],read:()=>null,validateConfig:()=>{},registerUsage:fn=>{decide=fn;return()=>{}}};installManagedSources(m,{protocolVersion:1,adapters:[adapter]},u)
 const request={id:'a:dependency',managementMode:'managed',on:'before_model_request',scope:{sessionId:'s'},event:{usage:'prompt-template-dependency',consumer:{adapterId:'tavern.prompt-templates',id:'prompt-template:allowed'}}}
 m.configuration.document={...empty(),entries:[{id:'prompt-template:allowed',adapterId:'tavern.prompt-templates',whitelist:[{global:true}]}]}
 assert.equal((await decide(request)).enabled,false)
 const entry={id:request.id,adapterId:'a',whitelist:[{sessionId:'s'}],retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'render'}]}}
 m.configuration.document={...empty(),entries:[entry]};const lease=await decide(request);assert(lease.enabled);assert(lease.checkCurrent())
 m.configuration.document={...empty(),revision:2,entries:[{...entry,retrieve:{...entry.retrieve,rule:false}}]};assert.equal(lease.checkCurrent(),false);assert.equal((await decide(request)).enabled,false)
})
