import {fail} from './config.js'
const known=[['dsh.skills','DSH Skills','启用可信 DSH skill provider。'],['tavern.world-books','Tavern 世界书','安装可信 Tavern memory-sources 版本并启用公开服务。'],['tavern.prompt-templates','Tavern 模板','安装可信 Tavern memory-sources 版本并启用模板服务。'],['tavern.mvu','Tavern MVU','启用可信 Tavern MVU Host 服务。']]
const directoryRequirements=[{id:'dsh.scopes',label:'DSH 会话与 Workspace',installation:'需要公开 SessionStore、WorkspaceRegistry 与缓存标题投影；只列 Host 已加载元数据。'},{id:'tavern.scopes',label:'Tavern 角色卡 / 预设 / Persona',installation:'需要可信 Tavern tavernScopeCatalog v1 分页目录服务。旧版无此接口；不会改用全量正文目录。'}]
export function adapterCatalog(manager){
 const ids=new Set([...known.map(([id])=>id),...manager.adapters.keys()])
 return {adapters:[...ids].map(id=>{const a=manager.adapters.get(id),description=known.find(r=>r[0]===id);return {id,label:a?.name??description?.[1]??id,installed:!!a,enabled:!!a&&manager.isAdapterEnabled(id),authority:a?.authority,installation:description?.[2]??'请查阅该可信 Host 插件的安装文档。',documentation:'/api/dsh-memory-manager/options-documentation#adapter'}}),directories:[...manager.scopeDirectory.catalog().map(p=>({...p,installed:true})),...directoryRequirements.filter(p=>!manager.scopeDirectory.providers.has(p.id)).map(p=>({...p,installed:false,enabled:false,documentation:'/api/dsh-memory-manager/options-documentation#scope'}))]}
}
export function setAdapterEnabled(manager,{id,enabled,kind='resource'}){
 if(!['resource','directory'].includes(kind))fail('INVALID_REQUEST','adapter kind 必须是 resource 或 directory。')
 if(kind==='directory'){manager.scopeDirectory.setEnabled(id,enabled);manager.catalogGeneration++;return adapterCatalog(manager)}
 if(!manager.adapters.has(id))fail('SOURCE_UNAVAILABLE','adapter 已卸载；请通过 Host 安装可信插件。')
 if(typeof enabled!=='boolean')fail('INVALID_REQUEST','enabled 必须为布尔值。')
 enabled?manager.disabledAdapters.delete(id):manager.disabledAdapters.add(id);manager.catalogGeneration++
 return adapterCatalog(manager)
}
