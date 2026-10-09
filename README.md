# DSH Memory Manager · 记忆管理 v1.0.0

[English](README_en.md) · [安装](docs/INSTALLATION.md) · [使用](docs/USAGE.md) · [API](docs/API.md) · [版本记录](CHANGELOG.md)

统一查看资源、编辑管理配置，并按会话轮次查看存储与读取是否触发。来源继续拥有正文、身份、版本、权限和写入；DSH 持久会话历史保持权威。Manager 保存配置和有界观察记录，不建立第二份正文库或任务账本。

## 安装

目标为 DSH `0.2.0-rc.2`，Node.js `^22.19.0 || >=24`。通过 GitHub 安装；受限仓库需要访问权限。

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

重启所选 Host，从设置中的「记忆管理」管理全局资源，或从会话「记忆管理」页签查看当前会话。包包含 DSH bundle 和预构建客户端。配置默认在 `$DSH_HOME/dsh-memory-manager/config.json`，正文仍从来源读取。升级与卸载见[安装文档](docs/INSTALLATION.md)。

## 配置与预设

配置页按左、中、右显示「当前值」「是否跟随来源」「来源默认值」，分割线留有间距。没有覆盖的字段直接使用来源值，也可逐字段选择跟随来源。固定资源由来源保存、内容随固定资源变动，同样是存储行为，界面明确说明。

有效配置按来源默认 → 本地字段 → 引用预设合成，再对明确跟随来源的字段取实时来源默认；其他预设字段继续生效。显式空值与未提供字段不同。管理配置保存与正文编辑分开，经过来源校验、revision 与磁盘 CAS；冲突保留草稿。

存取预设支持新建、编辑、导入、导出和 adapter 默认组合的本地覆盖。JSON 规则与策略只选择可信 Host 注册能力，不执行配置中的 JavaScript。详见[选项目录](docs/OPTIONS.md)、[预设](docs/PRESETS.md)和[配置示例](examples/config.json)。

## 本轮存取状态

真实 DSH `turn/start` 记录建立轮次目录。没有活动、没有资源或筛选后无可见资源的轮次均保留；不补造缺失轮次。每轮分别统计存储和读取，不显示跨轮次曾触发状态。未知轮次发起方式隐藏。

| 状态 | 判定 |
| --- | --- |
| 读取已触发 | 内容已核验进入本轮实际 DSH 请求 |
| 存储已触发 | 来源确认本轮写入已提交 |
| 处理中 / 已跳过 | 当前执行活动或明确跳过回执 |
| 未记录触发 | 没有本轮对应操作记录，不能据此判断未使用 |
| 未确认 | 有活动但证据不足，或发生失败、中断 |

正文读取成功、规则命中、预览均不单独计为读取触发。详情分别展示这些事实；进入 DSH 请求也不证明网络送达或模型采用。标准/native 路径观察 Skill 工具与显式指令；世界书、MVU、模板通过公开来源回执和核验历史请求引用补充证据，缺少引用时不靠当前预览推断过去。

## 可选来源

| 来源 | 能力与边界 |
| --- | --- |
| DSH Skills | 合并 Host 与已加载 Agent 目录；会话使用真实 preset/cwd，优先 preset registry。目录与正文只读，会话 Agent 不可用时不回退全局 |
| Tavern 世界书 / Prompt Template | 可选 `tavernMemorySources` v1 服务提供目录、默认、绑定与固定执行链；正文读写以来源能力为准 |
| Tavern MVU | 可选 `tavernMvu` v1 服务提供状态读取、CAS 编辑、决策和观察；原生卡片写入仍由 Tavern 独立授权 |
| Prompt Assembler | 独立仓库维护可选 `memory-manager.resources` adapter；用户显式选择装配策略，Manager 不自动改策略 |
| 第三方资源 | 公开 adapter、condition、operation 与来源决策合同；本版本没有 TaskSystem adapter |

Skill 是资源类型，来源表示加载渠道和目录，不要求归属于插件。当前 adapter 从 DSH 技能注册表识别资源，保存 `provider`；完整目录来源尚未展示。文件 Skill 使用提供方、路径和名称形成身份；虚拟 Skill 可声明 `metadata.dshResourceIdentity`。无稳定身份者只可查看，不能持久绑定规则。

Manager 没有 Tavern/assembler 生产依赖，可独立用于原生 DSH。标准/native 观察与可选 request-assembly 协议 1 接入是不同路径：通用请求装配需要显式 prepared core 能力，安装 Manager 不修改核心。旧世界书 HTTP 桥默认关闭、仅接受显式 loopback 地址且只读。来源失效显示诊断。

卸载保留配置、来源正文和 DSH 历史；兼容来源撤销委托，为后续操作恢复默认。重装重新采用保留规则。Manager 不提供向量引擎、总结模型或主动唤醒任务循环。

## 开发与文档

本仓库与 `dsh-prompt-assembler` 放在同一父目录，运行 `npm ci`、`npm run check`、`npm run pack:check`。assembler 仅为开发测试依赖。真实 Host 检查使用合成模型提供方；环境变量和浏览器检查见[兼容性验证](docs/VALIDATION_zh-CN.md)。

- [使用与状态解释](docs/USAGE.md)
- [开发者指南](docs/DEVELOPER_GUIDE.md)与[API](docs/API.md)
- [架构与交互图](docs/ARCHITECTURE.md)
- [assembler 接入](docs/ASSEMBLER.md)与[无会话预览](docs/SOURCE_PREVIEW.md)

MIT 许可。
