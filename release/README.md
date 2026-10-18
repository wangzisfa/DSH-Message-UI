# Agentarium 构建产物

插件版本 **0.2.1**，构建源码：[dcfa003](https://github.com/wangzisfa/DSH-Message-UI/commit/dcfa0037f8eaacff88762ee51b17bf0ccac4bb60)。版本 Tag：`v0.2.1`。

本版修复 DSH 浅色主题下地图仍显示深色背景的问题。地图、队员头像、检查器及原生控件配色现在跟随宿主，切换主题即时生效；独立 demo 仍使用自己的主题按钮。

| 文件 | 用途 |
| --- | --- |
| [dsh-agentarium-0.2.1.tgz](./dsh-agentarium-0.2.1.tgz) | 可安装的 DeepSeek Harness 插件 |
| [agentarium-demo-0.2.1.zip](./agentarium-demo-0.2.1.zip) | 独立静态网页演示，使用合成数据 |
| [build-info.json](./build-info.json) | 构建来源、环境和验证记录 |
| [SHA256SUMS](./SHA256SUMS) | 当前及保留的历史安装包完整性校验 |

## 安装或升级插件

要求 Node.js ≥ 22.12.0，以及 dsh `>=0.2.1-rc.2 <0.3.0`。桌面端请先启动过应用以初始化 profile，然后完全退出客户端，执行：

```sh
dsh plugin --profile desktop add https://raw.githubusercontent.com/wangzisfa/DSH-Message-UI/v0.2.1/release/dsh-agentarium-0.2.1.tgz
```

macOS 未配置 `dsh` 命令时，将其替换为 `"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh"`。Web profile 将 `desktop` 改为 `web`。安装后重启客户端或对应服务，进入会话的「工作流」标签页。

## 部署网页演示

解压 `.zip`，将 `index.html`、`assets/` 和 `THIRD_PARTY_NOTICES.md` 一起部署到 HTTP(S) 静态服务器。网页演示未连接真实 DSH，页眉保留原 demo 的 `v0.1` 标识。

## 本次验证

- 类型检查、网页生产构建、插件构建及 `pnpm verify:plugin` 通过。
- 使用官方宿主颜色变量和主题 DOM 契约复现原问题；修复后浅色 → 深色 → 浅色均通过。
- 完整 WorkflowView 加载构建包中的插件样式，地图与失败检查器正常，浏览器未记录警告或错误；独立 demo 的主题切换通过。
- 官方 dsh `0.2.1-rc.2` 在隔离 Web profile 中安装成功，配置含插件激活层，安装文件与发布包一致。
- 压缩包内容与构建输出一致。下载后可在本目录执行 `shasum -a 256 -c SHA256SUMS`。

视觉验证使用隔离的宿主主题夹具；本次完整 Web 宿主启动后返回 HTTP 401，未计入视觉验证通过项。未修改用户当前 Desktop profile，未执行真实模型任务、Windows 或长时间性能验证。详情见 [插件验证记录](../docs/PLUGIN-VERIFICATION.md)。

Jev 需求检查与结果验收未完成：本次会话未提供 `ask_jev` 工具。旧版 `0.2.0` 安装包保留在此目录，供需要时回退。
