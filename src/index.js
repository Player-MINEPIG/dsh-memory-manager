import { join } from 'node:path'
import { MemoryManager } from './manager.js'
import { Usage } from './usage.js'
import { skillAdapter } from './adapters/skills.js'
import { registerRequestSource,observeTavernRequest } from './adapters/request-source.js'
import { installMvu } from './adapters/mvu.js'
import { tavernWorldBooks } from './adapters/tavern.js'
import { handler } from './http.js'
export const name='dsh-memory-manager'
export async function apply(ctx,config={}){
  if(!config.storageDir)throw new Error('storageDir is required')
  const manager=await new MemoryManager({configPath:config.configPath??join(config.storageDir,'config.json'),journalPath:join(config.storageDir,'observations.json')}).init()
  const usage=new Usage(manager)
  usage.registerOperation({id:'memory.read_content',readOnly:true,run:({value})=>value?.content})
  usage.registerOperation({id:'memory.to_text',readOnly:true,run:({value})=>typeof value==='string'?value:JSON.stringify(value)})
  manager.registerCondition=usage.registerCondition.bind(usage);manager.registerOperation=usage.registerOperation.bind(usage);manager.trigger=usage.trigger.bind(usage)
  ctx.provide('dshMemoryManager',manager)
  ctx.inject(['tavernRequestSources'],c=>{c.effect(()=>registerRequestSource(manager,c.tavernRequestSources,usage));c.on('llm/stream',async function*(options,next){const session=c.get('agents')?.get(options.sessionId)?.session;try{observeTavernRequest(manager,session,options)}catch(e){manager.diagnostics.push({code:'REQUEST_OBSERVATION_FAILED',message:e.message})}yield* next()})})
  ctx.inject(['tavernMvu'],c=>c.effect(()=>installMvu(manager,c.tavernMvu,usage)))
  if(config.tavernBaseUrl)ctx.effect(()=>manager.registerAdapter(tavernWorldBooks({baseUrl:config.tavernBaseUrl})))
  ctx.inject(['skills'],c=>c.effect(()=>manager.registerAdapter(skillAdapter(c))))
  ctx.inject(['webServer'],c=>c.effect(()=>c.webServer.register({kind:'prefix',path:'/api/dsh-memory-manager',handler:handler(manager)})))
  ctx.effect(()=>()=>manager.dispose())
}
