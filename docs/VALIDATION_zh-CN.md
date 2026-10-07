# 兼容性验证

[English](VALIDATION.md)

使用临时 profile 与自建资源，保留 DSH 持久历史的权威性，仅使用公开服务；插件安装不得修改 DSH 核心。Tavern 依赖 assembler，memory-manager 为可选扩展。具体版本、包哈希与单次验收结果保存在私有记录中。

## 自动检查

将 manager 与 assembler 克隆到同一父目录，运行 `npm ci`、`npm run check`。设置 `DSH_MEMORY_RUNTIME` 为运行时目录，`DSH_MEMORY_TAVERN` 和 `DSH_MEMORY_MVU` 为当前 Tavern 源码，再运行 `npm test`。真实请求测试需要宿主公开的 request-assembly 协议 1，缺少该能力时记录接入缺口。自建 provider 不访问在线模型。可选的独立 MVU 依赖夹具不能代替当前 Tavern 来源测试。

检查请求正文与持久证据、MVU 更新、来源 CAS 与授权、冷会话、取消、重载与来源撤销。原生卡片写入使用 Tavern 绑定、授权和 schema；Manager 规则管理模型读取与助手更新。

## 可选扩展生命周期

在已授权隔离 profile 中，对持久会话（含压缩日志）、assembler 策略和 Manager 配置计算哈希。安装三插件，给自建世界书设置禁止读取并确认跳过。通过 `dsh plugin --profile web remove dsh-memory-manager` 卸载，重启后确认默认世界书装配与 MVU 更新恢复，assembler 通用 Manager 来源撤销。重新安装后确认保留规则重新生效，原资源与 DSH 历史不变。写入测试使用独立夹具，不修改用户策略。

## 浏览器验收

检查原生全局设置、会话页签、管理配置与选项、冷会话切换、失败重读和离开页面后的取消。加载中、会话不存在、来源缺失必须区分，覆盖桌面和窄屏。

检查预设新建/编辑、默认预设修改、导出再导入，以及畸形字段和不支持能力的整批拒绝；失败不得修改文件、revision 或任何候选条目。浏览器和文件选择器限制与服务端通过分开记录。

未经授权不发送在线请求。自动测试不能代替浏览器或桌面验收，剩余手动项目与私有安装记录一并保存。
