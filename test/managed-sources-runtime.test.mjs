import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installManagedSources} from '../src/adapters/managed-sources.js'
import {registerRequestSource} from 'dsh-prompt-assembler/adapters/memory-manager'
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
 assert.equal((await source.resolve(context)).blocks[0].text,'SELF:5')
 assert.equal(manager.configurationSnapshot({adapterId,id,sessionId:'s'}).sourceDefault.available,true)
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
 await manager.saveEntry({id,adapterId,entry,expectedRevision:3});const pending=await source.resolve(context);stop();assert.throws(()=>source.validateResolved(context),{code:'SOURCE_POLICY_CHANGED'});assert.equal((await source.resolve(context)).blocks[0].text,'SELF:5')
})

test('source-owned world-book receipt associates the real request with source defaults',{skip:!root&&'Set DSH_MEMORY_SOURCES to Tavern source protocol 1 checkout'},async t=>{
 const {createMemorySources}=await import(pathToFileURL(join(root,'packages/memory-sources/index.js')))
 const {WorldBookStore}=await import(pathToFileURL(join(root,'packages/world-book-library/src/store.js')))
 const {createWorldBookAdapter}=await import(pathToFileURL(join(root,'packages/tavern-loader/src/world-book-adapter.js')))
 const {createDefaultRegistry,assembleRequestAsync,BUILTINS}=await import(pathToFileURL(join(root,'packages/request-assembler/index.js')))
 const {projectSystemSnapshots}=await import(pathToFileURL(join(root,'packages/request-assembler/system-snapshots.js')))
 const {roundRows}=await import('../src/session-rounds.js')
 const directory=await mkdtemp(join(tmpdir(),'manager-worldbook-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const store=new WorldBookStore(directory),doc=store.import({entries:{0:{uid:0,constant:true,content:'WORLD_BOOK_REQUEST_PROOF'}}},{name:'Fixture'})
 const session={id:'s',header:{id:'s',version:4,createdAt:'fixture'}}
 const selected={worldBookIds:[doc.id],characterId:null},service=createMemorySources({storageDir:directory,store,getSession:()=>session,getSelection:()=>selected})
 const manager=await new MemoryManager({configPath:join(directory,'missing.json')}).init({createIfMissing:true}),usage=new Usage(manager),stop=installManagedSources(manager,service,usage)
 t.after(async()=>{stop();service.dispose();await manager.dispose()})
 const id='world-book:'+doc.id,adapterId='tavern.world-books',scope={sessionId:'s'},nativeMessages=[{id:'user',role:'user',content:[{type:'text',text:'Hello'}]}]
 const projected=createWorldBookAdapter(store).resolve({selection:{worldBookIds:[doc.id]},requestAssembly:true})
 const {hash}=await import(pathToFileURL(join(root,'packages/memory-sources/policy.js')))
 const assets={loreEntries:projected.loreEntries,worldBookIds:[doc.id],worldBookRevisions:{[doc.id]:hash(doc)}}
 const registry=createDefaultRegistry({worldbookPolicy:(c,o)=>service.worldBooks.filter(c,o),worldbookValidateResolved:service.worldBooks.validateResolved})
 const logical=await assembleRequestAsync({registry,preset:BUILTINS[0],assets,sessionId:'s',turn:2,step:0,nativeMessages,inputIds:['user']})
 const result=projectSystemSnapshots(logical,nativeMessages,undefined,{systemPromptUpdate:'in-history'})
 const event={type:'request/assembly',seq:3,data:{turn:2,step:0,messages:result.messages,metadata:{owner:'pmp-dsh-tavern',assembly:{...result,preview:false}}}}
 session.snapshotEvents=()=>[event]
 const read=async turn=>roundRows(await manager.query({scope}),turn).find(row=>row.id===id)
 assert.equal((await read('2')).facts.length,0)
 // A preview, absent request and a side call do not become usage evidence.
 event.data.metadata.assembly.preview=true;service.observeRequest({messages:result.messages},session)
 event.data.metadata.assembly.preview=false;service.observeRequest({messages:[]},session)
 assert.equal((await read('2')).facts.length,0)
 service.observeRequest({messages:result.messages},session);service.observeRequest({messages:result.messages},session)
 const row=await read('2')
 assert.equal(row.sourceDefault.available,true);assert.equal(row.origins['retrieve.rule'],'source-default');assert.equal(row.managementMode,'managed');assert.equal(row.applied,true);assert.equal(row.status,'past');assert.equal(row.facts.length,1);assert.equal(row.facts[0].requestId,'s:3');assert.equal(row.facts[0].revision,service.worldBooks.read({id}).revision)
 assert.equal((await read('1')).facts.length,0);assert.equal((await read('1')).applied,false)
 // An explicit deny overrides source defaults and reports a skip, not application.
 const before=service.worldBooks.read({id})
 service.worldBooks.setManagementMode({id,mode:'managed',expectedRevision:before.revision,operationId:'managed-fixture'})
 await manager.saveEntry({id,adapterId,sessionId:'s',entry:{id,adapterId,retrieve:{rule:false}},expectedRevision:1})
 const deniedLogical=await assembleRequestAsync({registry,preset:BUILTINS[0],assets,sessionId:'s',turn:3,step:0,nativeMessages,inputIds:['user']})
 const denied=projectSystemSnapshots(deniedLogical,nativeMessages,undefined,{systemPromptUpdate:'in-history'})
 assert(!JSON.stringify(denied.messages).includes('WORLD_BOOK_REQUEST_PROOF'))
 event.seq=4;event.data={turn:3,step:0,messages:denied.messages,metadata:{owner:'pmp-dsh-tavern',assembly:denied}}
 service.observeRequest({messages:denied.messages},session);service.observeRequest({messages:denied.messages},session)
 const skipped=await read('3'),{resourceStatus,policySkipReasons}=await import('../src/session-rounds.js')
 assert.equal(skipped.facts.length,1);assert.equal(skipped.applied,false);assert.equal(skipped.facts[0].phase,'skipped');assert.equal(skipped.facts[0].reason,'rule')
 assert.equal(resourceStatus(skipped),'策略跳过');assert.equal(policySkipReasons(skipped),'rule');assert.equal(skipped.managementMode,'managed');assert.equal(manager.configuration.document.entries.length,1)
})
