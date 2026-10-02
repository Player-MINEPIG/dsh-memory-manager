import { fail } from './config.js'
export function handler(manager){return async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store')
  try{
    const url=new URL(req.url,'http://localhost'),path=url.pathname.split('/').pop(),q=Object.fromEntries(url.searchParams)
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail('FORBIDDEN','Cross-origin access denied')
    if(req.headers['sec-fetch-site']==='cross-site')fail('FORBIDDEN','Cross-site access denied')
    const scope=q.sessionId?{sessionId:q.sessionId}:{}
    let result
    if(req.method==='GET'&&path==='query')result=await manager.query({scope,turn:q.turn||undefined,turnKind:q.turnKind||undefined,status:q.status||undefined,adapterId:q.adapterId||undefined})
    else if(req.method==='GET'&&path==='read')result=await manager.read({adapterId:q.adapterId,id:q.id,scope})
    else if(req.method==='POST'){
      if(req.headers['x-dsh-memory-manager']!=='1'||!req.headers['content-type']?.startsWith('application/json'))fail('FORBIDDEN','Management request headers required')
      let body='';for await(const chunk of req){body+=chunk;if(body.length>2_000_000)fail('TOO_LARGE','Request exceeds 2 MB')}
      const data=JSON.parse(body||'{}')
      if(path==='reload')result=await manager.reload()
      else if(path==='update')result=await manager.update({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else if(path==='management')result=await manager.setManagementMode({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else if(path==='copy')result=await manager.copy({...data,scope:data.sessionId?{sessionId:data.sessionId}:{}})
      else fail('NOT_FOUND','Unknown management operation')
    }else fail('NOT_FOUND','Unknown management endpoint')
    res.end(JSON.stringify(result))
  }catch(e){res.statusCode=e.code==='FORBIDDEN'?403:e.code==='REVISION_CONFLICT'?409:e.code==='NOT_FOUND'?404:400;res.end(JSON.stringify({error:{code:e.code??'REQUEST_FAILED',message:e.message}}))}
}}
