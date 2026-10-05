import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
import {installMvu} from '../src/adapters/mvu.js'
import {builtinPresets} from '../src/builtin-presets.js'
import {formFrom,entryFrom,restoreSourceDefaults} from '../src/client-form.js'
import {managementStatus} from '../src/client-management.js'

// Public contract fixture; no Tavern internals, real data or provider requests.
function sourceFixture(mvu=false){
 const id=mvu?'mvu:own-instance':'world-book:own-book',adapterId=mvu?'tavern.mvu':'tavern.world-books',sessionId='own-session'
 let handler=null,epoch=0,body='OWN BODY',revision=1,metadata
 const configuration=structuredClone(builtinPresets[mvu?'builtin:mvu-managed':'builtin:worldbook-retrieve'].configuration)
 if(mvu)configuration.store.rule=true
 const source={id:adapterId,name:'Own source',authority:'local',strategyOwner:'source',protocolVersion:1,
  optionCatalog:{version:1,types:[{id:'world-book',label:'Own world book'}],events:[{id:'before_model_request',label:'Request',mode:'retrieve'}],modes:{store:{supported:false},retrieve:{supported:true,onSelection:'single',strategySelection:'fixed'}},strategies:[{id:'own-chain',label:'Source chain',mode:'retrieve',events:['before_model_request'],value:configuration.retrieve.strategy}]},
  read:()=>({id,type:configuration.type,content:body,revision,managementMode:handler?'managed':'native'}),
  list:()=>[source.read()],
  listBound:({scope})=>({revision:String(epoch),items:scope.sessionId===sessionId?[{id,adapterId,type:configuration.type,revision,managementMode:handler?'managed':'native',binding:{sessionId,kind:'own-fixture'}}]:[],checkCurrent:()=>true}),
  getManagementDefaults:args=>{if(args.id!==id||args.scope?.sessionId&&args.scope.sessionId!==sessionId)return null;const captured=epoch;return {protocolVersion:1,revision:'own-default-v1',configuration:structuredClone(configuration),scopePolicy:'source-bound',checkCurrent:()=>epoch===captured}},
  validateConfig:()=>{},observe:()=>()=>{},
  registerUsage:(listener,descriptor)=>{assert.deepEqual(descriptor,{providerId:'dsh-memory-manager'});metadata=descriptor;handler=listener;epoch++;return()=>{handler=null;epoch++}},
  setManagementMode:()=>{throw Error('Lifecycle must not call a resource mode CAS')},
  update:({content,expectedRevision})=>{assert.equal(expectedRevision,revision);body=content;revision++;return source.read()}
 }
 return {source,id,adapterId,sessionId,configuration,get metadata(){return metadata},invalidate:()=>epoch++,
  decide:async(scope={sessionId})=>handler?handler({id,on:'before_model_request',scope,managementMode:'managed',event:{}}):{enabled:true,reason:'source-default'},
  scope:{sessionId}}
}
async function setup(t,mvu=false){
 const dir=await mkdtemp(join(tmpdir(),'dmm-lifecycle-own-'));t.after(()=>rm(dir,{recursive:true,force:true}))
 const configPath=join(dir,'config.json'),manager=await new MemoryManager({configPath}).init({createIfMissing:true}),usage=new Usage(manager),fixture=sourceFixture(mvu)
 const install=()=>mvu?installMvu(manager,fixture.source,usage):installManagedSources(manager,{protocolVersion:1,adapters:[fixture.source]},usage)
 let stop=install();t.after(async()=>{stop?.();await manager.dispose()})
 const args=entry=>({id:fixture.id,adapterId:fixture.adapterId,sessionId:fixture.sessionId,entry,expectedRevision:manager.configuration.document.revision})
 const row=async()=>((await manager.query({scope:fixture.scope})).rows[0])
 return {manager,fixture,configPath,args,row,unload:()=>{stop?.();stop=null},reinstall:()=>{stop=install()}}
}

