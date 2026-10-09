# 兼容性验证

[English](VALIDATION.md) · [安装](INSTALLATION.md) · [使用](USAGE.md)

目标为 DSH 0.2.0-rc.2。使用临时 profile、合成资源与假模型提供方；通过公开插件接口接入，DSH 持久历史保持权威。Manager 安装不修改核心。包版本 v1.0.0 与服务协议 1、配置 schema 1、预设格式 1 分别管理。单次运行结果、源码修订、包哈希和实际环境保存在 Git 忽略的 `.local/`。

## 单元测试、构建与包

将 manager 与 assembler 克隆到同一父目录，执行：

```sh
npm ci
npm run check
npm run pack:check
npm pack --ignore-scripts
```

检查 package.json 与 lockfile 根版本为 1.0.0，包含 Host 源码、预构建客户端、bundle、双语文档、CHANGELOG 和 LICENSE；不含测试夹具、node_modules、私有记录、用户数据或临时路径。assembler 仅为开发依赖。默认 npm test 未提供环境变量时会跳过可选 Host/第三方测试，不能以此宣称对应集成通过。

## 官方 stock Host 的原生路径

设置 `DSH_MEMORY_RUNTIME` 为官方 stock runtime，`DSH_MEMORY_TAVERN` 为实现相关来源协议的 Tavern 源码。执行：

```sh
node --test test/native-skill-evidence-host.test.mjs test/native-mvu-history-host.test.mjs test/native-template-evidence-host.test.mjs
```

Skill 测试核对目录不算调用、工具与显式指令、正文成功与请求进入的区分、正则/输出变换移除正文的负例，以及无资源首轮保留。MVU 核对标准/native 世界书宏及精确历史引用；模板核对自身与 MVU 依赖读成功、进入请求与被排除的区别。三者明确要求 stock 路径，不能用 prepared runtime 替代。

## 可选 prepared 请求装配路径

设置 `DSH_MEMORY_RUNTIME` 为具备 request-assembly 协议 1 的准备环境，`DSH_MEMORY_TAVERN` 和 `DSH_MEMORY_MVU` 为当前 Tavern 源码，`DSH_MEMORY_CORE` 为 assembler 的 `core-extension` 目录。执行：

```sh
node --test test/host-integration.test.mjs test/world-book-observation-host.test.mjs test/native-worldbook-history-host.test.mjs test/mvu-integration.test.mjs
```

检查实际请求正文与版本引用、世界书默认/拒绝、已核验历史恢复、MVU 写入与回执、来源 CAS/grants、取消/配置重载/来源撤销，以及 Manager 卸载后来源原生执行。`native-worldbook-history-host` 使用 prepared Host 验证原生历史投影，并非 stock fixture；不要把两组 runtime 混用后跑整个 npm test。测试中模型为合成提供方，不发送在线请求。可选独立 MVU dependency 通过 `DSH_MEMORY_MVU_DEPENDENCY` 单独启用；它不替代当前 Tavern 测试。

## 来源目录与绑定

设置 `DSH_MEMORY_SOURCES` 和 `DSH_MEMORY_MVU` 为当前 Tavern 源码、`DSH_MEMORY_RUNTIME` 为 stock runtime，执行：

```sh
node --test test/native-session-catalog.test.mjs test/managed-sources-runtime.test.mjs test/scope-session.test.mjs
```

这组检查原生技能目录、来源默认、绑定、模板 CAS、正文准备与请求进入的区别，以及目录规则不改变原生卡片授权。

## 浏览器与生命周期

在获授权隔离 profile 检查原生全局设置与会话页签、详情、选项、预设、失败重试及导航取消，覆盖桌面与窄屏。区分加载、会话不存在、来源失效和空目录。

- 三栏当前值/跟随来源/默认值和带间距分割线；草稿即时合成、来源变动、其他预设字段保留、恢复默认与 CAS 冲突。
- 固定资源存储说明、仅由 preset 提供的 Skill、两列逐轮触发、策略跳过、失败/中断，以及同时存储/读取的独立状态。
- 第一轮没有资源活动、完全没有资源、筛选移除全部行仍保留轮次；未知轮次发起标签隐藏，缺失数字不虚构。
- 预设新建/编辑、默认覆盖、导出再导入、非法字段/不支持能力整批拒绝；失败保留文件、revision 与草稿。

生命周期写入使用独立合成夹具。卸载前后核对来源数据、DSH 历史、assembler 策略与 Manager 配置；移除 Manager 只撤销兼容委托和通用贡献，重装重新采用保留规则。不要用用户策略进行写入测试。真实浏览器验收与合成 Host 通过分别记录；未经授权不发送在线请求。外部提供方送达、第三方插件和不可用桌面环境不由本地测试保证。
