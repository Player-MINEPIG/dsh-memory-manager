import {test} from 'node:test'
import assert from 'node:assert/strict'
import {canonical,filterValues,matchesConfigurationFilters,validateFilters} from '../src/filters.js'
import {effective} from '../src/config.js'
import {formFrom,entryFrom,importEntry,fieldOrigin} from '../src/client-form.js'
const f=(values,mode='exact',missing=false)=>({values,mode,missing})
test('effective filters compose preset overrides, OR within field AND across fields, empty unrestricted',()=>{
 const local={id:'x',adapterId:'a',type:'text',preset:'p',retrieve:{on:['one','two'],rule:true,strategy:'read'}}
 const {config}=effective({revision:1,entries:[local],presets:{p:{type:'skill',retrieve:{rule:false}}}},'x'),row={id:'x',type:'text',config}
 assert(matchesConfigurationFilters(row,{type:f(['skill','worldbook']),'retrieve.on':f(['two','three']),'retrieve.rule':f(['false'])}))
 assert(!matchesConfigurationFilters(row,{type:f(['skill']),'retrieve.rule':f(['true'])}))
 assert(matchesConfigurationFilters(row,{type:f([])}));assert.deepEqual(filterValues(row,'retrieve.on'),['one','two'])
 assert(!matchesConfigurationFilters(row,{'retrieve.rule':f(['"false"'])}))
 assert(matchesConfigurationFilters(row,{'store.rule':f([], 'exact',true)}));assert(!matchesConfigurationFilters(row,{'retrieve.rule':f([], 'exact',true)}))
 assert(matchesConfigurationFilters(row,{preset:f(['P','p'])}));assert(!matchesConfigurationFilters(row,{preset:f(['P'],'contains')}))
 assert.deepEqual(filterValues({id:'native',type:'skill',config:null},'type'),['skill']);assert.deepEqual(filterValues({id:'native',type:'skill',config:null},'preset'),[])
})
test('complex filters use deterministic JSON text without coercing JSON types or executing anything',()=>{
 const row={id:'x',config:{store:{rule:{condition:{params:{z:2,a:'value'},id:'not-executed'}},strategy:[{operation:'first'},{operation:'second'}]}}}
 assert.equal(canonical({z:1,a:[false,'false']}),'{"a":[false,"false"],"z":1}')
 assert(matchesConfigurationFilters(row,{'store.rule':f(['"id":"not-executed"'],'contains'),'store.strategy':f(['[{"operation":"first"},{"operation":"second"}]'])}))
 for(const invalid of [[],null,{unknown:f([])},{type:{mode:'eval',values:['x']}},{type:f([false])},{type:{...f([]),missing:'yes'}}])assert.throws(()=>validateFilters(invalid),{code:'INVALID_FILTER'})
})
test('controlled entry forms round-trip local-only config and reject lossy imports',()=>{
 const row={id:'x',adapterId:'a'},entry={...row,type:'skill',preset:null,whitelist:[],store:{},retrieve:{on:[],rule:false,strategy:[]}}
 assert.deepEqual(entryFrom(formFrom(entry),row),entry)
 assert.deepEqual(entryFrom(importEntry(JSON.stringify(entry),row),row),entry)
 assert.deepEqual(entryFrom(formFrom(null),row),row)
 for(const entry of [{...row,type:[]},{...row,type:''},{...row,preset:{}},{...row,store:null},{...row,store:[]},{...row,retrieve:{extra:true}},{...row,extra:true},{...row,id:'changed'}])assert.throws(()=>importEntry(JSON.stringify(entry),row))
 const form=formFrom(entry);form['retrieve.rule']='';assert.deepEqual(entryFrom(form,row).retrieve,{on:[],strategy:[]})
})
test('trace-only indeterminate type is missing, while real and configured unknown types remain exact facets',async()=>{
 const {MemoryManager}=await import('../src/manager.js'),m=new MemoryManager({configPath:'/unused'})
 let records=[{id:'real',type:'unknown'}]
 m.registerAdapter({id:'a',authority:'synthetic',list:async()=>records,read:async()=>null})
 m.recordTrace({adapterId:'a',id:'gone',eventId:'past',phase:'applied',sessionId:'s'})
 const scope={sessionId:'s'},query=await m.query({scope}),gone=query.rows.find(r=>r.id==='gone')
 assert.deepEqual(filterValues(gone,'type'),[])
 assert.deepEqual((await m.query({scope,filters:{type:f([],'exact',true)}})).rows.map(r=>r.id),['gone'])
 assert.deepEqual((await m.query({scope,filters:{type:f(['unknown'])}})).rows.map(r=>r.id),['real'])
 assert.deepEqual(query.facets.fields.type,['unknown'])
 records=[]
 assert.deepEqual((await m.query({scope})).facets.fields.type,[])
 assert.deepEqual((await m.query({scope,filters:{type:f(['unknown'])}})).rows,[])
 assert.deepEqual((await m.query({scope,filters:{type:f([],'exact',true)}})).rows.map(r=>r.id),['gone'])
 records=[{id:'real',type:'unknown'}]
 m.configuration.document.entries=[{id:'gone',adapterId:'a',type:'unknown'}]
 assert.deepEqual((await m.query({scope,filters:{type:f(['unknown'])}})).rows.map(r=>r.id),['real','gone'])
 assert.deepEqual((await m.query({scope,filters:{type:f([],'exact',true)}})).rows,[])
 await m.dispose()
})

test('missing behavior children have unconfigured provenance, independent of parent or preset',()=>{
 const doc={revision:1,entries:[{id:'x',adapterId:'a',retrieve:{on:'request'},preset:'p'}],presets:{p:{store:{on:'event'},retrieve:{strategy:'read'}}}}
 const {config,origins}=effective(doc,'x')
 assert.equal(fieldOrigin(config,origins,'retrieve.rule'),undefined)
 assert.equal(fieldOrigin(config,origins,'retrieve.on'),'local')
 assert.equal(fieldOrigin(config,origins,'retrieve.strategy'),'preset:p')
 assert.equal(fieldOrigin(config,origins,'store.rule'),undefined)
 assert.equal(fieldOrigin(config,origins,'store.on'),'preset:p')
 assert.equal(fieldOrigin(config,origins,'preset'),'local')
 assert.equal(fieldOrigin(config,origins,'blacklist'),'default')
})
