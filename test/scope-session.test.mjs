// Fixed-ID fixtures deliberately test shared-state policy/CAS; production defaults remain session instances.
import test from 'node:test'
import assert from 'node:assert/strict'
import {ScopeDirectory} from '../src/scope-directory.js'
import {dshScopes} from '../src/adapters/dsh-scopes.js'
import {tavernScopes} from '../src/adapters/tavern-scopes.js'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
import {applies} from '../src/config.js'
const sessionId='own-session',otherSession='own-other-session'
function directories(directory,{workspace=true}={}){
 const spaces=workspace?[{id:'own-workspace',sessionIds:[sessionId]}]:[],ctx={sessions:{list:()=>{throw Error('No history/catalog scan permitted')}},workspaceRegistry:{list:()=>spaces}}
 const dsh=dshScopes(ctx,{}, {cold:false});const stopDsh=directory.register(dsh)
 let character='own-character',generation=0
 const catalog={protocolVersion:1,searchScopes:()=>{throw Error('No catalog scan permitted')},resolveScopeContext:async ({sessionId:id})=>{const epoch=generation;return {scope:{sessionId:id,characterId:character,presetId:null,userId:null},checkCurrent:()=>generation===epoch}}}
 const stopTavern=directory.register(tavernScopes(catalog))
 return {spaces,dsh,stopDsh,stopTavern,catalog,change:()=>{character='own-next-character';generation++},dispose:()=>{stopDsh();stopTavern();dsh.dispose()}}
}
test('8a counterexample: actual DSH/Tavern context enrichment keeps the bound session with or without workspace',async()=>{
 for(const workspace of [true,false]){
  const directory=new ScopeDirectory(),providers=directories(directory,{workspace}),scope={authority:'local',sessionId}
  try{const lease=await directory.context(scope,{trustedSource:true});assert.equal(lease.scope.sessionId,sessionId);assert.equal(lease.scope.authority,'local');assert.equal(lease.scope.characterId,'own-character');assert.equal(lease.scope.workspaceId,workspace?'own-workspace':undefined);assert.equal(applies({whitelist:[{sessionId}],blacklist:[]},lease.scope),true)}finally{providers.dispose()}
 }
})
test('8a security counterexample: global allow never bypasses an exact session blacklist after directory enrichment',async()=>{
 const directory=new ScopeDirectory(),providers=directories(directory)
 try{const lease=await directory.context({sessionId},{trustedSource:true});assert.equal(applies({whitelist:[{global:true}],blacklist:[{sessionId}]},lease.scope),false)}finally{providers.dispose()}
})
test('source session anchor cannot be rewritten or invented; conflicting trusted facts fail closed',async()=>{
 const directory=new ScopeDirectory()
 directory.register({id:'conflict',kinds:['sessionId','workspaceId'],search:()=>({items:[]}),context:()=>({scope:{sessionId:otherSession,workspaceId:'own-workspace'},checkCurrent:()=>true})})
 await assert.rejects(directory.context({sessionId},{trustedSource:true}),{code:'SCOPE_CONTEXT_CONFLICT'})
 await assert.rejects(directory.context({},{trustedSource:false}),{code:'SCOPE_CONTEXT_CONFLICT'})
 let providerInput;const derived=new ScopeDirectory();derived.register({id:'facts',kinds:['characterId'],search:()=>({items:[]}),context:input=>{providerInput=input;return {scope:{characterId:'own-character'},checkCurrent:()=>true}}})
 const untrusted=await derived.context({sessionId,characterId:'guest-forgery'});assert.equal(untrusted.scope.characterId,'own-character');assert.equal(untrusted.scope.sessionId,sessionId);assert.equal(providerInput.characterId,undefined)
 await assert.rejects(derived.context({sessionId,characterId:'source-conflict'},{trustedSource:true}),{code:'SCOPE_CONTEXT_CONFLICT'})
 assert.equal((await derived.context({sessionId,characterId:'own-character',presetId:null,userId:null},{trustedSource:true})).scope.characterId,'own-character')
 derived.register({id:'second-facts',kinds:['characterId'],search:()=>({items:[]}),context:()=>({scope:{characterId:'conflicting-character'},checkCurrent:()=>true})})
 await assert.rejects(derived.context({sessionId}),{code:'SCOPE_CONTEXT_CONFLICT'})
})
test('context leases require synchronous true and stay revoked across metadata and registry ABA changes',async()=>{
 const d=new ScopeDirectory(),p=directories(d),lease=await d.context({sessionId},{trustedSource:true});assert.equal(lease.checkCurrent(),true)
 p.change();assert.equal(lease.checkCurrent(),false)
 const current=await d.context({sessionId},{trustedSource:true});p.spaces[0].sessionIds=[];assert.equal(current.checkCurrent(),false)
 d.setEnabled('dsh.scopes',false);d.setEnabled('dsh.scopes',true);assert.equal(current.checkCurrent(),false);p.dispose()
 for(const invalid of [()=>Promise.resolve(true),()=>1,()=>false]){const isolated=new ScopeDirectory();isolated.register({id:'non-sync',kinds:['workspaceId'],search:()=>({items:[]}),context:()=>({scope:{},checkCurrent:invalid})});assert.equal((await isolated.context({sessionId})).checkCurrent(),false)}
})
test('actual manager MVU handler uses enriched exact whitelist/blacklist and never substitutes another session',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),usage=new Usage(m);let callback,scope
 usage.registerCondition({id:'capture-own-scope',test:event=>{scope=event.scope;return true}})
 const stop=installMvu(m,{protocolVersion:1,list:()=>[],read:()=>null,validateConfig:()=>{},registerUsage:fn=>{callback=fn;return()=>{}}},usage),p=directories(m.scopeDirectory)
 const entry={id:'mvu:own',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[{sessionId}],blacklist:[],store:{on:'card_variable_update',rule:{all:[{condition:{id:'mvu_card_write_cause',params:{cause:'user-interaction'}}},'capture-own-scope']},strategy:[{operation:'validate_card_update'},{operation:'apply_card_update'}]}}
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[entry]}
 const request={id:entry.id,managementMode:'managed',on:'card_variable_update',scope:{authority:'local',sessionId},event:{cause:'user-interaction'}}
 try{const permit=await callback(request);assert.equal(permit.enabled,true);assert.equal(scope.sessionId,sessionId);assert.equal(scope.workspaceId,'own-workspace');assert.equal(scope.characterId,'own-character');assert.equal(permit.checkCurrent(),true)
  assert.equal((await callback({...request,scope:{sessionId:otherSession}})).enabled,false)
  entry.whitelist=[{global:true}];entry.blacklist=[{sessionId}];assert.equal((await callback(request)).enabled,false)
  entry.blacklist=[];p.change();assert.equal(permit.checkCurrent(),false)
 }finally{p.dispose();stop();await m.dispose()}
})

