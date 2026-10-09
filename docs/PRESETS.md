# 存取预设

[English](PRESETS_en.md)

资源表格的「存取预设」页提供新建、编辑、导入 JSON、导出单项和全部预设。预设只包含可复用的 `type / store / retrieve` 组合，不含资源正文、资源身份、白黑名单或嵌套预设引用。资源在管理配置中选择预设并保存，预设明确提供的字段覆盖本地值；未提供的字段仍取来源默认或本地值。资源字段明确选择跟随来源时，使用实时默认值而非预设值。

每个 adapter 可以在 `optionCatalog.presets` 声明多个默认组合。自定义默认 ID 为 `adapter:<adapterId>:<presetId>`；受支持内置 ID 保持原名。读取默认目录不写文件。显式保存资源引用时，仅将所选新默认定义持久化；在预设页编辑默认项时，保存同 ID 的本地覆盖。修改被引用的预设会影响引用资源，保存前必须通过这些资源的来源校验。正文、绑定、权限与原生执行仍由来源持有。

## 使用预设

1. 从资源表格打开「存取预设」，新建组合或选择来源默认组合并保存。
2. 在资源管理配置中引用预设，设置资源适用范围，再保存管理配置。
3. 导出单项或全部预设，用于其他环境；目标环境需要提供对应的 adapter 和操作。

通用资源提供（包括配置检索的 Skill）还需选择 assembler 请求来源，见[接入说明](ASSEMBLER.md)。

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

导入不覆盖已有 ID，包括默认 ID；需换用新 ID。编辑已有项则明确覆盖其定义。导出只包含可移植字段，不含运行时 origin/available/revision；换环境导入仍按当前注册能力严格校验。

## 旧配置

早期 `builtin:mvu-card-interaction` 不控制 Tavern 原生卡片写入，请在 Tavern 配置执行开关和写授权。旧预设仍可查看；导入或保存前需要替换当前来源不支持的操作。没有适用 adapter 元数据的预设，编辑保存前须选择 adapter。

## adapter 接入与 API

在现有选项目录添加 `presets: [{id, label, description?, configuration}]`；配置必须满足上述结构和该 adapter 的能力目录。声明目录不激活预设，不授予资源范围或写权限。可选异步 `validatePreset(configuration)` 补充与具体资源无关的校验，拒绝时抛错；不能读取正文或执行存取策略。

- `presetLibrary()`：返回默认与本地覆盖后的完整预设目录。
- `validatePresets(bundle)`：只校验，返回 `{valid, presets, revision}`，不写文件、不读取资源或执行规则。
- `savePresets({bundle, expectedRevision, replace?})`：校验整批并原子保存；`replace` 默认 false，编辑时明确 true。
- HTTP：`GET /api/dsh-memory-manager/presets`，`POST .../validate-presets`（`{bundle}`），`POST .../save-presets`（保存参数）。使用已有 Host 鉴权；POST 需同源 JSON 和 `X-DSH-Memory-Manager: 1`。

保存序列化到现有管理配置写队列，检查配置 revision、磁盘完整内容以及校验期间的能力变化。通过后只更新预设定义与 `presetMetadata`，revision 增加一次，临时文件同步后原子替换。冲突或失败保留原文件和界面草稿。被引用预设的编辑还须校验所有引用资源；来源不可用时拒绝保存，不能绕过资源契约。
