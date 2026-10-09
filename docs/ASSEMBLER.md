# Prompt Assembler 接入

[English](ASSEMBLER_en.md) · [Manager API](API.md)

通过管理规则将 Skill 或第三方通用资源加入模型请求，需要启用 assembler 的 `memory-manager.resources` 来源。DSH 原生 Skill 调用，以及 Tavern 自行执行的世界书、MVU 和模板贡献，使用各自的来源路径。

## 配置接入

1. 在 Manager 中为通用资源配置读取规则和适用范围，保存管理配置。
2. 在 Prompt Assembler 的装配策略中选择 `memory-manager.resources`。
3. 使用支持 request-assembly 协议 1 的宿主执行请求。宿主准备方式见 [assembler 文档](https://github.com/Player-MINEPIG/dsh-prompt-assembler)。

有效通用读取配置存在时，Manager 来源才出现在装配选项中。可自行执行的来源不进入这条路径，避免重复提供内容。

## adapter 接口

请求 adapter 位于 assembler 仓库的 `adapters/memory-manager.js`。`connectMemoryManager(ctx,registry)` 跟随 Host 服务 `dshMemoryManager` 的生命周期注册或撤销来源。

`manager.requestAssemblyResources()` 同步返回 `{available,entries}`，每项含 `id,adapterId,configurationSnapshot`。snapshot 是分离的有效配置与 revision；配置错误返回 `available:false,entries:[]`。source-owned adapter（包括 MVU）不进入通用快照。

adapter 以只读 preview 模式调用 `manager.trigger()`，传递会话、取消信号和配置快照。实际请求准备另传 `observeRead:true`，记录 `content-read`。`request/assembly`、消息哈希和来源节点经 `llm/stream` 核验后才记录 `request-included`，用于判断本轮读取触发。预览不生成请求进入回执。

## 会话读取与撤销

会话查询可通过 `withSessionRead({sessionId,signal},callback)` 只读租约读取持久化冷会话。`SESSION_READER_NOT_READY` 为初始化状态（503），`SESSION_NOT_FOUND` 为会话不存在（404）。租约不创建 Agent 或追加历史。

卸载 Manager 撤销其通用请求来源，保留来源资源和 DSH 历史。
