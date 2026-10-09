# Manager 合同（协议 1）

v1.0.0 包版本保持服务协议、配置 schema 和预设格式为 1。轮次标题隐藏未知 turnKind，不修改原始回执。Skill 是注册表声明的资源类型，provider 是加载渠道；当前 adapter 不完整暴露目录来源。

[English](API_en.md) · [第三方开发者指南](DEVELOPER_GUIDE.md) · [选项目录](OPTIONS.md) · [存取预设](PRESETS.md)

Host 服务 dshMemoryManager 保存声明式配置和有界观察。正文、来源事务与 DSH durable history 不进入中心记忆库。根包入口为 Host 插件，MemoryManager 库通过 dsh-memory-manager/manager 导入。公开方法由 src/manager.js、src/usage.js 和 src/http.js 实现。

## 资源 adapter 与 scope

registerAdapter({id,name?,authority,list,read,...}) 返回 disposer。list({scope,signal}) 返回记录数组，read({id,scope,signal}) 返回记录或 null。记录含稳定 id/type/revision，可含 name/content/authority/capabilities；来源前缀 ID 不随正文变化，不把 scope 当成新身份。可选 update({id,content,expectedRevision,operationId,scope,signal})、copy({id,newId,scope,signal})、setManagementMode、validateConfig、validatePreset、observe、optionCatalog，分别由来源声明实际能力与校验。来源执行自身权限/CAS/幂等；Manager 预留身份不是来源账本。committed:false 的真实提交前拒绝释放本次预留；模糊结果标记 MUTATION_OUTCOME_UNKNOWN，需权威回读核实。

scope 为 Host 绑定 JSON，可含 sessionId/branchId/authority/taskId/runId/attemptId，不序列化真实 Agent key。依赖 Agent 的 adapter 在可信闭包解析，远端不得回退本地账本。UI 不是模型工具授权。目录只丰富 session lookup anchor，不能改换 sessionId；非来源调用方的 workspace/character/preset/persona 声明被丢弃，可信来源事实冲突拒绝，null 表示缺失。checkCurrent 只接受同步 true。

catalogScope:'all-sessions' 表示原生默认目录，仍受来源 scope/权限约束。要求真实绑定的来源用 listBound({scope,signal}) → {items,revision,checkCurrent}，items 仅 metadata 和 binding，不含正文。查询在最后 await 后核对来源/注册/enable/代次租约。缺绑定能力报告 unconfirmed，不全局回退；无资源的确认目录返回 0。当前未配置规则的绑定资源仍显示，其他卡规则、旧 Trace 和名单不建立绑定。metadata 上限 2000 项/1000000 JSON 字符。withSessionRead 可短期借用冷会话，不能激活 Agent 或追加历史；初始化未就绪 503，缺会话 404。

## 配置、查询与观察

getConfig(id) 返回 config/origins/revision。字段为 id/adapterId/sourceAdapterId?/type?/preset?/whitelist/blacklist/store/retrieve。store/retrieve 含 on/rule/strategy；预设持续覆盖明确提供的字段，rule/list/chain 整体替换。显式空白名单匹配不到，黑名单优先。配置只能为安全 JSON。

query({scope?,turn?,turnKind?,status?,adapterId?,filters?,signal?}) 返回 protocolVersion/revision/configError/rows/diagnostics/catalogs/facets/scope/adapters。turn/turnKind/status/adapterId 接受 scalar 或 array，同维 OR、不同维 AND、空 array 不限；HTTP 用重复参数，逗号是 ID 原文。配置 filters 为字段键对象，mode:exact|contains、values:string[]、missing?；允许 id/type/preset/whitelist/blacklist/store.on/store.rule/store.strategy/retrieve.on/retrieve.rule/retrieve.strategy。复杂值为排序 key 的 canonical JSON，不执行条件。facets 在配置/状态筛选前生成；会话 facets.turns 合并公开会话历史中真实的 turn/start 轮次与已记录资源轮次，独立于资源目录和筛选结果。无资源轮次仍保留，不按最大轮次补造缺号；catalogs 给来源原始数量，失败为 null。状态 running/past/never 与 activeFacts/facts 分开；never 是未记录触发，不证明从未使用。会话页按真实 turn 展示，全局页不虚构轮次；读取当前正文/配置，不重建历史资源。

