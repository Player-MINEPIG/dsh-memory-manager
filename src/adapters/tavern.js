import { createHash } from 'node:crypto'
import { fail } from '../config.js'
export function tavernWorldBooks({baseUrl,fetchImpl=fetch}){
  const base=new URL(baseUrl)
  if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname)||!['http:','https:'].includes(base.protocol)||base.username||base.password)fail('INVALID_ORIGIN','Tavern adapter requires a configured loopback origin')
  const get=async(path,signal)=>{const r=await fetchImpl(new URL('/pmp-dsh-tavern/api/v1'+path,base),{signal});const value=await r.json();if(!r.ok||!value.ok)fail('TAVERN_UNAVAILABLE',typeof value.error==='string'?value.error:value.error?.message??`HTTP ${r.status}`);return value}
  return {id:'tavern.world-books',name:'Tavern 世界书',authority:'tavern.world-book-library',
    async list({scope,signal}){
      const {worldBooks}=await get(scope.sessionId?'/world-book-selection?sessionId='+encodeURIComponent(scope.sessionId):'/world-books',signal)
      let records=[]
      if(scope.sessionId)records=(await get('/traces?sessionId='+encodeURIComponent(scope.sessionId),signal)).records??[]
      return worldBooks.map(book=>({id:'world-book:'+book.id,name:book.name,type:'world-book',revision:book.updatedAt??null,nativeBehavior:true,facts:records.flatMap(record=>(record.worldBooks??[]).filter(w=>w.resource?.id===book.id).map((w,i)=>({id:'world-book:'+book.id,adapterId:'tavern.world-books',eventId:`${record.id??record.createdAt??record.timestamp}:${i}`,phase:w.decisions?.some(d=>d.included)?'triggered':'skipped',sessionId:scope.sessionId,turn:record.turn,turnKind:'unknown',detail:'Tavern world-book evaluation; final request application is not established by this record'})))}))
    },
    async read({id,signal}){if(!id.startsWith('world-book:'))return null;const {worldBook}=await get('/world-books/'+encodeURIComponent(id.slice(11)),signal);return {id,name:worldBook.name,type:'world-book',content:worldBook,revision:createHash('sha256').update(JSON.stringify(worldBook)).digest('hex'),authority:'tavern.world-book-library'}},
    validateConfig(c){if(c.type&&c.type!=='world-book')fail('TYPE_MISMATCH','World-book source type is world-book');if(c.store||c.retrieve)fail('UNSUPPORTED_POLICY','World-book usage remains controlled by Tavern; management policy execution is not exposed by its public API')},
  }
}
