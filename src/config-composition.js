import {presetDefinitions} from './builtin-presets.js'
const clone=value=>structuredClone(value)
export const sourceFields=['type','whitelist','blacklist','store.on','store.rule','store.strategy','retrieve.on','retrieve.rule','retrieve.strategy']
export function composeConfiguration(doc,id,sourceDefault=null) {
  const local=doc.entries.find(e=>e.id===id)
  if (!local&&!sourceDefault) return {config:null,origins:{},revision:doc.revision}
  const config={whitelist:[],blacklist:[],preset:null},origins={whitelist:'default',blacklist:'default',preset:'default'}
  for(const [values,origin] of [[sourceDefault,'source-default'],[local,'local']])for(const [key,value] of Object.entries(values??{})){
    if(['store','retrieve'].includes(key)){
      if(origin==='local'&&!Object.keys(value).length){
        config[key]={}
        for(const field of Object.keys(origins))if(field.startsWith(key+'.'))delete origins[field]
      }else config[key]={...config[key],...clone(value)}
      for(const child of Object.keys(value))origins[`${key}.${child}`]=origin
    }else config[key]=clone(value)
    origins[key]=origin
  }
  const preset=local?.preset==null?null:presetDefinitions(doc)[local.preset]
  for (const [k,v] of Object.entries(preset??{})) {
    if (['store','retrieve'].includes(k)) { config[k]={...config[k],...clone(v)}; for(const child of Object.keys(v)) origins[`${k}.${child}`]=`preset:${local.preset}` }
    else {config[k]=clone(v);origins[k]=`preset:${local.preset}`}
  }
  for(const field of local?.followSource??[]){
    const [key,child]=field.split('.'),value=child?sourceDefault?.[key]?.[child]:sourceDefault?.[key]
    if(child){
      if(value===undefined){if(config[key])delete config[key][child]}
      else (config[key]??={})[child]=clone(value)
    }else config[key]=value===undefined?(key==='type'?undefined:[]):clone(value)
    if(config.type===undefined)delete config.type
    origins[field]=sourceDefault?'source-default':'default'
  }
  return {config,origins,revision:doc.revision}
}
