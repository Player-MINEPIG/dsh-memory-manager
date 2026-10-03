export const fieldLabels={adapterId:'规则路由 adapter',id:'资源 ID',type:'类型',preset:'预设',whitelist:'白名单',blacklist:'黑名单','store.on':'存储 · 时机 on','store.rule':'存储 · 条件 rule','store.strategy':'存储 · 策略 strategy','retrieve.on':'读取 · 时机 on','retrieve.rule':'读取 · 条件 rule','retrieve.strategy':'读取 · 策略 strategy'}
const fields=Object.keys(fieldLabels).filter(k=>!['id','adapterId'].includes(k))
const jsonFields=fields.filter(k=>!['type','preset'].includes(k))
const stringify=value=>value===undefined?'':JSON.stringify(value,null,2)
const at=(object,path)=>path.split('.').reduce((v,key)=>v?.[key],object)
export function formFrom(local){const form={__base:structuredClone(local??{}),adapterId:local?.adapterId??'',__presetPresent:Object.hasOwn(local??{},'preset'),__storePresent:Object.hasOwn(local??{},'store'),__retrievePresent:Object.hasOwn(local??{},'retrieve')};for(const field of fields)form[field]=['type','preset'].includes(field)?at(local,field)??'':stringify(at(local,field));return form}
export function entryFrom(form,row){const entry={...structuredClone(form.__base??{}),id:row.id,adapterId:form.adapterId||row.adapterId};if(entry.adapterId!==row.adapterId)entry.sourceAdapterId=row.adapterId;else delete entry.sourceAdapterId;for(const field of fields)if(!field.includes('.'))delete entry[field];for(const mode of ['store','retrieve']){const extra=Object.fromEntries(Object.entries(entry[mode]??{}).filter(([k])=>!['on','rule','strategy'].includes(k)));delete entry[mode];if(form['__'+mode+'Present']||Object.keys(extra).length)entry[mode]=extra;}for(const field of fields){const value=form[field];if(field==='preset'){if(value||form.__presetPresent)entry.preset=value||null;continue}if(value==='')continue;let parsed;try{parsed=jsonFields.includes(field)?JSON.parse(value):value}catch{throw Error(`${fieldLabels[field]}不是有效 JSON。`)}const [key,child]=field.split('.');if(child)(entry[key]??={})[child]=parsed;else entry[key]=parsed}return entry}
export function importEntry(raw,row){
 const entry=JSON.parse(raw)
 if(!entry||typeof entry!=='object'||Array.isArray(entry)||entry.id!==row.id||(entry.sourceAdapterId??entry.adapterId)!==row.adapterId)throw Error('JSON 必须保留本资源 ID 和提供方。')
 if(Object.hasOwn(entry,'content'))throw Error('正文不属于管理规则配置。')
 if('type' in entry&&(typeof entry.type!=='string'||!entry.type))throw Error('type 必须是非空文本。')
 if('preset' in entry&&entry.preset!==null&&(typeof entry.preset!=='string'||!entry.preset))throw Error('preset 必须是非空文本或 null。')
 for(const mode of ['store','retrieve'])if(mode in entry){const value=entry[mode];if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${mode} 必须是仅含 on、rule、strategy 的对象。`)}
 return formFrom(entry)
}

export function fieldOrigin(config,origins,field){return at(config,field)===undefined?undefined:origins[field]}

// Removing a section is distinct from deliberately keeping an empty object.
export function removeModeFrom(form,mode){
 if(!['store','retrieve'].includes(mode))throw Error('Unknown configuration mode')
 return {...form,['__'+mode+'Present']:false,...Object.fromEntries(['on','rule','strategy'].map(child=>[mode+'.'+child,'']))}
}
export function effectiveDraftType(form,presets=[]){
 const preset=presets.find(p=>p.id===form.preset)?.configuration
 return preset&&Object.hasOwn(preset,'type')?preset.type:form.type||undefined
}