recordTrace({adapterId,id,eventId,phase,evidence?,mode?,on?,sessionId?,turn?,turnKind?,requestId?,revision?,configRevision?,strategyRevision?,detail?}) 记录 started/triggered/applied/skipped/failed/completed。mode 为 store/retrieve，on 为实际执行时机；Manager trigger 会记录两者，来源观察保留实际操作方向。活动、去重和重启时的结束匹配分别按操作方向及事件身份处理。既有查询 status:running/past/never 保留兼容，UI 不以它代替逐轮存储/读取触发判断。会话查询另外通过公开 sessionQuery.observeSession 只读投影已有 request/assembly 的世界书来源证据；来源版本诊断必须对应装配节点，预览与无对应节点的证据不计触发。历史事实标记 origin:dsh-history，只补充 triggered/skipped，不把装配记录提升为提供方送达或 applied；已确认进入请求的观察回执按资源、requestId 与操作方向优先；同一次仅有读取成功或执行尝试不压制请求证据，不重复记入 journal。读取失败显示诊断。journal 最多 2000 条，单事实上限 32000 JSON 字符；预览不产生 applied，不是持久幂等库或权威历史。turnKind 为 human/task/system/unknown，任务注入不能标成用户轮次。

## 使用能力与原生 MVU 写入

registerCondition({id,test,...metadata}) 和 registerOperation({id,run,readOnly,...metadata}) 返回 disposer。trigger({id,event,mode,preview,observeRead?,signal,configurationSnapshot?}) 固定有效配置、scope 与能力集合，执行可信链；event 有 eventId/on/scope 及可选 turn/turnKind/requestId，operation 接收 id/value/event/config/params/preview/signal/operationId。preview 拒绝写操作且默认不记录事实；实际请求准备可传 observeRead:true，仅在正文读取成功后记录 content-read，不计读取触发。配置、来源、condition/operation 重注册、reload、enable、目录变化撤销旧 lease。memory.read_content 与 memory.to_text 为 Host 注册的只读投影，不自行注入模型。

strategyOwner:'source' 表示来源自己执行固定链，Manager 只给决策并观察，不重复执行。当前 Tavern 公开 adapter 有专门接线；第三方仅注册同名字段不自动得到接线，参阅[开发指南](DEVELOPER_GUIDE.md)。Tavern 原生 card_variable_update 是来源执行事实，绑定/grant/CAS/schema 独立于 Manager policy；原生提交 configRevision:null，值发生变化才有 applied。旧卡片管理定义可保留查看，已不支持字段的导入/保存拒绝，不控制原生写入。模型读取和助手提交后的 MVU store/retrieve 决策仍受有效规则及来源权限限制。

## 来源默认与当前委托

可选同步只读 getManagementDefaults({id,scope?}) 返回 {protocolVersion:1,revision,configuration,scopePolicy:'source-bound',checkCurrent}；不返回正文、身份、preset、全局名单或卡片 grant。实际绑定、默认值和来源 lifecycle 变化撤销租约。兼容来源以可信 registerUsage(handler,{providerId:'dsh-memory-manager'}) 判断当前委托，卸载同步撤销并对后续操作恢复默认；注册期间配置无效拒绝执行，不能当 Manager 不存在回退。

合成顺序为来源默认 → 本地字段 → 已引用预设字段；条目 `followSource:string[]` 明确指定的字段最终跟随来源。允许 type、whitelist、blacklist 与 store/retrieve 的 on/rule/strategy；不允许重复、身份字段或在预设中设置。逐字段跟随仅影响所选字段，其他预设字段保留；不复制来源值，来源变更后重新合成。来源绑定范围仍须由来源验证，不生成通用授权。显式空 store/retrieve、空名单和拒绝规则保留；缺 whitelist 仅在来源决策路径继承 source-bound 资格，不产生通用授权；跨规则路由不继承原来源默认。旧来源仍按其显式 native/managed 合同执行，卸载不等同持久 setManagementMode 转移。sourceDefault、scopePolicy 与 origins 进入 JSON，checkCurrent 不进入浏览器。“恢复来源默认”只更新本资源草稿，清除已知覆盖/preset/跨路由，保留未知字段、正文和全局预设；经 validate/save 才写文件。

## 配置编辑、重读与预设

configurationSnapshot({id,adapterId,sessionId?}) 给 local/effective config/origins/presets/revision/configError/sourceDefault 等，不读正文。validateEntry({id,adapterId,entry,expectedRevision,expectedCatalogRevision?}) 返回 valid/local?/effective?/origins?/diagnostics；level:error|unknown|info。纯校验不 list/read、执行 condition/operation、改 epoch 或写盘。缺能力阻止保存；实际事件可达、资源存在和权限仍待运行期验证。

