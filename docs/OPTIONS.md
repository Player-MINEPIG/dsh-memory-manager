# Option catalog protocol 1

This catalog describes existing capabilities for the manager UI. It does not register executable code, grant authority, select an assembly source, transfer management ownership, or execute a condition/strategy. Resource IDs and request-assembly source IDs are different identities.

GET `/options` returns `version:1` plus `catalogRevision`, independent of configuration/resource revision. The revision includes capability registration generations and descriptor/option definitions; unload and same-function re-registration change it. Editor requests may supply `expectedCatalogRevision`; stale selections must be revalidated.

## Source adapter declaration

A trusted adapter may expose this JSON-only `optionCatalog`:

```js
{
  version: 1,
  types: [{id: 'example-resource', label: 'Example resource', description: '...'}],
  events: [{id: 'before_model_request', label: 'Before model request', mode: 'retrieve'}],
  strategies: [{
    id: 'example.render', label: 'Read and render', mode: 'retrieve',
    events: ['before_model_request'],
    value: [{operation: 'read_content'}, {operation: 'render'}]
  }],
  presets: [{
    id: 'example.default', label: 'Read configuration',
    configuration: {type: 'example-resource', retrieve: {
      on: 'before_model_request', rule: true,
      strategy: [{operation: 'read_content'}, {operation: 'render'}]
    }}
  }],
  modes: {
    store: {supported: false, reason: 'Source does not expose managed storage'},
    retrieve: {supported: true, onSelection: 'single', strategySelection: 'fixed'}
  }
}
```

`mode` is `store` or `retrieve`. `onSelection` is `single` or `multiple`. `strategySelection` is `fixed` (select a complete source-owned chain) or `chain` (compose registered generic operations). Missing mode support is unknown, not supported. Labels/descriptions are presentation text, never executable content. `events` on a strategy lists compatible event IDs. Preset definitions must omit identity/provider/content fields. They do not supply a scope or change management ownership implicitly. A source should omit whitelist/blacklist from a reusable preset when the user must choose scope locally.

For source-owned execution, declare `strategyOwner: 'source'` and retain source `validateConfig` plus its actual ordered execution. Optional `registerUsage(handler)` follows the existing MVU decision contract: source sends `{id,on,scope,event,managementMode}`; handler returns `undefined` for native management, otherwise `{enabled,reason,configRevision,strategy,checkCurrent}`. The source must validate every returned synchronous lease after its final await, immediately before committing/using the managed decision. This policy does not replace source permissions, CAS, resource selection or idempotency. Unsupported events fail closed. Disposal must unregister usage and resource access together.

Tavern may provide a `tavernMemorySources` Host service `{protocolVersion:1, adapters:[adapter,...]}`. Each adapter is a trusted object with the manager's existing `list/read/validateConfig` contract and optional CAS content/ownership methods. The service lifetime owns this stable array. Manager attaches/detaches it with the Host service lifecycle. Suggested stable adapter IDs are `tavern.world-books` and `tavern.prompt-templates`; their resource IDs are respectively `world-book:<source-id>` and `prompt-template:<source-id>`. Sources must keep configuration templates, prompt template resources and assembly source descriptors distinct.

## Registered condition and operation parameters

The existing trusted `registerCondition({id,test,...})` and `registerOperation({id,run,...})` registrations may additionally declare `label`, `description`, `adapterIds` and `parameters`. No function is serialized into the catalog. Parameters use a bounded declarative schema:

```js
parameters: {
  type: 'object',
  properties: {
    cause: {type: 'string', label: 'Cause', enum: ['user-interaction','interval','script']},
    limit: {type: 'number', label: 'Limit', minimum: 1, maximum: 20}
  },
  required: ['cause']
}
```

Supported types are string, number, integer, boolean, object and array. `enum` values have the declared scalar type. Objects use named properties and explicit required names; arrays declare `items`. The UI uses typed controls, not JSON text. Unsupported/undeclared parameter shapes remain explicitly uneditable rather than discarded. Runtime implementation and validation stay authoritative.

