import test from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {skillAdapter} from '../src/adapters/skills.js'

test('preset-only registries are discoverable in session and global panels without a host skills service',async t=>{
 const definition={name:'own-skill',path:'/fixture/SKILL.md',provider:'fixture',content:'BODY'}
 const registry={list:async()=>[definition],get:async()=>definition},agent={id:'self',session:{header:{cwd:'/fixture'}}}
 const ctx={get:key=>key==='agents'?{get:id=>id==='self'?agent:undefined,list:()=>[agent]}:key==='agentPresets'?{serviceFor:()=>registry}:undefined}
 const m=new MemoryManager({configPath:'/unused'});t.after(()=>m.dispose());m.registerAdapter(skillAdapter(ctx))
 assert.equal((await m.query({scope:{sessionId:'self'}})).rows.length,1)
 const global=await m.query();assert.equal(global.rows.length,1,JSON.stringify(global.diagnostics));assert.equal(global.rows[0].name,'own-skill')
 assert.equal((await m.read({adapterId:'dsh.skills',id:global.rows[0].id})).content,'BODY')
})
test('an unavailable virtual body does not hide other catalog entries or its own summary',async()=>{
 const ctx={skills:{list:async()=>[{name:'broken',provider:'own'},{name:'good',provider:'own',path:'/good/SKILL.md'}],get:async()=>{throw Error('body unavailable')}}}
 const rows=await skillAdapter(ctx).list({scope:{}})
 assert.deepEqual(rows.map(r=>r.name),['broken','good']);assert.equal(rows[0].capabilities.bind,false);assert(rows[0].diagnostics.some(d=>d.code==='SKILL_BODY_UNAVAILABLE'))
})
