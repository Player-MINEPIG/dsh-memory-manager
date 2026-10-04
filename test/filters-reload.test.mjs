import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'
import {handler} from '../src/http.js'
const document={schemaVersion:1,revision:1,entries:[],presets:{}}
async function setup(t,doc=document){const dir=await mkdtemp(join(tmpdir(),'dmm-filters-'));t.after(()=>rm(dir,{recursive:true,force:true}));const configPath=join(dir,'config.json');await writeFile(configPath,JSON.stringify(doc));const m=await new MemoryManager({configPath}).init();t.after(()=>m.dispose());return {m,configPath}}
test('unchanged/reformatted reload is a no-op; changed same/lower revision fails, higher revision validates atomically',async t=>{
 const {m,configPath}=await setup(t),original=m.configuration.document,epoch=m.configuration.pending
 await writeFile(configPath,JSON.stringify({presets:{},entries:[],revision:1,schemaVersion:1},null,2))
 assert.deepEqual(await m.reload(),{revision:1,unchanged:true});assert.equal(m.configuration.document,original);assert.notEqual(m.configuration.pending,epoch)
 const changed={...document,presets:{p:{type:'text'}}}
 await writeFile(configPath,JSON.stringify(changed));await assert.rejects(m.reload(),e=>e.code==='REVISION_CONFLICT'&&e.message.includes('当前生效版本 1'));assert.equal(m.configuration.document,original)
 await writeFile(configPath,JSON.stringify(document));assert.equal((await m.reload()).unchanged,true);assert.equal(m.configuration.error,null)
 await writeFile(configPath,JSON.stringify({...changed,revision:2}));assert.deepEqual(await m.reload(),{revision:2,unchanged:false})
 await writeFile(configPath,JSON.stringify(document));await assert.rejects(m.reload(),{code:'REVISION_CONFLICT'});assert.equal(m.configuration.document.revision,2)
 await writeFile(configPath,'{invalid');await assert.rejects(m.reload());assert.equal(m.configuration.document.revision,2)
 m.registerAdapter({id:'reject',authority:'test',list:async()=>[],read:async()=>null,validateConfig:()=>{throw Error('source type rejected')}})
 await writeFile(configPath,JSON.stringify({...document,revision:3,entries:[{id:'r',adapterId:'reject'}]}));await assert.rejects(m.reload(),/source type rejected/);assert.equal(m.configuration.document.revision,2)
})
test('no-op reload and error recovery never revive an earlier MVU permission lease',async t=>{
 const doc={...document,entries:[{id:'mvu:test',adapterId:'tavern.mvu',whitelist:[{global:true}],store:{on:'card_variable_update',rule:true,strategy:[]}}]}, {m,configPath}=await setup(t,doc)
 let decide;installMvu(m,{protocolVersion:1,list:async()=>[],read:async()=>null,validateConfig:async()=>{},registerUsage:fn=>{decide=fn;return()=>{}}},new Usage(m))
 const request={id:'mvu:test',managementMode:'managed',on:'card_variable_update',scope:{sessionId:'s'},event:{}}
 const old=await decide(request);assert.equal(old.checkCurrent(),true)
 const noop=m.reload();assert.equal(old.checkCurrent(),false);await noop;assert.equal(old.checkCurrent(),false)
 const current=await decide(request);assert.equal(current.checkCurrent(),true)
 await writeFile(configPath,'bad');await assert.rejects(m.reload());assert.equal(current.checkCurrent(),false)
 await writeFile(configPath,JSON.stringify(doc));await m.reload();assert.equal(old.checkCurrent(),false);assert.equal(current.checkCurrent(),false);assert.equal((await decide(request)).checkCurrent(),true)
})
test('multi-select OR within dimensions, AND across dimensions, empty unlimited; session facts and facets stay isolated',async t=>{
 const {m}=await setup(t)
 for(const id of ['a','b','c'])m.registerAdapter({id,authority:'test',list:async()=>[{id:id+':r',type:'text'}],listBound:({scope})=>({revision:'self',items:[{id:id+':r',adapterId:id,type:'text',binding:{sessionId:scope.sessionId,kind:'self-authored'}}],checkCurrent:()=>true}),read:async()=>null})
 for(const [adapterId,sessionId,turn,turnKind,phase] of [['a','s',1,'human','applied'],['b','s',2,'task','started'],['c','s',3,'system','skipped'],['a','other',9,'system','started']])m.recordTrace({id:adapterId+':r',adapterId,sessionId,turn,turnKind,phase,eventId:adapterId+sessionId})
 const q=await m.query({scope:{sessionId:'s'},adapterId:['a','b'],turn:['1','2'],turnKind:['human','task'],status:['past','running']})
 assert.deepEqual(q.rows.map(r=>r.id),['a:r','b:r']);assert(q.rows.every(r=>r.facts.length===1));assert.deepEqual(q.facets.turns,['1','2']);assert.equal(q.scope.sessionId,'s')
 assert.equal((await m.query({scope:{sessionId:'s'},adapterId:['a','b'],turn:['1','2'],turnKind:['human'],status:['running']})).rows.length,0)
 assert.equal((await m.query({adapterId:[],turn:[],turnKind:[],status:[]})).rows.length,3)
 const other=await m.query({scope:{sessionId:'other'}});assert.deepEqual(other.facets.turns,['9']);assert.equal(other.rows[1].status,'never')
 assert.equal((await m.query({scope:{sessionId:'s'},adapterId:'a',turn:1,status:'past'})).rows.length,1)
 assert.deepEqual(q.catalogs.map(c=>c.count),[1,1])
})
test('HTTP accepts repeated filter values and preserves punctuation without comma splitting',async()=>{
 let query;const req={url:'/api/dsh-memory-manager/query?sessionId=s&adapterId=a&adapterId=b%2Cc&turn=1&turn=2&status=past&status=running',method:'GET',headers:{host:'localhost'}},res={setHeader(){},end(){}}
 await handler({query:async q=>{query=q;return {}}},{admit:()=>({peer:{}})})(req,res)
 assert.deepEqual(query,{scope:{sessionId:'s'},adapterId:['a','b,c'],turn:['1','2'],status:['past','running'],turnKind:[]})
})
