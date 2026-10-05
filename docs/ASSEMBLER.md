# Prompt Assembler 接入

[English](ASSEMBLER_en.md) · [Manager API](API.md)

Manager 的生产包不依赖 assembler 或 Tavern。请求 adapter 位于独立 assembler 仓库 `adapters/memory-manager.js`，第三方在那里 fork 或提 PR；管理配置、资源权限与检索策略仍由 Manager 和来源维护。

`manager.requestAssemblyResources()` 同步返回 `{available,entries}`。配置错误时返回 `available:false,entries:[]`，不回退到失效配置。每条 entry 包含 `id,adapterId,configurationSnapshot`；snapshot 是与内部配置分离的有效配置与 revision，不能改变 Manager 状态。source-owned adapter（包括 MVU）不进入通用装配路径，避免重复插入。

adapter 以只读 preview 模式调用公开 `manager.trigger()`，传递真实会话、取消信号及配置快照。注册/卸载由 `connectMemoryManager(ctx,registry)` 跟随 Host 服务 `dshMemoryManager` 生命周期，assembler 来源 ID 为 `memory-manager.resources`。来源注册仅使其可选；用户仍须将其加入装配策略。

预览不记录 applied。只有持久 `request/assembly` 事件、最终消息哈希和对应来源节点同时匹配 `llm/stream` 观察时才记录 applied；该事实说明进入 DSH 请求，不证明网络送达。卸载 adapter 不删除持久记录、不改变原生 DSH 执行。
