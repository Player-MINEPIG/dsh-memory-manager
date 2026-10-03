import {readFile} from 'node:fs/promises'
import { fail } from './config.js'
export function handler(manager,connection){return async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store')
  try{
    if(typeof connection?.admit!=='function')fail('FORBIDDEN','Host admission is unavailable')
    const admission=connection.admit(req)
    if('rejection' in admission){res.statusCode=admission.rejection;res.end(JSON.stringify({error:{code:'HOST_ADMISSION_DENIED',message:'Host admission denied'}}));return}
    const url=new URL(req.url,'http://localhost'),path=url.pathname.split('/').pop(),q=Object.fromEntries(url.searchParams)
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail('FORBIDDEN','Cross-origin access denied')
    if(req.headers['sec-fetch-site']==='cross-site')fail('FORBIDDEN','Cross-site access denied')
    const scope=q.sessionId?{sessionId:q.sessionId}:{}
    if(req.method==='GET'&&path==='options-documentation'){
      const text=await readFile(new URL('../docs/OPTIONS.md',import.meta.url),'utf8'),escaped=text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'")
      res.end('<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>记忆管理选项扩展文档</title><style>body{max-width:900px;margin:32px auto;padding:0 20px;font:15px/1.7 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><pre>'+escaped+'</pre></html>');return
    }
    let result
    if(req.method==='GET'&&path==='query')result=await manager.query({scope,...(q.filters?{filters:JSON.parse(q.filters)}:{}),...Object.fromEntries(['turn','turnKind','status','adapterId'].map(key=>[key,url.searchParams.getAll(key).filter(Boolean)]))})
    else if(req.method==='GET'&&path==='options')result=manager.optionCatalog({id:q.id,adapterId:q.adapterId,sessionId:q.sessionId})
    else if(req.method==='GET'&&path==='configuration')result=manager.configurationSnapshot({id:q.id,adapterId:q.adapterId})
    else if(req.method==='GET'&&path==='read')result=await manager.read({adapterId:q.adapterId,id:q.id,scope})
    else if(req.method==='POST'){
      if(req.headers['x-dsh-memory-manager']!=='1'||!req.headers['content-type']?.startsWith('application/json'))fail('FORBIDDEN','Management request headers required')
      let body='';for await(const chunk of req){body+=chunk;if(body.length>2_000_000)fail('TOO_LARGE','Request exceeds 2 MB')}
      const data=JSON.parse(body||'{}')
      if(path==='reload')result=await manager.reload()
      else if(path==='validate-configuration')result=await manager.validateEntry(data)
      else if(path==='save-configuration')result=await manager.saveEntry(data)
      else if(path==='update')result=await manager.update({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else if(path==='management')result=await manager.setManagementMode({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else if(path==='copy')result=await manager.copy({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else fail('NOT_FOUND','Unknown management operation')
    }else fail('NOT_FOUND','Unknown management endpoint')
    res.end(JSON.stringify(result))
  }catch(e){res.statusCode=e.code==='FORBIDDEN'?403:e.code==='REVISION_CONFLICT'?409:e.code==='NOT_FOUND'?404:400;res.end(JSON.stringify({error:{code:e.code??'REQUEST_FAILED',message:e.message,...(e.diagnostics?{diagnostics:e.diagnostics}:{})}}))}
}}
