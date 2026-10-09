# Memory Manager 架构

[English](ARCHITECTURE_en.md) · [交互架构图](assets/architecture/memory-manager.zh-CN.html) · [开发者指南](DEVELOPER_GUIDE.md)

src/index.js 挂载 dshMemoryManager 和可选来源/目录服务。settings 与 conversation.view 客户端经 admission HTTP 使用 query、详情、选项与显式保存原语。Manager 拥有 config.json 与有界 observations.json，正文和权威账本仍归提供方。

主路径为查询/显式保存 → 身份与 scope 配置 → adapter list/read 或已授权来源写入。Usage 用冻结规则及注册能力决策；source-owned adapter 使用可撤销决策，自己执行固定链。配置 revision、来源 revision 与 catalogRevision 相互独立。无正文绑定目录与 scope 目录不授权访问、不激活 Agent。

独立 assembler 拥有可选 memory-manager.resources adapter；只读检索排除 MVU 与其他 source-owned 执行。request-included 证据须核验实际请求 messages 与匹配来源引用，phase 名称本身不足以确认。Tavern/assembler 都不是生产依赖。Manager 卸载保留配置/观察并撤销当前委托，兼容 Tavern 来源对新操作恢复默认；重装重新应用保留规则。原生卡片写入继续独立受来源 binding/grant/CAS/schema 控制。

会话标题通过公开 sessionQuery 独立读取真实 turn/start。原生 Skill 钩子区分正文读取和请求进入回执；DSH 装配记录与精确 Tavern v3 历史恢复核验的本轮来源证据，不写入 journal 或历史。这些观察不替代来源执行或网络送达证据。

图旁 JSON 可编辑。[API](API.md)、[选项](OPTIONS.md)、[预设](PRESETS.md) 与 [assembler 接入](ASSEMBLER.md)定义可组合接口。
