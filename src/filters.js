import {fail} from './config.js'
export const configurationFilterFields=['id','type','preset','whitelist','blacklist','store.on','store.rule','store.strategy','retrieve.on','retrieve.rule','retrieve.strategy']
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
 return JSON.stringify(value)
}
export function filterValues(row,field){
 const value=field==='id'?row.id:field==='type'?(row.config?.type??row.type):field.split('.').reduce((v,k)=>v?.[k],row.config)
 if(value===undefined||value===null)return []
 const values=field.endsWith('.on')&&Array.isArray(value)&&value.length?value:[value]
 return values.map(v=>typeof v==='string'&&!['whitelist','blacklist','store.rule','store.strategy','retrieve.rule','retrieve.strategy'].includes(field)?v:canonical(v))
}
export function validateFilters(filters={}){
 if(!filters||typeof filters!=='object'||Array.isArray(filters))fail('INVALID_FILTER','字段筛选必须是对象。')
 for(const [field,filter] of Object.entries(filters)){
  if(!configurationFilterFields.includes(field)||!filter||!['exact','contains'].includes(filter.mode)||!Array.isArray(filter.values)||filter.values.length>100||filter.values.some(v=>typeof v!=='string'||!v||v.length>16000)||('missing' in filter&&typeof filter.missing!=='boolean'))fail('INVALID_FILTER',`不支持的字段筛选：${field}`)
 }
 return filters
}
export function matchesConfigurationFilters(row,filters){
 return Object.entries(filters).every(([field,f])=>{
  if(!f.values.length&&!f.missing)return true
  const values=filterValues(row,field)
  return (f.missing&&!values.length)||values.some(v=>f.values.some(term=>f.mode==='exact'?v===term:v.includes(term)))
 })
}
