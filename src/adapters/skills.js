import { createHash } from 'node:crypto'
import { fail } from '../config.js'
const hash=x=>createHash('sha256').update(x).digest('hex')
const key=(s,scope={})=>`skill:${hash(JSON.stringify([s.provider,s.path??scope.sessionId??"global",s.name])).slice(0,24)}`
export function skillAdapter(ctx){
  function lookup(scope,signal){const agent=scope.sessionId?ctx.get('agents')?.get(scope.sessionId):undefined;if(scope.sessionId&&!agent)fail('AGENT_UNAVAILABLE','The session Agent is unavailable; no global fallback is permitted');return {scope:agent,cwd:agent?.session?.header?.cwd,signal}}
  return {id:'dsh.skills',name:'DSH Skills',authority:'dsh.skill-registry',
    async list({scope,signal}){return (await ctx.skills.list(lookup(scope,signal))).map(s=>({id:key(s,scope),name:s.name,type:'skill',revision:null,summary:s.description,source:{provider:s.provider},nativeBehavior:true}))},
    async read({id,scope,signal}){const options=lookup(scope,signal),s=(await ctx.skills.list(options)).find(s=>key(s,scope)===id);if(!s)return null;const full=await ctx.skills.get(s.name,options);if(!full||key(full,scope)!==id)fail('SOURCE_CHANGED','Skill source changed during read');return {id,name:s.name,type:'skill',content:full.content,revision:hash(full.content??''),authority:'dsh.skill-registry'}},
    validateConfig(c){if(c.type&&c.type!=='skill')fail('TYPE_MISMATCH','Skill source type is skill')},
  }
}