Local declarative named combinations reference these registered capabilities; local JSON never registers executable JavaScript. Catalog/UI editing does not persist draft option definitions. Custom definitions are maintained in the local configuration file, followed by revision-safe reload.

## 使用与内置预设

已注册选项均可选择与组合。来源、模式和类型适用性作为提示，可主动筛选；不会提前禁选或隐藏。最终校验与保存检查注册能力、参数、来源支持和路由冲突。预设明确提供的 type 优先；编辑已知条件参数会保留 condition 对象中已有的扩展成员。

“清空本地字段”仅删除该子字段，有意设置的空 store/retrieve 对象仍会保留。“移除本地存储配置／读取配置”删除整个本地模式及其存在标记；预设引用不变，预设提供的模式仍会生效，需调整预设引用才能去除。保存或校验期间不能移除模式。

点击配置字段进入独立选项页，搜索名称或说明，再按资源提供方或预设缩小范围。选择只修改本页草稿；左上返回丢弃本页修改，底部“保存并返回”提交到父草稿，不写文件。父页“保存管理配置（写入文件）”重新校验，检查总配置 revision 与磁盘 CAS，通过后原子写入。失败与冲突保留草稿，不覆盖文件。筛选页也使用独立草稿，保存并返回才应用。筛选同字段内 OR、不同字段间 AND，空选不限，不执行条件。未知安全 JSON 扩展字段、条件成员和参数保留原值，正文不属于管理规则。

## Adapter

表格中筛选按钮左侧的 Adapter 页展示已注册资源 adapter 与目录 adapter。开关立即影响当前 manager 的查询、规则执行和租约；不删除正文或规则文件。卸载由 Host 插件管理负责，再次注册或重新启用需重新校验。开关为当前进程状态，重启恢复默认启用。缺失 adapter 显示可信插件的安装与版本说明；manager 不安装仓库、不更改权限。

资源权威来源保持只读。条目的 `adapterId` 可以选择任何已注册规则路由；跨源时增加 `sourceAdapterId` 保存原正文来源。所选 adapter 必须实现只读 `validateResourceRoute({id,sourceAdapterId,scope,signal})` 并确认 `{supported:true,id,sourceAdapterId}`。当前来源固定策略的跨源路由不受支持，保存明确报告冲突。manager-owned 策略在受支持路由中仍由原来源读取正文；原来源权限、版本和稳定 ID 始终有效。此设置不迁移、复制或接管正文。

“规则由来源执行 / 规则委托记忆管理执行”只说明规则执行模式。正文编辑能力单独展示：只有来源提供 update 且资源未声明只读时才显示编辑器；提交仍由来源验证权限、CAS 与 operationId。切换 managed 不增加权限，Skill 注册表、内嵌世界书等只读来源仍可能不可编辑。跨源规则设置也不授予正文写权限。

“移除本地存储 / 读取配置”只移除本地规则覆盖，回到预设或默认值；不删除资源正文。来源原生行为是否继续由来源自己的模式和权限决定。

## Scope

白名单与黑名单用来源实体目录选择稳定 ID，不要求填写 ID。会话按标题与 Workspace 查找；Workspace 按注册名称选择。DSH adapter 使用公开 `sessionQuery.listSessions(signal)` 的来源可见 header 快照纳入未加载冷会话；标题只来自零 I/O 缓存投影，标明“缓存标题”，可能陈旧，缺缓存显示“未命名会话”。它不读取正文、不调用内容搜索或激活会话。Workspace 选择只查公开 WorkspaceRegistry，不枚举会话。缺公开冷目录服务时明确回到已加载会话范围。

manager 一次保留 header 快照，默认最多 2000 条、1 MB，获取与每页 metadata stat 等待最多 3 秒，TTL 为 15 秒；可在 Host 配置 `scopeDirectoryLimits` 调整，每项必须为正整数且不超过默认值的 10 倍。超限会明确提示“不是全部会话”，只搜索保留范围，可刷新；输入变化不会逐次全量枚举。游标签名并绑定来源快照、查询和 Workspace；TTL、来源卸载、目录/Workspace 变化、标题事件、每页 metadata stat 发现删除或身份变化后拒绝旧游标。DSH 上游公开 header list 本身未分页，manager 的保留与时间界限不能限制来源内部枚举或分配，不能声称是来源分页。

