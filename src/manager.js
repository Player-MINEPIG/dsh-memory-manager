import { mkdir,readFile,writeFile,rename } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Configuration,clone,fail,effective,applies,safe } from './config.js'
export class MemoryManager {
  protocolVersion=1
  adapters=new Map(); lifetimes=new Map(); owners=new Map(); reservations=new Map(); traces=[]; active=new Map(); diagnostics=[]; pending=Promise.resolve()
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
    const validation=this.validateAdapter(adapter)
    validation.catch(e=>{if(!lifetime.signal.aborted)this.diagnostics.push({adapterId:adapter.id,code:e.code??'SOURCE_CONFIG_INVALID',message:e.message})})
    let stop
    try{stop=adapter.observe?.(event=>{if(lifetime.signal.aborted||this.lifetimes.get(adapter)!==lifetime||this.adapters.get(adapter.id)!==adapter)return;try{this.recordTrace({...event,adapterId:adapter.id})}catch(e){this.diagnostics.push({adapterId:adapter.id,code:'INVALID_SOURCE_TRACE',message:e.message})}})}catch(e){this.adapters.delete(adapter.id);lifetime.abort();throw e}
    return ()=>{lifetime.abort();stop?.();if(this.lifetimes.get(adapter)!==lifetime)return;for(const [id,reservation] of this.reservations)if(reservation.adapter===adapter)this.reservations.delete(id);for(const [id,owner] of this.owners)if(owner===adapter)this.owners.delete(id);if(this.adapters.get(adapter.id)===adapter)this.adapters.delete(adapter.id);for(const [k,v] of this.active)if(v.adapterId===adapter.id)this.active.delete(k)}
  }
  async validateAdapter(adapter) {
    for(const entry of this.configuration.document.entries)if(entry.adapterId===adapter.id)await adapter.validateConfig?.(this.getConfig(entry.id).config)
  }
  assertOwner(adapter,id) {const owner=this.owners.get(id)??this.reservations.get(id)?.adapter;if(owner&&owner!==adapter)fail('OWNERSHIP_CONFLICT',`Multiple adapters claim resource ${id}`)}
  reserve(adapter,ids) {
    ids=[...new Set(ids)];for(const id of ids)this.assertOwner(adapter,id)
    const token=Symbol('mutation'),slots=[]
    for(const id of ids){let slot=this.reservations.get(id);if(!slot){slot={adapter,tokens:new Set(),uncertain:false};this.reservations.set(id,slot)}slot.tokens.add(token);slots.push([id,slot])}
    return (uncertain=false)=>{for(const [id,slot] of slots){slot.tokens.delete(token);slot.uncertain||=uncertain;if(this.reservations.get(id)===slot&&!slot.tokens.size&&!slot.uncertain)this.reservations.delete(id)}}
  }
  async mutate(adapter,method,args,ids,expectedId){
    args.signal?.throwIfAborted();this.lifetimes.get(adapter)?.signal.throwIfAborted()
    const release=this.reserve(adapter,ids);let received=false
    try{const result=await this.invoke(adapter,method,args);received=true;this.claim(adapter,result,expectedId);release();return clone(result)}
    catch(error){
      const rejected=!received&&(error.committed===false||['VALIDATION_FAILED','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','READ_ONLY','NOT_FOUND','FORBIDDEN'].includes(error.code))
      release(!rejected)
      if(!rejected)this.diagnostics.push({adapterId:adapter.id,code:'MUTATION_OUTCOME_UNKNOWN',message:`${method} outcome for ${expectedId} requires source reconciliation`})
      throw error
    }
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
      try {for(const r of await this.invoke(a,'list',{scope,signal})) {this.claim(a,r);diagnostics.push(...(r.diagnostics??[]).map(d=>({...d,adapterId:a.id})));records.push({...clone(r),adapterId:a.id,authority:r.authority??a.authority,capabilities:{edit:!!a.update,copy:!!a.copy,management:!!a.setManagementMode,...r.capabilities}})}}
      catch(e) {diagnostics.push({adapterId:a.id,code:e.code??'SOURCE_ERROR',message:e.message})}
    }
    for(const entry of this.configuration.document.entries) if((!adapterId||entry.adapterId===adapterId)&&!records.some(r=>r.id===entry.id)) records.push({id:entry.id,type:entry.type,adapterId:entry.adapterId,missing:true,capabilities:{edit:false,copy:false}})
    const filter=t=>(!scope.sessionId||t.sessionId===scope.sessionId)&&(turn===undefined||String(t.turn)===String(turn))&&(!turnKind||t.turnKind===turnKind)
    for(const fact of this.traces.filter(filter))if((!adapterId||fact.adapterId===adapterId)&&!records.some(r=>r.id===fact.id))records.push({id:fact.id,type:'unknown',adapterId:fact.adapterId,missing:true,capabilities:{edit:false,copy:false}})
    const rows=records.map(r=>{
      const policy=this.getConfig(r.id),facts=[...this.traces,...(r.facts??[])].filter(t=>t.id===r.id&&t.adapterId===r.adapterId&&filter(t)),running=[...this.active.values()].some(t=>t.id===r.id&&filter(t))
      const state=running?'running':facts.some(t=>['triggered','applied','started'].includes(t.phase))?'past':'never'
      return {...r,config:policy.config,origins:policy.origins,configRevision:policy.revision,managed:r.managementMode==='managed',applicable:applies(policy.config,scope),status:state,facts,interrupted:facts.some(t=>t.interrupted),applied:facts.some(t=>t.phase==='applied')}
    }).filter(r=>!status||r.status===status)
    return {protocolVersion:1,revision:this.configuration.document.revision,configError:this.configuration.error,rows,diagnostics,adapters:[...this.adapters.values()].map(a=>({id:a.id,name:a.name,authority:a.authority}))}
  }
  async read({adapterId,id,scope={},signal}) {const a=this.adapters.get(adapterId);if(!a)fail('SOURCE_UNAVAILABLE','Source is unavailable');const result=await this.invoke(a,'read',{id,scope,signal});if(result)this.claim(a,result,id);else {const reservation=this.reservations.get(id);if(reservation?.adapter===a&&!reservation.tokens.size)this.reservations.delete(id)}return clone(result)}
  async update({adapterId,id,scope={},content,expectedRevision,operationId,signal}) {
    const a=this.adapters.get(adapterId);if(!a?.update)fail('READ_ONLY','Source does not support editing')
    if(expectedRevision===undefined||typeof operationId!=='string'||!operationId)fail('INVALID_UPDATE','Revision and operationId are required')
    safe(content);return this.mutate(a,'update',{id,scope,content:clone(content),expectedRevision,operationId,signal},[id],id)
  }
  async copy({adapterId,id,scope={},newId,signal}) {const a=this.adapters.get(adapterId);if(!a?.copy)fail('READ_ONLY','Source does not support copying');if(!newId||newId===id)fail('INVALID_COPY','Copy requires a new ID');return this.mutate(a,'copy',{id,scope,newId,signal},[id,newId],newId)}
  claim(adapter,record,expectedId){
    if(!record||typeof record.id!=='string'||typeof record.type!=='string'||(expectedId&&record.id!==expectedId))fail('INVALID_RECORD','Source returned an invalid resource identity')
    safe(record);if(JSON.stringify(record).length>2_000_000)fail('TOO_LARGE','Resource exceeds 2 MB')
    this.assertOwner(adapter,record.id)
    this.owners.set(record.id,adapter)
    const reservation=this.reservations.get(record.id);if(reservation?.adapter===adapter){reservation.uncertain=false;if(!reservation.tokens.size)this.reservations.delete(record.id)}
  }
  async invoke(adapter,method,args){
    const lifetime=this.lifetimes.get(adapter);if(!lifetime||lifetime.signal.aborted)fail('SOURCE_UNAVAILABLE','Source was unloaded')
    const signal=args.signal?AbortSignal.any([args.signal,lifetime.signal]):lifetime.signal
    signal.throwIfAborted();const result=await adapter[method]({...args,signal});signal.throwIfAborted()
    if(this.adapters.get(adapter.id)!==adapter)fail('SOURCE_UNAVAILABLE','Source registration changed')
    return result
  }
  async setManagementMode({adapterId,...args}){const a=this.adapters.get(adapterId);if(!a?.setManagementMode)fail('UNSUPPORTED','Source does not expose management ownership');return this.mutate(a,'setManagementMode',args,[args.id],args.id)}
  async dispose(){for(const lifetime of this.lifetimes.values())lifetime.abort();await this.pending}
}
