const reasons={SOURCE_DEFAULTS_UNSUPPORTED:'来源版本未提供默认规则接口',SOURCE_DEFAULTS_UNAVAILABLE:'来源没有确认该资源与范围的默认规则',SOURCE_UNAVAILABLE:'来源未注册',SOURCE_DISABLED:'来源已停用',SOURCE_DEFAULTS_CHANGED:'来源默认规则或绑定已变化',INVALID_SOURCE_DEFAULTS:'来源默认规则合同无效'}
export function managementStatus(row,{loading=false}={}){
 if(loading)return '当前托管：加载中…'
 if(row.missing||row.sourceAvailable===false)return '当前托管：来源不可用，管理方未确认'
 const owner=row.managementMode==='managed'?'记忆管理':row.managementMode==='native'?(row.adapterId?.startsWith('tavern.')?'Tavern':'来源'):'来源未确认管理方'
 const prefix=`当前托管：${owner}`
 if(row.configError)return `${prefix} · 管理配置错误，委托决策被阻止（${row.configError.code}）`
 if(row.sourceDefault?.available){
  const overridden=Object.entries(row.origins??{}).some(([field,origin])=>(['type','preset','whitelist','blacklist'].includes(field)||/^(store|retrieve)\.(on|rule|strategy)$/.test(field))&&(origin==='local'||origin?.startsWith('preset:')))||['store','retrieve'].some(mode=>row.origins?.[mode]==='local'&&row.config?.[mode]&&Object.keys(row.config[mode]).length===0)
  return `${prefix} · ${overridden?'来源默认 + 本地 / 预设覆盖':'来源默认规则'}`
 }
 if(!row.sourceDefault)return `${prefix} · 管理规则加载中…`
 const reason=row.sourceDefault.message??reasons[row.sourceDefault.reason]??row.sourceDefault.reason??'来源默认规则不可用'
 return `${prefix} · ${row.config?'本地规则；':'缺少有效管理配置；'}${reason}`
}