可选 `tavernScopeCatalog` Host 服务 v1 提供分页 `searchScopes({field,query,cursor,limit})`，field 为 characterId / presetId / userId，仅返回 `{items:[{id,name}],nextCursor}`。角色卡对应来源 selection.characterCardId；presetId 是 Tavern/ST prompt preset；userId 是 RP Persona，不是 DSH 登录账号。缺服务的版本显示安装说明，绝不回退到会读取全部正文的旧列表 API。

目录 provider 负责每页实际可见性校验。当前本机 Host admission 与来源已有权限边界保持有效；不新增或伪造 principal ACL。目录可见、选择 scope 或修改名单均不授予内容访问或 prompt 使用权。

执行时事实由可信 Host 的 `resolveScopeContext` 提供，浏览器不能传入 Workspace/角色/预设/Persona 标签冒充事实。Host-only lease 必须保留并在每次 await 后及最终使用前检查；adapter 停用/卸载、selection 或目录代次变化使租约失效。未注册事实不会匹配该 scope 条件。

## 浏览器文档

本页和 API / VALIDATION / README 通过 `/api/dsh-memory-manager/documentation?document=OPTIONS` 渲染为 HTML，保持 Markdown 单一来源。HTML、代码和链接均转义/校验；CSP 禁止脚本与外部资源执行，不加载外部 JavaScript。

| 管理预设 ID | 来源与明确覆盖的字段 |
| --- | --- |
| `builtin:skill-retrieve` | DSH Skills：type=skill；请求前、始终满足、读取正文并转文本 |
| `builtin:mvu-managed` | MVU：type=mvu-state；助手提交后解析/验证/应用；请求前读取/渲染/提供 |
| `builtin:mvu-card-interaction` | MVU：type=mvu-state；卡片更新时检查 user-interaction，验证并应用更新；不授予写权限 |
| `builtin:worldbook-retrieve` | 新世界书服务：type=world-book；请求前激活并输出 |
| `builtin:prompt-template-retrieve` | 新模板服务：type=prompt-template；请求前只读展开并输出 |

预设持续覆盖其明确提供的本地字段，未提供字段继续取本地值；名单、规则、链为整体替换。内置预设不含白/黑名单，不自动启用资源或改变 native/managed。用户 `presets` 中同 ID 的定义优先于内置版本。来源 `optionCatalog.presets` 是描述，不能注入新的权威配置；来源可描述上述相同 ID/定义，扩展管理预设须明确写入本地 `presets`。选择引用不会复制定义为本地字段。

Skill 的模型贡献需选中 `memory-manager.resources` 装配来源。世界书由 Tavern worldbook 来源执行；模板需选中 `pmp-dsh-tavern/prompt-template`。manager 不重复执行 source-owned 策略。旧 Tavern 世界书 HTTP 桥没有托管能力；服务缺失或固定链不支持时不伪造可用选项。managed 资源还需来源侧明确接管与当前有效 lease；manager 缺失、规则拒绝或配置不可用不能回退 native 放行。来源权限、范围、版本和实际事件仍在执行时验证。

## 本地扩展示例（配置维护者）

可信 Host 插件注册实际 condition/operation 后，可以在配置文件维护纯数据组合；界面用户直接选择这些已命名选项。

```json
{
  "schemaVersion": 1,
  "revision": 2,
  "presets": {
    "local:skills": {
      "type": "skill",
      "retrieve": {"on":"before_model_request","rule":true,"strategy":[{"operation":"memory.read_content"},{"operation":"memory.to_text"}]}
    }
  },
  "entries": [],
  "catalog": {
    "rules": [{"id":"local:never","label":"暂不使用","adapterIds":["dsh.skills"],"modes":["retrieve"],"value":false}],
    "strategies": [{"id":"local:skill-text","label":"技能正文","adapterIds":["dsh.skills"],"modes":["retrieve"],"value":[{"operation":"memory.read_content"},{"operation":"memory.to_text"}]}]
  }
}
```

