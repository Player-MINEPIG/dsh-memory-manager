import { createHash } from 'node:crypto'
import { fail } from '../config.js'
const hash=x=>createHash('sha256').update(x).digest('hex')
// Virtual definitions have no provider-owned durable locator in the public API.
// Content addressing avoids both session-split globals and same-name shadow aliasing.
const key=s=>`skill:${hash(JSON.stringify([s.provider,s.path??['virtual',s.resourceBase??null,s.content],s.name])).slice(0,24)}`
export function skillAdapter(ctx){
  function lookup(scope,signal){
    const agent=scope.sessionId?ctx.get('agents')?.get(scope.sessionId):undefined
    if(scope.sessionId&&!agent)fail('AGENT_UNAVAILABLE','The session Agent is unavailable; no global fallback is permitted')
    const registry=(agent?ctx.get('agentPresets')?.serviceFor?.(agent,'skills'):undefined)??ctx.skills
    return {registry,options:{scope:agent,cwd:agent?.session?.header?.cwd,signal}}
  }
  async function catalog(scope,signal){
    const {registry,options}=lookup(scope,signal),rows=[]
    for(const summary of await registry.list(options)){
      const definition=summary.path?summary:await registry.get(summary.name,options)
      if(definition)rows.push({...summary,...definition})
    }
    return {registry,options,rows}
  }
  return {id:'dsh.skills',name:'DSH Skills',authority:'dsh.skill-registry',
    async list({scope,signal}){const {rows}=await catalog(scope,signal);return rows.map(s=>({id:key(s),name:s.name,type:'skill',revision:s.content===undefined?null:hash(s.content),summary:s.description??'',source:{provider:s.provider??'unknown'},nativeBehavior:true}))},
    async read({id,scope,signal}){const {registry,options,rows}=await catalog(scope,signal),s=rows.find(s=>key(s)===id);if(!s)return null;const full=await registry.get(s.name,options);if(!full||key(full)!==id)fail('SOURCE_CHANGED','Skill source changed during read');return {id,name:s.name,type:'skill',content:full.content,revision:hash(full.content??''),authority:'dsh.skill-registry'}},
    validateConfig(c){if(c.type&&c.type!=='skill')fail('TYPE_MISMATCH','Skill source type is skill')},
  }
}
