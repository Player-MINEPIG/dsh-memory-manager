// Pure Node callback inspection: exact product source, synthetic React element/hook
// facade, no DOM/browser/Host, and no source callbacks or real resource I/O.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {pathToFileURL} from 'node:url'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const root=new URL('../',import.meta.url).pathname.replace(/\/$/,'')
const product=path=>pathToFileURL(root+'/'+path).href
const {MemoryManager}=await import(product('src/manager.js'))
const {Usage}=await import(product('src/usage.js'))
const {validateDocument}=await import(product('src/config.js'))
const {formFrom,entryFrom,removeModeFrom,effectiveDraftType}=await import(product('src/client-form.js'))
const source=await readFile(root+'/src/client-options.js','utf8')

globalThis.__dmmReviewReact={
  createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),
  useState:value=>[value,()=>{}]
}
const reviewed=source.replace("import {createElement as h,useState} from 'react'",'const {createElement:h,useState}=globalThis.__dmmReviewReact')
  .replace("'./option-schema.js'",JSON.stringify(product('src/option-schema.js')))
  .replace("'./client-form.js'",JSON.stringify(product('src/client-form.js')))
const finalSource=reviewed.replace("'./option-availability.js'",JSON.stringify(product('src/option-availability.js')))
const {OptionPage}=await import('data:text/javascript;base64,'+Buffer.from(finalSource).toString('base64'))
function flatten(node){
  if(node==null||typeof node!=='object')return []
  if(typeof node.type==='function')return flatten(node.type(node.props))
  return [node,...(node.props.children??[]).flatMap(flatten)]
}
function page(field,value,catalog,onChange=()=>{},extra={}){return flatten(OptionPage({field,value,catalog,onChange,onBack:()=>{},effectiveType:'text',...extra}))}
function setup(){
  const m=new MemoryManager({configPath:'/unused'}),u=new Usage(m)
  m.configuration.loaded=true
  m.registerAdapter({id:'synthetic',authority:'synthetic',list:()=>[],read:()=>null,validateConfig:()=>{},optionCatalog:{version:1,types:[{id:'text',label:'Text'},{id:'number',label:'Number'}],events:[{id:'request',label:'Request',mode:'retrieve'}],modes:{store:{supported:true,onSelection:'single',strategySelection:'chain'},retrieve:{supported:true,onSelection:'single',strategySelection:'chain'}}}})
  return {m,u}
}
const entry=rule=>({id:'synthetic:1',adapterId:'synthetic',type:'text',whitelist:[{global:true}],retrieve:{on:'request',rule}})
const check=(m,e)=>m.validateEntry({id:e.id,adapterId:e.adapterId,entry:e,expectedRevision:1})

test('R1: top-level and nested retrieve controls both reject store-only condition',async()=>{
  const {m,u}=setup();u.registerCondition({id:'store-only',label:'Store only',modes:['store'],test:()=>{throw Error('must not execute')}})
  const catalog=m.optionCatalog({id:'synthetic:1',adapterId:'synthetic'})
  assert.equal(catalog.fields['retrieve.rule'].find(o=>o.id==='store-only').available,true)
  let selected;const nodes=page('retrieve.rule',true,catalog,v=>selected=v)
  const card=nodes.find(n=>n.type==='label'&&n.props.className==='dmm-option-card'&&JSON.stringify(n).includes('Store only'))
  const radio=flatten(card).find(n=>n.type==='input')
  assert.equal(radio.props.disabled,true);radio.props.onChange();assert.equal(selected,undefined)
  const report=await check(m,entry('store-only'));assert.equal(report.valid,false)
  assert(report.diagnostics.some(d=>d.code==='CAPABILITY_MISMATCH'&&d.message.includes('模式')))
  const nested=page('retrieve.rule','store-only',catalog).find(n=>n.type==='option'&&n.props.value==='store-only')
  assert.equal(nested.props.disabled,true)
})

