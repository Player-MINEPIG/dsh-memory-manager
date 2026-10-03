import {nativeDependencyLease} from './native-dependency.js'
import {capabilityErrors} from '../capabilities.js'
import {builtinPresets} from '../builtin-presets.js'
import { applies, fail } from '../config.js'
const modes={assistant_message_committed:'store',card_variable_update:'store',before_model_request:'retrieve'}
export function installMvu(manager,service,usage){
  if(service.protocolVersion!==1)throw new Error('Unsupported tavernMvu protocol')
  const bind=args=>({...args,scope:Object.keys(args.scope??{}).length?args.scope:{authority:'local'}})
  const adapter={id:'tavern.mvu',name:'Tavern MVU',authority:'local',strategyOwner:'source'}
  adapter.optionCatalog={version:1,types:[{id:'mvu-state',label:'MVU 状态'}],events:[{id:'assistant_message_committed',label:'助手消息提交后',mode:'store'},{id:'card_variable_update',label:'卡片变量更新',mode:'store'},{id:'before_model_request',label:'模型请求前',mode:'retrieve'}],strategies:[{id:'mvu.update',label:'解析、验证并应用更新',mode:'store',events:['assistant_message_committed'],value:builtinPresets['builtin:mvu-managed'].configuration.store.strategy},{id:'mvu.card',label:'验证并应用卡片更新',mode:'store',events:['card_variable_update'],value:builtinPresets['builtin:mvu-card-interaction'].configuration.store.strategy},{id:'mvu.provide',label:'读取状态、渲染指令并输出',mode:'retrieve',events:['before_model_request'],value:builtinPresets['builtin:mvu-managed'].configuration.retrieve.strategy}],modes:{store:{supported:true,onSelection:'single',strategySelection:'fixed'},retrieve:{supported:true,onSelection:'single',strategySelection:'fixed'}}}
  adapter.describeScope=scope=>scope.sessionId?'当前会话可见的 MVU 资源。':'本地权限范围内的 MVU 资源。'
  for(const method of ['list','read','update','copy','observe','validateConfig','setManagementMode'])if(service[method])adapter[method]=service[method].bind(service)
  if(service.setManagementMode)adapter.setManagementMode=async args=>{await service.setManagementMode(bind(args));return service.read(bind(args))}
  for(const method of ['list','read','update','copy'])if(service[method])adapter[method]=args=>service[method](bind(args))
  const stop=manager.registerAdapter(adapter)
  const uncondition=usage.registerCondition({id:'contains_mvu_update',label:'包含 MVU 更新',adapterIds:['tavern.mvu'],parameters:{type:'object',properties:{}},test:event=>event.containsMvuUpdate===true})
  const uncause=usage.registerCondition({id:'mvu_card_write_cause',label:'卡片更新原因',adapterIds:['tavern.mvu'],parameters:{type:'object',properties:{cause:{type:'string',label:'触发原因',enum:['user-interaction','interval','script']}},required:['cause']},test:(event,params)=>{if(Object.keys(params).some(k=>k!=='cause')||!['user-interaction','interval','script'].includes(params.cause))fail('INVALID_CONDITION','Expected one supported MVU card write cause');return event.on==='card_variable_update'&&event.cause===params.cause}})
  let disposed=false
  const unuse=service.registerUsage(async request=>{
    if(disposed)return {enabled:false,reason:'manager-unloaded'}
    if(!manager.isAdapterEnabled(adapter.id))return {enabled:false,reason:'adapter-disabled'}
    const native=nativeDependencyLease(manager,adapter,request,()=>disposed);if(native)return native
    const document=manager.configuration.document,reloadEpoch=manager.configuration.pending,lifetime=manager.lifetimes.get(adapter),conditions=new Map(usage.conditions),catalogRevision=manager.optionCatalog({adapterId:adapter.id}).catalogRevision
    const {config,revision}=manager.getConfig(request.id)
    if(request.managementMode==='managed'&&(!config||manager.configuration.error))return {enabled:false,reason:'config-unavailable'}
    if(!config||request.managementMode!=='managed')return undefined
    const mode=modes[request.on]
    if(!mode)return {enabled:false,reason:'unsupported-event'}
    if(config.adapterId!==adapter.id)return {enabled:false,reason:'config-unavailable'}
    manager.assertOwner(adapter,request.id)
    if(capabilityErrors(adapter,config,conditions,usage.operations).length)return {enabled:false,reason:'capability-mismatch'}
    await service.validateConfig(config)
    const behavior=config[mode]
    const scopeLease=await manager.scopeDirectory.context(request.scope??{},{trustedSource:true})
    if(!applies(config,scopeLease.scope))return {enabled:false,reason:'scope'}
    if(!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(request.on))return {enabled:false,reason:'timing'}
    const enabled=await usage.rule(behavior.rule??true,{...request.event,on:request.on,scope:scopeLease.scope},conditions)
    if(disposed)return {enabled:false,reason:'manager-unloaded'}
    const owns=()=>{try{manager.assertOwner(adapter,request.id);return true}catch{return false}}
    const checkCurrent=()=>scopeLease.checkCurrent()&&manager.isAdapterEnabled(adapter.id)&&owns()&&manager.optionCatalog({adapterId:adapter.id}).catalogRevision===catalogRevision&&!disposed&&!lifetime?.signal.aborted&&manager.adapters.get(adapter.id)===adapter&&manager.lifetimes.get(adapter)===lifetime&&!manager.configuration.error&&manager.configuration.document===document&&manager.configuration.document.revision===revision&&manager.configuration.pending===reloadEpoch&&conditions.size===usage.conditions.size&&[...conditions].every(([id,condition])=>usage.conditions.get(id)===condition)
    if(!checkCurrent())return {enabled:false,reason:'config-changed'}
    return {enabled,configRevision:revision,strategy:behavior.strategy,reason:enabled?'matched':'rule',checkCurrent}
  })
  return()=>{disposed=true;unuse();uncondition();uncause();stop()}
}