saveEntry 重新独立校验，经配置 revision、磁盘结构等价、adapter/能力/ownership/lifecycle 最终检查，在同目录 0600 独占临时文件 fsync 后同步 atomic rename，一次递增 revision；未变化为 no-op。最终 compact JSON 不超过 2000000 字符。失败保留当前文件，旧 revision 或外部改盘 409；保存推进 pending epoch 撤销旧租约。跨规则路由需 validateResourceRoute 确认实际 id/sourceAdapterId，来源固定链拒绝；不迁移正文/身份/权限。外部不合作 writer 仍可竞争 read/rename，本合同是单 Host 协调。

reload() 对结构相同（含 revision）的文件返回 unchanged:true，清旧 load error；变化内容必须更高 revision 且通过来源校验，失败保留旧有效文档。每次尝试包括 no-op 推进 pending epoch，不自动增加磁盘 revision，也不是资源刷新。presetLibrary/validatePresets/savePresets 的 strict 整批格式、revision/CAS 与全部拒绝规则见 [PRESETS](PRESETS.md)。

## 能力目录与 adapter 开关

optionCatalog({id,adapterId,sessionId}) 返回 version:1、独立 catalogRevision 和 JSON-only 来源/types/events/strategies/presets/modes/conditions/operations。注册、ABA 重注册、enable、卸载、descriptor 变化使旧目录决策失效。参数与适用性在服务端检查；来源固定链校验留在来源。完整 schema/本地组合见 [OPTIONS](OPTIONS.md)。setAdapterEnabled({id,enabled,kind:'resource'|'directory'}) 只改当前运行时，保留规则/正文，撤销待执行 lease，重启恢复安装默认。

scopeDirectory.search 对应 scope-directory 路由，返回有界 items/nextCursor?/range?，只读 DSH 公开 header metadata、标题 cache 与 WorkspaceRegistry；不读 session 正文或激活 Agent。默认 maxRecords:2000/maxBytes:1000000/timeoutMs:3000/ttlMs:15000，每项至多默认 10 倍。cursor 绑定查询/快照/workspace/代次；上游 list 本身未分页，Manager 限制保留和等待，不限制上游内部枚举/分配。缺冷目录服务明确 loaded-only；可选 tavernScopeCatalog 只提供角色/ST 预设/Persona 身份，不回退旧正文列表。

## HTTP 路由

前缀 /api/dsh-memory-manager，路由需要公开 connection.admit 与外层 Host 认证，Origin/跨站检查仍有效。POST 带 Content-Type:application/json 与 X-DSH-Memory-Manager:1，正文最多 2000000 字符。成功返回方法原始 JSON（不统一加 ok）；失败 {error:{code,message,diagnostics?}}。403 为 FORBIDDEN，409 为 REVISION_CONFLICT，404 为 NOT_FOUND/SESSION_NOT_FOUND，503 为 SESSION_READER_NOT_READY，其他错误 400。

| 方法 | 相对路径 | 参数 / 作用 |
| --- | --- | --- |
| GET | /query | sessionId、重复 turn/turnKind/status/adapterId、filters JSON |
| GET | /read | id、adapterId、sessionId?；返回来源记录或 null |
| GET | /configuration | id、adapterId、sessionId?；无正文配置 |
| GET | /options | id?、adapterId?、sessionId?；JSON 能力目录 |
| GET | /presets | format/version/revision/presets 库 |
| GET | /adapters | 资源/目录 adapter 与可用性 |
| GET | /scope-directory | providerId/kind/query/limit/cursor/refresh=1 等；有界 metadata |
| GET | /documentation 或 /options-documentation | document=OPTIONS/API/VALIDATION/README/PRESETS；同 admission、无脚本 HTML 与 restrictive CSP |
| POST | /reload | 重读已保存配置，不改 revision |
| POST | /adapter-enabled | {id,enabled,kind} |
| POST | /validate-configuration | validateEntry 参数，纯 dry-run |
| POST | /save-configuration | saveEntry 参数，显式配置写盘 |
| POST | /validate-presets | {bundle}；整批只读校验 |
| POST | /save-presets | {bundle,expectedRevision,replace?:boolean}，完整格式见 PRESETS；显式整批保存 |
| POST | /update | {adapterId,id,sessionId?,content,expectedRevision,operationId} |
| POST | /copy | {adapterId,id,sessionId?,newId} |
| POST | /management | {adapterId,id,sessionId?,mode,expectedRevision,operationId}；仅来源支持时 |

