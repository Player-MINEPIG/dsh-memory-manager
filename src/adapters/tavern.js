import { createHash } from 'node:crypto'
import { fail } from '../config.js'
export function tavernWorldBooks({baseUrl,fetchImpl=fetch}){
  const base=new URL(baseUrl)
  if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname)||!['http:','https:'].includes(base.protocol)||base.username||base.password)fail('INVALID_ORIGIN','Tavern adapter requires a configured loopback origin')
  const get=async(path,signal)=>{const r=await fetchImpl(new URL('/pmp-dsh-tavern/api/v1'+path,base),{signal});const value=await r.json();if(!r.ok||!value.ok)fail('TAVERN_UNAVAILABLE',typeof value.error==='string'?value.error:value.error?.message??`HTTP ${r.status}`);return value}
  return {id:'tavern.world-books',name:'Tavern 世界书',authority:'tavern.world-book-library',
    optionCatalog:{version:1,types:[{id:'world-book',label:'世界书'}],modes:{store:{supported:false,reason:'当前 HTTP 来源仅提供只读资源。'},retrieve:{supported:false,reason:'世界书由 Tavern 原生路径控制；需新版 tavernMemorySources 管理权接口。'}}},
    describeScope:scope=>scope.sessionId?'当前会话选择、预览及使用记录中的世界书。':'Tavern 世界书库中的已导入资源。',
    async list({scope,signal}){
      const {worldBooks}=await get(scope.sessionId?'/world-book-selection?sessionId='+encodeURIComponent(scope.sessionId):'/world-books',signal)
      let records=[],active=[]
      if(scope.sessionId){
        const suffix='?sessionId='+encodeURIComponent(scope.sessionId)
        records=(await get('/traces'+suffix,signal)).records??[]
        active=(await get('/active'+suffix,signal)).resources?.worldBooks??[]
      }
      const books=new Map([...worldBooks,...active].map(book=>[book.id,book]))
      for(const record of records)for(const w of record.worldBooks??[])if(w.resource?.id&&!books.has(w.resource.id))books.set(w.resource.id,w.resource)
      return [...books.values()].map(book=>({id:'world-book:'+book.id,name:book.name??book.id,type:'world-book',revision:book.updatedAt??null,nativeBehavior:true,facts:records.flatMap(record=>(record.worldBooks??[]).filter(w=>w.resource?.id===book.id).map((w,i)=>({id:'world-book:'+book.id,adapterId:'tavern.world-books',eventId:`${record.id??record.recordedAt??'unknown'}:${i}`,phase:w.decisions?.some(d=>d.decision==='included')?'triggered':'skipped',sessionId:scope.sessionId,...(record.turn==null?{}:{turn:record.turn}),turnKind:'unknown',detail:'Tavern world-book evaluation; final request application is not established by this record'})))}))
    },
    async read({id,signal}){if(!id.startsWith('world-book:'))return null;const {worldBook}=await get('/world-books/'+encodeURIComponent(id.slice(11)),signal);return {id,name:worldBook.name,type:'world-book',content:worldBook,revision:createHash('sha256').update(JSON.stringify(worldBook)).digest('hex'),authority:'tavern.world-book-library'}},
    validateConfig(c){if(c.type&&c.type!=='world-book')fail('TYPE_MISMATCH','World-book source type is world-book');if(c.store||c.retrieve)fail('UNSUPPORTED_POLICY','World-book usage remains controlled by Tavern; management policy execution is not exposed by its public API')},
  }
}
