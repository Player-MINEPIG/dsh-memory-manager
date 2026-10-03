# DSH Memory Manager · 记忆管理

统一查看持久化资源、编辑来源支持的内容，并用 `on / rule / strategy / preset` 管理资源如何使用。来源系统继续持有内容、版本、历史和写入权限；本插件不复制任务账本，不内置向量数据库、总结模型或任务执行引擎。

DSH 原生全局 Settings「记忆管理」与会话顶栏「记忆」共用同一投影，默认展示应用情况，可按轮次、轮次来源、触发状态和资源来源过滤。三种状态为「未触发」「曾触发」「正在触发」；已进入请求的证据单独显示。预览、目录可用、读取成功都不等于模型已使用。

## 安装

目标 DSH `0.2.0-rc.2`、Node.js 22 或更新版本。当前为本地开发版本，尚未发布到 npm 或 GitHub。

```sh
npm install
npm run check
dsh plugin --profile web add /absolute/path/to/dsh-memory-manager
```

包同时提供 `dsh.bundle`、`cordis.patch.yml` 和预构建 client。默认配置位于 `$DSH_HOME/dsh-memory-manager/config.json`。将 [examples/config.json](examples/config.json) 复制到该位置后编辑，在面板点击「重载本地配置」。每次修改递增 `revision`。缺失、损坏或不兼容的配置显示错误，不悄悄生效。旧有效值保留供查看；托管执行在错误期间被阻止。

卸载用 `dsh plugin --profile web remove dsh-memory-manager`。来源资源不删除，已持久委托管理的资源不会因为卸载而自动恢复原生执行；需通过来源提供的明确所有权转换。

## 资源与使用

- 同一个 `id` 是同一个实体和同一份当前内容。复制必须生成新 ID；作用域不能隐式创建副本。
- `type` 由来源定义并校验内容结构；`content` 从权威来源读取，不另存一份。
- 默认白名单为空；至少命中一条白名单且没有命中黑名单才适用。适用性不是访问授权。
- `store/retrieve.on` 定义检查时机；`rule` 支持 `all/any/not/at_least` 和已注册条件；`strategy` 是一个操作或顺序操作链。
- preset 持续覆盖明确提供的字段。名单、规则树、操作链整体替换；空值与未提供不同。`id/content` 不被覆盖。UI 展示字段来源。
- 来源原生管理、已委托管理、托管但不适用是不同状态。已托管资源缺配置时拒绝执行。

卡片变量写入使用独立的 `card_variable_update` 时机和来源验证事务。代码审批、写能力授权和管理规则是分别校验的条件；默认示例不启用写，历史气泡不提升到当前可写范围。`mvu_card_write_cause` 可筛选宿主确认的交互、定时器或脚本调用原因，不能代替授权。具体合同见 API 文档。本地合成卡已验证完整授权、写入、通知、撤销和首轮失效链路；这不代表任意第三方卡片或完整 Helper 框架兼容。

复杂配置为本地 JSON；不会运行文件中的 JS。可信 Host 插件可注册条件/操作。时间检查点可接同一触发协议；主动唤醒 Agent 还需宿主调度与授权，本插件不建立后台任务循环。

## 可选适配

| 来源 | 当前能力 | 边界 |
| --- | --- | --- |
| DSH Skills | 目录与正文读取；会话查询使用真实 Agent scope | 优先会话 preset registry，未知会话不回退全局；无编辑接口，明确只读 |
| Tavern 世界书 | 通过公开 v1 HTTP API 读目录、正文和评估记录 | 当前显式绑定、公开 active 有效资源与历史 Trace 的并集；active 不作为触发证据；无原子 CAS API，明确只读 |
| Tavern MVU v1 | 公开服务包装、CAS 编辑、使用决策、真实事件观察；可选 card_variable_update 策略桥 | 需要提供 `tavernMvu` v1 的 Tavern 版本；不把旧 Tavern 当作已兼容 |
| Tavern Request Sources v1 | `memory-manager.resources` 只读来源，版本化块标识 | 需支持 request assembly v1 的 DSH core；用户自行选择装配来源；不会自动改预设 |
| TaskSystem | scope/authority/使用协议兼容边界 | 本版本没有 TaskSystem adapter，不开放额外模型工具或放宽 guard |

世界书 HTTP 适配默认不启用。共装同一隔离 Host 时可在 profile patch 配置：

```yaml
- id: dsh-memory-manager
  config:
    storageDir: !!js dshHomePath('dsh-memory-manager')
    tavernBaseUrl: http://127.0.0.1:3080
```

HTTP 地址只接受明确配置的 loopback origin。管理路由使用 DSH `connection.admit` 原有 Host/Origin 与浏览器认证，认证服务缺失时不开放路由。来源错误或卸载会显式显示，不把旧内容当作当前值。MVU 与装配来源通过可选 Cordis 服务自动发现，核心和两面板无需 Tavern。独立记忆面板和 Skill 读取可在官方 DSH 0.2.0-rc.2 使用；Tavern 完整请求注入另需 prepared Session/AgentLoop 核心扩展，stock RC2 会明确拒绝装配策略。运行时与验收范围见 [验证说明](docs/VALIDATION.md)。

文件 Skill 用来源路径形成身份。虚拟 Skill 可在 `metadata.dshResourceIdentity` 声明 `{version:1, namespace:"your.source", id:"your-resource"}`；实体 ID 只由此身份决定，正文只影响 revision。声明必须由来源维护，copy 使用新 id，独立 shadow 使用独立 id。没有声明的虚拟 Skill 仅提供当前查看周期的临时句柄、诊断和 `bind:false` 能力，禁止持久绑定配置；不会将正文、会话或 registry 对象伪装成持久身份。

注册与使用协议见 [docs/API.md](docs/API.md)。验证范围与复现步骤见 [docs/VALIDATION.md](docs/VALIDATION.md)。MIT 许可。Awesome 列表的公开仓库年龄、真实提交数量、topic、维护和收录审核属于外部条件；本地可安装不代表已满足这些条件。

## English

A resource manager and usage protocol for DSH. Providers remain authoritative for content, revision, permissions and atomic writes. Two native panels expose configuration provenance and actual usage evidence. JSON policies use explicit timing, composable rules, trusted operation chains and continuously overriding presets. Optional adapters live in this repository; source systems do not depend on the manager. No vector engine, summarizer, task ledger copy or autonomous scheduler is included. This is an unpublished local development build; browser acceptance and cross-plugin integration must be reported separately from unit tests.

### 筛选与配置重读

全局面板只筛选资源提供方；轮次、轮次来源、触发状态属于会话面板。筛选均可多选，同一项内满足任一选择，不同项同时满足，清空选择即不限；切换会话或重新打开面板时重置。资源提供方按 `adapterId` 路由到来源，属于管理接入信息，不是用户内容字段，也不是 `preset`。`preset` 持续覆盖其明确提供的配置字段。

「重新读取管理配置」读取服务端已保存的规则与预设。未改动显示“已是最新”；改动必须带更高配置版本，通过校验后才生效。失败保留原有效配置，不自动改版本。查询范围及提供方返回数量可帮助区分没有资源、筛选无匹配和来源读取失败。全局技能注册表不会自动汇总会话目录，安装提供方也不代表此范围已有技能。