## 独立装配与兼容范围

requestAssemblyResources() 返回分离 {available,entries}，每项 id/adapterId/configurationSnapshot；配置错时 unavailable，排除 MVU 与其他 source-owned adapter。assembler 仓库 connectMemoryManager 跟随公开服务注册 memory-manager.resources，以只读 preview trigger 检索。用户显式选择装配规则，Manager 不挂自己的请求 adapter；实际 request/assembly、messages hash、来源节点核对 llm/stream 后才记录 applied，不证明网络送达。详见 [ASSEMBLER](ASSEMBLER.md)。

虚拟 Skill 可用 metadata.dshResourceIdentity:{version:1,namespace,id} 提供持久身份；每段非空 trim、至多 256 字符。未声明虚拟 Skill 为临时 skill-view handle、bind:false，不可绑定持久规则；文件 Skill 保留 path 身份。Manager 不创建 timer、task-run engine 或 Agent wake；TaskSystem 是兼容边界，未实现 adapter。Tavern、assembler 均为可选集成。英文[详细合同](API_en.md)提供对应类型与补充解释。

浏览器会话面板另组合现有 Tavern v3 `/sessions/:sessionId/assemblies` 及记录 ID 详情。标准/native 仅接受 `request-observed`、`requestContentStatus:available` 和 `nativeProvenance.provenance:recorded-references` 的世界书来源节点，形成 `origin:tavern-history` 的 triggered 事实；不读取 `/actual` 或 `/preview`，不按段名或正文猜测资源。已存在同资源/requestId/操作方向的观察事实优先。只缓存投影事实，不缓存正文；详情不可核验时显示状态可能不完整的诊断。UI 合并后应用轮次、来源与状态筛选；后端 query 的 DSH 历史投影合同不变。

会话面板分别筛选和显示每轮 store/retrieve 触发状态。读取须有 evidence:request-included，存储须有 evidence:write-committed；仅 phase:triggered/applied 不足以确认。兼容既有经核对的请求回执与来源写入回执，来源明确确认的 manual_update 完成也计为存储触发；仍在处理但尚无触发证据时显示处理中；只有 skipped 时显示已跳过；无记录显示未记录触发；旧记录方向不明或未结束且无触发证据时显示未确认。Tavern 旧回执仅使用经核对的 on 和来源固定回执标记识别方向，不解析不透明 ID、不以当前配置倒推历史。世界书装配属于读取；正文随固定来源变化的存储行为本身不证明某轮发生过存储。缺少轮次的记录单独展示。

MVU 的 core 历史读取须有 `MVU_RESOURCE_VERSION` 或 `WORLD_BOOK_MVU_VARIABLE_VERSION` 与当次来源节点对应。standard/native 读取通过 Tavern 已核验节点的 `mvuReads`（`adapterId: tavern.mvu`、资源 `id`、`blockId`、版本）投影为 `mode: retrieve`、`on: before_model_request`；`nativeRequestRef.stepStartSeq` 可与实时请求身份去重。模板及其 MVU/世界书依赖、通用 Manager 资源通过同样核验的节点 memoryReads 投影。旧记录缺少读取来源时保持未记录，不能由当前绑定、展开后的 YAML 文本或存储回执推断读取。


读取证据分为 `content-read`（正文读取成功）与 `request-included`（经核验进入本轮实际请求）；存储用 `write-committed`（来源确认写入），规则命中或求值用 `source-evaluated`。证据与执行 phase 独立。正文读取、来源目录查询、预览和策略许可不会单独点亮读取触发。来源拒绝或未知提交不会点亮存储触发，成功执行空链也不算写入。

原生 Skill 通过公开 `tools/pre-execute`、`tools/result`、`agent/pre-step` 与 `llm/stream` 接线：实际作用域中成功加载正文先记录 content-read，再用工具调用或显式 Skill 消息身份、内容哈希和冻结实际请求核验 request-included。仅目录描述不能证明读取；正文被输出变换移除时不会记录请求进入证据。正文保留在后续轮次请求时按该轮记录进入请求，不重复声称加载。journal 只保留资源身份、版本、消息引用及哈希，不复制正文。卸载撤销观察，不改原生 Skill 行为。
