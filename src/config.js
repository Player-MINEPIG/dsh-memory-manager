import { readFile } from 'node:fs/promises'
export const clone = value => structuredClone(value)
export function fail(code, message) { throw Object.assign(new Error(message), { code }) }
const object = x => x && typeof x === 'object' && !Array.isArray(x)
const fields = new Set(['id','adapterId','type','whitelist','blacklist','store','retrieve','preset'])
export function safe(value, depth = 0) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value))) fail('INVALID_JSON','Only finite JSON values are supported')
  if (depth > 40) fail('INVALID_CONFIG','Configuration nesting exceeds 40')
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__','constructor','prototype'].includes(key)) fail('INVALID_CONFIG',`Forbidden key: ${key}`)
    safe(child, depth + 1)
  }
}
function rule(value) {
  if (typeof value === 'boolean' || typeof value === 'string') return
  if (!object(value)) fail('INVALID_CONFIG','Rule must be boolean, condition name or a rule tree')
  const keys = Object.keys(value)
  if (keys.length !== 1) fail('INVALID_CONFIG','Rule nodes have exactly one operator')
  const [op] = keys
  if (['all','any'].includes(op)) { if (!Array.isArray(value[op])) fail('INVALID_CONFIG','Rule operands must be arrays'); value[op].forEach(rule) }
  else if (op === 'not') rule(value.not)
  else if (op === 'at_least') { const v=value.at_least; if (!object(v)||!Array.isArray(v.conditions)||!Number.isInteger(v.count)||v.count<0||v.count>v.conditions.length) fail('INVALID_CONFIG','Invalid at_least'); v.conditions.forEach(rule) }
  else if (op === 'condition') { if (!object(value.condition)||typeof value.condition.id!=='string') fail('INVALID_CONFIG','Invalid named condition') }
  else fail('INVALID_CONFIG',`Unknown rule operator: ${op}`)
}
function validateFields(entry, partial = false) {
  if (!object(entry)) fail('INVALID_CONFIG','Entry/preset must be an object')
  for (const key of Object.keys(entry)) if (!fields.has(key) || (partial && ['id','adapterId','preset'].includes(key))) fail('INVALID_CONFIG',`Unexpected configuration field: ${key}`)
  for (const key of ['whitelist','blacklist']) if (entry[key] !== undefined) {
    if (!Array.isArray(entry[key])) fail('INVALID_CONFIG',`${key} must be an array`)
    for (const selector of entry[key]) {
      if (!object(selector)||!Object.keys(selector).length) fail('INVALID_CONFIG','Empty scope selector')
      for (const [k,v] of Object.entries(selector)) if (!['global','sessionId','branchId','authority','taskId','runId','attemptId'].includes(k) || (k==='global' ? v!==true : typeof v!=='string'||!v)) fail('INVALID_CONFIG',`Invalid scope selector: ${k}`)
    }
  }
  if (entry.type !== undefined && (typeof entry.type !== 'string'||!entry.type)) fail('INVALID_CONFIG','type must be a nonempty string')
  for (const key of ['store','retrieve']) if (entry[key] !== undefined) {
    const v=entry[key]; if (!object(v)) fail('INVALID_CONFIG',`${key} must be an object`)
    for (const k of Object.keys(v)) if (!['on','rule','strategy'].includes(k)) fail('INVALID_CONFIG',`Unknown ${key} field: ${k}`)
    if ('on' in v && !(typeof v.on==='string'||(Array.isArray(v.on)&&v.on.every(x=>typeof x==='string')))) fail('INVALID_CONFIG','Invalid on')
    if ('rule' in v) rule(v.rule)
    if ('strategy' in v && !(typeof v.strategy==='string'||(Array.isArray(v.strategy)&&v.strategy.every(x=>object(x)&&typeof x.operation==='string')))) fail('INVALID_CONFIG','Invalid strategy')
  }
}
export function validateDocument(doc) {
  safe(doc)
  if (!object(doc)||doc.schemaVersion!==1||!Number.isInteger(doc.revision)||doc.revision<1||!Array.isArray(doc.entries)||!object(doc.presets)) fail('INVALID_CONFIG','Expected schemaVersion 1, positive revision, entries and presets')
  if (JSON.stringify(doc).length>2_000_000) fail('INVALID_CONFIG','Configuration exceeds 2 MB')
  for (const p of Object.values(doc.presets)) validateFields(p,true)
  const ids=new Set()
  for (const e of doc.entries) {
    validateFields(e)
    if (typeof e.id!=='string'||!e.id||typeof e.adapterId!=='string'||!e.adapterId||ids.has(e.id)) fail('INVALID_CONFIG','Entry requires unique id and adapterId')
    ids.add(e.id)
    if (e.preset != null && (typeof e.preset!=='string'||!Object.hasOwn(doc.presets,e.preset))) fail('INVALID_CONFIG',`Missing preset: ${e.preset}`)
    effective(doc,e.id)
  }
  return clone(doc)
}
export function effective(doc,id) {
  const local=doc.entries.find(e=>e.id===id)
  if (!local) return {config:null,origins:{},revision:doc.revision}
  const config={whitelist:[],blacklist:[],preset:null,...clone(local)},origins={}
  for (const k of Object.keys(config)) origins[k]='local'
  const preset=local.preset==null?null:doc.presets[local.preset]
  for (const [k,v] of Object.entries(preset??{})) {
    if (['store','retrieve'].includes(k)) { config[k]={...config[k],...clone(v)}; for(const child of Object.keys(v)) origins[`${k}.${child}`]=`preset:${local.preset}` }
    else {config[k]=clone(v);origins[k]=`preset:${local.preset}`}
  }
  validateFields(config)
  return {config,origins,revision:doc.revision}
}
export function applies(config,scope={}) {
  const match=s=>Object.entries(s).every(([k,v])=>k==='global'?v===true:scope[k]===v)
  return !!config && config.whitelist.some(match) && !config.blacklist.some(match)
}
export class Configuration {
  constructor(path) {this.path=path;this.document={schemaVersion:1,revision:1,entries:[],presets:{}};this.error=null;this.loaded=false;this.pending=Promise.resolve()}
  reload(validate=async()=>{}) {
    const job=this.pending.catch(()=>{}).then(()=>this.load(validate));this.pending=job;return job
  }
  async load(validate) {
    try {
      const next=validateDocument(JSON.parse(await readFile(this.path,'utf8')))
      if (this.loaded&&next.revision<=this.document.revision) fail('REVISION_CONFLICT','Increase configuration revision before reloading')
      await validate(next)
      this.document=next;this.loaded=true;this.error=null
      return {revision:next.revision}
    } catch(e) {this.error={code:e.code??'INVALID_CONFIG',message:e.message};throw e}
  }
  get(id) {return effective(this.document,id)}
}