import {createHash} from 'node:crypto'
import {mkdtemp,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
const sourceRoot=process.env.DSH_MEMORY_MVU
async function realSource(t){
 const {MvuService}=await import(pathToFileURL(join(sourceRoot,'packages/mvu-adapter/src/service.js'))),root=await mkdtemp(join(tmpdir(),'bound-scope-source-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const text="_.add('hp',-1);",fingerprint=createHash('sha256').update(JSON.stringify(text)).digest('hex'),scope={playthroughId:'own-play',sessionId,nodeId:'own-node',variantId:'own-variant',endEventId:1,sessionFormatVersion:4},sourceIdentity={version:1,sha256:'a'.repeat(64),scope}
 let grantActive=true
 const events=[{seq:0,type:'turn/start',data:{turn:1}},{seq:1,type:'assistant/message',data:{turn:1,message:{id:'own-reply',content:[{type:'text',text}]}}},{seq:2,type:'turn/end',data:{turn:1,reason:{kind:'completed'}}}]
 const service=new MvuService({storageDir:join(root,'source'),resources:[{id:'mvu:own',sharing:'shared',sessionIds:[sessionId,otherSession],initial:{stat_data:{hp:10}}}],inspect:async()=>({header:{id:sessionId,version:4},events}),resolveScope:async value=>{assert.deepEqual(value,scope);return {writableHead:true,messageId:'own-reply',fingerprint}},authorizeCardWrite:async ({grantId,sourceIdentity:identity})=>grantActive&&grantId==='own-grant'&&JSON.stringify(identity)===JSON.stringify(sourceIdentity)?{valid:true,write:true,scope,checkCurrent:()=>grantActive}:null})
 await service.ingest({id:sessionId,header:{id:sessionId,version:4},inheritedEventCount:0,snapshotEvents:()=>events})
 const configPath=join(root,'config.json');await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,presets:{},entries:[]}))
 const manager=await new MemoryManager({configPath}).init(),usage=new Usage(manager),stop=installMvu(manager,service,usage),p=directories(manager.scopeDirectory)
 const row=await service.read({id:'mvu:own',scope:{sessionId}});await manager.setManagementMode({adapterId:'tavern.mvu',id:'mvu:own',scope:{sessionId},mode:'managed',expectedRevision:row.revision,operationId:'own-managed'})
 const policy={id:'mvu:own',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[{sessionId}],blacklist:[],store:{on:'card_variable_update',rule:{condition:{id:'mvu_card_write_cause',params:{cause:'user-interaction'}}},strategy:[{operation:'validate_card_update'},{operation:'apply_card_update'}]}}
 const configure=async entry=>{await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:manager.configuration.document.revision+1,presets:{},entries:[entry]}));await manager.reload()}
 await configure(policy)
 const binding=await service.createCardBinding({scope,grantId:'own-grant',sourceIdentity})
 t.after(async()=>{p.dispose();stop();service.dispose();await manager.dispose()})
 const before=()=>service.read({id:policy.id,scope:{sessionId}}),request=(revision,operationId)=>({capability:binding.capability,operation:'patch',value:[{op:'delta',path:'/hp',value:-2}],expectedRevision:revision,operationId,cause:'user-interaction'})
 return {service,manager,usage,p,policy,configure,before,request,scope,stop,revoke:()=>{grantActive=false}}
}
test('real MVU card commit obeys exact session whitelist and blacklist with both actual directories installed',{skip:!sourceRoot},async t=>{
 const f=await realSource(t),before=await f.before(),result=await f.service.cardWrite(f.request(before.revision,'own-allowed'))
 assert.equal(result.variables.stat_data.hp,before.content.stat_data.hp-2);assert.equal(result.revision,before.revision+1);assert.deepEqual(await f.service.cardWrite(f.request(before.revision,'own-allowed')),result)
 const deny={...f.policy,whitelist:[{global:true}],blacklist:[{sessionId}]};await f.configure(deny);const blocked=await f.before()
 await assert.rejects(f.service.cardWrite(f.request(blocked.revision,'own-blacklist')),{code:'MVU_USAGE_DENIED'});assert.equal((await f.before()).revision,blocked.revision)
 await f.configure({...f.policy,whitelist:[{sessionId:otherSession}]});await assert.rejects(f.service.cardWrite(f.request(blocked.revision,'own-other-session')),{code:'MVU_USAGE_DENIED'});assert.equal((await f.before()).revision,blocked.revision)
 await f.configure(f.policy);for(const cause of ['script','interval'])await assert.rejects(f.service.cardWrite({...f.request(blocked.revision,cause),cause}),{code:'MVU_USAGE_DENIED'})
 assert.equal(f.manager.traces.filter(fact=>fact.phase==='applied').length,1)
})
test('real MVU final source await rejects directory lease, registry ABA, config reload and source-unload revocation',{skip:!sourceRoot},async t=>{
 for(const action of ['selection','workspace','directory-ABA','reload','unload','grant'])await t.test(action,async sub=>{
  const f=await realSource(sub),before=await f.before(),original=f.service.resolveScope
  let enter,release,calls=0;const entered=new Promise(resolve=>enter=resolve)
  f.service.resolveScope=async scope=>{const evidence=await original(scope);if(++calls===2){enter();await new Promise(resolve=>release=resolve)}return evidence}
  const pending=f.service.cardWrite(f.request(before.revision,'own-final-'+action));await entered
  if(action==='selection')f.p.change()
  if(action==='workspace')f.p.spaces[0].id='own-next-workspace'
  if(action==='directory-ABA'){f.manager.scopeDirectory.setEnabled('dsh.scopes',false);f.manager.scopeDirectory.setEnabled('dsh.scopes',true)}
  if(action==='reload')await f.configure({...f.policy,blacklist:[{sessionId}]})
  if(action==='unload')f.stop()
  if(action==='grant')f.revoke()
  release();await assert.rejects(pending)
  const after=await f.before();assert.equal(after.revision,before.revision);assert.deepEqual(after.content,before.content);assert(!f.manager.traces.some(fact=>fact.phase==='applied'))
 })
})
