import { join } from 'node:path'
import { MemoryManager } from './manager.js'
import { Usage } from './usage.js'
import {installNativeSkillObserver} from './native-skill-observer.js'
import {installRequestObserver} from './request-observer.js'
import { skillAdapter } from './adapters/skills.js'
import {installManagedSources} from './adapters/managed-sources.js'
import { installMvu } from './adapters/mvu.js'
import { tavernWorldBooks } from './adapters/tavern.js'
import { handler } from './http.js'
import {dshScopes} from './adapters/dsh-scopes.js'
import {tavernScopes} from './adapters/tavern-scopes.js'
export const name='dsh-memory-manager'
export async function apply(ctx,config={}){
  if(!config.storageDir)throw new Error('storageDir is required')
  const manager=await new MemoryManager({configPath:config.configPath??join(config.storageDir,'config.json'),journalPath:join(config.storageDir,'observations.json')}).init({createIfMissing:true})
  const usage=new Usage(manager)
  usage.registerOperation({id:'memory.read_content',label:'读取资源正文',parameters:{type:'object',properties:{}},readOnly:true,run:({value})=>value?.content})
  usage.registerOperation({id:'memory.to_text',label:'转换为文本',parameters:{type:'object',properties:{}},readOnly:true,run:({value})=>typeof value==='string'?value:JSON.stringify(value)})
  manager.registerCondition=usage.registerCondition.bind(usage);manager.registerOperation=usage.registerOperation.bind(usage);manager.trigger=usage.trigger.bind(usage)
  ctx.provide('dshMemoryManager',manager)
  ctx.effect(()=>installRequestObserver(ctx,manager))
  ctx.inject(['sessions','workspaceRegistry'],c=>{
    let current,disposing=false
    const clear=()=>{current?.stop();current?.directory.dispose();current=null}
    const mount=(scope,options)=>{clear();const directory=dshScopes(scope,config.scopeDirectoryLimits,options),marker=Symbol('directory');current={directory,marker,stop:manager.scopeDirectory.register(directory)};return marker}
    mount(c,{cold:false})
    c.inject(['sessionQuery','sessionPersistence'],full=>full.effect(()=>{const marker=mount(full,{cold:true});return()=>{if(current?.marker===marker){clear();if(!disposing)mount(c,{cold:false})}}}))
    c.effect(()=>()=>{disposing=true;clear()})
  })
  ctx.inject(['tavernScopeCatalog'],c=>c.effect(()=>{try{return manager.scopeDirectory.register(tavernScopes(c.tavernScopeCatalog))}catch(error){manager.diagnostics.push({adapterId:'tavern.scopes',code:error.code??'DIRECTORY_UNAVAILABLE',message:error.message});return()=>{}}}))
  ctx.inject(['tavernMvu'],c=>c.effect(()=>installMvu(manager,c.tavernMvu,usage)))
  let legacyWorldBooks,disposing=false
  const installLegacy=()=>{if(!disposing&&config.tavernBaseUrl&&!manager.adapters.has('tavern.world-books'))legacyWorldBooks=manager.registerAdapter(tavernWorldBooks({baseUrl:config.tavernBaseUrl}))}
  installLegacy()
  ctx.inject(['tavernMemorySources'],c=>c.effect(()=>{legacyWorldBooks?.();legacyWorldBooks=null;let stop;try{stop=installManagedSources(manager,c.tavernMemorySources,usage)}catch(error){installLegacy();throw error}return()=>{stop();installLegacy()}}))
  ctx.effect(()=>()=>{disposing=true;legacyWorldBooks?.()})
  const skills=skillAdapter(ctx,{hostSkills:()=>ctx.get('skills')})
  ctx.effect(()=>manager.registerAdapter(skills))
  ctx.effect(()=>installNativeSkillObserver(ctx,manager,skills))
  ctx.inject(['sessionQuery'],c=>c.effect(()=>{
    const read=async(sessionId,signal)=>{const observation=await c.sessionQuery.observeSession(sessionId,{signal,projectionMode:'none'});try{signal?.throwIfAborted();return observation.events}finally{observation[Symbol.dispose]()}}
    manager.readSessionEvents=read
    return()=>{if(manager.readSessionEvents===read)manager.readSessionEvents=undefined}
  }))
  ctx.inject(['webServer','connection'],c=>c.effect(()=>c.webServer.register({kind:'prefix',path:'/api/dsh-memory-manager',handler:handler(manager,c.connection)})))
  ctx.effect(()=>()=>manager.dispose())
}
