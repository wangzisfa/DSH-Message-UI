# Agentarium 构建产物

插件版本 **0.3.0**，构建源码：[fb4002f](https://github.com/wangzisfa/DSH-Message-UI/commit/fb4002f5a255e9bca8b8d835905d01335827bd2b)。版本 Tag：`v0.3.0`。日期：2026-10-19。

## 本版新增

- 可视化自定义世界背景、队伍名称、主/子 Agent 称谓、八类设施名称和主题色。
- 终端基地、深海科考、符文工坊预设，JSON 导入导出、预览与项目保存草稿。
- 执行期间持续生成“世界动态”，沿用自定义世界观；支持暂停/恢复叙事、点击来源和按历史游标重建。
- 动态篇章使用本地执行事件映射，不持续调用 AI 或自动改写项目文件；暂停叙事时 Agent 仍继续执行。
- 保留 v0.2.1 的宿主深浅主题适配；网页、插件构建版本统一读取根包版本。

## 下载

| 文件 | 用途 |
| --- | --- |
| [dsh-agentarium-0.3.0.tgz](./dsh-agentarium-0.3.0.tgz) | 可安装的 DeepSeek Harness 插件 |
| [agentarium-demo-0.3.0.zip](./agentarium-demo-0.3.0.zip) | 独立静态网页演示，使用合成数据 |
| [build-info.json](./build-info.json) | 构建来源、环境和验证记录 |
| [SHA256SUMS](./SHA256SUMS) | 本版两个安装包与构建记录的 SHA-256 校验值 |

旧版 0.2.0 / 0.2.1 包继续保留在本目录；历史校验值见相应 Git 版本。

## 安装或升级插件

要求 Node.js ≥ 22.12.0，以及 dsh `>=0.2.1-rc.2 <0.3.0`。桌面端请先启动过应用以初始化 profile，然后完全退出客户端，执行：

```sh
dsh plugin --profile desktop add https://raw.githubusercontent.com/wangzisfa/DSH-Message-UI/v0.3.0/release/dsh-agentarium-0.3.0.tgz
```

macOS 未配置 `dsh` 命令时，将其替换为 `"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh"`。Web profile 将 `desktop` 改为 `web`。安装后重启客户端或对应服务，进入会话的“工作流”标签页。

展开“项目世界设定 → 自定义世界观”编辑并预览。项目持久化沿用原生对话和文件工具；网页演示仅将设定保存在当前浏览器。

## 部署网页演示

解压 `.zip`，将 `index.html`、`assets/` 和 `THIRD_PARTY_NOTICES.md` 一起部署到 HTTP(S) 静态服务器。网页演示未连接真实 DSH，版本标识为 `v0.3.0`。

## 验证与边界

- `pnpm build`（含严格类型检查）和 `pnpm verify:plugin` 通过。
- 插件运行文件与构建产物逐字节一致；pnpm 打包仅去除 `package.json` 末尾换行，清单语义一致。网页包逐字节一致。
- 官方 dsh `0.2.1-rc.2` 在新的隔离 Web profile 中安装成功，组合配置已激活插件，安装文件与发布包逐字节一致。
- 本版功能实现时已验证编辑、预设、无效配置、存储恢复、导出、暂停/恢复、来源定位、回放、项目隔离、深浅主题与窄屏。详细记录见 [世界观验证](../docs/WORLD-CUSTOMIZATION-VERIFICATION.md)。
- 将本版两个包、`build-info.json` 和 `SHA256SUMS` 下载到同一目录后，执行 `shasum -a 256 -c SHA256SUMS`。

未升级用户正在使用的 Desktop profile；未执行真实模型生成并写文件的完整链路、Windows 或长时间性能验证。Jev 需求检查与结果验收均未完成：当前没有 `ask_jev` 工具。
