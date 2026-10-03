import { applies, fail } from '../config.js'
const modes={assistant_message_committed:'store',card_variable_update:'store',before_model_request:'retrieve'}
export function installMvu(manager,service,usage){
  if(service.protocolVersion!==1)throw new Error('Unsupported tavernMvu protocol')
  const bind=args=>({...args,scope:Object.keys(args.scope??{}).length?args.scope:{authority:'local'}})
  const adapter={id:'tavern.mvu',name:'Tavern MVU',authority:'local',strategyOwner:'source'}
  adapter.describeScope=scope=>scope.sessionId?'当前会话可见的 MVU 资源。':'本地权限范围内的 MVU 资源。'
  for(const method of ['list','read','update','copy','observe','validateConfig','setManagementMode'])if(service[method])adapter[method]=service[method].bind(service)
  if(service.setManagementMode)adapter.setManagementMode=async args=>{await service.setManagementMode(bind(args));return service.read(bind(args))}
  for(const method of ['list','read','update','copy'])if(service[method])adapter[method]=args=>service[method](bind(args))
  const stop=manager.registerAdapter(adapter)
  const uncondition=usage.registerCondition({id:'contains_mvu_update',test:event=>event.containsMvuUpdate===true})
  const uncause=usage.registerCondition({id:'mvu_card_write_cause',test:(event,params)=>{if(Object.keys(params).some(k=>k!=='cause')||!['user-interaction','interval','script'].includes(params.cause))fail('INVALID_CONDITION','Expected one supported MVU card write cause');return event.on==='card_variable_update'&&event.cause===params.cause}})
  let disposed=false
  const unuse=service.registerUsage(async request=>{
    if(disposed)return {enabled:false,reason:'manager-unloaded'}
    const document=manager.configuration.document,reloadEpoch=manager.configuration.pending,lifetime=manager.lifetimes.get(adapter),conditions=new Map(usage.conditions)
    const {config,revision}=manager.getConfig(request.id)
    if(request.managementMode==='managed'&&(!config||manager.configuration.error))return {enabled:false,reason:'config-unavailable'}
    if(!config||request.managementMode!=='managed')return undefined
    const mode=modes[request.on]
    if(!mode)return {enabled:false,reason:'unsupported-event'}
    await service.validateConfig(config)
    const behavior=config[mode]
    if(!applies(config,request.scope))return {enabled:false,reason:'scope'}
    if(!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(request.on))return {enabled:false,reason:'timing'}
    const enabled=await usage.rule(behavior.rule??true,{...request.event,on:request.on,scope:request.scope},conditions)
    if(disposed)return {enabled:false,reason:'manager-unloaded'}
    const checkCurrent=()=>!disposed&&!lifetime?.signal.aborted&&manager.adapters.get(adapter.id)===adapter&&manager.lifetimes.get(adapter)===lifetime&&!manager.configuration.error&&manager.configuration.document===document&&manager.configuration.document.revision===revision&&manager.configuration.pending===reloadEpoch&&conditions.size===usage.conditions.size&&[...conditions].every(([id,condition])=>usage.conditions.get(id)===condition)
    if(!checkCurrent())return {enabled:false,reason:'config-changed'}
    return {enabled,configRevision:revision,strategy:behavior.strategy,reason:enabled?'matched':'rule',checkCurrent}
  })
  return()=>{disposed=true;unuse();uncondition();uncause();stop()}
}