test('R1: draft type and preset override update both card and nested availability',async()=>{
  const {m,u}=setup();u.registerCondition({id:'number-condition',label:'Number condition',types:['number'],test:()=>{throw Error('must not execute')}})
  u.registerOperation({id:'number-operation',label:'Number operation',types:['number'],run:()=>{throw Error('must not execute')}})
  m.configuration.document.entries=[entry(true)]
  const catalog=m.optionCatalog({id:'synthetic:1',adapterId:'synthetic'})
  assert.equal(catalog.conditions.find(o=>o.id==='number-condition').available,true)
  assert.equal(catalog.operations.find(o=>o.id==='number-operation').available,true)
  const op=page('retrieve.strategy',[{operation:'number-operation'}],catalog).find(n=>n.type==='option'&&n.props.value==='number-operation')
  assert.equal(op.props.disabled,true)
  const numberPage=page('retrieve.rule','number-condition',catalog,()=>{},{effectiveType:'number'})
  assert.equal(numberPage.find(n=>n.type==='option'&&n.props.value==='number-condition').props.disabled,false)
  const numberCard=numberPage.find(n=>n.type==='label'&&n.props.className==='dmm-option-card'&&JSON.stringify(n).includes('Number condition'))
  assert.equal(flatten(numberCard).find(n=>n.type==='input').props.disabled,false)
  assert.equal(effectiveDraftType({type:'text',preset:'numeric'},[{id:'numeric',configuration:{type:'number'}}]),'number')
  assert.equal(effectiveDraftType({type:'text',preset:''},[]),'text')
  const filtered=page('retrieve.rule',true,catalog,()=>{},{filter:true})
  assert(filtered.filter(n=>n.type==='input'&&n.props.type==='checkbox').every(n=>!n.props.disabled))
  const e={...entry('number-condition'),retrieve:{on:'request',rule:'number-condition',strategy:[{operation:'number-operation'}]}}
  const report=await check(m,e);assert.equal(report.valid,false)
  assert.equal(report.diagnostics.filter(d=>d.code==='CAPABILITY_MISMATCH'&&d.message.includes('类型')).length,2)
})

test('R2: editing a known parameter preserves an accepted unknown condition member on actual temporary save',async t=>{
  const {m,u}=setup();u.registerCondition({id:'typed',label:'Typed',parameters:{type:'object',properties:{n:{type:'integer'}},required:['n']},test:()=>{throw Error('must not execute')}})
  const before=entry({condition:{id:'typed',params:{n:1},extension:{keep:'original'}}})
  assert.doesNotThrow(()=>validateDocument({schemaVersion:1,revision:1,presets:{},entries:[before]}))
  assert.equal((await check(m,before)).valid,true)
  assert.deepEqual(entryFrom(formFrom(before),before),before)
  let next;const nodes=page('retrieve.rule',before.retrieve.rule,m.optionCatalog({id:before.id,adapterId:before.adapterId}),v=>next=v)
  const control=nodes.find(n=>n.type==='input'&&n.props['aria-label']==='Typed · n')
  assert(control);control.props.onChange({target:{value:'2'}})
  assert.deepEqual(next,{condition:{id:'typed',params:{n:2},extension:{keep:'original'}}})
  assert.deepEqual(next.condition.extension,{keep:'original'})
  assert.equal((await check(m,entry(next))).valid,true)
  const dir=await mkdtemp(join(tmpdir(),'dmm-ui-2a467e4-'));t.after(()=>rm(dir,{recursive:true,force:true}))
  m.configuration.path=join(dir,'config.json')
  m.configuration.document=validateDocument({schemaVersion:1,revision:1,presets:{},entries:[before]})
  await writeFile(m.configuration.path,JSON.stringify(m.configuration.document))
  const draft=formFrom(before);draft['retrieve.rule']=JSON.stringify(next)
  const after=entryFrom(draft,before)
  const saved=await m.saveEntry({id:before.id,adapterId:before.adapterId,entry:after,expectedRevision:1})
  assert.equal(saved.revision,2)
  assert.deepEqual(JSON.parse(await readFile(m.configuration.path,'utf8')).entries[0].retrieve.rule.condition.extension,{keep:'original'})
})

test('R3: child clears preserve intentional empty mode; explicit section removal clears presence and validates',async()=>{
  const {m}=setup()
  m.adapters.get('synthetic').optionCatalog.modes.store={supported:false,reason:'read only'}
  const before={...entry(true),store:{on:'legacy-event',rule:true,strategy:'legacy-operation'}}
  const form=formFrom(before)
  // DetailPage.updateField(undefined) uses the empty form value; __storePresent
  // has no field-level control and remains true throughout all three clears.
  for(const field of ['store.on','store.rule','store.strategy'])form[field]=''
  const cleared=entryFrom(form,before)
  assert.deepEqual(cleared.store,{})
  const report=await check(m,cleared);assert.equal(report.valid,false)
  assert(report.diagnostics.some(d=>d.code==='CAPABILITY_MISMATCH'&&d.field==='store'))
  const removed=removeModeFrom(form,'store');assert.equal(removed.__storePresent,false);const omitted=entryFrom(removed,before);assert.equal(Object.hasOwn(omitted,'store'),false)
  const empty={...entry(true),store:{},preset:null};assert.deepEqual(entryFrom(formFrom(empty),empty),empty)
  assert.equal(removeModeFrom(formFrom({...empty,preset:'kept'}),'store').preset,'kept')
  assert.equal((await check(m,omitted)).valid,true)
})

