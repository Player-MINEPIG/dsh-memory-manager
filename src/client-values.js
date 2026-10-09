import {composeConfiguration} from './config-composition.js'
import {entryFrom} from './client-form.js'
import {describeValue} from './client-options.js'
const at=(object,path)=>path.split('.').reduce((v,key)=>v?.[key],object)
export function draftConfiguration(form,row,snapshot){
 const entry=entryFrom(form,row),source=snapshot.sourceDefault?.available&&entry.adapterId===row.adapterId?{id:row.id,adapterId:row.adapterId,...snapshot.sourceDefault.configuration}:null
 const composed=composeConfiguration({revision:snapshot.revision,entries:[entry],presets:snapshot.presets??{}},row.id,source)
 return {...composed,scopePolicy:source&&['default','source-default'].includes(composed.origins.whitelist)?'source-bound':'whitelist'}
}
export function followsSource(form,field,origins){
 if(field==='adapterId')return form.adapterId===form.__base.sourceAdapterId||!form.__base.sourceAdapterId&&form.adapterId===form.__base.adapterId
 if(field==='preset')return !form.__presetPresent
 return form.__base.followSource?.includes(field)||!['local'].includes(origins[field])&&!origins[field]?.startsWith('preset:')&&!(['store','retrieve'].includes(field.split('.')[0])&&form['__'+field.split('.')[0]+'Present']&&['on','rule','strategy'].every(part=>form[field.split('.')[0]+'.'+part]===''))
}
export function fieldDescription(value,field,{row,catalog,scopePolicy,source=false}={}){
 if(field==='whitelist'&&scopePolicy==='source-bound')return '跟随来源的当前绑定范围'
 if(value!==undefined)return describeValue(value,field,catalog)
 if(field==='adapterId')return describeValue(row.adapterId,field,catalog)
 if(field==='type')return row.type===undefined?'来源未声明类型':describeValue(row.type,field,catalog)
 if(field==='preset')return '不引用预设'
 if(field==='blacklist')return '不额外排除范围'
 if(field==='whitelist')return source?'由来源确认绑定与权限':'空白名单，不适用任何范围'
 const mode=field.split('.')[0]
 if(!source&&['store','retrieve'].includes(mode)&&row.config?.[mode]&&Object.keys(row.config[mode]).length===0)return mode==='store'?'未启用额外托管存储；内容仍由来源保存':'未启用托管读取'
 if(row.missing)return '来源不可用，当前行为未确认'
 if(field.startsWith('store.')&&['dsh.skills','tavern.world-books','tavern.prompt-templates'].includes(row.adapterId))return ({'store.on':'固定资源变动时','store.rule':'遵循来源的保存与权限规则','store.strategy':'由来源保存，内容随固定资源变动'})[field]
 if(field.startsWith('store.')&&row.adapterId==='tavern.mvu')return '由来源维护状态；原生卡片写入遵循绑定与权限'
 if(field.startsWith('retrieve.')&&row.adapterId==='dsh.skills')return ({'retrieve.on':'DSH 调用技能时','retrieve.rule':'由 DSH 技能可见性与调用规则决定','retrieve.strategy':'从技能来源读取当前正文'})[field]
 return field.startsWith('store.')?'由来源维护；未启用额外托管存储':field.startsWith('retrieve.')?'未启用额外托管读取':'来源未声明默认值'
}
export function behaviorSummary(row,mode){
 const behavior=row.config?.[mode]
 if(!behavior?.on&&!behavior?.strategy)return fieldDescription(undefined,mode+'.strategy',{row})
 return [fieldDescription(behavior.on,mode+'.on',{row}),fieldDescription(behavior.strategy,mode+'.strategy',{row})].join(' · ')
}
