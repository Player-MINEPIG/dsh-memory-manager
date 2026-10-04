# DSH Memory Manager · 记忆管理

统一查看持久化资源、编辑来源支持的内容，并用 `on / rule / strategy / preset` 管理资源如何使用。来源系统继续持有内容、版本、历史和写入权限；本插件不复制任务账本，不内置向量数据库、总结模型或任务执行引擎。

DSH 原生全局 Settings「记忆管理」与会话「记忆管理」页签共用资源表格，管理配置和筛选分别在同一内容区域的独立页面打开。全局筛选配置字段与资源提供方；会话另有轮次、轮次来源和触发状态。三种状态为「未触发」「曾触发」「正在触发」；已进入请求的证据单独显示。预览、目录可用、读取成功都不等于模型已使用。

会话中的记忆管理使用与 Trace 同层的「记忆管理」页签。顶部不再提供重复按钮；尚未发送消息等核心不显示会话页签的状态也不增加替代入口。全局资源与配置仍可从设置中的「记忆管理」查看。

含本插件的会话页签使用紧凑间距；窄屏可横向滚动选择页签。会话资源表格也可在表格内部横向滚动。

## 安装

目标 DSH `0.2.0-rc.2`、Node.js 22 或更新版本。当前为本地开发版本，尚未发布到 npm 或 GitHub。

```sh
npm install
npm run check
dsh plugin --profile web add /absolute/path/to/dsh-memory-manager
```

包同时提供 `dsh.bundle`、`cordis.patch.yml` 和预构建 client。默认配置位于 `$DSH_HOME/dsh-memory-manager/config.json`。可在详情页校验并保存本地条目，成功保存会自动递增 `revision`。手动编辑文件可参考 [examples/config.json](examples/config.json)，修改后递增 `revision`，再点击「重新读取管理配置」。未修改文件时重复读取为正常无操作。缺失、损坏或不兼容的配置显示错误，不悄悄生效。旧有效值保留供查看；托管执行在错误期间被阻止。

卸载用 `dsh plugin --profile web remove dsh-memory-manager`。来源资源不删除，已持久委托管理的资源不会因为卸载而自动恢复原生执行；需通过来源提供的明确所有权转换。

## 资源与使用

- 同一个 `id` 是同一个实体和同一份当前内容。复制必须生成新 ID；作用域不能隐式创建副本。
- `type` 由来源定义并校验内容结构；`content` 从权威来源读取，不另存一份。
- 默认白名单为空；至少命中一条白名单且没有命中黑名单才适用。适用性不是访问授权。
- `store/retrieve.on` 定义检查时机；`rule` 支持 `all/any/not/at_least` 和已注册条件；`strategy` 是一个操作或顺序操作链。
- preset 持续覆盖明确提供的字段。名单、规则树、操作链整体替换；空值与未提供不同。`id/content` 不被覆盖。UI 展示字段来源。
- 来源原生管理、已委托管理、托管但不适用是不同状态。已托管资源缺配置时拒绝执行。

卡片变量写入使用独立的 `card_variable_update` 时机和来源验证事务。代码审批、写能力授权和管理规则是分别校验的条件；默认示例不启用写，历史气泡不提升到当前可写范围。`mvu_card_write_cause` 可筛选宿主确认的交互、定时器或脚本调用原因，不能代替授权。具体合同见 API 文档。本地合成卡已验证完整授权、写入、通知、撤销和首轮失效链路；这不代表任意第三方卡片或完整 Helper 框架兼容。

详情页通过独立选项页编辑类型、预设、名单、存储和读取字段，支持搜索、来源/预设筛选、参数控件、条件树和顺序操作链。未知参数原样保留并允许明确替换；管理配置无需手输 JSON。完整能力、内置预设与本地声明扩展示例见 [选项与扩展文档](docs/OPTIONS.md)。不会运行配置文件中的 JS。可信 Host 插件可注册条件/操作。时间检查点可接同一触发协议；主动唤醒 Agent 还需宿主调度与授权，本插件不建立后台任务循环。

## 可选适配

| 来源 | 当前能力 | 边界 |
| --- | --- | --- |
| DSH Skills | 目录与正文读取；会话查询使用真实 Agent scope | 优先会话 preset registry，未知会话不回退全局；无编辑接口，明确只读 |
| Tavern 世界书 / Prompt Template | `tavernMemorySources` v1 的目录、正文、来源 CAS 与 native/managed 策略桥 | 仅声明来源已实现的固定读取链；模板为只读求值子集，世界书独立库与内嵌资源以来源实际声明的能力为准。旧 HTTP 世界书桥明确只读 |
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

全局面板筛选资源提供方与全部配置字段（ID、类型、预设、白/黑名单、store/retrieve 的 on/rule/strategy）；轮次、轮次来源、触发状态属于会话面板。筛选均可多选，同一项内满足任一选择，不同项同时满足，清空选择即不限；返回表格保留筛选与滚动位置，徽标统计启用维度；切换会话或重新打开面板时重置。筛选使用含预设覆盖的生效配置；复杂值通过已命名选项或组合控件选择，按规范值精确匹配，不执行规则。资源提供方按 `adapterId` 路由到来源，属于管理接入信息，不是用户内容字段，也不是 `preset`。`preset` 持续覆盖其明确提供的配置字段。

「重新读取管理配置」读取服务端已保存的规则与预设。未改动显示“已是最新”；改动必须带更高配置版本，通过校验后才生效。失败保留原有效配置，不自动改版本。查询范围及提供方返回数量可帮助区分没有资源、筛选无匹配和来源读取失败。全局技能注册表不会自动汇总会话目录，安装提供方也不代表此范围已有技能。

### 本地配置编辑

详情展示资源身份、本地值、生效值及默认/本地/预设来源。未配置资源的管理字段显示“未配置”，来源的类型元数据另行标注。ID 与 adapterId 只读；复制资源生成独立新 ID，内容从来源单独读写。保存只更新该本地条目，不修改预设定义，也不把预设覆盖后的值写回本地。

校验只检查 JSON、来源配置合同及注册能力，不读取资源或运行事件、规则、操作。未注册/不支持能力明确报错，事件上下文、资源存在性与权限仍标记为运行时未验证。通过校验不授予权限或自动委托管理。页面草稿不会持久保存，离开时提示。

保存重新校验、比较编辑版本和磁盘内容，写入同目录临时文件并原子替换，成功后版本加一；冲突或失败保留现行配置与草稿。插件内写入串行化；外部编辑器需遵守 revision 协议，不能把本地文件系统当作跨任意进程的事务数据库。
