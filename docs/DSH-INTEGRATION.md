# Agentarium：DeepSeek Harness 插件

插件包版本 `0.2.0`。按[官方插件安装文档](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)提供 `dsh.bundle`、配置 patch、Host 入口与浏览器入口。

## 兼容与安装

实际验证：macOS 上官方 Desktop 自带的 **dsh 0.2.1-rc.2** 运行时，以及与官方源码提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 对照的事件、Slot、子会话和文件接口。npm 的 `latest` 可能仍是旧版本；不能仅凭 `npx @deepseek-ai/dsh` 推断兼容。

构建：

```sh
pnpm install --frozen-lockfile
pnpm build
node scripts/verify-plugin.mjs
cd dist/plugin
pnpm pack --out ../dsh-agentarium-0.2.0.tgz
```

在已经提供 `dsh` 命令的兼容安装中，为 Web profile 安装：

```sh
dsh plugin --profile web add /absolute/path/to/dsh-agentarium-0.2.0.tgz
dsh --profile web --dump-config
dsh --profile web --no-open
```

Desktop 使用 `desktop` profile，可通过插件管理添加本地构建包；使用 CLI 时将上例的 profile 改为 `desktop`，然后重新加载或重启客户端。macOS Desktop 附带的 CLI 位于 `/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`。本次只在独立 `DSH_HOME` 和测试 profile 中安装，没有改变用户正在使用的 Desktop profile。

开发中可把 tarball 路径换成已构建的 `dist/plugin` 绝对路径。卸载：

```sh
dsh plugin --profile web remove dsh-agentarium
```

## 插件内容

- `cordis.patch.yml` 插入 `agentarium` 行，`dsh.bundle.patch` 使安装时自动激活该层。
- `lib/index.js` 是无执行副作用的 Host 入口。
- `lib/client.js` 使用官方 `window.__ModuleLoader__.load({ id, factory })` 协议；React 由宿主提供。
- `conversation.view / agentarium / order 20` 注册第三个「工作流」Tab。默认视图和卸载后的回退由宿主控制。
- CSS 限定在 `.agentarium`，由 Cordis 生命周期添加和移除；React 卸载时释放事件订阅、子会话引用和字符绘制。
- `THIRD_PARTY_NOTICES.md` 随包交付。

## 会话事实与回放

`SessionBinding.eventSource` 读取真实轮次、工具调用/结果、PTC 子调用及 `subagent/catalog`。同名 callId 按来源 sessionId 隔离；`step/end` 和 `turn/end` 都不会冒充工具结算。

子 Agent 由宿主 `subagentCatalog` 投影发现。本地子会话通过正式的 `sessions.retain(address)` 读取，卸载时 release；fork 的祖先历史按自身 descriptor 的 seq 截断。外部 Agent 只展示身份和未知状态，不请求不存在的内部会话。最多同时保留 32 个子会话引用，超出后明确提示，保留已知身份。

当前审批来自 `uiSession.sessionStatus.pendingInteraction`，作为实时状态叠加，不写成虚构的历史事件。点击「打开原生审批」回到原有界面，插件不批准或拒绝请求。断连时展示未知。

主会话工具可通过 `inspectCall(callId)` 精确跳到原生轨迹；子会话的工具详情提供「打开来源子会话」，再使用宿主轨迹查看。回放锚定已加载事件的身份；载入更早记录不移动当前锚点，Agent 实际执行继续。实时审批不混入回放。

## 按项目修改世界

在当前项目根目录保存 `.agentarium/world.json`。通过官方会话授权的 `remote.workspaceFiles.read` 读取，文件内容仅作为有长度限制的普通文本和装饰颜色。

在「项目世界设定 → 让模型修改设定」输入风格要求，可将完整要求加入原生对话草稿，再交给模型通过现有文件工具修改。没有独立写入或审批通道。首次打开、重连、可能写文件的工具结算后自动读取；也可手动刷新。无效内容保留当前视图中的有效设定；切换会话重新读取各自项目文件，迟到响应被取消。

格式、边界及示例见仓库 `docs/WORLD-SETTING.md` 和 `examples/deep-sea-world.json`。世界称谓不改变工具名称、调用身份、错误、队员关系或真实执行状态。

## 验证边界

宿主安装、Tab、真实 API 读取、子会话导航、失败定位、世界设定和回放均已用官方运行时加**明确标注的合成会话日志**验证。没有发起付费模型请求。模型生成设定后的真实文件工具完整链路、实时审批 UI 的端到端操作、Windows、30 分钟连续性能和多窗口压力仍需要对应环境验证。未宣称完整 PRD MVP 已验收。
