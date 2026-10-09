# 第三方开发者接入指南

[English](DEVELOPER_GUIDE_en.md) · [API](API.md) · [选项](OPTIONS.md) · [Assembler](ASSEMBLER.md)

先选择所需能力：资源 adapter 让权威资源可供 Manager 列出/读取/编辑；具名 condition/operation 为通用规则提供可信 Host 行为；source-owned 使用 adapter 只委托决策，来源继续执行；请求装配 adapter 提供模型请求贡献，放在独立 assembler 仓库。这些注册和 ID 彼此独立。

## 最小只读资源 adapter

[笔记示例](examples/notes-adapter.js)实现 list/read/validateConfig 与 JSON 选项目录。接入方 notes 服务实现 list({scope,signal}) → {id,name,revision}[] 和 read({id,scope,signal}) → {id,name,content,revision}|null，并检查自身权限。持久 ID 使用提供方前缀，如 example.notes:scene；不从变化正文派生身份、不把不同 session scope 当作同一 ID 的新实例。

```js
import { registerNotesAdapter } from './notes-adapter.js'
export function apply(ctx) {
  return ctx.inject(['dshMemoryManager', 'myNotes'], scope => {
    const manager = scope.get('dshMemoryManager')
    if (manager.protocolVersion !== 1) throw new Error('Unsupported manager protocol')
    scope.effect(() => registerNotesAdapter(manager, scope.get('myNotes')))
  })
}
```

myNotes 由接入方插件提供。scoped injection 可选且随生命周期撤销，缺 Manager 不应阻止原生来源运行。全部注册返回 disposer，卸载取消调用/观察，迟到 callback 不能恢复注册。本例无正文 update/copy，也不宣称写能力。catalogScope:'all-sessions' 声明原生默认可见范围，仍受来源 scope/权限约束；要求真实绑定的来源提供无正文 listBound 与同步可撤销 checkCurrent。缺绑定能力不能回退全局枚举。

## 配置与通用检索

没有 Manager 规则时仍可显示已注册资源；可见不等于模型使用。用户在 Manager UI 显式设置 retrieve、选择真实 scope，经校验/CAS 保存。通用笔记规则可为：

```json
{"id":"example.notes:scene","adapterId":"example.notes","type":"note",
 "whitelist":[{"sessionId":"example-session"}],"blacklist":[],
 "retrieve":{"on":"before_model_request","rule":true,
 "strategy":[{"operation":"memory.read_content"},{"operation":"memory.to_text"}]}}
```

示例 session ID 须替换为实际获准的会话。来源校验自己的配置，Manager 检查注册能力、类型参数、revision 与目录代次。注册不写用户配置，保存为显式操作。通用正文要真正提供给模型，还需独立安装 assembler 并显式选择 memory-manager.resources 规则。adapter 用只读 preview 检索，排除 source-owned 来源；这里不添加第二个请求钩子或直接写历史。

## 条件、操作与来源自行执行

registerCondition({id,test,label?,description?,adapterIds?,types?,modes?,parameters?}) 与 registerOperation({id,run,readOnly,...metadata}) 返回 disposer。condition 接收 event/params；operation 接收 id/value/event/config/params/preview/signal 及生成的 operationId。写操作转交稳定意图，来源落实权限/CAS/幂等。preview 拒绝非 readOnly 操作；JSON 只能选择可信注册，不安装代码。缺能力拒绝执行。

已有有序存取链的来源声明 strategyOwner:'source'，实现完整来源决策合同、validateConfig、observe、registerUsage。当前 Tavern 接线只跟随已命名公开服务，不自动发现任意服务；第三方需组合自己的可信 usage handler 或提供支持的 Manager adapter。只在通用 adapter 上加 registerUsage 不会自动挂来源规则接线。来源在最后 await 后、使用/提交前同步复验返回的 checkCurrent；Manager 不得再次执行同一来源链。详见 [API](API.md#来源默认与当前委托)。

可选 getManagementDefaults 返回 protocolVersion:1、revision、不含正文的 configuration、scopePolicy:'source-bound' 与同步 checkCurrent。兼容来源将可信 registerUsage(handler,{providerId:'dsh-memory-manager'}) 解释为当前委托，disposer 后恢复来源默认。委托期间配置错误拒绝执行；卸载不同于授权或持久 ownership transfer。旧提供方保持其声明的所有权语义。Manager 预设/名单不授予来源权限；Tavern 原生卡片变量提交只由 Manager 观察，不受其规则批准。

## 编辑、身份与观察

可选 update 需要 expectedRevision/operationId，事务提交与回执由来源拥有；copy 需要不同 newId。Manager 预留身份但不替代权威账本。适用的提交前拒绝须报告 committed:false；模糊结果保持 MUTATION_OUTCOME_UNKNOWN，直到权威回读核实。提交后错误不能冒充可安全重试的拒绝。

observe(listener) 发送 started/triggered/applied/skipped/failed/completed，含稳定 eventId 与真实 session/turn/request。报告来源事实，不从 UI 推断。支持时提供 mode:store|retrieve 及 evidence:content-read|request-included|write-committed|source-evaluated；读取触发需 request-included，存储触发需 write-committed，applied 等 phase 本身不足以确认。标题隐藏未知 turnKind，不改写回执。有界 journal 最多 2000 条，不是持久幂等库或历史替代。装配 applied 必须以 durable request、messages、来源节点匹配 llm/stream，不证明网络送达。preview 不发 applied。

虚拟 Skill 可声明 metadata.dshResourceIdentity:{version:1,namespace,id}，重启/正文变化仍保持身份；namespace 与复制新身份由提供方负责。未声明者为临时 skill-view handle、bind:false，配置不能把它变为持久资源。

## 校验与打包

运行 npm run check 与 npm run pack:check。覆盖 scope list/read、缺/null 资源、来源错误、身份冲突、纯 validateConfig、preview 拒写、取消/卸载、revision/catalog/default 租约过期，以及来源权威处支持的 mutation。Host/浏览器另行验收。库 import MemoryManager 使用 dsh-memory-manager/manager，根 export 为 Host 插件。生产包无 Tavern/assembler 依赖；assembler 只是开发 fixture。跨仓库装配 adapter 只用公开服务，不访问私有文件。
