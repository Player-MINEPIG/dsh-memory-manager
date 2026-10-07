import test from 'node:test'
import assert from 'node:assert/strict'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {installMvu} from '../src/adapters/mvu.js'

test('current MVU catalog only offers model policies while native card receipts stay observable',async()=>{
 const manager=new MemoryManager({configPath:'/unused'}),usage=new Usage(manager)
 let observe
 const stop=installMvu(manager,{protocolVersion:1,list:()=>[],read:()=>null,registerUsage:()=>()=>{},observe:fn=>{observe=fn;return()=>{}},validateConfig:()=>{}},usage)
 try{
  const catalog=manager.optionCatalog({adapterId:'tavern.mvu'})
  assert.deepEqual(catalog.fields['store.on'].map(o=>o.value),['assistant_message_committed'])
  assert(!catalog.conditions.some(c=>c.id==='mvu_card_write_cause'))
  assert(!manager.presetLibrary().some(p=>p.id==='builtin:mvu-card-interaction'))
  const bundle={format:'dsh-memory-manager-presets',version:1,presets:[{id:'unsupported-native',label:'Unsupported',adapterIds:['tavern.mvu'],configuration:{store:{on:'card_variable_update',rule:true,strategy:[{operation:'validate_card_update'},{operation:'apply_card_update'}]}}}]}
  await assert.rejects(manager.validatePresets(bundle),{code:'INVALID_PRESET'})
  observe({id:'mvu:1',eventId:'native',phase:'applied',on:'card_variable_update',detail:'state-committed',configRevision:null})
  assert.equal(manager.traces[0].configRevision,null)
  assert.equal(manager.traces[0].on,'card_variable_update')
 }finally{stop();await manager.dispose()}
})