for(const mvu of [false,true])test(`${mvu?'MVU':'source bridge'}: install defaults → preserve override → restore via CAS → unload → reinstall`,async t=>{
 const {manager,fixture,configPath,args,row,unload,reinstall}=await setup(t,mvu)
 const initial=await row();assert.equal(initial.managementMode,'managed');assert.equal(initial.scopePolicy,'source-bound');assert.equal(initial.applicable,true)
 assert.match(managementStatus(initial),/记忆管理.*来源默认规则/)
 assert.deepEqual(initial.config.whitelist,[]);assert.equal((await fixture.decide()).enabled,true)
 assert.equal((await fixture.decide({sessionId:'unrelated'})).enabled,false)
 const snapshot=manager.configurationSnapshot({id:fixture.id,adapterId:fixture.adapterId,sessionId:fixture.sessionId})
 assert.deepEqual(snapshot.config,initial.config);assert.equal(snapshot.local,null)
 const local={id:fixture.id,adapterId:fixture.adapterId,retrieve:{rule:false},opaque:{keep:true}}
 await manager.saveEntry(args(local));assert.equal((await fixture.decide()).enabled,false)
 assert.match(managementStatus(await row()),/本地 \/ 预设覆盖/)
 const beforeContent=await readFile(configPath,'utf8')
 await manager.update({id:fixture.id,adapterId:fixture.adapterId,content:'NEW OWN BODY',expectedRevision:1,operationId:'own-content'})
 assert.equal(await readFile(configPath,'utf8'),beforeContent);assert.equal((await fixture.decide()).enabled,false)
 const presetDoc={...manager.configuration.document,revision:3,entries:[{...local,preset:'own-deny'}],presets:{'own-deny':{retrieve:{rule:false}}},opaqueFile:{keep:true}}
 await writeFile(configPath,JSON.stringify(presetDoc));await manager.reload()
 const restored=entryFrom(restoreSourceDefaults(formFrom(presetDoc.entries[0]),{id:fixture.id,adapterId:fixture.adapterId}),{id:fixture.id,adapterId:fixture.adapterId})
 const preview=await manager.validateEntry(args(restored));assert.equal(preview.valid,true);assert.equal(preview.effective.retrieve.rule,true);assert.equal(preview.scopePolicy,'source-bound')
 assert.equal((await fixture.decide()).enabled,false,'Preview cannot publish defaults')
 await assert.rejects(manager.saveEntry({...args(restored),expectedRevision:2}),{code:'REVISION_CONFLICT'})
 await manager.saveEntry(args(restored));const restoredRow=await row();assert.equal(restoredRow.managementMode,'managed');assert.equal(restoredRow.config.preset,null)
 assert.equal((await fixture.decide()).enabled,true);assert.deepEqual(manager.configuration.document.presets,presetDoc.presets);assert.deepEqual(manager.configuration.document.opaqueFile,{keep:true});assert.deepEqual(manager.getConfig(fixture.id).config.opaque,{keep:true})
 const lease=await fixture.decide();assert.equal(lease.checkCurrent(),true)
 manager.setAdapterEnabled({id:fixture.adapterId,enabled:false});assert.equal(lease.checkCurrent(),false);assert.equal((await fixture.decide()).enabled,false)
 manager.setAdapterEnabled({id:fixture.adapterId,enabled:true});assert.equal(lease.checkCurrent(),false);assert.equal((await fixture.decide()).enabled,true)
 const beforeUnload=await fixture.decide();unload();assert.equal(beforeUnload.checkCurrent(),false);assert.equal(fixture.source.read().managementMode,'native');assert.equal((await fixture.decide()).enabled,true)
 reinstall();assert.equal((await row()).managementMode,'managed');assert.equal((await fixture.decide()).enabled,true);assert.equal(beforeUnload.checkCurrent(),false)
})

test('explicit empty scope/mode and blacklist remain denied; source-bound defaults do not authorize generic usage',async t=>{
 const {manager,fixture,args,row}=await setup(t)
 for(const entry of [{whitelist:[]},{retrieve:{}},{blacklist:[fixture.scope]}]){
  await manager.saveEntry(args({id:fixture.id,adapterId:fixture.adapterId,...entry}))
  assert.equal((await fixture.decide()).enabled,false)
  if(entry.retrieve)assert.match(managementStatus(await row()),/本地 \/ 预设覆盖/)
 }
 await manager.saveEntry(args({id:fixture.id,adapterId:fixture.adapterId}))
 assert.deepEqual(await manager.usage.trigger({id:fixture.id,event:{eventId:'browser-claim',on:'before_model_request',scope:fixture.scope}}),{matched:false,reason:'scope-or-timing'})
 const lease=await fixture.decide();fixture.invalidate();assert.equal(lease.checkCurrent(),false)
})

test('query and actual source decision use the same trusted character scope',async t=>{
 const {manager,fixture,args,row}=await setup(t)
 let characterId='own-character'
 const stop=manager.scopeDirectory.register({id:'own-role-fixture',kinds:['characterId'],search:()=>({items:[]}),context:()=>{const captured=characterId;return {scope:{sessionId:fixture.sessionId,characterId},checkCurrent:()=>characterId===captured}}})
 t.after(stop)
 await manager.saveEntry(args({id:fixture.id,adapterId:fixture.adapterId,whitelist:[{characterId:'own-character'}]}))
 assert.equal((await row()).applicable,true);assert.equal((await fixture.decide()).enabled,true)
 characterId='other-own-character'
 assert.equal((await row()).applicable,false);assert.equal((await fixture.decide()).enabled,false)
})

test('defaults invalidated during validation cannot be saved; invalid local files are preserved and deny delegation',async t=>{
 const {manager,fixture,configPath,args}=await setup(t)
 const before=await readFile(configPath,'utf8')
 fixture.source.validateConfig=()=>{fixture.invalidate()}
 await assert.rejects(manager.saveEntry(args({id:fixture.id,adapterId:fixture.adapterId,retrieve:{rule:false}})),{code:'VALIDATION_FAILED'})
 assert.equal(await readFile(configPath,'utf8'),before)
 await writeFile(configPath,'INVALID OWN FILE');await assert.rejects(manager.reload())
 assert.equal(await readFile(configPath,'utf8'),'INVALID OWN FILE');assert.equal((await fixture.decide()).enabled,false)
 assert.match(managementStatus((await manager.query({scope:fixture.scope})).rows[0]),/配置错误/)
})
