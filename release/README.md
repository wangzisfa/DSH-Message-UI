# Agentarium 构建产物

插件版本 **0.2.0**，构建源码：[cb2c16f](https://github.com/wangzisfa/DSH-Message-UI/commit/cb2c16f8886079785322a8474aad5d8485a1c65d)。

| 文件 | 用途 |
| --- | --- |
| [dsh-agentarium-0.2.0.tgz](./dsh-agentarium-0.2.0.tgz) | 可安装的 DeepSeek Harness 插件 |
| [agentarium-demo-0.2.0.zip](./agentarium-demo-0.2.0.zip) | 独立静态网页演示，使用合成数据 |
| [build-info.json](./build-info.json) | 构建来源、环境和验证记录 |
| [SHA256SUMS](./SHA256SUMS) | 文件完整性校验 |

## 安装插件

要求 Node.js ≥ 22.12.0；插件声明兼容 dsh `>=0.2.1-rc.2 <0.3.0`，本次安装验证使用 macOS 的 dsh `0.2.1-rc.2`。

在 DeepSeek Harness Desktop 的插件管理中添加下载后的 `.tgz` 文件，然后重新加载或重启客户端。也可以通过已配置的 `dsh` 命令安装：

```sh
dsh plugin --profile desktop add https://raw.githubusercontent.com/wangzisfa/DSH-Message-UI/main/release/dsh-agentarium-0.2.0.tgz
```

Web profile 将 `desktop` 改为 `web`。进入已有会话后选择「工作流」标签页。

## 部署网页演示

解压 `.zip`，将 `index.html`、`assets/` 和 `THIRD_PARTY_NOTICES.md` 一起部署到 HTTP(S) 静态服务器。网页演示未连接真实 DSH，页眉保留原 demo 的 `v0.1` 标识。

## 本次验证

本次已重新构建。源码与上次发布相同，插件压缩包和网页全部文件均与上次已验证的产物逐字节一致，版本保持 `0.2.0`。构建时间见 `build-info.json`。

- 使用锁定依赖完成类型检查、网页生产构建和插件构建。
- `pnpm verify:plugin` 集成检查通过。
- 复用相同插件包的安装验证：此前在隔离的 DSH_HOME 中安装成功，组合配置包含插件激活层，安装文件与发布包一致。
- 复用相同网页文件的浏览器验证：加载、失败检查器、对应调用的轨迹跳转、历史回放起点和回到现场通过；浏览器未记录警告或错误。
- 压缩包内容与本次构建输出一致。下载后可在本目录执行 `shasum -a 256 -c SHA256SUMS`。

本次未执行真实模型任务、Windows 或长时间性能验证。Jev 需求检查与结果验收未完成：构建会话未提供 `ask_jev` 工具。
