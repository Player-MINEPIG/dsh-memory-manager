import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {pathToFileURL} from 'node:url'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
const document=()=>({schemaVersion:1,revision:1,entries:[],presets:{}})
const request=()=>({id:'world-book:one',on:'before_model_request',managementMode:'native',scope:{authority:'local',sessionId:'s'},event:{usage:'prompt-template-dependency',preview:true,consumer:{adapterId:'tavern.prompt-templates',id:'prompt-template:self'}}})

test('native dependency explicit lease does not apply managed policy or grant ordinary events; every captured generation can revoke it',async()=>{
 const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m);let decide
 const adapter={id:'tavern.world-books',authority:'local',strategyOwner:'source',optionCatalog:{version:1,types:[{id:'world-book',label:'Book'}],events:[{id:'before_model_request',label:'Request',mode:'retrieve'}],strategies:[{id:'native',label:'Native chain',mode:'retrieve',events:['before_model_request'],value:[{operation:'worldbook.activate'},{operation:'worldbook.emit'}]}],modes:{retrieve:{supported:true,strategySelection:'fixed'}}},list:()=>[],read:()=>null,validateConfig:()=>{},registerUsage:fn=>{decide=fn;return()=>{}}}
 const stop=installManagedSources(m,{protocolVersion:1,adapters:[adapter]},u)
 m.configuration.document={...document(),entries:[{id:'world-book:one',adapterId:adapter.id,type:'world-book',whitelist:[],retrieve:{on:'before_model_request',rule:false,strategy:adapter.optionCatalog.strategies[0].value}}]}
 assert.equal(await decide({...request(),event:{}}),undefined)
 let lease=await decide(request());assert.equal(lease.enabled,true);assert.equal(lease.configRevision,null);assert(lease.checkCurrent());assert.deepEqual(lease.strategy,adapter.optionCatalog.strategies[0].value)
 assert.equal((await decide({...request(),managementMode:'managed'})).enabled,false)
 for(const change of [()=>{m.configuration.pending=Promise.resolve()},()=>{m.configuration.document={...m.configuration.document,revision:2}},()=>{m.configuration.error={code:'BROKEN'}},()=>{u.registerCondition({id:'new',test:()=>true})}]){lease=await decide(request());assert(lease.checkCurrent());change();assert.equal(lease.checkCurrent(),false)}
 assert.equal((await decide(request())).enabled,true,'existing config error does not transfer native ownership')
 lease=await decide(request());stop();assert.equal(lease.checkCurrent(),false)
 assert.equal((await decide(request())).enabled,false)
})

const root=process.env.DSH_MEMORY_MVU_DEPENDENCY
for(const mode of ['native','managed'])test(`actual MVU dependency service with manager: ${mode} permission, policy isolation and revocation`,{skip:!root&&'Set DSH_MEMORY_MVU_DEPENDENCY to MVU dependency checkout'},async t=>{
 const {MvuService}=await import(pathToFileURL(join(root,'packages/mvu-adapter/src/service.js')))
 const dir=await mkdtemp(join(tmpdir(),'manager-native-dependency-'));t.after(()=>rm(dir,{recursive:true,force:true}));const configPath=join(dir,'config.json')
 await writeFile(configPath,JSON.stringify(document()))
 const m=await new MemoryManager({configPath}).init(),u=new Usage(m)
 let scopeCurrent=true
 const service=new MvuService({storageDir:dir,resources:[{id:'mvu:self',sessionIds:['s'],managementMode:mode,initial:{stat_data:{value:42}}}],capturePromptScope:()=>()=>scopeCurrent})
 t.after(()=>service.dispose());const input={id:'mvu:self',scope:{authority:'local',sessionId:'s'},event:request().event}
 const before=await service.resolvePromptDependency(input);assert.equal(!!before,mode==='native')
 const stop=installMvu(m,service,u);t.after(stop)
 const entry={id:'mvu:self',adapterId:'tavern.mvu',type:'mvu-state',whitelist:[{sessionId:'s'}],retrieve:{on:'before_model_request',rule:false,strategy:[{operation:'read_content'},{operation:'render_state_and_update_instructions'},{operation:'provide_to_model'}]}}
 await m.saveEntry({id:entry.id,adapterId:entry.adapterId,entry,expectedRevision:1})
 assert.equal(!!await service.resolvePromptDependency(input),mode==='native','managed false rule cannot become a native allow')
 entry.retrieve.rule=true;await m.saveEntry({id:entry.id,adapterId:entry.adapterId,entry,expectedRevision:2})
 const allowed=await service.resolvePromptDependency(input);assert(allowed);assert(allowed.checkCurrent());assert.equal(allowed.content.stat_data.value,42);assert.equal(allowed.configRevision,mode==='native'?null:3)
 assert.equal((await service.read({id:entry.id,scope:input.scope})).managementMode,mode)
 const reload=m.reload();assert.equal(allowed.checkCurrent(),false);await reload
 const next=await service.resolvePromptDependency(input);assert(next.checkCurrent());scopeCurrent=false;assert.equal(next.checkCurrent(),false);scopeCurrent=true
 const current=await service.resolvePromptDependency(input);stop();assert.equal(current.checkCurrent(),false)
 assert.equal(!!await service.resolvePromptDependency(input),mode==='native','zero-handler native remains source-owned; managed fails closed')
 assert.equal(m.traces.filter(f=>f.phase==='applied').length,0)
})
