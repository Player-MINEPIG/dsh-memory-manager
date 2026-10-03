export const fieldLabels={id:'资源 ID',type:'类型',preset:'预设',whitelist:'白名单',blacklist:'黑名单','store.on':'存储 · 时机 on','store.rule':'存储 · 条件 rule','store.strategy':'存储 · 策略 strategy','retrieve.on':'读取 · 时机 on','retrieve.rule':'读取 · 条件 rule','retrieve.strategy':'读取 · 策略 strategy'}
const fields=Object.keys(fieldLabels).filter(k=>k!=='id')
const jsonFields=fields.filter(k=>!['type','preset'].includes(k))
const stringify=value=>value===undefined?'':JSON.stringify(value,null,2)
const at=(object,path)=>path.split('.').reduce((v,key)=>v?.[key],object)
export function formFrom(local){const form={__presetPresent:Object.hasOwn(local??{},'preset'),__storePresent:Object.hasOwn(local??{},'store'),__retrievePresent:Object.hasOwn(local??{},'retrieve')};for(const field of fields)form[field]=['type','preset'].includes(field)?at(local,field)??'':stringify(at(local,field));return form}
export function entryFrom(form,row){const entry={id:row.id,adapterId:row.adapterId};for(const mode of ['store','retrieve'])if(form['__'+mode+'Present'])entry[mode]={};for(const field of fields){const value=form[field];if(field==='preset'){if(value||form.__presetPresent)entry.preset=value||null;continue}if(value==='')continue;let parsed;try{parsed=jsonFields.includes(field)?JSON.parse(value):value}catch{throw Error(`${fieldLabels[field]}不是有效 JSON。`)}const [key,child]=field.split('.');if(child)(entry[key]??={})[child]=parsed;else entry[key]=parsed}return entry}
export function importEntry(raw,row){
 const entry=JSON.parse(raw)
 if(!entry||typeof entry!=='object'||Array.isArray(entry)||entry.id!==row.id||entry.adapterId!==row.adapterId)throw Error('JSON 必须保留本资源 ID 和提供方。')
 if(Object.keys(entry).some(k=>!['id','adapterId','type','preset','whitelist','blacklist','store','retrieve'].includes(k)))throw Error('JSON 含不支持的顶层字段。')
 if('type' in entry&&(typeof entry.type!=='string'||!entry.type))throw Error('type 必须是非空文本。')
 if('preset' in entry&&entry.preset!==null&&(typeof entry.preset!=='string'||!entry.preset))throw Error('preset 必须是非空文本或 null。')
 for(const mode of ['store','retrieve'])if(mode in entry){const value=entry[mode];if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['on','rule','strategy'].includes(k)))throw Error(`${mode} 必须是仅含 on、rule、strategy 的对象。`)}
 return formFrom(entry)
}

export function fieldOrigin(config,origins,field){return at(config,field)===undefined?undefined:origins[field]}
