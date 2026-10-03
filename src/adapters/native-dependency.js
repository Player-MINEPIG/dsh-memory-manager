import {clone} from '../config.js'

// A native dependency keeps source authority. This is an explicit, revocable
// acknowledgement for the new dependency API, not a managed-policy grant.
export function nativeDependencyLease(manager,adapter,request,isDisposed){
 if(request.managementMode!=='native'||request.event?.usage!=='prompt-template-dependency')return undefined
 if(request.on!=='before_model_request')return {enabled:false,reason:'unsupported-dependency-event'}
 const strategies=adapter.optionCatalog?.strategies?.filter(s=>s.mode==='retrieve'&&s.events.includes(request.on))??[]
 if(adapter.optionCatalog?.modes?.retrieve?.supported!==true||strategies.length!==1)return {enabled:false,reason:'native-dependency-strategy-unavailable'}
 const document=manager.configuration.document,epoch=manager.configuration.pending,error=manager.configuration.error,lifetime=manager.lifetimes.get(adapter),catalogRevision=manager.optionCatalog({adapterId:adapter.id}).catalogRevision
 const checkCurrent=()=>{
  try{
   manager.assertOwner(adapter,request.id)
   return manager.isAdapterEnabled(adapter.id)&&!isDisposed()&&!!lifetime&&!lifetime.signal.aborted&&manager.adapters.get(adapter.id)===adapter&&manager.lifetimes.get(adapter)===lifetime&&manager.configuration.document===document&&manager.configuration.pending===epoch&&manager.configuration.error===error&&manager.optionCatalog({adapterId:adapter.id}).catalogRevision===catalogRevision
  }catch{return false}
 }
 return {enabled:checkCurrent(),reason:'native-dependency',configRevision:null,strategy:clone(strategies[0].value),checkCurrent}
}
