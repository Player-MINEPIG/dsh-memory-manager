// Shared pure-data schema validation for server decisions and typed UI controls.
const types=new Set(['string','number','integer','boolean','object','array'])
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)
const error=message=>{throw Object.assign(new Error(message),{code:'INVALID_OPTION_SCHEMA'})}
export function validateParameterSchema(schema,depth=0,budget={nodes:0}){
 if(++budget.nodes>300)error('参数描述的字段总数超过上限。')
 if(!object(schema)||!types.has(schema.type)||depth>5)error('参数定义包含不支持的类型或过深嵌套。')
 const allowed=['type','label','description','default',...({object:['properties','required'],array:['items','minItems','maxItems'],string:['enum','minLength','maxLength'],number:['enum','minimum','maximum'],integer:['enum','minimum','maximum'],boolean:['enum']}[schema.type])]
 if(Object.keys(schema).some(k=>!allowed.includes(k)))error('参数定义包含未支持的属性。')
 for(const k of ['label','description'])if(schema[k]!==undefined&&(typeof schema[k]!=='string'||schema[k].length>2000))error('参数名称或说明过长。')
 if(schema.enum!==undefined&&(!Array.isArray(schema.enum)||!schema.enum.length||schema.enum.length>100||schema.enum.some(v=>(schema.type==='integer'?!Number.isInteger(v):typeof v!==schema.type)||typeof v==='number'&&!Number.isFinite(v)||typeof v==='string'&&v.length>10000)))error('参数选项与类型不一致。')
 if(schema.type==='object'){
  if(!object(schema.properties??{})||Object.keys(schema.properties??{}).length>30)error('参数对象字段无效。')
  for(const [key,value] of Object.entries(schema.properties??{})){if(!key||key.length>100||['__proto__','constructor','prototype'].includes(key))error('参数字段名不受支持。');validateParameterSchema(value,depth+1,budget)}
  if(schema.required!==undefined&&(!Array.isArray(schema.required)||new Set(schema.required).size!==schema.required.length||schema.required.some(k=>typeof k!=='string'||!Object.hasOwn(schema.properties??{},k))))error('必填参数必须有字段定义。')
 }
 if(schema.type==='array')validateParameterSchema(schema.items,depth+1,budget)
 for(const bound of ['minimum','maximum','minItems','maxItems','minLength','maxLength'])if(schema[bound]!==undefined&&(!Number.isFinite(schema[bound])||(/Items|Length/.test(bound)&&(!Number.isInteger(schema[bound])||schema[bound]<0||schema[bound]>(bound.endsWith('Items')?100:10000)))))error('参数边界无效或超过上限。')
 for(const [min,max] of [['minimum','maximum'],['minItems','maxItems'],['minLength','maxLength']])if(schema[min]!==undefined&&schema[max]!==undefined&&schema[min]>schema[max])error('参数最小值不得大于最大值。')
 if(defaultCost(schema)>1000)error('参数默认值展开超过 1000 项。')
 if(schema.default!==undefined&&JSON.stringify(schema.default).length>64000)error('参数默认值过大。')
 if(schema.default!==undefined&&parameterErrors(schema,schema.default).length)error('默认参数不符合定义。')
 return schema
}
export function parameterErrors(schema,value,path='参数'){
 if(value===undefined)return []
 const valid=schema.type==='object'?object(value):schema.type==='array'?Array.isArray(value):schema.type==='integer'?Number.isInteger(value):typeof value===schema.type
 if(!valid)return [`${path}的类型应为 ${schema.type}。`]
 const errors=[]
 if(schema.enum&&!schema.enum.includes(value))errors.push(`${path}不在可选范围中。`)
 if(['number','integer'].includes(schema.type)&&(!Number.isFinite(value)||(schema.minimum!==undefined&&value<schema.minimum)||(schema.maximum!==undefined&&value>schema.maximum)))errors.push(`${path}超出数值范围。`)
 if(schema.type==='string'&&(value.length<(schema.minLength??0)||value.length>(schema.maxLength??10000)))errors.push(`${path}的长度超出范围。`)
 if(schema.type==='object'){
  for(const key of schema.required??[])if(value[key]===undefined)errors.push(`${path}.${key}为必填项。`)
  for(const [key,v] of Object.entries(value))if(!Object.hasOwn(schema.properties??{},key))errors.push(`${path}.${key}没有参数定义。`);else errors.push(...parameterErrors(schema.properties[key],v,path+'.'+key))
 }
 if(schema.type==='array'){
  if(value.length<(schema.minItems??0)||value.length>(schema.maxItems??100))errors.push(`${path}的项目数超出范围。`)
  value.slice(0,101).forEach((v,i)=>errors.push(...parameterErrors(schema.items,v,`${path}[${i+1}]`)))
 }
 return errors
}
function defaultCost(schema){if(schema.default!==undefined)return JSON.stringify(schema.default).length;if(schema.type==='array')return 1+(schema.minItems??0)*defaultCost(schema.items);if(schema.type==='object')return 1+(schema.required??[]).reduce((n,k)=>n+defaultCost(schema.properties[k]),0);return 1}
export function parameterDefault(schema){
 if(schema.default!==undefined)return structuredClone(schema.default)
 if(schema.enum)return schema.enum[0]
 if(schema.type==='object')return Object.fromEntries((schema.required??[]).map(key=>[key,parameterDefault(schema.properties[key])]))
 if(schema.type==='array')return Array.from({length:schema.minItems??0},()=>parameterDefault(schema.items))
 return schema.type==='boolean'?false:['number','integer'].includes(schema.type)?Math.max(schema.minimum??-Infinity,Math.min(schema.maximum??Infinity,0)):''
}
