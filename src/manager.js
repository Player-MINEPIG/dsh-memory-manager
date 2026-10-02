import { mkdir,readFile,writeFile,rename } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Configuration,clone,fail,effective,applies,safe } from './config.js'
export class MemoryManager {
  protocolVersion=1
  adapters=new Map(); lifetimes=new Map(); owners=new Map(); traces=[]; active=new Map(); diagnostics=[]; pending=Promise.resolve()
  constructor({configPath,journalPath}) {this.configuration=new Configuration(configPath);this.journalPath=journalPath}
  async init() {
    if(this.journalPath) try {const rows=JSON.parse(await readFile(this.journalPath,'utf8'));if(!Array.isArray(rows)) throw Error('Invalid trace journal');this.traces=rows.slice(-2000);for(const event of this.traces)if(event.phase==='started'&&!this.traces.some(t=>t.id===event.id&&t.adapterId===event.adapterId&&t.sessionId===event.sessionId&&(t.requestId??t.eventId)===(event.requestId??event.eventId)&&['completed','failed','applied','skipped'].includes(t.phase)))event.interrupted=true} catch(e) {if(e.code!=='ENOENT')this.diagnostics.push({code:'JOURNAL_ERROR',message:e.message})}
    try {await this.reload()} catch { /* Visible; empty policy remains active. */ }
    return this
  }
  registerAdapter(adapter) {
    if(!adapter?.id||!adapter.authority||typeof adapter.list!=='function'||typeof adapter.read!=='function'||this.adapters.has(adapter.id)) fail('INVALID_ADAPTER','Adapter requires unique id, authority, list and read')
    const lifetime=new AbortController();this.lifetimes.set(adapter,lifetime)
    this.adapters.set(adapter.id,adapter)
    let stop
    try{stop=adapter.observe?.(event=>{if(this.adapters.get(adapter.id)!==adapter)return;try{this.recordTrace({...event,adapterId:adapter.id})}catch(e){this.diagnostics.push({adapterId:adapter.id,code:'INVALID_SOURCE_TRACE',message:e.message})}})}catch(e){this.adapters.delete(adapter.id);lifetime.abort();throw e}
    return ()=>{lifetime.abort();stop?.();for(const [id,owner] of this.owners)if(owner===adapter)this.owners.delete(id);if(this.adapters.get(adapter.id)===adapter)this.adapters.delete(adapter.id);for(const [k,v] of this.active)if(v.adapterId===adapter.id)this.active.delete(k)}
  }
  getConfig(id) {return this.configuration.get(id)}
  async reload() {return this.configuration.reload(async doc=>{
    for(const entry of doc.entries) {const a=this.adapters.get(entry.adapterId);if(a?.validateConfig) await a.validateConfig(effective(doc,entry.id).config)}
  })}
  recordTrace(input) {
    const event=clone(input)
    if((!this.adapters.has(event.adapterId)&&!(['failed','completed'].includes(event.phase)&&this.traces.some(t=>t.adapterId===event.adapterId&&t.eventId===event.eventId&&t.id===event.id)))||!event.id||!event.eventId||!['started','triggered','applied','skipped','failed','completed'].includes(event.phase)) fail('INVALID_TRACE','Trace requires registered adapter, id, eventId and phase')
    if(JSON.stringify(event).length>32000)fail('INVALID_TRACE','Observation exceeds 32 KB')
    if(this.traces.some(t=>t.adapterId===event.adapterId&&t.id===event.id&&t.sessionId===event.sessionId&&t.requestId===event.requestId&&t.eventId===event.eventId&&t.phase===event.phase)) return
    event.at=Date.now();event.turnKind??='unknown'
    const key=JSON.stringify([event.adapterId,event.id,event.sessionId,event.requestId??event.eventId])
    if(event.phase==='started') this.active.set(key,event)
    if(['completed','failed','applied','skipped'].includes(event.phase)) this.active.delete(key)
    this.traces.push(event);this.traces=this.traces.slice(-2000)
    if(this.journalPath) {
      const data=JSON.stringify(this.traces)
      this.pending=this.pending.catch(()=>{}).then(async()=>{await mkdir(dirname(this.journalPath),{recursive:true});const temp=`${this.journalPath}.tmp`;await writeFile(temp,data,{mode:0o600});await rename(temp,this.journalPath)}).catch(e=>{this.diagnostics.push({code:'JOURNAL_WRITE_FAILED',message:e.message})})
    }
  }
  async query({scope={},turn,turnKind,status,adapterId,signal}={}) {
    const records=[],diagnostics=[...this.diagnostics]
    for(const a of this.adapters.values()) {
      if(adapterId&&a.id!==adapterId) continue
      try {for(const r of await this.invoke(a,'list',{scope,signal})) {this.claim(a,r);records.push({...clone(r),adapterId:a.id,authority:r.authority??a.authority,capabilities:{edit:!!a.update,copy:!!a.copy,management:!!a.setManagementMode}})}}
      catch(e) {diagnostics.push({adapterId:a.id,code:e.code??'SOURCE_ERROR',message:e.message})}
    }
    for(const entry of this.configuration.document.entries) if((!adapterId||entry.adapterId===adapterId)&&!records.some(r=>r.id===entry.id)) records.push({id:entry.id,type:entry.type,adapterId:entry.adapterId,missing:true,capabilities:{edit:false,copy:false}})
    const filter=t=>(!scope.sessionId||t.sessionId===scope.sessionId)&&(turn===undefined||String(t.turn)===String(turn))&&(!turnKind||t.turnKind===turnKind)
    for(const fact of this.traces.filter(filter))if((!adapterId||fact.adapterId===adapterId)&&!records.some(r=>r.id===fact.id))records.push({id:fact.id,type:'unknown',adapterId:fact.adapterId,missing:true,capabilities:{edit:false,copy:false}})
    const rows=records.map(r=>{
      const policy=this.getConfig(r.id),facts=[...this.traces,...(r.facts??[])].filter(t=>t.id===r.id&&t.adapterId===r.adapterId&&filter(t)),running=[...this.active.values()].some(t=>t.id===r.id&&filter(t))
      const state=running?'running':facts.some(t=>['triggered','applied','started'].includes(t.phase))?'past':'never'
      return {...r,...policy,managed:r.managementMode==='managed',applicable:applies(policy.config,scope),status:state,facts,interrupted:facts.some(t=>t.interrupted),applied:facts.some(t=>t.phase==='applied')}
    }).filter(r=>!status||r.status===status)
    return {protocolVersion:1,revision:this.configuration.document.revision,configError:this.configuration.error,rows,diagnostics,adapters:[...this.adapters.values()].map(a=>({id:a.id,name:a.name,authority:a.authority}))}
  }
  async read({adapterId,id,scope={},signal}) {const a=this.adapters.get(adapterId);if(!a)fail('SOURCE_UNAVAILABLE','Source is unavailable');const result=await this.invoke(a,'read',{id,scope,signal});if(result)this.claim(a,result,id);return clone(result)}
  async update({adapterId,id,scope={},content,expectedRevision,operationId,signal}) {
    const a=this.adapters.get(adapterId);if(!a?.update)fail('READ_ONLY','Source does not support editing')
    if(expectedRevision===undefined||typeof operationId!=='string'||!operationId)fail('INVALID_UPDATE','Revision and operationId are required')
    safe(content);const result=await this.invoke(a,'update',{id,scope,content:clone(content),expectedRevision,operationId,signal});this.claim(a,result,id);return clone(result)
  }
  async copy({adapterId,id,scope={},newId,signal}) {const a=this.adapters.get(adapterId);if(!a?.copy)fail('READ_ONLY','Source does not support copying');if(!newId||newId===id)fail('INVALID_COPY','Copy requires a new ID');const result=await this.invoke(a,'copy',{id,scope,newId,signal});this.claim(a,result,newId);return clone(result)}
  claim(adapter,record,expectedId){
    if(!record||typeof record.id!=='string'||typeof record.type!=='string'||(expectedId&&record.id!==expectedId))fail('INVALID_RECORD','Source returned an invalid resource identity')
    safe(record);if(JSON.stringify(record).length>2_000_000)fail('TOO_LARGE','Resource exceeds 2 MB')
    const owner=this.owners.get(record.id);if(owner&&owner!==adapter)fail('OWNERSHIP_CONFLICT',`Multiple adapters claim resource ${record.id}`)
    this.owners.set(record.id,adapter)
  }
  async invoke(adapter,method,args){
    const lifetime=this.lifetimes.get(adapter);if(!lifetime||lifetime.signal.aborted)fail('SOURCE_UNAVAILABLE','Source was unloaded')
    const signal=args.signal?AbortSignal.any([args.signal,lifetime.signal]):lifetime.signal
    signal.throwIfAborted();const result=await adapter[method]({...args,signal});signal.throwIfAborted()
    if(this.adapters.get(adapter.id)!==adapter)fail('SOURCE_UNAVAILABLE','Source registration changed')
    return result
  }
  async setManagementMode({adapterId,...args}){const a=this.adapters.get(adapterId);if(!a?.setManagementMode)fail('UNSUPPORTED','Source does not expose management ownership');const result=await this.invoke(a,'setManagementMode',args);this.claim(a,result,args.id);return clone(result)}
  async dispose(){for(const lifetime of this.lifetimes.values())lifetime.abort();await this.pending}
}
