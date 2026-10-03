import {parameterErrors} from './option-schema.js'
import {canonical} from './canonical.js'
export function conditionReferences(rule){
 if(typeof rule==='string')return [{id:rule,params:{}}]
 if(!rule||typeof rule!=='object')return []
 if(rule.condition)return [{id:rule.condition.id,params:rule.condition.params??{}}]
 if(rule.not!==undefined)return conditionReferences(rule.not)
 return (rule.all??rule.any??rule.at_least?.conditions??[]).flatMap(conditionReferences)
}
export function capabilityErrors(adapter,config,conditions,operations,{catalogStrategies=false,strictEvents=true}={}){
 const errors=[],catalog=adapter?.optionCatalog
 const add=(field,message,code='CAPABILITY_MISMATCH')=>errors.push({field,message,code})
 if(catalog&&config.type!==undefined&&!catalog.types?.some(t=>t.id===config.type))add('type','此类型不属于当前来源。')
 for(const mode of ['store','retrieve']){
  const behavior=config[mode];if(!behavior)continue
  const field=key=>mode+'.'+key,support=catalog?.modes?.[mode]
  if(catalog&&support?.supported!==true){add(mode,support?.reason??'当前来源未声明此模式的能力。');continue}
  const on=behavior.on===undefined?[]:Array.isArray(behavior.on)?behavior.on:[behavior.on]
  if(catalog){
   if(strictEvents&&on.some(id=>!catalog.events?.some(e=>e.id===id&&e.mode===mode)))add(field('on'),'此时机不属于当前来源的模式。')
   if(support.onSelection==='single'&&on.length>1)add(field('on'),'当前来源只支持单一时机。')
   if(catalogStrategies&&behavior.strategy!==undefined&&support.strategySelection==='fixed'&&!catalog.strategies?.some(s=>s.mode===mode&&canonical(s.value)===canonical(behavior.strategy)&&on.every(id=>s.events.includes(id))))add(field('strategy'),'策略顺序或时机与当前来源的固定策略不兼容。')
  }
  const check=(descriptor,params,path)=>{
   if(descriptor?.adapterIds?.length&&!descriptor.adapterIds.includes(adapter.id))add(path,'此能力不适用于当前来源。')
   if(descriptor?.modes?.length&&!descriptor.modes.includes(mode))add(path,'此能力不适用于当前模式。')
   if(descriptor?.types?.length&&!descriptor.types.includes(config.type))add(path,'此能力不适用于当前类型。')
   if(descriptor?.parameters)for(const message of parameterErrors(descriptor.parameters,params))add(path,message)
  }
  for(const ref of conditionReferences(behavior.rule)){const fn=conditions.get(ref.id);if(!fn)add(field('rule'),'条件尚未注册：'+ref.id,'CONDITION_UNAVAILABLE');else check(fn.option,ref.params,field('rule'))}
  if(adapter?.strategyOwner!=='source')for(const step of typeof behavior.strategy==='string'?[{operation:behavior.strategy}]:behavior.strategy??[]){const op=operations.get(step.operation);if(!op)add(field('strategy'),'操作尚未注册：'+step.operation,'OPERATION_UNAVAILABLE');else check(op.option,step.params??{},field('strategy'))}
 }
 return errors
}
