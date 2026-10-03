import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {ScopeDirectory} from '../src/scope-directory.js'
import {dshScopes} from '../src/adapters/dsh-scopes.js'
import {formFrom,entryFrom} from '../src/client-form.js'
import {handler} from '../src/http.js'
import {renderDocumentation} from '../src/documentation.js'
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'dmm-ux-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'config.json'),entry={id:'body:1',adapterId:'source',type:'text',whitelist:[{global:true}],retrieve:{on:'request',rule:true,strategy:[{operation:'read'}]},opaque:{keep:true}};await writeFile(path,JSON.stringify({schemaVersion:1,revision:1,entries:[entry],presets:{}}));const m=await new MemoryManager({configPath:path}).init(),u=new Usage(m);let reads=0;const source={id:'source',authority:'fixture',list:()=>[{id:entry.id,type:'text',name:'Body',capabilities:{edit:true}}],read:()=>{reads++;return {id:entry.id,type:'text',content:'SOURCE_AUTHORITY',revision:1}},validateConfig:()=>{}};const stop=m.registerAdapter(source);u.registerOperation({id:'read',readOnly:true,run:({value})=>value.content});return {m,u,path,entry,source,stop,reads:()=>reads}}
test('cross-adapter draft is selectable but requires explicit route support; source content and unknown metadata survive save',async t=>{
 const {m,u,path,entry,reads}=await setup(t),route={id:'route',authority:'fixture',list:()=>[],read:()=>{throw Error('target must not own or read body')},validateConfig:()=>{}}
 m.registerAdapter(route);await m.query();const form=formFrom(entry);form.adapterId='route';const draft=entryFrom(form,entry),args={id:entry.id,adapterId:'source',entry:draft,expectedRevision:1}
 assert.equal(draft.sourceAdapterId,'source');assert.deepEqual(draft.opaque,{keep:true});const before=await readFile(path,'utf8')
 assert((await m.validateEntry(args)).diagnostics.some(d=>d.code==='ROUTE_UNSUPPORTED'));await assert.rejects(m.saveEntry(args),{code:'VALIDATION_FAILED'});assert.equal(await readFile(path,'utf8'),before);assert.equal(reads(),0)
 route.validateResourceRoute=({id,sourceAdapterId})=>({supported:true,id,sourceAdapterId});assert.equal((await m.validateEntry(args)).valid,true);const saved=await m.saveEntry(args);assert.equal(saved.local.adapterId,'route');assert.equal(saved.local.sourceAdapterId,'source');assert.equal((await m.query()).rows[0].adapterId,'source');assert.equal((await u.trigger({id:entry.id,preview:true,event:{eventId:'route',on:'request'}})).value,'SOURCE_AUTHORITY');assert.equal(reads(),1)
})
test('adapter disable/unload/re-enable never grants writes or drops rule/content identity and invalidates leases',async t=>{
 const {m,u,entry,source,stop}=await setup(t);const first=await m.query();assert.equal(first.rows[0].capabilities.edit,false)
 assert.equal(m.adapterCatalog().directories.find(p=>p.id==='tavern.scopes').installed,false);assert.throws(()=>m.setAdapterEnabled({id:'source',enabled:false,kind:'unknown'}),{code:'INVALID_REQUEST'});const generation=m.optionCatalog().catalogRevision;m.setAdapterEnabled({id:'source',enabled:false});assert.notEqual(m.optionCatalog().catalogRevision,generation);await assert.rejects(m.read({adapterId:'source',id:entry.id}),{code:'SOURCE_UNAVAILABLE'});await assert.rejects(u.trigger({id:entry.id,event:{eventId:'disabled',on:'request'}}),{code:'SOURCE_UNAVAILABLE'});assert.equal((await m.query()).rows[0].missing,true)
 m.setAdapterEnabled({id:'source',enabled:true});assert.equal((await m.query()).rows[0].missing,undefined);stop();assert.equal(m.adapterCatalog().adapters.find(a=>a.id==='source'),undefined);const stopAgain=m.registerAdapter(source);assert.equal((await m.query()).rows[0].name,'Body');stopAgain()
})
test('DSH directory paginates public metadata only; duplicate titles preserve stable IDs and workspace filtering',async()=>{
 const spaces=[{id:'w:1',title:'Workspace',sessionIds:['s:1','s:2']}],sessions=[{id:'s:1',header:{title:'Same'}},{id:'s:2',header:{title:'Same'}},{id:'s:3',header:{title:'Else'}}]
 for(const s of sessions)Object.defineProperty(s,'snapshotEvents',{get(){throw Error('event-log scan forbidden')}})
 const directory=new ScopeDirectory();directory.register(dshScopes({sessions:{list:()=>sessions},sessionProjections:{cachedSnapshot:s=>({values:{title:s.header.title}})},workspaceRegistry:{list:()=>spaces}}));const request={providerId:'dsh.scopes',kind:'sessionId',query:'same',workspaceId:'w:1',limit:1},one=await directory.search(request),two=await directory.search({...request,cursor:one.nextCursor});assert.equal(one.items[0].id,'s:1');assert.equal(two.items[0].id,'s:2');assert.equal(two.nextCursor,undefined);await assert.rejects(directory.search({...request,query:'else',cursor:one.nextCursor}),{code:'DIRECTORY_CHANGED'});spaces[0].title='Changed';await assert.rejects(directory.search({...request,cursor:one.nextCursor}),{code:'DIRECTORY_CHANGED'})
 directory.setEnabled('dsh.scopes',false);await assert.rejects(directory.search(request),{code:'DIRECTORY_UNAVAILABLE'});directory.setEnabled('dsh.scopes',true);assert.equal((await directory.search(request)).items.length,1)
})
test('untrusted scope claims do not match; trusted metadata lease revokes after async operation',async t=>{
 const {m,u,entry}=await setup(t);m.configuration.document.entries[0].whitelist=[{characterId:'actual'}]
 assert.equal((await u.trigger({id:entry.id,preview:true,event:{on:'request',eventId:'fake',scope:{characterId:'actual'}}})).matched,false)
 let selected='actual';m.scopeDirectory.register({id:'tavern-test',kinds:['characterId'],search:()=>({items:[]}),context:()=>{const id=selected;return {scope:{characterId:id},checkCurrent:()=>selected===id}}});u.registerOperation({id:'change',readOnly:true,run:({value})=>{selected='different';return value}});m.configuration.document.entries[0].retrieve.strategy=[{operation:'change'}];await assert.rejects(u.trigger({id:entry.id,preview:true,event:{on:'request',eventId:'lease',scope:{characterId:'forged'}}}),{code:'CAPABILITY_CHANGED'})
})
test('Host admission rejects directory access before source callback; HTML renders Markdown and denies executable input',async()=>{
 const m=new MemoryManager({configPath:'/unused'});let calls=0;m.scopeDirectory.register({id:'private',kinds:['userId'],search:()=>{calls++;return {items:[]}}});const req={url:'/api/dsh-memory-manager/scope-directory?providerId=private&kind=userId',method:'GET',headers:{}},res={statusCode:200,setHeader(){},end(){}};await handler(m,{admit:()=>({rejection:403})})(req,res);assert.equal(res.statusCode,403);assert.equal(calls,0)
 const html=renderDocumentation('# Title\n## Scope\n<script src="https://evil"></script>\n[bad](javascript:alert(1))\n| A | B |\n| --- | --- |\n| one | two |');assert(html.includes('<h1'));assert(html.includes('<table>'));assert(html.includes('id="scope"'));assert(!html.includes('<script'));assert(!html.includes('href="javascript:'))
})
