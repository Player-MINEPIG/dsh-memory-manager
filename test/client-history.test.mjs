import test from 'node:test'
import assert from 'node:assert/strict'
import {nativeWorldBookObservations,createTavernHistoryReader,withHistoryFacts} from '../src/client-history.js'
const record={id:'capture',sessionId:'self',turn:3,status:'request-observed',requestContentStatus:'available',requestAssemblyRef:{seq:8},nativeRequestRef:{version:1},nativeProvenance:{provenance:'recorded-references',nodes:[{source:{plugin:'pmp-dsh-tavern',sourceId:'worldbook',resourceId:'book'}}]}}
const data={rows:[{id:'world-book:book',adapterId:'tavern.world-books',facts:[],activeFacts:[],status:'never'}],facets:{turns:[]}}
test('native status uses verified exact-request provenance and participates in turn/status filters',()=>{
 const facts=nativeWorldBookObservations(record,'self'),result=withHistoryFacts(data,facts,{turn:['3'],status:['past']})
 assert.equal(facts[0].mode,'retrieve');assert.equal(facts[0].on,'before_model_request');assert.equal(result.rows[0].status,'past');assert.equal(result.rows[0].applied,false);assert.deepEqual(result.facets.turns,['3'])
 assert.equal(withHistoryFacts(data,facts,{turn:['2'],status:['past']}).rows.length,0)
 for(const change of [{sessionId:'other'},{status:'assembled'},{requestContentStatus:'reference-unavailable'},{nativeProvenance:{nodes:record.nativeProvenance.nodes}}])assert.deepEqual(nativeWorldBookObservations({...record,...change},'self'),[])
 const skipped={...facts[0],phase:'skipped'},existing={...data,rows:[{...data.rows[0],facts:[skipped]}]};assert.equal(withHistoryFacts(existing,facts).rows[0].status,'past','verified request inclusion takes precedence over an earlier skip record')
})
test('browser composes explicit historical record APIs and caches only projected evidence',async()=>{
 const calls=[],reader=createTavernHistoryReader(async url=>{calls.push(url);return url.endsWith('/assemblies')?{ok:true,sessionId:'self',records:[record]}:{ok:true,record}})
 assert.equal((await reader('self')).facts.length,1);assert.equal((await reader('self')).facts.length,1);assert.equal(calls.length,3)
 assert.equal(calls[1],'/pmp-dsh-tavern/api/v3/sessions/self/assemblies/capture')
 const failed=createTavernHistoryReader(async url=>url.endsWith('/assemblies')?{ok:true,sessionId:'self',records:[record]}:{ok:true,record:{...record,requestContentStatus:'reference-unavailable'}})
 const result=await failed('self');assert.deepEqual(result.facts,[]);assert.equal(result.diagnostics.length,1)
 await assert.rejects(createTavernHistoryReader(async()=>({ok:true,sessionId:'other',records:[]}))('self'))
})

test('a stored resource in the same request cannot suppress verified retrieval evidence',()=>{
 const facts=nativeWorldBookObservations(record,'self'),existing={...data,rows:[{...data.rows[0],facts:[{...facts[0],mode:'store',phase:'triggered'}]}]}
 assert.deepEqual(withHistoryFacts(existing,facts).rows[0].facts.map(f=>f.mode),['store','retrieve'])
})


test('native MVU reads use verified dependency metadata and deduplicate the live request',()=>{
 const native={...record,requestAssemblyRef:undefined,nativeRequestRef:{version:1,stepStartSeq:5},nativeProvenance:{...record.nativeProvenance,nodes:[{mvuReads:[{adapterId:'tavern.mvu',id:'mvu:state',blockId:'macro',revision:2,configRevision:null}]}]}}
 const facts=nativeWorldBookObservations(native,'self')
 assert.equal(facts.length,1);assert.equal(facts[0].mode,'retrieve');assert.equal(facts[0].requestId,'self:native:5')
 const rows={rows:[{id:'mvu:state',adapterId:'tavern.mvu',facts:[{...facts[0],phase:'applied'}],activeFacts:[]}],facets:{turns:[]}}
 assert.equal(withHistoryFacts(rows,facts).rows[0].facts.length,1)
 assert.deepEqual(nativeWorldBookObservations({...native,nativeProvenance:{...native.nativeProvenance,nodes:[{source:{plugin:'pmp-dsh-tavern',sourceId:'worldbook',resourceId:'book'},text:'hp: 100'}]}},'self').filter(f=>f.adapterId==='tavern.mvu'),[],'expanded text alone cannot identify the historical MVU instance')
})


test('native history composition and status filters preserve resource-free session turns',()=>{
 const empty={rows:[],facets:{turns:['1','2']}}
 assert.deepEqual(withHistoryFacts(empty,[],{turn:['2'],status:['past']}).facets.turns,['1','2'])
 const filtered=withHistoryFacts({...data,facets:{turns:['1','2']}},[],{status:['past']})
 assert.deepEqual(filtered.rows,[]);assert.deepEqual(filtered.facets.turns,['1','2'])
})
