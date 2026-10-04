import test from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {sessionRounds,roundRows,roundKinds,roundVisibleCount} from '../src/session-rounds.js'

test('round states come from scoped active facts, never an aggregate status from another turn or old unmatched start',async t=>{
 const manager=new MemoryManager({configPath:'/unused'});t.after(()=>manager.dispose())
 let reads=0,lists=0
 const stop=manager.registerAdapter({id:'own',authority:'self-authored',list:()=>{lists++;return ['a','b','c'].map(id=>({id,type:'text',name:id,opaque:'retained'}))},listBound:({scope})=>{lists++;return {revision:'self',items:['a','b','c'].map(id=>({id,adapterId:'own',type:'text',name:id,binding:{sessionId:scope.sessionId,kind:'self-authored'}})),checkCurrent:()=>true}},read:()=>{reads++;throw Error('no resource body reads')}});t.after(stop)
 const fact=(id,eventId,turn,phase,turnKind='human',sessionId='self-session')=>manager.recordTrace({adapterId:'own',id,eventId,requestId:eventId,turn,phase,turnKind,sessionId})
 fact('a','done',1,'started');fact('a','done',1,'applied')
 fact('b','running',2,'started','task')
 fact('b','old-incomplete',1,'started');manager.active.delete(JSON.stringify(['own','b','self-session','old-incomplete']))
 manager.traces.at(-1).interrupted=true
 fact('c','unknown',undefined,'skipped','unknown')
 fact('a','other-session',9,'started','system','other-session')
 const data=await manager.query({scope:{sessionId:'self-session'}})
 assert.deepEqual(sessionRounds(data).map(g=>g.turn),['2','1',null])
 assert.deepEqual(sessionRounds(data,['1']).map(g=>g.turn),['1'])
 const one=roundRows(data,'1'),two=roundRows(data,'2')
 assert.equal(one.find(r=>r.id==='a').status,'past');assert.equal(one.find(r=>r.id==='a').applied,true)
 assert.equal(one.find(r=>r.id==='b').status,'past');assert.equal(one.find(r=>r.id==='b').interrupted,true)
 assert.equal(two.find(r=>r.id==='b').status,'running');assert.equal(two.find(r=>r.id==='a').status,'never')
 assert.deepEqual(roundRows(data,'2',['never']).map(r=>r.id),['a','c'])
 assert.equal(roundVisibleCount(data,['2'],['never']),2)
 assert.equal(roundVisibleCount(data,[],['running']),1)
 assert.equal(roundVisibleCount(data,['1'],['past']),2)
 assert.equal(roundKinds(two),'任务上下文');assert.equal(roundRows(data,null).find(r=>r.id==='c').status,'never')
 assert(data.rows.every(r=>r.facts.every(f=>f.sessionId==='self-session')))
 assert(data.rows.every(r=>r.activeFacts.every(f=>f.sessionId==='self-session')))
 assert.equal(two[0].name,'a');assert.equal(reads,0);assert.equal(lists,1)
 const active=data.rows.find(r=>r.id==='b').activeFacts[0];active.turn=99
 assert.equal([...manager.active.values()].find(f=>f.eventId==='running').turn,2)
 fact('b','running',2,'completed','task')
 const after=await manager.query({scope:{sessionId:'self-session'}})
 assert.equal(roundRows(after,'2').find(r=>r.id==='b').status,'past')
 assert.equal(roundRows(after,'1').find(r=>r.id==='a').status,'past')
 const other=await manager.query({scope:{sessionId:'other-session'}})
 assert.deepEqual(sessionRounds(other).map(g=>g.turn),['9'])
 assert.equal(other.rows.find(r=>r.id==='b').status,'never')
})

test('no fabricated turn, no wildcard unknown turn, and no mutation of observations or configuration',()=>{
 const data={facets:{turns:[]},rows:[{id:'own',status:'running',config:{whitelist:[],opaque:true},facts:[],activeFacts:[]}]},before=structuredClone(data)
 assert.deepEqual(sessionRounds(data),[{turn:null,key:'unknown',label:'尚无轮次记录'}])
 assert.equal(roundRows(data,null)[0].status,'never')
 assert.deepEqual(sessionRounds({...data,facets:{turns:['2','10','1']}}).map(g=>g.turn),['10','2','1'])
 assert.deepEqual(roundRows(data,'no-source-turn',['past']),[])
 assert.deepEqual(data,before)
})
