import { createHash, randomUUID } from 'node:crypto'
import { fail } from '../config.js'
const hash=x=>createHash('sha256').update(x).digest('hex')
function declaredIdentity(skill){
  const identity=skill.metadata?.dshResourceIdentity
  if(identity===undefined)return null
  if(!identity||identity.version!==1||Object.keys(identity).some(k=>!['version','namespace','id'].includes(k))||!['namespace','id'].every(k=>typeof identity[k]==='string'&&identity[k].trim()===identity[k]&&identity[k].length>0&&identity[k].length<=256))fail('INVALID_SKILL_IDENTITY','dshResourceIdentity requires version 1 and stable namespace/id strings')
  return [identity.namespace,identity.id]
}
export function skillAdapter(ctx,{hostSkills=()=>ctx.skills}={}){
  // View handles are explicitly nonpersistent; they never grant a policy binding.
  // They identify one scoped catalog view, not the provider's durable resource.
  const views=new WeakMap()
  function lookups(scope,signal){
    const agents=ctx.get?.('agents'),presets=ctx.get?.('agentPresets'),host=hostSkills()
    const agent=scope.sessionId?agents?.get(scope.sessionId):undefined
    if(scope.sessionId&&!agent)fail('AGENT_UNAVAILABLE','The session Agent is unavailable; no global fallback is permitted')
    const view=agent=>({registry:presets?.serviceFor?.(agent,'skills')??host,scope:{sessionId:agent.id},options:{scope:agent,cwd:agent.session?.header?.cwd,signal}})
    const results=scope.sessionId?[view(agent)]:[...(typeof host?.list==='function'?[{registry:host,scope:{},options:{signal}}]:[]),...(agents?.list?.()??[]).map(view)]
    const valid=results.filter(v=>typeof v.registry?.list==='function')
    if(!valid.length)fail('SKILL_REGISTRY_UNAVAILABLE','当前 Host 或已加载会话没有可读取的技能注册表。')
    return valid
  }
  function identity(skill,registry,scope){
    if(skill.path)return {id:`skill:${hash(JSON.stringify([skill.provider,skill.path,skill.name])).slice(0,24)}`,stable:true}
    const declared=declaredIdentity(skill)
    if(declared)return {id:`skill:${hash(JSON.stringify(['declared',...declared])).slice(0,24)}`,stable:true}
    let catalogs=views.get(registry);if(!catalogs){catalogs=new Map();views.set(registry,catalogs)}
    const viewKey=JSON.stringify([scope.sessionId??null,skill.provider,skill.source,skill.resourceBase,skill.name])
    if(!catalogs.has(viewKey))catalogs.set(viewKey,'skill-view:'+randomUUID())
    return {id:catalogs.get(viewKey),stable:false}
  }
  async function catalog(scope,signal){
    const rows=[],seen=new Set()
    for(const view of lookups(scope,signal))for(const summary of await view.registry.list(view.options)){
      let definition=summary,diagnostics=[]
      if(!summary.path)try{definition=await view.registry.get(summary.name,view.options)??summary}catch(error){signal?.throwIfAborted();diagnostics=[{code:'SKILL_BODY_UNAVAILABLE',message:`${summary.name}: ${error.message}`}];definition=summary}
      const skill={...summary,...definition},key=identity(skill,view.registry,view.scope)
      if(seen.has(key.id))continue
      seen.add(key.id);rows.push({skill,...key,...view,diagnostics})
    }
    return {rows}
  }
  return {
    async invocation({scope,name,signal,read=false}){const {rows}=await catalog(scope,signal),row=rows.find(row=>row.skill.name===name);if(!row?.stable)return null;const skill=read?await row.registry.get(name,row.options):row.skill;if(!skill||identity({...row.skill,...skill},row.registry,row.scope).id!==row.id)return null;return {id:row.id,skill};},
    id:'dsh.skills',name:'DSH Skills',authority:'dsh.skill-registry',catalogScope:'all-sessions',
    optionCatalog:{version:1,presets:[{id:'builtin:skill-retrieve',label:'Skill · 请求前读取正文',configuration:{type:'skill',retrieve:{on:'before_model_request',rule:true,strategy:[{operation:'memory.read_content'},{operation:'memory.to_text'}]}}}],types:[{id:'skill',label:'Skill 技能'}],events:[{id:'before_model_request',label:'模型请求前',mode:'retrieve'}],strategies:[{id:'skill.content',label:'读取技能正文',mode:'retrieve',events:['before_model_request'],value:[{operation:'memory.read_content'},{operation:'memory.to_text'}]}],modes:{store:{supported:false,reason:'技能注册表不提供管理层写入接口。'},retrieve:{supported:true,onSelection:'multiple',strategySelection:'chain'}}},
    describeScope:scope=>scope.sessionId?'当前会话 Agent 的技能目录；会话须已加载。':'Host 技能及已加载会话可见的技能目录；相同资源合并显示，不加载新 Agent。',
    async list({scope,signal}){const {rows}=await catalog(scope,signal);return rows.map(({skill:s,id,stable,diagnostics})=>({id,name:s.name,type:'skill',revision:s.content===undefined?null:hash(s.content),summary:s.description??'',source:{provider:s.provider??'unknown'},nativeBehavior:true,capabilities:{bind:stable},...((diagnostics.length||!stable)?{diagnostics:[...diagnostics,...(!stable?[{code:'SKILL_STABLE_ID_REQUIRED',message:`${s.name}: 来源未声明稳定身份；仅可查看，不能持久绑定管理配置。`}]:[])]}:{})}))},
    async read({id,scope,signal}){const {rows}=await catalog(scope,signal),row=rows.find(s=>s.id===id);if(!row)return null;const full=await row.registry.get(row.skill.name,row.options);if(!full||identity({...row.skill,...full},row.registry,row.scope).id!==id)fail('SOURCE_CHANGED','Skill source changed during read');return {id,name:row.skill.name,type:'skill',content:full.content,revision:hash(full.content??''),authority:'dsh.skill-registry',capabilities:{bind:row.stable}}},
    validateConfig(c){if(c.id.startsWith('skill-view:'))fail('SKILL_STABLE_ID_REQUIRED','View handles cannot be bound to persistent configuration; the source must declare dshResourceIdentity');if(c.type&&c.type!=='skill')fail('TYPE_MISMATCH','Skill source type is skill')},
  }
}
