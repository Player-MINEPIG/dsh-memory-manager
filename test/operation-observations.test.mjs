import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {observationMode,operationStatus} from '../src/observation-modes.js'
import {roundRows,roundVisibleCount} from '../src/session-rounds.js'
const adapter={id:'source',authority:'test',list:()=>[],read:()=>({id:'r',type:'text',content:'fixture'})}
const base={adapterId:'source',id:'r',sessionId:'s',requestId:'same-request',eventId:'same-event',turn:1}

test('a turn distinguishes store/retrieve, policy skips, unclassified legacy evidence, and interrupted work',()=>{
 const row={id:'r',adapterId:'source',facts:[{turn:1,mode:'store',phase:'applied'},{turn:2,mode:'retrieve',phase:'applied',evidence:'request-included'},{turn:2,mode:'store',phase:'started'},{turn:2,mode:'store',phase:'skipped',reason:'rule'},{turn:2,mode:'store',phase:'completed'}],activeFacts:[]}
 const data={rows:[row],facets:{turns:['1','2']}}
 assert.equal(operationStatus(roundRows(data,'1')[0],'store'),'triggered')
 assert.equal(operationStatus(roundRows(data,'1')[0],'retrieve'),'unrecorded')
 assert.equal(operationStatus(roundRows(data,'2')[0],'store'),'skipped')
 assert.equal(operationStatus(roundRows(data,'2')[0],'retrieve'),'triggered')
 assert.equal(roundRows(data,'1',[],{storeStatus:['triggered'],retrieveStatus:['triggered']}).length,0)
 assert.equal(roundVisibleCount(data,[],[],{storeStatus:['triggered'],retrieveStatus:['triggered']}),0,'opposite turns must not combine into a match')
 assert.equal(roundVisibleCount(data,[],[],{retrieveStatus:['triggered']}),1)
 assert.equal(operationStatus({facts:[{phase:'applied',executionKey:'opaque store-like id'}]},'store'),'unknown')
 assert.equal(operationStatus({facts:[{mode:'retrieve',phase:'started',interrupted:true}]},'retrieve'),'unknown')
 assert.equal(operationStatus({activeFacts:[{mode:'store',phase:'started'}]},'store'),'processing')
 assert.equal(operationStatus({facts:[{mode:'store',phase:'triggered'},{mode:'store',phase:'failed'}]},'store'),'unknown','an attempted write does not establish a storage commit')
})

test('directions sharing request and event identity have independent deduplication and live activity',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'dmm-directions-')),journalPath=join(dir,'observations.json'),configPath=join(dir,'config.json')
 await writeFile(configPath,JSON.stringify({schemaVersion:1,revision:1,entries:[],presets:{}}))
 const m=await new MemoryManager({configPath,journalPath}).init();m.registerAdapter(adapter);t.after(()=>m.dispose())
 assert.throws(()=>m.recordTrace({...base,mode:'invented',on:'before_model_request',phase:'started'}),{code:'INVALID_TRACE'})
 for(const mode of ['store','retrieve'])m.recordTrace({...base,mode,phase:'started'})
 assert.equal(m.active.size,2)
 m.recordTrace({...base,mode:'store',phase:'completed'});assert.equal(m.active.size,1);assert.equal([...m.active.values()][0].mode,'retrieve')
 for(const mode of ['store','retrieve'])m.recordTrace({...base,mode,phase:'triggered'})
 m.recordTrace({...base,mode:'retrieve',phase:'triggered'});assert.equal(m.traces.filter(f=>f.phase==='triggered').length,2)
 await m.dispose();assert.equal(JSON.parse(await readFile(journalPath)).filter(f=>f.mode==='retrieve').length,2)
 const restored=await new MemoryManager({configPath,journalPath}).init();t.after(()=>restored.dispose())
 assert.equal(restored.traces.find(f=>f.phase==='started'&&f.mode==='store').interrupted,undefined)
 assert.equal(restored.traces.find(f=>f.phase==='started'&&f.mode==='retrieve').interrupted,true,'store completion cannot complete a read on restart')
})

test('normal execution persists explicit directions and event timing without granting policy permission',async t=>{
 const m=new MemoryManager({configPath:'/unused'}),usage=new Usage(m);m.registerAdapter(adapter);t.after(()=>m.dispose())
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[{id:'r',adapterId:'source',type:'text',whitelist:[{global:true}],store:{on:'store-event',rule:true},retrieve:{on:'read-event',rule:true}}]}
 for(const [mode,on] of [['store','store-event'],['retrieve','read-event']])await usage.trigger({id:'r',mode,event:{eventId:'shared',on,scope:{sessionId:'s'},turn:4}})
 assert.equal(m.traces.length,8);assert.deepEqual([...new Set(m.traces.map(f=>f.mode))],['store','retrieve'])
 assert(m.traces.every(f=>f.on=== (f.mode==='store'?'store-event':'read-event')))
})

test('Tavern receipt compatibility uses documented emitter fields rather than current rules or opaque IDs',()=>{
 assert.equal(observationMode({adapterId:'tavern.mvu',on:'assistant_message_committed'}),'store')
 assert.equal(observationMode({adapterId:'tavern.mvu',on:'card_variable_update'}),'store')
 assert.equal(observationMode({adapterId:'tavern.mvu',detail:'dsh-request-observed'}),'retrieve')
 assert.equal(observationMode({adapterId:'tavern.mvu',detail:'state-committed'}),'store')
 assert.equal(observationMode({adapterId:'tavern.world-books',detail:'Observed in durable DSH request; provider delivery not established'}),'retrieve')
 assert.equal(observationMode({adapterId:'tavern.world-books',code:'WORLD_BOOK_POLICY_SKIPPED'}),'retrieve')
 assert.equal(observationMode({adapterId:'source',detail:'state-committed'}),null)
 assert.equal(observationMode({adapterId:'source',eventId:'store:before_model_request',config:{retrieve:{on:'request'}}}),null)
})

test('a failed condition records a direction-specific skip without executing an operation; preview stays read-only',async t=>{
 const m=new MemoryManager({configPath:'/unused'}),usage=new Usage(m);m.registerAdapter({...adapter,read:()=>{throw Error('must not execute')}});t.after(()=>m.dispose())
 m.configuration.document={schemaVersion:1,revision:1,presets:{},entries:[{id:'r',adapterId:'source',type:'text',whitelist:[{global:true}],store:{on:'store-event',rule:false}}]}
 const request={id:'r',mode:'store',event:{eventId:'denied',on:'store-event',scope:{sessionId:'s'},turn:7}}
 assert.equal((await usage.trigger({...request,preview:true})).matched,false);assert.equal(m.traces.length,0)
 assert.equal((await usage.trigger(request)).reason,'rule');assert.equal(m.traces.length,1)
 assert.equal(m.traces[0].mode,'store');assert.equal(m.traces[0].phase,'skipped');assert.equal(m.traces[0].turn,7)
 assert.equal(operationStatus({facts:m.traces},'store'),'skipped');assert.equal(operationStatus({facts:m.traces},'retrieve'),'unrecorded')
})
