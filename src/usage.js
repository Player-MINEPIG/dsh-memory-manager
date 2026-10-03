import {createHash} from 'node:crypto'
import { applies,clone,fail } from './config.js'
export class Usage {
  conditions=new Map();operations=new Map();running=new Set()
  constructor(manager){this.manager=manager;manager.usage=this}
  registerCondition({id,test}){if(typeof test!=='function')fail('INVALID_CONDITION',id);const registration=(...args)=>test(...args);return this.register(this.conditions,id,registration)}
  registerOperation({id,run,readOnly=false,version=1}){if(typeof run!=='function')fail('INVALID_OPERATION',id);return this.register(this.operations,id,{run,readOnly,version})}
  register(map,id,value){if(!id||map.has(id))fail('DUPLICATE_REGISTRATION',`Duplicate registration: ${id}`);map.set(id,value);return()=>{if(map.get(id)===value)map.delete(id)}}
  async rule(rule,event,conditions=new Map(this.conditions)){
    if(typeof rule==='boolean')return rule
    if(typeof rule==='string'){const fn=conditions.get(rule);if(!fn)fail('CONDITION_UNAVAILABLE',rule);return !!await fn(clone(event),{})}
    if(rule.all){for(const r of rule.all)if(!await this.rule(r,event,conditions))return false;return true}
    if(rule.any){for(const r of rule.any)if(await this.rule(r,event,conditions))return true;return false}
    if('not' in rule)return !await this.rule(rule.not,event,conditions)
    if(rule.at_least){let n=0;for(const r of rule.at_least.conditions)if(await this.rule(r,event,conditions))n++;return n>=rule.at_least.count}
    const fn=conditions.get(rule.condition.id);if(!fn)fail('CONDITION_UNAVAILABLE',rule.condition.id);return !!await fn(clone(event),clone(rule.condition.params??{}))
  }
  async trigger({id,event,mode='retrieve',preview=false,signal,configurationSnapshot}){
    if(!['store','retrieve'].includes(mode)||!event?.eventId||!event.on)fail('INVALID_TRIGGER','Trigger requires mode, on and stable eventId')
    if(this.manager.configuration.error)fail('CONFIG_UNAVAILABLE','Configuration is invalid; managed execution is blocked')
    const {config,revision}=configurationSnapshot??this.manager.getConfig(id),scope=event.scope??{},behavior=config?.[mode]
    if(!config||!applies(config,scope)||!behavior||!(Array.isArray(behavior.on)?behavior.on:[behavior.on]).includes(event.on))return {matched:false,reason:'scope-or-timing'}
    const adapter=this.manager.adapters.get(config.adapterId)
    if(!adapter)fail('SOURCE_UNAVAILABLE',config.adapterId)
    const generation=this.manager.lifetimes.get(adapter)
    if(adapter.validateConfig)await adapter.validateConfig(clone(config))
    if(this.manager.adapters.get(config.adapterId)!==adapter)fail('SOURCE_UNAVAILABLE','Source registration changed')
    const operations=new Map(this.operations),conditions=new Map(this.conditions)
    if(!await this.rule(behavior.rule??true,event,conditions))return {matched:false,reason:'rule'}
    const chain=typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy??[]
    for(const step of chain){const op=operations.get(step.operation);if(!op)fail('OPERATION_UNAVAILABLE',step.operation);if(preview&&!op.readOnly)fail('PREVIEW_WRITE_REFUSED',step.operation)}
    const key=JSON.stringify([id,mode,scope,event.eventId]),operationId=createHash('sha256').update(key).digest('hex'),strategyRevision=createHash('sha256').update(JSON.stringify(chain.map(step=>[step,operations.get(step.operation).version]))).digest('hex')
    const lifetime=generation?.signal
    lifetime?.throwIfAborted()
    if(this.manager.lifetimes.get(adapter)!==generation)fail('SOURCE_UNAVAILABLE','Source registration changed')
    if(lifetime)signal=signal?AbortSignal.any([signal,lifetime]):lifetime
    if(!preview&&(this.running.has(key)||this.manager.traces.some(t=>t.executionKey===key&&['completed','failed'].includes(t.phase))))return {matched:true,duplicate:true}
    const fact={adapterId:config.adapterId,id,eventId:event.eventId,sessionId:scope.sessionId,turn:event.turn,turnKind:event.turnKind??'unknown',requestId:event.requestId??event.eventId,executionKey:key,configRevision:revision,strategyRevision}
    if(!preview){this.running.add(key);this.manager.recordTrace({...fact,phase:'started'});this.manager.recordTrace({...fact,phase:'triggered'})}
    try{
      let value=await this.manager.read({adapterId:config.adapterId,id,scope,signal})
      if(value==null)fail('RESOURCE_UNAVAILABLE',id)
      const resourceRevision=value.revision??null
      for(const step of chain){signal?.throwIfAborted();value=await operations.get(step.operation).run({id,operationId,value:clone(value),event:clone(event),config:clone(config),params:clone(step.params??{}),preview,signal});signal?.throwIfAborted()}
      if(!preview)this.manager.recordTrace({...fact,phase:'completed'})
      return {matched:true,value,resourceRevision,configRevision:revision,strategyRevision,preview}
    }catch(e){if(!preview)this.manager.recordTrace({...fact,phase:'failed',detail:e.message});throw e}
    finally{this.running.delete(key)}
  }
}