配置修改后递增 revision 并重新读取；不要覆盖现有 entries/presets。`catalog` 只添加命名组合，不注册代码，不修改配置引用语义。每类最多 200 项；每个来源目录最多 256 KB，单项注册描述最多 64 KB。参数 schema 支持 label/description/default；数值 minimum/maximum，字符串 minLength/maxLength（默认最多 10000 字符），数组 minItems/maxItems（默认最多 100 项），对象 properties/required。嵌套最多 5 层，最多 300 个 schema 节点，默认展开最多 1000 项；拒绝 `$ref`、表达式、HTML组件或其他未声明属性。注册元数据可用 `adapterIds`、`types`、`modes` 限定能力范围；缺省空数组表示不额外限制。参数由校验/保存及执行层检查。旧没有参数描述的扩展原样保留参数且不提供虚构控件，来源最终校验仍有决定权。

通用事件目录列出内置接线已知的事件；可信插件仍可通过公开 trigger 协议显式发出自己的事件。来源固定策略的实际语义最终由 validateConfig 决定，目录不是绕过来源验证的授权凭证。运行中的配置、来源或能力代际变更会阻止后续操作；已经由来源提交的副作用不能由 manager 追溯撤回。

### Template dependency usage

A trusted source may request the same `before_model_request` usage decision for a dependency resource, with `event.usage:'prompt-template-dependency'` and `event.consumer:{adapterId:'tavern.prompt-templates',id:<actual-template-id>}` plus preview/turn/step. These fields are context only. Manager evaluates the dependency's own adapter, scopes, rule and supported strategy, never the consumer's policy as a substitute. Source `resolvePromptDependency(...)` returns `{content,revision,configRevision,checkCurrent}` only within Host code; the source binds selection, content revision, management mode and manager lease. The template source must lazily acquire only used dependencies, bound recursion/count/depth, and synchronously recheck every dependency lease after its final await. VM-provided claims are not proofs. Missing source implementation must report unsupported. Acceptance of this event shape does not certify any particular Tavern release's helper implementation.

For this dependency API only, registered manager listeners explicitly acknowledge native reads with `{enabled:true,configRevision:null,strategy:<source's fixed retrieve chain>,checkCurrent}`. They do not apply managed entry scopes/rules to a native resource or change ownership. Ordinary native events still abstain. The native acknowledgement expires on manager/source unload, ownership conflict, configuration document/reload/error-state changes and capability generation changes. A pre-existing manager configuration error does not itself convert or deny native source authority; changing that state revokes the outstanding acknowledgement. Target sources must still apply their own scope/content/selection/management-mode lease and synchronously check all registered acknowledgements. Managed resources retain their own configuration/rule denial and never use this native path.

本地 catalog 的 rules/strategies 必须为数组；选项若提供 adapterIds/modes，必须为合法数组，description 必须为文本。非法描述在发布新版本前被拒绝，当前有效配置与选项目录保持可用。

## Restore source defaults

The detail page shows the source-reported current manager and the effective default/local/preset rules separately from resource content. `getManagementDefaults` supplies an optional versioned source-bound policy base; option presets alone are not active default policies. Existing preset precedence remains. Source-default eligibility is not an all-session selector or permission grant. Explicit empty scopes/modes and deny rules remain effective.

「恢复来源默认配置」 clears the selected resource's known rule and scope overrides, preset reference and alternate rule route in its draft. It previews the composed result through normal validation and takes effect only through the existing save/CAS action. Opaque fields, global preset definitions, content and current delegation remain. If the source cannot provide a valid default snapshot, the action explains why restoration cannot be previewed. Content editing never implicitly changes these rules. For compatible lifecycle sources the content editor does not offer the old resource-mode toggle as a way to change registration-based delegation.
