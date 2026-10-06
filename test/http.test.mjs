import {test} from 'node:test'
import assert from 'node:assert/strict'
import {handler} from '../src/http.js'
async function call(manager,{url='/api/dsh-memory-manager/update',method='POST',headers={},body={}}={}){const req={url,method,headers:{host:'localhost:1',...headers},async *[Symbol.asyncIterator](){yield JSON.stringify(body)}};const res={statusCode:200,setHeader(){},end(body){this.body=JSON.parse(body)}};await handler(manager,{admit:()=>({peer:{}})})(req,res);return res}
test('management mutation requires same-origin controls and cannot smuggle authority scope',async()=>{let args;const manager={update:async value=>{args=value;return {ok:true}}};let response=await call(manager);assert.equal(response.statusCode,403);assert.equal(args,undefined);response=await call(manager,{headers:{origin:'https://foreign.test','content-type':'application/json','x-dsh-memory-manager':'1'}});assert.equal(response.statusCode,403);response=await call(manager,{headers:{origin:'http://localhost:1','content-type':'application/json','x-dsh-memory-manager':'1'},body:{id:'a',sessionId:'visible-session',scope:{authority:'remote',sessionId:'different-session'}}});assert.equal(response.statusCode,200);assert.deepEqual(args.scope,{sessionId:'visible-session'})})

test('HTTP handler fails closed without Host admission and preserves its rejection status',async()=>{
 let calls=0;const manager={query:async()=>{calls++;return {}}},req={url:'/api/dsh-memory-manager/query',method:'GET',headers:{host:'attacker.example'}}
 for(const connection of [undefined,{admit:()=>({rejection:401})},{admit:()=>({rejection:403})}]){const res={statusCode:200,setHeader(){},end(){}};await handler(manager,connection)(req,res);assert.equal(res.statusCode,connection?.admit().rejection??403)}
 assert.equal(calls,0)
})

test('configuration editor routes retain Host mutation fences and diagnostic conflict status',async()=>{
 let writes=0;const manager={withScopeRead:(scope,callback)=>callback(),configurationSnapshot:args=>({...args,revision:3,local:null}),validateEntry:async()=>({valid:true,diagnostics:[]}),saveEntry:async()=>{writes++;throw Object.assign(Error('stale edit'),{code:'REVISION_CONFLICT',diagnostics:[{level:'error',code:'REVISION_CONFLICT',field:'configuration',message:'stale edit'}]})}}
 const snapshot=await call(manager,{method:'GET',url:'/api/dsh-memory-manager/configuration?id=a%3A1&adapterId=a'});assert.equal(snapshot.body.id,'a:1');assert.equal(snapshot.body.local,null)
 for(const path of ['validate-configuration','save-configuration'])assert.equal((await call(manager,{url:'/api/dsh-memory-manager/'+path})).statusCode,403)
 assert.equal(writes,0)
 const response=await call(manager,{url:'/api/dsh-memory-manager/save-configuration',headers:{origin:'http://localhost:1','content-type':'application/json','x-dsh-memory-manager':'1'},body:{expectedRevision:2}})
 assert.equal(response.statusCode,409);assert.equal(response.body.error.diagnostics[0].code,'REVISION_CONFLICT');assert.equal(writes,1)
})


test('session read readiness, absence and failed reads have distinct HTTP errors',async()=>{
 for(const [code,status] of [['SESSION_READER_NOT_READY',503],['SESSION_NOT_FOUND',404],['SESSION_READ_FAILED',400]]){
  const manager={withScopeRead:async()=>{throw Object.assign(Error(code),{code})},configurationSnapshot(){assert.fail('must wait for the session read')}}
  const response=await call(manager,{method:'GET',url:'/api/dsh-memory-manager/configuration?id=a&sessionId=cold'})
  assert.equal(response.statusCode,status);assert.equal(response.body.error.code,code)
 }
})
