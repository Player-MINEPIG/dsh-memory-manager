import {capabilityErrors} from './capabilities.js'
import {parameterErrors} from './option-schema.js'
import {normalizeRegistration} from './option-catalog.js'
import {createHash} from 'node:crypto'
import { applies,clone,fail } from './config.js'
export class Usage {
  conditions=new Map();operations=new Map();running=new Set()
  constructor(manager){this.manager=manager;manager.usage=this}
  registerCondition({id,test,...metadata}){if(typeof test!=='function')fail('INVALID_CONDITION',id);const registration=(...args)=>test(...args);registration.option=normalizeRegistration(id,metadata);return this.register(this.conditions,id,registration)}
  registerOperation({id,run,readOnly=false,version=1,...metadata}){if(typeof run!=='function')fail('INVALID_OPERATION',id);return this.register(this.operations,id,{run,readOnly,version,option:normalizeRegistration(id,metadata)})}
  register(map,id,value){if(!id||map.has(id))fail('DUPLICATE_REGISTRATION',`Duplicate registration: ${id}`);map.set(id,value);this.manager.catalogGeneration++;return()=>{if(map.get(id)===value){map.delete(id);this.manager.catalogGeneration++}}}
  async rule(rule,event,conditions=new Map(this.conditions),checkCurrent=()=>true){
    const assertCurrent=()=>{if(!checkCurrent())fail('CAPABILITY_CHANGED','配置、来源或能力注册已变化。')};assertCurrent()
    if(typeof rule==='boolean')return rule
    if(typeof rule==='string'){const fn=conditions.get(rule);if(!fn)fail('CONDITION_UNAVAILABLE',rule);this.checkParameters(fn.option,{});const result=!!await fn(clone(event),{});assertCurrent();return result}
    if(rule.all){for(const r of rule.all)if(!await this.rule(r,event,conditions,checkCurrent))return false;return true}
    if(rule.any){for(const r of rule.any)if(await this.rule(r,event,conditions,checkCurrent))return true;return false}
    if('not' in rule)return !await this.rule(rule.not,event,conditions,checkCurrent)
    if(rule.at_least){let n=0;for(const r of rule.at_least.conditions)if(await this.rule(r,event,conditions,checkCurrent))n++;return n>=rule.at_least.count}
    const fn=conditions.get(rule.condition.id);if(!fn)fail('CONDITION_UNAVAILABLE',rule.condition.id);this.checkParameters(fn.option,rule.condition.params??{});const result=!!await fn(clone(event),clone(rule.condition.params??{}));assertCurrent();return result
  }
  checkParameters(option,params){if(option?.parameters){const errors=parameterErrors(option.parameters,params,option.label);if(errors.length)fail('INVALID_PARAMETERS',errors.join(' '))}}
  async trigger({id,event,mode='retrieve',preview=false,signal,configurationSnapshot}){
    if(!['store','retrieve'].includes(mode)||!event?.eventId||!event.on)fail('INVALID_TRIGGER','Trigger requires mode, on and stable eventId')
    if(this.manager.configuration.error)fail('CONFIG_UNAVAILABLE','Configuration is invalid; managed execution is blocked')
    const scopeLease=await this.manager.scopeDirectory.context(event.scope??{}),scope=scopeLease.scope
    event={...event,scope}
    const {config,revision}=configurationSnapshot??this.manager.getConfig(id),behavior=config?.[mode]
    if(!config||!applies(config,scope)||!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(event.on))return {matched:false,reason:'scope-or-timing'}
    const adapter=this.manager.adapters.get(config.adapterId)
    if(!adapter||!this.manager.isAdapterEnabled(config.adapterId))fail('SOURCE_UNAVAILABLE',config.adapterId)
    const generation=this.manager.lifetimes.get(adapter),document=this.manager.configuration.document,epoch=this.manager.configuration.pending,operations=new Map(this.operations),conditions=new Map(this.conditions),catalogRevision=this.manager.optionCatalog({adapterId:adapter.id}).catalogRevision
    const checkCurrent=()=>{try{this.manager.assertOwner(this.manager.adapters.get(config.sourceAdapterId??config.adapterId),id);return scopeLease.checkCurrent()&&this.manager.isAdapterEnabled(adapter.id)&&this.manager.isAdapterEnabled(config.sourceAdapterId??config.adapterId)&& !this.manager.configuration.error&&this.manager.configuration.document===document&&this.manager.configuration.pending===epoch&&this.manager.adapters.get(adapter.id)===adapter&&this.manager.lifetimes.get(adapter)===generation&&!generation.signal.aborted&&this.manager.optionCatalog({adapterId:adapter.id}).catalogRevision===catalogRevision}catch{return false}}
    const assertCurrent=()=>{signal?.throwIfAborted();if(!checkCurrent())fail('CAPABILITY_CHANGED','配置、来源或能力注册已变化。')}
    if(adapter.validateConfig)await adapter.validateConfig(clone(config))
    if(this.manager.adapters.get(config.adapterId)!==adapter)fail('SOURCE_UNAVAILABLE','Source registration changed')
    assertCurrent()
    const errors=capabilityErrors(adapter,config,conditions,operations,{strictEvents:false});if(errors.length)fail(errors[0].code,errors.map(e=>e.message).join(' '))
    if(!await this.rule(behavior.rule??true,event,conditions,checkCurrent))return {matched:false,reason:'rule'}
    const chain=typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy??[]
    for(const step of chain){const op=operations.get(step.operation);if(!op)fail('OPERATION_UNAVAILABLE',step.operation);this.checkParameters(op.option,step.params??{});if(preview&&!op.readOnly)fail('PREVIEW_WRITE_REFUSED',step.operation)}
    const key=JSON.stringify([id,mode,scope,event.eventId]),operationId=createHash('sha256').update(key).digest('hex'),strategyRevision=createHash('sha256').update(JSON.stringify(chain.map(step=>[step,operations.get(step.operation).version]))).digest('hex')
    const lifetime=generation?.signal
    lifetime?.throwIfAborted()
    if(this.manager.lifetimes.get(adapter)!==generation)fail('SOURCE_UNAVAILABLE','Source registration changed')
    if(lifetime)signal=signal?AbortSignal.any([signal,lifetime]):lifetime
    if(!preview&&(this.running.has(key)||this.manager.traces.some(t=>t.executionKey===key&&['completed','failed'].includes(t.phase))))return {matched:true,duplicate:true}
    const fact={adapterId:config.adapterId,id,eventId:event.eventId,sessionId:scope.sessionId,turn:event.turn,turnKind:event.turnKind??'unknown',requestId:event.requestId??event.eventId,executionKey:key,configRevision:revision,strategyRevision}
    if(!preview){this.running.add(key);this.manager.recordTrace({...fact,phase:'started'});this.manager.recordTrace({...fact,phase:'triggered'})}
    try{
      let value=await this.manager.read({adapterId:config.adapterId,sourceAdapterId:config.sourceAdapterId,id,scope,signal})
      assertCurrent()
      if(value==null)fail('RESOURCE_UNAVAILABLE',id)
      const resourceRevision=value.revision??null
      for(const step of chain){assertCurrent();value=await operations.get(step.operation).run({id,operationId,value:clone(value),event:clone(event),config:clone(config),params:clone(step.params??{}),preview,signal});assertCurrent()}
      if(!preview)this.manager.recordTrace({...fact,phase:'completed'})
      return {matched:true,value,resourceRevision,configRevision:revision,strategyRevision,preview}
    }catch(e){if(!preview)this.manager.recordTrace({...fact,phase:'failed',detail:e.message});throw e}
    finally{this.running.delete(key)}
  }
}
