# 存取预设

[English](PRESETS_en.md)

资源表格的「存取预设」页提供新建、编辑、导入 JSON、导出单项和全部预设。预设只包含可复用的 `type / store / retrieve` 组合，不含资源正文、资源身份、白黑名单或嵌套预设引用。资源在管理配置中选择预设并保存，预设明确提供的字段持续覆盖本地值；未提供的字段仍取来源默认或本地值。

每个 adapter 可以在 `optionCatalog.presets` 声明多个默认组合。自定义默认 ID 为 `adapter:<adapterId>:<presetId>`；受支持内置 ID 保持原名。读取默认目录不写文件。显式保存资源引用时，仅将所选新默认定义持久化；在预设页编辑默认项时，保存同 ID 的本地覆盖。修改被引用的预设会影响引用资源，保存前必须通过这些资源的来源校验。正文、绑定、权限与原生执行仍由来源持有。


当前 Tavern 的原生卡片变量写入不使用 Manager 策略，因此旧 `builtin:mvu-card-interaction` 不再作为新默认项显示；已持久保存的定义保留查看，不支持的事件、条件和写策略会在导入或保存时拒绝。原生执行由 Tavern 的来源开关与写授权控制。

## 导入与导出

```json
{
  "format": "dsh-memory-manager-presets",
  "version": 1,
  "presets": [{
    "id": "my-skill-read",
    "label": "请求前读取技能",
    "description": "读取已获准范围中的技能正文",
    "adapterIds": ["dsh.skills"],
    "configuration": {
      "type": "skill",
      "retrieve": {
        "on": "before_model_request",
        "rule": true,
        "strategy": [{"operation": "memory.read_content"}, {"operation": "memory.to_text"}]
      }
    }
  }]
}
```

文件最多 2 MB、1–200 项。每项必须有唯一非空 ID、名称和至少一个适用 adapter；说明可省略。`configuration` 必须包含 store 或 retrieve，仅接受这些模式中的 `on / rule / strategy`。未知文件字段、未知配置字段、畸形规则或步骤、未知条件/操作、未声明参数、不支持的类型/模式/时机、固定策略顺序不符、缺失或停用 adapter 均拒绝整批导入，不删除字段、不部分导入、不修改已有配置。所有选定 adapter 都必须通过校验。参数必须符合注册能力的参数描述；来源自有策略只能使用该来源实际声明的步骤与参数。

导入不覆盖已有 ID，包括默认 ID；需换用新 ID。编辑已有项则明确覆盖其定义。导出只包含可移植字段，不含运行时 origin/available/revision；换环境导入仍按当前注册能力严格校验。旧配置文件中没有适用 adapter 元数据的本地预设可以继续读取，编辑保存前须明确选择 adapter。

## adapter 接入与 API

在现有选项目录添加 `presets: [{id, label, description?, configuration}]`；配置必须满足上述结构和该 adapter 的能力目录。声明目录不激活预设，不授予资源范围或写权限。可选异步 `validatePreset(configuration)` 补充与具体资源无关的校验，拒绝时抛错；不能读取正文或执行存取策略。

- `presetLibrary()`：返回默认与本地覆盖后的完整预设目录。
- `validatePresets(bundle)`：只校验，返回 `{valid, presets, revision}`，不写文件、不读取资源或执行规则。
- `savePresets({bundle, expectedRevision, replace?})`：校验整批并原子保存；`replace` 默认 false，编辑时明确 true。
- HTTP：`GET /api/dsh-memory-manager/presets`，`POST .../validate-presets`（`{bundle}`），`POST .../save-presets`（保存参数）。使用已有 Host 鉴权；POST 需同源 JSON 和 `X-DSH-Memory-Manager: 1`。

保存序列化到现有管理配置写队列，检查配置 revision、磁盘完整内容以及校验期间的能力变化。通过后只更新预设定义与 `presetMetadata`，revision 增加一次，临时文件同步后原子替换。冲突或失败保留原文件和界面草稿。被引用预设的编辑还须校验所有引用资源；来源不可用时拒绝保存，不能绕过资源契约。

## 读取状态

管理配置与选项目录分别完成读取，目录未返回不会遮住已读取的管理配置。浏览器 GET 读取超过 30 秒显示读取超时和重试入口，取消对应请求；超时不等于资源不存在或来源卸载。会话读取服务初始化、确认不存在和读取失败仍分别显示。保存请求不应用 GET 超时，因为取消传输不能证明服务端没有写入。
