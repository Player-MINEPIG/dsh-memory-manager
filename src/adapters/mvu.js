import { applies } from '../config.js'
export function installMvu(manager,service,usage){
  if(service.protocolVersion!==1)throw new Error('Unsupported tavernMvu protocol')
  const bind=args=>({...args,scope:Object.keys(args.scope??{}).length?args.scope:{authority:'local'}})
  const adapter={id:'tavern.mvu',name:'Tavern MVU',authority:'local'}
  for(const method of ['list','read','update','copy','observe','validateConfig','setManagementMode'])if(service[method])adapter[method]=service[method].bind(service)
  if(service.setManagementMode)adapter.setManagementMode=async args=>{await service.setManagementMode(bind(args));return service.read(bind(args))}
  for(const method of ['list','read','update','copy'])if(service[method])adapter[method]=args=>service[method](bind(args))
  const stop=manager.registerAdapter(adapter)
  const uncondition=usage.registerCondition({id:'contains_mvu_update',test:event=>event.containsMvuUpdate===true})
  const unuse=service.registerUsage(async request=>{
    const {config,revision}=manager.getConfig(request.id)
    if(request.managementMode==='managed'&&(!config||manager.configuration.error))return {enabled:false,reason:'config-unavailable'}
    if(!config||request.managementMode!=='managed')return undefined
    await service.validateConfig(config)
    const mode=request.on==='assistant_message_committed'?'store':'retrieve',behavior=config[mode]
    if(!applies(config,request.scope))return {enabled:false,reason:'scope'}
    if(!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(request.on))return {enabled:false,reason:'timing'}
    const enabled=await usage.rule(behavior.rule??true,request.event??{})
    return {enabled,configRevision:revision,strategy:behavior.strategy,reason:enabled?'matched':'rule'}
  })
  return()=>{unuse();uncondition();stop()}
}
