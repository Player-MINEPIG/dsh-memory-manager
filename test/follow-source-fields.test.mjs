import test from 'node:test'
import assert from 'node:assert/strict'
import {effective,validateDocument} from '../src/config.js'
import {formFrom,entryFrom,followField} from '../src/client-form.js'
import {draftConfiguration,fieldDescription} from '../src/client-values.js'
import {MemoryManager} from '../src/manager.js'
import {Usage} from '../src/usage.js'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const row={id:'own',adapterId:'own-source',type:'text'},defaults={...row,retrieve:{on:'request',rule:true,strategy:'read'}}
const doc={schemaVersion:1,revision:1,entries:[{...row,preset:'p',retrieve:{rule:false}}],presets:{p:{retrieve:{rule:false},blacklist:[{sessionId:'blocked'}]}}}
test('per-field following overrides only that preset field and tracks subsequent source changes',()=>{
 const original=structuredClone(doc),form=followField(formFrom(doc.entries[0]),'retrieve.rule',true)
 const entry=entryFrom(form,row),draft={...doc,entries:[entry]},result=effective(draft,row.id,defaults)
 assert.equal(result.config.retrieve.rule,true);assert.equal(result.origins['retrieve.rule'],'source-default');assert.deepEqual(result.config.blacklist,doc.presets.p.blacklist)
 assert.equal(effective(draft,row.id,{...defaults,retrieve:{...defaults.retrieve,rule:false}}).config.retrieve.rule,false)
 assert.equal(entry.retrieve,undefined);assert.deepEqual(doc,original)
 assert.equal(effective({...draft,entries:[entryFrom(followField(form,'retrieve.rule',false,false),row)]},row.id,defaults).origins['retrieve.rule'],'preset:p')
})
test('current-value draft includes untouched defaults and explains native fixed-resource storage',()=>{
 const snapshot={revision:1,local:null,sourceDefault:{available:true,configuration:defaults},presets:{}}
 const draft=draftConfiguration(formFrom(null),row,snapshot);assert.equal(draft.config.type,'text');assert.equal(draft.config.retrieve.rule,true);assert.equal(draft.scopePolicy,'source-bound')
 for(const adapterId of ['dsh.skills','tavern.world-books','tavern.prompt-templates'])assert.match(fieldDescription(undefined,'store.strategy',{row:{...row,adapterId}}),/固定资源变动/)
 assert.equal(fieldDescription(undefined,'retrieve.on',{row:{...row,config:{retrieve:{}}}}),'未启用托管读取')
 for(const followSource of [['content'],['adapterId'],['retrieve.rule','retrieve.rule']])assert.throws(()=>validateDocument({...doc,entries:[{...row,followSource}]}),{code:'INVALID_CONFIG'})
})
test('saving and reloading a followed scope retains source binding, CAS and live default composition',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'dmm-follow-source-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'config.json');await writeFile(path,JSON.stringify({...doc,entries:[]}))
 const m=await new MemoryManager({configPath:path}).init();t.after(()=>m.dispose());const usage=new Usage(m);usage.registerOperation({id:'read',readOnly:true,run:()=>''})
 let revision='r1',rule=true
 m.registerAdapter({id:row.adapterId,authority:'fixture',list:()=>[],read:()=>null,validateConfig:()=>{},getManagementDefaults:()=>({protocolVersion:1,revision,scopePolicy:'source-bound',configuration:{type:'text',retrieve:{on:'request',rule,strategy:'read'}},checkCurrent:()=>true})})
 const entry={...row,preset:'p',followSource:['retrieve.rule','whitelist']}
 const saved=await m.saveEntry({id:row.id,adapterId:row.adapterId,entry,expectedRevision:1});assert.equal(saved.config.retrieve.rule,true);assert.equal(saved.scopePolicy,'source-bound');assert.deepEqual(saved.config.whitelist,[])
 assert.deepEqual(JSON.parse(await readFile(path,'utf8')).entries[0].followSource,entry.followSource)
 revision='r2';rule=false;await m.reload();assert.equal(m.getConfig(row.id).config.retrieve.rule,false)
})
