// Read requests must finish visibly even when a source never returns. Mutations
// retain their transport outcome: cancelling them cannot prove no write occurred.
export async function requestJson(fetcher,url,{body,signal,readTimeoutMs=30000}={}){
 const controller=new AbortController(),read=body===undefined
 let timer,timedOut=false,rejectAbort
 const aborted=new Promise((resolve,reject)=>{rejectAbort=reject})
 const onAbort=()=>rejectAbort(controller.signal.reason??Object.assign(Error('请求已取消'),{name:'AbortError'}))
 controller.signal.addEventListener('abort',onAbort,{once:true})
 const cancel=()=>controller.abort(signal.reason)
 if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true})
 if(read)timer=setTimeout(()=>{timedOut=true;controller.abort()},readTimeoutMs)
 try{
  const r=await Promise.race([fetcher(url,{signal:controller.signal,headers:read?undefined:{'Content-Type':'application/json','X-DSH-Memory-Manager':'1'},method:read?'GET':'POST',body:read?undefined:JSON.stringify(body)}),aborted])
  const data=await Promise.race([r.json(),aborted]);if(!r.ok)throw Object.assign(Error(data.error?.message??'请求失败'),data.error);return data
 }catch(e){if(timedOut&&!signal?.aborted)throw Object.assign(Error(`来源读取超过 ${Math.round(readTimeoutMs/1000)} 秒，尚未返回。请重新读取；这不表示资源不存在或来源已卸载。`),{code:'READ_TIMEOUT'});throw e}
 finally{controller.signal.removeEventListener('abort',onAbort);clearTimeout(timer);signal?.removeEventListener('abort',cancel)}
}
