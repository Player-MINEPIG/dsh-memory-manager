import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {join,resolve} from 'node:path'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {skillAdapter} from '../src/adapters/skills.js'
const setup=t=>{const m=new MemoryManager({configPath:'/unused-native-scope-fixture'});t.after(()=>m.dispose());return m}
const runtime=process.env.DSH_MEMORY_RUNTIME

test('actual DSH native registry global layer is visible in each session without Tavern binding capability',{skip:!runtime},async t=>{
 const require=createRequire(join(resolve(runtime),'package.json')),load=name=>import(pathToFileURL(require.resolve(name)).href)
 const {Context}=await load('@deepseek-ai/cordis'),{SkillRegistry}=await load('@deepseek-ai/dsh-skill'),ctx=new Context();t.after(()=>ctx.fiber.dispose())
 await ctx.plugin(SkillRegistry)
 ctx.skills.register({name:'self-native-scope',source:'self-authored-runtime',description:'Self authored native default scope',content:'SELF_AUTHORED_BODY',metadata:{dshResourceIdentity:{version:1,namespace:'self-authored',id:'native'}}})
 const agents=new Map(['self-a','self-b'].map(id=>[id,{id,session:{header:{cwd:'/self-authored/'+id}}}]))
 const m=setup(t);m.registerAdapter(skillAdapter({skills:ctx.skills,get:name=>name==='agents'?agents:undefined}))
 let identity
 for(const sessionId of agents.keys()){
  const query=await m.query({scope:{sessionId}}),row=query.rows.find(r=>r.name==='self-native-scope')
  assert(row,JSON.stringify({diagnostics:query.diagnostics,catalogs:query.catalogs,names:query.rows.map(r=>r.name)}));identity??=row.id;assert.equal(row.id,identity);assert.equal(row.config,null);assert.equal(row.nativeBehavior,true);assert.equal(Object.hasOwn(row,'binding'),false)
  assert.deepEqual(query.catalogs.map(c=>[c.catalogScope,c.binding,c.count]),[['all-sessions','default',1]])
  assert.equal(query.diagnostics.some(d=>d.code==='SESSION_BINDINGS_UNAVAILABLE'),false)
 }
 const absent=await m.query({scope:{sessionId:'self-not-loaded'}})
 assert.deepEqual(absent.rows,[]);assert.equal(absent.diagnostics[0].code,'AGENT_UNAVAILABLE');assert.equal(absent.catalogs[0].binding,'unavailable')
})
test('native default scope is declared by capability and still uses actual Agent preset/cwd visibility',async t=>{
 const global={name:'global-native',provider:'fixture',path:'/self/global/SKILL.md',content:'SELF_GLOBAL'},shadow={...global,path:'/self/preset/SKILL.md',content:'SELF_SHADOW'},seen=[]
 const agents=new Map(['self-a','self-b'].map(id=>[id,{id,session:{header:{cwd:'/self/'+id}}}]))
 const registry={list:async options=>{seen.push(options);return [global]}},scoped={list:async options=>{seen.push(options);return [shadow]}}
 const m=setup(t),a=skillAdapter({skills:registry,get:name=>name==='agents'?agents:name==='agentPresets'?{serviceFor:agent=>agent.id==='self-b'?scoped:registry}:undefined});m.registerAdapter(a)
 const one=await m.query({scope:{sessionId:'self-a'}}),two=await m.query({scope:{sessionId:'self-b'}})
 assert.equal(one.rows.length,1);assert.equal(two.rows.length,1);assert.notEqual(one.rows[0].id,two.rows[0].id)
 assert.equal(seen[0].scope,agents.get('self-a'));assert.equal(seen[0].cwd,'/self/self-a');assert.equal(seen[1].scope,agents.get('self-b'));assert.equal(seen[1].cwd,'/self/self-b')
 m.registerAdapter({id:'arbitrary-native-id',authority:'self-authored',catalogScope:'all-sessions',list:({scope})=>[{id:'self-native-resource',type:'text',name:scope.sessionId}],read:()=>{throw Error('no body reads for catalog')}})
 assert.equal((await m.query({scope:{sessionId:'self-a'},adapterId:'arbitrary-native-id'})).rows[0].name,'self-a')
 assert.equal((await m.query({scope:{sessionId:'self-b'},adapterId:'arbitrary-native-id'})).rows[0].name,'self-b')
})
test('native default resources coexist with Tavern current bindings; other-card rules/history cannot expand Tavern rows',async t=>{
 const m=setup(t)
 m.registerAdapter({id:'arbitrary-native-id',authority:'self-authored',catalogScope:'all-sessions',list:()=>[{id:'SELF_NATIVE',type:'text'}],read:()=>null})
 const source={id:'tavern.world-books',authority:'local',list:()=>{throw Error('no global Tavern catalog')},read:()=>{throw Error('no Tavern body')}};m.registerAdapter(source)
 m.boundMemorySource={adapters:[source],listBound:({scope})=>({revision:'self',items:[{id:scope.sessionId==='self-a'?'SELF_BOOK_A':'SELF_BOOK_B',adapterId:source.id,type:'world-book',binding:{sessionId:scope.sessionId,kind:'character-embedded'}}],checkCurrent:()=>true})}
 m.configuration.document.entries=[{id:'SELF_BOOK_B',adapterId:source.id,type:'world-book',whitelist:[{global:true}]}]
 m.recordTrace({id:'SELF_BOOK_B',adapterId:source.id,eventId:'old-other-card',sessionId:'self-a',phase:'applied',turn:9})
 assert.deepEqual((await m.query({scope:{sessionId:'self-a'}})).rows.map(r=>r.id),['SELF_NATIVE','SELF_BOOK_A'])
 const b=await m.query({scope:{sessionId:'self-b'}});assert.deepEqual(b.rows.map(r=>r.id),['SELF_NATIVE','SELF_BOOK_B']);assert.deepEqual(b.catalogs.map(c=>c.binding),['default','confirmed'])
})
test('default visibility neither changes rules nor bypasses blacklist, narrow whitelist or explicit disable',async t=>{
 const m=setup(t),usage=new Usage(m);let reads=0,operations=0
 m.registerAdapter({id:'self-native',authority:'self-authored',catalogScope:'all-sessions',list:()=>[{id:'SELF_NATIVE',type:'text'}],read:()=>{reads++;return {id:'SELF_NATIVE',type:'text',content:'SELF_BODY'}}})
 usage.registerOperation({id:'self-read',readOnly:true,run:()=>++operations})
 const policy={id:'SELF_NATIVE',adapterId:'self-native',type:'text',whitelist:[{global:true}],blacklist:[{sessionId:'self-a'}],retrieve:{on:'self-event',rule:false,strategy:[{operation:'self-read'}]}}
 m.configuration.document.entries=[policy];const before=structuredClone(m.configuration.document)
 const a=await m.query({scope:{sessionId:'self-a'}}),b=await m.query({scope:{sessionId:'self-b'}})
 assert.equal(a.rows.length,1);assert.equal(a.rows[0].applicable,false);assert.equal(b.rows[0].applicable,true);assert.deepEqual(m.configuration.document,before)
 const trigger=(sessionId,eventId)=>usage.trigger({id:policy.id,event:{on:'self-event',eventId,scope:{sessionId}}})
 assert.equal((await trigger('self-a','blacklist')).matched,false);assert.equal((await trigger('self-b','false-rule')).matched,false);assert.equal(reads,0);assert.equal(operations,0)
 policy.retrieve.rule=true;policy.whitelist=[{sessionId:'self-a'}];policy.blacklist=[]
 assert.equal((await trigger('self-b','narrow-whitelist')).matched,false)
 m.recordTrace({id:policy.id,adapterId:policy.adapterId,eventId:'old-native',sessionId:'self-a',phase:'applied'})
 m.setAdapterEnabled({id:policy.adapterId,enabled:false});assert.deepEqual((await m.query({scope:{sessionId:'self-a'}})).rows,[])
 await assert.rejects(trigger('self-a','disabled'),{code:'SOURCE_UNAVAILABLE'});assert.equal(reads,0);assert.equal(operations,0)
 m.setAdapterEnabled({id:policy.adapterId,enabled:true});assert.equal((await m.query({scope:{sessionId:'self-a'}})).rows.length,1)
 assert.equal((await trigger('self-a','explicit-rule')).matched,true);assert.equal(reads,1);assert.equal(operations,1)
})
test('native catalog cannot return a disabled adapter snapshot after another source await',async t=>{
 const m=setup(t);let release
 m.registerAdapter({id:'self-native',authority:'self-authored',catalogScope:'all-sessions',list:()=>[{id:'SELF_NATIVE',type:'text'}],read:()=>null})
 m.registerAdapter({id:'self-bound',authority:'self-authored',list:()=>[],read:()=>null,listBound:()=>new Promise(resolve=>release=()=>resolve({revision:'self',items:[],checkCurrent:()=>true}))})
 const job=m.query({scope:{sessionId:'self-a'}});while(!release)await new Promise(resolve=>setImmediate(resolve))
 m.setAdapterEnabled({id:'self-native',enabled:false});release();const query=await job
 assert.deepEqual(query.rows,[]);assert(query.diagnostics.some(d=>d.adapterId==='self-native'&&d.code==='SESSION_BINDINGS_CHANGED'))
})
