# 选项目录协议 1

[English](OPTIONS_en.md) · [API](API.md) · [预设](PRESETS.md)

GET /options 用 JSON 描述注册能力，返回 version:1 与 catalogRevision，不注册代码、不授权访问、不选择装配来源、不转移 ownership 或运行策略。资源 ID 与装配来源 ID 独立。注册/卸载/同函数 ABA 重注册/descriptor/enable 变化使旧目录失效；expectedCatalogRevision 与 expectedRevision 分开。

## 来源声明

optionCatalog 含 version/types/events/strategies/presets/modes。types 为 id/label/description?，events 另含 mode:store|retrieve，strategies 给 mode/events/value（真实操作链），presets 只含 type/store/retrieve 配置，排除身份/正文/provider/名单。modes 声明 supported/reason?/onSelection:single|multiple/strategySelection:fixed|chain；缺支持表示未知。descriptor 不实现可执行能力；参阅[可运行 adapter 示例](examples/notes-adapter.js)。

来源自己执行时声明 strategyOwner:'source'、validateConfig 与真实固定链；usage 决策给 enabled/reason?/configRevision/strategy/checkCurrent，来源在最后 await 后同步复验。当前注册委托与旧显式 ownership 分开，通用执行不重复来源链。

## 条件、操作与参数

可信 Host registerCondition/registerOperation 可声明 label/description/adapterIds/types/modes/parameters。参数支持 string/number/integer/boolean/object/array、标量 enum、properties/required、items；边界有 minimum/maximum、minLength/maxLength、minItems/maxItems。不支持 $ref、表达式、HTML component 和未知 schema 字段。上限：嵌套 5、300 schema nodes、默认展开 1000 项；缺省字符串 10000 字符/array 100 项，注册 64 KB/来源目录 256 KB，每类选项 200 项。空适用性 array 不额外限制；旧无参数描述者保留原值并明确不可编辑，不猜控件。validate/save 和运行层检查同一能力。

## 编辑与本地组合

UI 可选择注册选项，适用性仅为提示，最终校验/保存决定兼容性。选项页草稿与“保存并返回”只改父页内存，显式保存才经 revision/磁盘 CAS 写文件，冲突保留草稿。清子字段不同于移除整个 store/retrieve；显式空模式有意义，预设覆盖持续。未知安全 JSON 扩展成员和条件参数保留。

本地配置 catalog 可含 rules/strategies array，每项 id/label/value 及可选 description/adapterIds/modes，为引用可信能力的纯 JSON 具名组合，不注册代码。维护时提高 revision 并 reload，保留现有 entries/presets；非法 descriptor 拒绝发布并保留当前有效文档。filters 使用 canonical 值，同字段 OR、不同字段 AND，不求值条件。

## 预设与路由

内置 builtin:skill-retrieve、builtin:mvu-managed、builtin:worldbook-retrieve、builtin:prompt-template-retrieve。不再提供原生卡片交互默认预设；旧不支持定义可查看但拒绝导入/保存。用户同 ID 定义覆盖内置；adapter 默认为 adapter:<adapterId>:<presetId>，显式保存才物化选择的定义。复用预设不含白/黑名单，scope 为资源本地字段。可移植格式见 [PRESETS](PRESETS.md)。

adapterId 为规则路由，sourceAdapterId 保留正文权威来源。跨路由需只读 validateResourceRoute 确认 supported:true 与精确 id/sourceAdapterId，来源固定链不得跨路由。不迁移正文/权限/复制身份。正文编辑能力独立；当前 runtime 资源/目录开关撤销 lease，不删数据，重启恢复默认。

## Scope 与默认

选择 global/sessionId/workspaceId/characterId/presetId/userId。名称不是身份或访问授权，事实由可信 Host directory lease 解析。DSH 冷目录保留有界公开 header 与零 I/O 标题 cache，不读正文/激活 Agent；默认 2000 条/1 MB/3 秒等待/15 秒 TTL，可至多十倍。上游枚举没有分页。可选 Tavern metadata 目录给角色/ST 预设/Persona ID；缺能力不回退正文列表。

getManagementDefaults 给有版本、不含正文的 source-bound 默认，与选项预设不同。有效顺序为来源默认 → 本地 → 引用预设，再对明确跟随的字段使用实时来源默认，显式空 scope/mode 与 deny 保留。恢复默认只改本资源草稿的已知覆盖/preset/跨路由，保留未知字段、正文和全局预设，经 validate/save CAS 才生效。原生卡片变量权限始终归来源。

## 文档与模型使用

GET /documentation?document=OPTIONS 在 Host admission 下以转义输入和禁止脚本 CSP 渲染 Markdown，另支持 API/VALIDATION/README/PRESETS。原生 Skill 工具与显式指令无需 assembler；Manager 通用正文提供（包括配置检索的 Skill）需显式 assembler memory-manager.resources 规则；世界书/MVU/模板从其自己的已选来源贡献，不重复提供。模板依赖按依赖自己的 scope/rule/strategy 决策，并最终复验来源 checkCurrent，不用 consumer 规则替代。native acknowledgement 与生命周期详细规则见 [API](API.md)。
