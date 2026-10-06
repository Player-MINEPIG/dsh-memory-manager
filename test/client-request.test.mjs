import test from 'node:test'
import assert from 'node:assert/strict'
import {requestJson} from '../src/client-request.js'
test('a read transport that never returns ends as a read timeout rather than unavailable',async()=>{let signal;await assert.rejects(requestJson((url,args)=>{signal=args.signal;return new Promise(()=>{})},'/read',{readTimeoutMs:10}),e=>e.code==='READ_TIMEOUT'&&e.message.includes('不表示资源不存在'));assert.equal(signal.aborted,true)})
test('body decoding also has a finite read bound and generation cancellation remains AbortError',async()=>{await assert.rejects(requestJson(async()=>({ok:true,json:()=>new Promise(()=>{})}),'/read',{readTimeoutMs:10}),{code:'READ_TIMEOUT'});const c=new AbortController(),pending=requestJson(()=>new Promise(()=>{}),'/read',{signal:c.signal});c.abort();await assert.rejects(pending,{name:'AbortError'})})
test('mutation transport is not silently timed out as an uncommitted write',async()=>{const response=await requestJson(async(url,args)=>{assert.equal(args.method,'POST');await new Promise(r=>setTimeout(r,20));return {ok:true,json:async()=>({saved:true})}},'/save',{body:{x:1},readTimeoutMs:1});assert.equal(response.saved,true)})
