# 无会话来源预览

[English](SOURCE_PREVIEW_en.md)

来源管理桥接支持世界书开场预览，无需先创建 DSH 会话。来源的 `getManagementDefaults({id,scope})` 可在有效的已选资源绑定上返回可选 `previewScope: {characterId?,presetId?,userId?}`；每个 ID 必须为非空字符串。它只用于可信 Host 回调，不是浏览器传入参数或持久化配置。

该快照的 `checkCurrent()` 必须同时覆盖预览生命周期、草稿版本、当前选择及资源版本。Manager 仅在来源使用回调标明 `event.preview === true` 且无 sessionId 时采用这些范围事实。没有绑定证明的普通无会话来源请求仍受原有范围限制。

来源默认范围只允许当前绑定资源。显式空白名单、黑名单、来源禁用、空 retrieve 或拒绝规则仍生效；角色、预设、Persona 范围规则使用证明中的 ID。来源变化或预览结束会使许可失效。该字段不授予通用 usage 执行权限，不创建会话，不保存全局许可。旧来源不提供此字段时行为不变；需要与支持该字段的 Tavern 配套使用。
