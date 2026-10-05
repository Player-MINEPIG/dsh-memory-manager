import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {spawn} from 'node:child_process'
import {managementStatus} from '../src/client-management.js'

test('pending management status does not interpret an absent default or stale failure as unavailable',()=>{
 assert.match(managementStatus({managementMode:'managed'}),/加载中/)
 assert.equal(managementStatus({missing:true,sourceDefault:{available:false,reason:'SOURCE_UNAVAILABLE'}},{loading:true}),'当前托管：加载中…')
})
test('settled management status keeps the precise source rejection and successful ownership',()=>{
 assert.match(managementStatus({managementMode:'managed',sourceDefault:{available:false,reason:'SOURCE_DEFAULTS_UNAVAILABLE',message:'当前资源未绑定此会话'}}),/当前资源未绑定此会话/)
 assert.match(managementStatus({managementMode:'managed',sourceDefault:{available:true}}),/记忆管理.*来源默认规则/)
 assert.match(managementStatus({sourceAvailable:false}),/来源不可用/)
})

const deps=process.env.DMM_COMPONENT_DEPS,chrome=process.env.DMM_CHROME_PATH
test('actual React components: pending, settled success/denial/error and cancelled scopes/generations',{skip:!deps||!chrome},async t=>{
 const {build}=await import('esbuild'),root=new URL('../',import.meta.url).pathname
 const dir=mkdtempSync(join(tmpdir(),'dmm-own-loading-components-'));t.after(()=>rmSync(dir,{recursive:true,force:true}))
 const bundle=await build({stdin:{contents:readFileSync(new URL('./fixtures/client-management-loading.fixture.txt',import.meta.url),'utf8'),resolveDir:root},bundle:true,write:false,format:'iife',platform:'browser',
  alias:{react:resolve(deps,'react'),'react-dom':resolve(deps,'react-dom')},plugins:[{name:'test-private-components',setup(b){
   b.onLoad({filter:/\/src\/client\.js$/},args=>({contents:readFileSync(args.path,'utf8')+'\nexport {DetailPage,ScopedPanel}\n',loader:'js'}))
   b.onResolve({filter:/^@deepseek-ai\/dsh-client-ui-primitives$/},()=>({path:'tooltip',namespace:'test'}))
   b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:"import {createElement,Fragment} from 'react';export const Tooltip=({children})=>createElement(Fragment,null,children)",loader:'js',resolveDir:root}))
  }}]})
 writeFileSync(join(dir,'index.html'),'<meta charset="utf-8"><div id="root"></div><script>'+bundle.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>')
 const profile=join(dir,'chrome'),browser=spawn(chrome,['--headless','--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'})
 t.after(()=>browser.kill('SIGTERM'))
 const pause=ms=>new Promise(r=>setTimeout(r,ms))
 for(let n=0;n<100&&!existsSync(join(profile,'DevToolsActivePort'));n++)await pause(100)
 assert.ok(existsSync(join(profile,'DevToolsActivePort')),'independent Chrome must start')
 const port=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]
 const tabs=await fetch(`http://127.0.0.1:${port}/json`).then(r=>r.json())
 const ws=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);t.after(()=>ws.close())
 await new Promise(r=>ws.addEventListener('open',r,{once:true}))
 let sequence=0;const pending=new Map()
 ws.addEventListener('message',e=>{const v=JSON.parse(e.data);if(v.id){const p=pending.get(v.id);pending.delete(v.id);v.error?p.reject(Error(v.error.message)):p.resolve(v.result)}})
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++sequence,{resolve,reject});ws.send(JSON.stringify({id:sequence,method,params}))})
 const evaluate=async expression=>{const value=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert.equal(value.exceptionDetails,undefined,JSON.stringify(value.exceptionDetails));return value.result.value}
 await send('Page.navigate',{url:pathToFileURL(join(dir,'index.html')).href})
 for(let n=0;n<100&&!await evaluate('Boolean(window.runLoadingChecks)');n++)await pause(50)
 const result=await evaluate('window.runLoadingChecks()')
 assert.ok(result.length>=10);assert.ok(result.every(x=>x.pass));console.log(JSON.stringify({componentChecks:result,modelRequests:0}))
 await send('Browser.close').catch(()=>{});await new Promise(r=>browser.once('exit',r))
})
