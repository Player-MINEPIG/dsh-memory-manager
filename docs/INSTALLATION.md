# 安装与卸载

[English](INSTALLATION_en.md) · [README](../README.md)

使用 DSH 0.2.0-rc.2 与 Node ^22.19.0 或 >=24，安装前停止所选 Host 并保留数据。通过当前分支安装；受限仓库需要访问权限：

```sh
dsh plugin --profile web add github:Player-MINEPIG/dsh-memory-manager#codex/assembler-integration
```

重启同一 profile。cordis.patch.yml 经 dshHomePath('dsh-memory-manager') 设置 storageDir；缺 config.json 时独占创建，已有非法/不可读文件保留并报告。Manager 可不安装 Tavern 或 assembler，它们的来源服务和请求 adapter 都是可选能力。安装不改 DSH 核心、不启动模型请求。

settings 用于全局管理，单独的公开 conversation.view 显示当前会话资源、真实 DSH 轮次目录与逐轮来源观察。DSH 可在空会话隐藏页签，Manager 不注入替代外壳。

停止 Host，通过公开 DSH 插件管理只移除 Manager bundle。卸载保留 config.json、observations.json、来源正文和 DSH 历史。兼容生命周期来源撤销委托并恢复默认，通用 Manager 装配贡献消失；重装读取保留规则，可能再次拒绝此前默认放行的来源使用。重装不删除/恢复配置，不覆盖会话；旧来源 ownership 沿自身声明合同。

开发将 dsh-memory-manager 与 dsh-prompt-assembler 放在同一父目录，后者为 file 开发依赖。运行 npm ci、npm run check 和 npm run pack:check。Host/浏览器校验见[验收指南](VALIDATION_zh-CN.md)，fixture skip 不代表 UI 验收。

## 升级

停止所选 Host，保留 `$DSH_HOME/dsh-memory-manager`，在同一 profile 使用上述命令更新插件。配置 schema、服务协议和预设格式仍为 1，无需迁移；不要删除配置或会话历史来升级。按 DSH 插件管理要求重启 Host 与重新加载客户端。

从相同 profile 卸载：

```sh
dsh plugin --profile web remove dsh-memory-manager
```

## 可选接入

Skill 使用 DSH 注册表和既有原生工具/请求钩子。Tavern 需提供声明的公开协议与证据能力，版本号本身不证明可选功能已实现。原生历史恢复需精确请求来源；通用 assembler 装配还需显式选择来源与 request-assembly 协议 1。Manager 安装不安装或准备核心扩展。见[使用](USAGE.md)、[assembler 接入](ASSEMBLER.md)及[验证](VALIDATION_zh-CN.md)。
