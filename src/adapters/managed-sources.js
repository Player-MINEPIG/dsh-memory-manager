import {nativeDependencyLease} from './native-dependency.js'
import {capabilityErrors} from '../capabilities.js'
import {applies,clone} from '../config.js'
export function installManagedSources(manager,service,usage){
 if(service.protocolVersion!==1||!Array.isArray(service.adapters))throw Error('Unsupported Tavern memory source protocol')
 const disposers=[]
 try{
  for(const adapter of service.adapters){
   if(adapter.strategyOwner!=='source'||typeof adapter.registerUsage!=='function'||typeof adapter.validateConfig!=='function')throw Error('Managed source requires source-owned strategy and usage validation')
   const stop=manager.registerAdapter(adapter);disposers.push(stop)
   let disposed=false
   const unuse=adapter.registerUsage(async request=>{
    if(disposed)return {enabled:false,reason:'manager-unloaded'}
    if(!manager.isAdapterEnabled(adapter.id))return {enabled:false,reason:'adapter-disabled'}
    const native=nativeDependencyLease(manager,adapter,request,()=>disposed);if(native)return native
    if(request.managementMode!=='managed')return undefined
    const document=manager.configuration.document,epoch=manager.configuration.pending,lifetime=manager.lifetimes.get(adapter),conditions=new Map(usage.conditions),catalogRevision=manager.optionCatalog({adapterId:adapter.id}).catalogRevision
    const {config,revision}=manager.getConfig(request.id)
    if(!config||config.adapterId!==adapter.id||manager.configuration.error)return {enabled:false,reason:'config-unavailable'}
    const mode=adapter.optionCatalog?.events?.find(event=>event.id===request.on)?.mode
    if(!mode)return {enabled:false,reason:'unsupported-event'}
    manager.assertOwner(adapter,request.id)
    if(capabilityErrors(adapter,config,conditions,usage.operations).length)return {enabled:false,reason:'capability-mismatch'}
    await adapter.validateConfig(clone(config))
    const scopeLease=await manager.scopeDirectory.context(request.scope??{},{trustedSource:true})
    if(!applies(config,scopeLease.scope))return {enabled:false,reason:'scope'}
    const behavior=config[mode]
    if(!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(request.on))return {enabled:false,reason:'timing'}
    const enabled=await usage.rule(behavior.rule??true,{...request.event,on:request.on,scope:scopeLease.scope},conditions)
    const owns=()=>{try{manager.assertOwner(adapter,request.id);return true}catch{return false}}
    const checkCurrent=()=>scopeLease.checkCurrent()&&manager.isAdapterEnabled(adapter.id)&&owns()&&manager.optionCatalog({adapterId:adapter.id}).catalogRevision===catalogRevision&&!disposed&&!lifetime.signal.aborted&&manager.adapters.get(adapter.id)===adapter&&manager.lifetimes.get(adapter)===lifetime&&!manager.configuration.error&&manager.configuration.document===document&&manager.configuration.pending===epoch&&conditions.size===usage.conditions.size&&[...conditions].every(([key,value])=>usage.conditions.get(key)===value)
    if(!checkCurrent())return {enabled:false,reason:'config-changed'}
    return {enabled,reason:enabled?'matched':'rule',configRevision:revision,strategy:behavior.strategy,checkCurrent}
   })
   disposers.push(()=>{disposed=true;unuse()})
  }
  manager.boundMemorySource=service
  disposers.push(()=>{if(manager.boundMemorySource===service)manager.boundMemorySource=undefined})
 }catch(error){for(const stop of disposers.reverse())stop();throw error}
 return ()=>{for(const stop of disposers.reverse())stop()}
}
