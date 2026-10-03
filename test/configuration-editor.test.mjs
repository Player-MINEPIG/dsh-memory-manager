import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
const doc={schemaVersion:1,revision:1,presets:{p:{type:'text',retrieve:{rule:false}}},entries:[{id:'a:1',adapterId:'a',type:'text',whitelist:[{global:true}],preset:'p',retrieve:{on:'before_model_request',rule:true,strategy:'read'}}]}
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'dmm-editor-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'config.json');await writeFile(path,JSON.stringify(doc));const m=await new MemoryManager({configPath:path}).init(),usage=new Usage(m);let effects=0;usage.registerCondition({id:'never-run',test:()=>{effects++;throw Error('side effect')}});usage.registerOperation({id:'read',readOnly:true,run:()=>{effects++;throw Error('side effect')}});const stop=m.registerAdapter({id:'a',authority:'test',list:()=>{effects++;return []},read:()=>{effects++;throw Error('side effect')},update:()=>{effects++;throw Error('side effect')},validateConfig:c=>{if(c.type!=='text')throw Error('type unsupported')}});return {m,usage,dir,path,stop,effects:()=>effects}}
const args=(m,entry=doc.entries[0])=>({id:'a:1',adapterId:'a',entry:structuredClone(entry),expectedRevision:m.configuration.document.revision})
test('dry-run composes presets with explicit origins but never runs conditions/operations or reads/writes resources',async t=>{
 const {m,effects}=await setup(t),epoch=m.configuration.pending,document=m.configuration.document
 const report=await m.validateEntry(args(m,{...doc.entries[0],retrieve:{...doc.entries[0].retrieve,rule:'never-run'}}))
 assert.equal(report.valid,true);assert.equal(report.local.retrieve.rule,'never-run');assert.equal(report.effective.retrieve.rule,false);assert.equal(report.origins['retrieve.rule'],'preset:p');assert.equal(report.origins.preset,'local');assert.equal(report.origins.blacklist,'default');assert.equal(effects(),0);assert.equal(m.configuration.pending,epoch);assert.equal(m.configuration.document,document)
 assert(report.diagnostics.some(d=>d.level==='unknown'&&d.code==='RUNTIME_AUTHORIZATION_UNCHECKED'))
})
test('atomic save preserves unrelated entries/presets, increments once, round trips disk, rejects stale versions and external same-revision edits',async t=>{
 const {m,path,dir}=await setup(t),entry={...doc.entries[0],blacklist:[{sessionId:'private'}]},before=m.configuration.document
 const saved=await m.saveEntry(args(m,entry));assert.equal(saved.revision,2);assert.equal(saved.local.retrieve.rule,true);assert.equal(saved.config.retrieve.rule,false);assert.equal(m.configuration.document.presets.p.retrieve.rule,false);assert.notEqual(m.configuration.document,before);assert.deepEqual(JSON.parse(await readFile(path,'utf8')),m.configuration.document)
 assert.equal((await m.saveEntry(args(m,entry))).unchanged,true);assert.equal(m.configuration.document.revision,2)
 await assert.rejects(m.saveEntry({...args(m,entry),expectedRevision:1}),{code:'REVISION_CONFLICT'})
 const external={...m.configuration.document,presets:{p:{retrieve:{rule:true}}}};await writeFile(path,JSON.stringify(external));await assert.rejects(m.saveEntry(args(m,{...entry,type:'text',blacklist:[]})),{code:'REVISION_CONFLICT'});assert.deepEqual(JSON.parse(await readFile(path,'utf8')),external);assert.equal(m.configuration.document.revision,2);assert(!(await readdir(dir)).some(f=>f.includes('.tmp-')))
})
test('invalid draft, unknown capability, unavailable source and source validation failure keep disk and active config untouched',async t=>{
 const {m,path,stop}=await setup(t),disk=await readFile(path,'utf8'),document=m.configuration.document
 for(const entry of [{...doc.entries[0],type:'bad',preset:null},{...doc.entries[0],preset:null,retrieve:{rule:'not-registered'}},{...doc.entries[0],preset:null,retrieve:{strategy:'not-registered'}},{...doc.entries[0],id:'other'}]){
  assert.equal((await m.validateEntry(args(m,entry))).valid,false);await assert.rejects(m.saveEntry(args(m,entry)),{code:'VALIDATION_FAILED'});assert.equal(await readFile(path,'utf8'),disk);assert.equal(m.configuration.document,document)
 }
 stop();const report=await m.validateEntry(args(m));assert(report.diagnostics.some(d=>d.code==='SOURCE_UNAVAILABLE'));await assert.rejects(m.saveEntry(args(m)),{code:'VALIDATION_FAILED'})
})
test('queued saves are CAS serialized and validator unload cannot publish a stale permission',async t=>{
 const {m,path,stop}=await setup(t),request=args(m,{...doc.entries[0],blacklist:[]})
 const [a,b]=await Promise.allSettled([m.saveEntry(request),m.saveEntry({...request,entry:{...request.entry,whitelist:[]}})])
 assert.equal(a.status,'fulfilled');assert.equal(b.status,'rejected');assert.equal(m.configuration.document.revision,2)
 stop();let release,enter;const entered=new Promise(r=>enter=r)
 const remove=m.registerAdapter({id:'a',authority:'test',list:()=>[],read:()=>null,validateConfig:async()=>{enter();await new Promise(r=>release=r)}})
 const saving=m.saveEntry(args(m,{...doc.entries[0],blacklist:[]}));await entered;remove();release();await assert.rejects(saving,{code:'VALIDATION_FAILED'});assert.equal(JSON.parse(await readFile(path,'utf8')).revision,2)
})
test('configuration saves revoke old MVU leases and source-owned strategies are validated by source, not generic operation registry',async t=>{
 const {m,usage,path}=await setup(t);let decide
 const mvu={id:'mvu:1',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[{global:true}],store:{on:'card_variable_update',rule:true,strategy:[{operation:'source-op'}]}}
 const disk={...doc,revision:2,entries:[...doc.entries,mvu]};await writeFile(path,JSON.stringify(disk));await m.reload()
 installMvu(m,{protocolVersion:1,list:async()=>[],read:async()=>null,validateConfig:()=>{},registerUsage:fn=>{decide=fn;return()=>{}}},usage)
 const request={id:mvu.id,scope:{sessionId:'s'},managementMode:'managed',on:'card_variable_update',event:{}},lease=await decide(request)
 assert.equal(lease.checkCurrent(),true)
 assert.equal((await m.validateEntry({id:mvu.id,adapterId:'tavern.mvu',entry:mvu,expectedRevision:2})).valid,true);assert.equal(lease.checkCurrent(),true)
 const save=m.saveEntry(args(m,{...doc.entries[0],blacklist:[]}));assert.equal(lease.checkCurrent(),false);await save;assert.equal(lease.checkCurrent(),false)
})
test('ownership claimed during awaited validation prevents publication',async t=>{
 const {m,stop,path}=await setup(t);stop();let release,enter;const entered=new Promise(r=>enter=r)
 m.registerAdapter({id:'a',authority:'test',list:()=>[],read:()=>null,validateConfig:async()=>{enter();await new Promise(r=>release=r)}})
 m.registerAdapter({id:'b',authority:'test',list:()=>[{id:'a:1',type:'text'}],read:()=>null})
 const saving=m.saveEntry(args(m,{...doc.entries[0],blacklist:[]}));await entered;await m.query({adapterId:['b']});release()
 await assert.rejects(saving,{code:'VALIDATION_FAILED'});assert.equal(JSON.parse(await readFile(path,'utf8')).revision,1);assert.equal(m.configuration.document.revision,1)
})
test('final revision growth cannot publish an oversized document and old revision remains reloadable',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'dmm-size-boundary-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'config.json')
 const document={schemaVersion:1,revision:9,entries:[{id:'a:1',adapterId:'a',type:'text'}],presets:{padding:{type:''}}}
 document.presets.padding.type='x'.repeat(2_000_000-JSON.stringify(document).length)
 const original=JSON.stringify(document);assert.equal(original.length,2_000_000);await writeFile(path,original)
 const m=await new MemoryManager({configPath:path}).init();t.after(()=>m.dispose());m.registerAdapter({id:'a',authority:'synthetic',list:async()=>[],read:async()=>null,validateConfig:async()=>{}})
 const current=m.configuration.document
 await assert.rejects(m.saveEntry({id:'a:1',adapterId:'a',expectedRevision:9,entry:{id:'a:1',adapterId:'a',type:'data'}}),{code:'INVALID_CONFIG'})
 assert.equal(await readFile(path,'utf8'),original);assert.equal(m.configuration.document,current);assert.equal(m.configuration.error,null);assert.equal(m.configuration.document.revision,9)
 assert.deepEqual(await m.reload(),{revision:9,unchanged:true});assert.deepEqual(await readdir(dir),['config.json'])
 // Adjacent valid boundary still publishes and reloads at revision 10.
 document.presets.padding.type=document.presets.padding.type.slice(0,-1);await writeFile(path,JSON.stringify(document))
 const n=await new MemoryManager({configPath:path}).init();t.after(()=>n.dispose());n.registerAdapter({id:'a',authority:'synthetic',list:async()=>[],read:async()=>null,validateConfig:async()=>{}})
 assert.equal((await n.saveEntry({id:'a:1',adapterId:'a',expectedRevision:9,entry:{id:'a:1',adapterId:'a',type:'data'}})).revision,10)
 assert.equal(JSON.stringify(JSON.parse(await readFile(path,'utf8'))).length,2_000_000);assert.deepEqual(await n.reload(),{revision:10,unchanged:true})
})
