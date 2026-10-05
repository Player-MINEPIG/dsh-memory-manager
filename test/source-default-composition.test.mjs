import test from 'node:test'
import assert from 'node:assert/strict'
import {effective,applies,validateDocument} from '../src/config.js'
import {formFrom,entryFrom,restoreSourceDefaults} from '../src/client-form.js'
import {managementStatus} from '../src/client-management.js'

const row={id:'own-resource',adapterId:'own-source'}
const defaults={...row,type:'world-book',retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'source.activate'},{operation:'source.emit'}]}}
const document=entries=>({schemaVersion:1,revision:7,entries,presets:{named:{retrieve:{rule:true}}},opaque:{keep:true}})

test('source defaults are a base, with per-field local then existing preset precedence',()=>{
 const local={...row,preset:'named',retrieve:{rule:false},blacklist:[{sessionId:'private'}],opaque:{user:true}}
 const doc=validateDocument(document([local])),before=structuredClone(doc)
 const result=effective(doc,row.id,defaults)
 assert.equal(result.config.retrieve.rule,true)
 assert.equal(result.origins['retrieve.rule'],'preset:named')
 assert.equal(result.origins['retrieve.on'],'source-default')
 assert.equal(result.origins.blacklist,'local')
 assert.deepEqual(result.config.opaque,{user:true})
 assert.deepEqual(doc,before)
 assert.deepEqual(defaults.retrieve.strategy,[{operation:'source.activate'},{operation:'source.emit'}])
})

test('existing deny, empty lists and deliberately empty modes do not turn into defaults',()=>{
 for(const retrieve of [{rule:false},{}]){
  const result=effective(document([{...row,whitelist:[],retrieve}]),row.id,defaults)
  assert.deepEqual(result.config.retrieve,retrieve.rule===false?{...defaults.retrieve,rule:false}:{})
  assert.deepEqual(result.config.whitelist,[])
  assert.equal(applies(result.config,{sessionId:'own-session'}),false)
  assert.match(managementStatus({...result,managementMode:'managed',sourceDefault:{available:true}}),/本地 \/ 预设覆盖/)
 }
 const doc=document([{...row,preset:'named'}]);doc.presets.named.whitelist=[]
 assert.equal(effective(doc,row.id,defaults).origins.whitelist,'preset:named')
})

test('a source-bound default is never converted to a global generic usage grant',()=>{
 const result=effective(document([]),row.id,defaults)
 assert.equal(result.origins['retrieve.on'],'source-default')
 assert.deepEqual(result.config.whitelist,[])
 assert.equal(applies(result.config,{sessionId:'unrelated'}),false)
 assert.equal(effective(document([]),row.id).config,null)
})

test('restoring a resource clears its policy, scope, preset reference and alternate route in the draft',()=>{
 const local={...row,adapterId:'other-route',sourceAdapterId:row.adapterId,type:'other',preset:'named',whitelist:[{global:true}],blacklist:[{sessionId:'private'}],store:{on:'write',rule:false,strategy:[],opaqueStore:{keep:true}},retrieve:{rule:false,opaqueRead:{keep:true}},opaque:{user:true}}
 const doc=document([local]),before=structuredClone(doc)
 const restored=entryFrom(restoreSourceDefaults(formFrom(local),row),row)
 assert.deepEqual(restored,{...row,store:{opaqueStore:{keep:true}},retrieve:{opaqueRead:{keep:true}},opaque:{user:true}})
 const result=effective({...doc,entries:[restored]},row.id,defaults)
 assert.equal(result.config.retrieve.rule,true)
 assert.equal(result.config.preset,null)
 assert.deepEqual(result.config.whitelist,[])
 assert.equal(result.config.adapterId,row.adapterId)
 assert.deepEqual(doc,before)
 assert.deepEqual(doc.presets.named,{retrieve:{rule:true}})
 assert.match(managementStatus({...result,managementMode:'managed',sourceDefault:{available:true}}),/来源默认规则$/)
})
