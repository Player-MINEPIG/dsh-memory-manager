# 安装、升级与卸载

[English](INSTALLATION_en.md) · [README](../README.md) · [使用指南](USAGE.md)

## 安装

需要 DSH `0.2.0-rc.2`、Node.js `^22.19.0 || >=24`，以及仓库访问权限。停止使用目标 profile 的 Host，执行：

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#v1.0.0
```

将 `web` 替换为实际 profile 名称，然后重启 DSH。在设置中打开「记忆管理」查看资源；已有会话也可通过同名页签查看本轮活动。

插件附带预构建客户端，无需自行构建。默认配置目录为 `$DSH_HOME/dsh-memory-manager`。首次启动创建空配置，资源使用来源默认规则；已有配置读取失败时保留文件并显示错误。

## 可选接入

DSH Skill 直接从当前 Host 和会话的技能注册表读取。安装 Tavern 后，可接入其世界书、MVU 和模板来源服务。各来源支持的操作在配置页显示。

通过 Manager 规则将通用资源加入模型请求，还需在 Prompt Assembler 中选择 `memory-manager.resources`，并提供 request-assembly 协议 1。详细步骤与接口见[assembler 接入](ASSEMBLER.md)。

## 升级

停止 Host，在同一 profile 使用安装命令更新插件，然后重启。保留 `$DSH_HOME/dsh-memory-manager` 即可沿用配置。v1.0.0 使用配置 schema 1 和预设格式 1，无需数据迁移。

## 卸载

停止 Host，从原 profile 移除插件：

```sh
dsh plugin --profile web remove dsh-memory-manager
```

卸载保留配置、观察记录、来源资源与 DSH 历史。支持默认委托的来源会恢复自身规则；重装后重新采用保留的管理配置。

开发环境安装与验证见[开发者指南](DEVELOPER_GUIDE.md)和[验证文档](VALIDATION_zh-CN.md)。