test('unsupported modes and absent source presets remain disabled; filter selections do not grant execution',()=>{
  const m=new MemoryManager({configPath:'/unused'})
  const catalog=m.optionCatalog()
  assert.equal(catalog.fields.preset.find(o=>o.id==='builtin:worldbook-retrieve').available,false)
  const presets=page('preset',undefined,catalog)
  assert(presets.filter(n=>n.type==='input'&&n.props.type==='radio').every(n=>n.props.disabled))
  const rules=page('retrieve.rule',true,catalog)
  assert(rules.filter(n=>n.type==='input'&&n.props.type==='radio').every(n=>n.props.disabled))
})

test('local catalog metadata rejects every supplied nonmatching type before publishing and retains usable last-good state',async t=>{
 const base={schemaVersion:1,revision:1,presets:{},entries:[]}
 for(const field of ['modes','adapterIds','description'])for(const value of [false,0,'',null,{},[]]){
  const valid=field==='description'?typeof value==='string':Array.isArray(value)
  const doc={...base,catalog:{rules:[{id:'r',label:'R',value:true,[field]:value}]}}
  if(valid)assert.doesNotThrow(()=>validateDocument(doc));else assert.throws(()=>validateDocument(doc),{code:'INVALID_CONFIG'})
 }
 for(const value of [false,0,'',null,{}])assert.throws(()=>validateDocument({...base,catalog:{rules:value}}),{code:'INVALID_CONFIG'})
 const dir=await mkdtemp(join(tmpdir(),'dmm-review4-'));t.after(()=>rm(dir,{recursive:true,force:true}))
 const configPath=join(dir,'config.json');await writeFile(configPath,JSON.stringify(base))
 const m=await new MemoryManager({configPath}).init();t.after(()=>m.dispose())
 const lastGood=m.configuration.document
 await writeFile(configPath,JSON.stringify({...base,revision:2,catalog:{rules:[{id:'r',label:'R',value:true,modes:false}]}}))
 await assert.rejects(m.reload(),{code:'INVALID_CONFIG'});assert.equal(m.configuration.document.revision,1);assert.equal(m.configuration.document,lastGood);assert(m.configuration.error)
 assert.doesNotThrow(()=>m.optionCatalog())
 await assert.doesNotReject(()=>m.validateEntry({id:'x',adapterId:'a',entry:{id:'x',adapterId:'a'},expectedRevision:1}))
})

test('named type-specific combinations remain composable and all their referenced capabilities are gated',()=>{
 const {m,u}=setup();u.registerCondition({id:'n',types:['number'],test:()=>true});u.registerOperation({id:'op',types:['number'],run:()=>{}})
 m.configuration.document.catalog={rules:[{id:'nr',label:'Numeric combination',value:{all:['n',true]}}],strategies:[{id:'ns',label:'Numeric chain',value:[{operation:'op'}]}]}
 const catalog=m.optionCatalog({adapterId:'synthetic'})
 for(const [field,label] of [['retrieve.rule','Numeric combination'],['retrieve.strategy','Numeric chain']]){
  assert.equal(catalog.fields[field].find(o=>o.label===label).available,true)
  for(const type of ['text','number']){
   const card=page(field,undefined,catalog,()=>{},{effectiveType:type}).find(n=>n.type==='label'&&n.props.className==='dmm-option-card'&&JSON.stringify(n).includes(label))
   assert.equal(flatten(card).find(n=>n.type==='input').props.disabled,type==='text')
  }
 }
})

test('replacing a type-overriding preset evaluates the candidate against local type, not the previous preset',async()=>{
 const {m,u}=setup();u.registerCondition({id:'text-rule',types:['text'],test:()=>true});u.registerCondition({id:'number-rule',types:['number'],test:()=>true})
 m.configuration.document.presets={numeric:{type:'number'},textual:{type:'text'},textRule:{retrieve:{rule:'text-rule'}},numberRule:{retrieve:{rule:'number-rule'}}}
 const catalog=m.optionCatalog({adapterId:'synthetic'})
 for(const [localType,currentPreset] of [['text','numeric'],['number','textual']]){
  const nodes=page('preset',currentPreset,catalog,()=>{},{localType,effectiveType:effectiveDraftType({type:localType,preset:currentPreset},catalog.presets)})
  for(const [candidate,type] of [['textRule','text'],['numberRule','number']]){
   const card=nodes.find(n=>n.type==='label'&&n.props.className==='dmm-option-card'&&n.props.children.some(c=>c?.props?.children?.some(t=>t?.type==='strong'&&t.props.children[0]===candidate)))
   assert.equal(flatten(card).find(n=>n.type==='input').props.disabled,localType!==type)
   assert.equal((await check(m,{...entry(true),type:localType,preset:candidate})).valid,localType===type)
  }
 }
})
