# DSH Memory Manager · 记忆管理

[English](README_en.md)

DSH 的资源管理插件，用于统一管理 Skill、世界书、MVU 状态和提示词模板。你可以查看资源、配置何时存储或读取、复用存取预设，并检查每轮对话实际触发了哪些操作。

## Quick Start

需要 DSH `0.2.0-rc.2` 和 Node.js `^22.19.0 || >=24`。

### 1. 安装

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

如果使用其他 profile，将 `web` 替换为对应名称。仓库受限时需要 GitHub 访问权限。

### 2. 打开资源目录

重启使用该 profile 的 DSH，在设置中打开「记忆管理」。这里可以查看已接入来源的资源、当前配置和存取预设。

DSH Skill 可直接接入；世界书、MVU 和模板需要安装 [DSH Tavern](https://github.com/Player-MINEPIG/dsh-tavern)。资源目录取决于当前 Host 和已加载会话可用的来源。

### 3. 查看和配置会话资源

打开已有会话，选择「记忆管理」页签，展开一轮对话查看存储与读取状态。点击资源的「管理配置」，选择跟随来源默认值，或设置本地规则、引用预设，最后保存管理配置。

存取记录按轮次显示，没有资源活动的轮次也会保留。更多操作见[使用指南](docs/USAGE.md)。

## 常用功能

- **统一查看资源**：全局设置用于管理资源目录，会话页签用于查看当前会话可用的资源。
- **配置存取行为**：为来源支持的操作设置执行时机、条件和步骤，可逐字段跟随来源默认值。
- **复用预设**：创建、编辑、导入和导出存取预设，将同一组合应用到多个资源。
- **检查本轮活动**：分别查看读取和存储是否触发，以及跳过、失败和正文读取等详情。

配置页对照显示当前值和来源默认值。未覆盖的字段沿用默认；选择跟随来源后，来源变化会反映到当前值。预设提供的其他字段继续生效。详见[配置与预设](docs/USAGE.md#编辑配置)。

## 支持的资源

| 资源 | 接入方式 |
| --- | --- |
| Skill | DSH 原生技能注册表；支持目录和正文读取 |
| 世界书、MVU 状态、提示词模板 | Tavern 来源服务；可用操作由来源声明 |
| 第三方资源 | 通过公开 adapter 接口接入，见[开发者指南](docs/DEVELOPER_GUIDE.md) |

插件使用各来源已有的资源；正文、访问权限和写入由来源管理。卸载保留管理配置、资源数据和 DSH 会话历史。

## 如何理解“已触发”

**读取已触发**表示资源内容进入了本轮 DSH 请求；**存储已触发**表示来源确认本轮写入已提交。正文读取成功会单独记录；“未记录触发”表示没有相应证据，不能据此判断未使用。

如果希望通过管理规则主动将通用资源提供给模型，需要在 [Prompt Assembler](https://github.com/Player-MINEPIG/dsh-prompt-assembler) 中选择 `memory-manager.resources`，并使用支持 request-assembly 协议 1 的宿主。DSH 原生 Skill 调用不需要这一步。见[assembler 接入](docs/ASSEMBLER.md)。

## 文档

- [安装、升级与卸载](docs/INSTALLATION.md)
- [使用指南](docs/USAGE.md)与[存取预设](docs/PRESETS.md)
- [API](docs/API.md)、[选项目录](docs/OPTIONS.md)与[开发者指南](docs/DEVELOPER_GUIDE.md)
- [架构](docs/ARCHITECTURE.md)与[兼容性验证](docs/VALIDATION_zh-CN.md)
- [版本记录](CHANGELOG.md)

[MIT License](LICENSE)
