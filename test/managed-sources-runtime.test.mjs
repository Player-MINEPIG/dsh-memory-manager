import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
import {registerRequestSource} from '../src/adapters/request-source.js'
const root=process.env.DSH_MEMORY_SOURCES

test('real Tavern source catalog → builtin reference → validation/save → managed template output, CAS and unload', {skip:!root&&'Set DSH_MEMORY_SOURCES to Tavern source protocol 1 checkout'},async t=>{
 const {createMemorySources}=await import(pathToFileURL(join(root,'packages/memory-sources/index.js')))
 const {WorldBookStore}=await import(pathToFileURL(join(root,'packages/world-book-library/src/store.js')))
 const directory=await mkdtemp(join(tmpdir(),'manager-source-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const configPath=join(directory,'config.json');await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,entries:[],presets:{}}))
 const service=createMemorySources({storageDir:directory,store:new WorldBookStore(directory),resources:[{id:'prompt-template:self',name:'Self authored',content:'SELF:<%= 2+3 %>',enabled:true,sessionIds:['s']}]})
 const manager=await new MemoryManager({configPath}).init(),usage=new Usage(manager),stop=installManagedSources(manager,service,usage)
 t.after(()=>{stop();service.dispose()})
 const source=service.templates,id='prompt-template:self',adapterId=source.id,scope={sessionId:'s'},context={sessionId:'s',turn:1,step:0,preview:true,assets:{},nativeMessages:[],inputIds:[]}
 assert.equal((await source.resolve(context)).blocks[0].text,'SELF:5')
 const row=await manager.read({adapterId,id,scope});await manager.setManagementMode({adapterId,id,scope,mode:'managed',expectedRevision:row.revision,operationId:'own-fixture'})
 assert.equal((await source.resolve(context)).blocks.length,0)
 const catalog=manager.optionCatalog({adapterId,id,sessionId:'s'});assert(catalog.presets.find(p=>p.id==='builtin:prompt-template-retrieve').available)
 const entry={id,adapterId,preset:'builtin:prompt-template-retrieve',whitelist:[scope]}
 assert.equal((await manager.validateEntry({id,adapterId,entry,expectedRevision:1,expectedCatalogRevision:catalog.catalogRevision})).valid,true)
 await manager.saveEntry({id,adapterId,entry,expectedRevision:1,expectedCatalogRevision:catalog.catalogRevision})
 const output=await source.resolve(context);assert.equal(output.blocks.length,1);assert.equal(output.blocks[0].text,'SELF:5');source.validateResolved(context)
 let generic;registerRequestSource(manager,{version:1,register:value=>{generic=value;return()=>{}}},usage)
 assert.equal((await generic.resolve(context)).blocks.length,0)
 const read=await manager.read({adapterId,id,scope});assert.equal(read.content,'SELF:<%= 2+3 %>')
 await assert.rejects(manager.update({adapterId,id,scope,content:'self',expectedRevision:'stale',operationId:'stale'}),{code:'REVISION_CONFLICT'})
 const configured=manager.getConfig(id).config;const denied={...entry,preset:null,type:'prompt-template',retrieve:{...configured.retrieve,rule:false}}
 await manager.saveEntry({id,adapterId,entry:denied,expectedRevision:2});assert.equal((await source.resolve(context)).blocks.length,0)
 await manager.saveEntry({id,adapterId,entry,expectedRevision:3});const pending=await source.resolve(context);stop();assert.throws(()=>source.validateResolved(context),{code:'SOURCE_POLICY_CHANGED'});assert.equal((await source.resolve(context)).blocks.length,0)
})
