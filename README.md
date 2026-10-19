# Agentarium · DSH 工作流可视化

把 Agent 与工具执行记录映射为一个可检查、可回放的 ASCII 智能体基地。

当前交付为 **独立网页 demo + 可安装的 dsh 插件**。网页使用明确标注的合成数据；插件从宿主读取真实会话，已在官方 dsh 0.2.1-rc.2 运行时用合成日志完成安装与界面联调。

## 本地运行

需要 Node.js ≥ 22.12 和 pnpm 12.14.0（`npm install -g pnpm@12.14.0`）。

统一使用 pnpm 和 `pnpm-lock.yaml`，避免混用包管理器。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。初始停留在含失败和审批等待的演示现场，可继续演示、逐事件推进、从头播放或进入历史回放。

```sh
pnpm typecheck
pnpm build
pnpm preview
```

仅修改插件时可运行 `pnpm build:plugin`，跳过网页打包，仍执行类型检查。

构建输出：`dist/demo` 为静态网页，`dist/plugin` 为 dsh 插件包目录。运行时不请求第三方图片、字体或 ASCII CDN。锁定依赖版本，许可文本随两份产物交付。

## 可以体验

- 四个队员的并行审查，机械风 ASCII 设施、旋转字符核心、活动数据流、机器人平滑移动和可追溯检查器。
- 失败/审批筛选、原始演示轨迹、历史游标和演示报告下载。
- 新会话空态、模拟断连、深浅主题、静态地图和窄屏布局。
- 插件读取当前会话及本地子 Agent 轨迹，支持外部占位、实时审批提示、历史回放和原生详情导航。
- 世界观支持表单编辑、终端/深海/符文预设、JSON 导入导出和预览；插件通过对话草稿保存 `.agentarium/world.json`，网页演示保存在当前浏览器。
- Agent 执行期间持续生成世界动态，沿用自定义称谓和设施名称；支持暂停/恢复叙事、点击来源和按历史游标重建。
- 插件安装步骤与验证边界见 [DSH 接入说明](docs/DSH-INTEGRATION.md)。

## 文档

- [产品需求](docs/PRD.md)
- [按项目定制远征队世界设定](docs/WORLD-SETTING.md)
- [联网核查与技术方案](docs/TECHNICAL-PLAN.md)
- [dsh 入口、版本约束与联调步骤](docs/DSH-INTEGRATION.md)
- [本次验证记录](docs/VERIFICATION.md)

目录：`src/model` 事件模型，`src/demo` 合成记录，`src/components` 共享 UI，`src/dsh` 真实协议适配，`scripts` 插件构建。

按仓库要求未创建单测文件。构建、可重复的 `node scripts/verify-plugin.mjs` 集成检查与浏览器验证记录见 [插件验证](docs/PLUGIN-VERIFICATION.md)；此前 demo 的记录保留在原验证文档中。

## 通过 GitHub 发布与安装

### 发布方式

源码推送到本 GitHub 仓库，构建后的插件安装包放在 [`release/`](release/) 目录。当前发布版本为 **dsh-agentarium 0.3.0**，安装包已包含运行所需的编译产物，用户无需在本地构建，也无需登录 npm。

发布时建议使用语义化 Tag 或锁定 commit，避免分支更新后安装到不同内容。下面的命令固定到版本 Tag `v0.3.0`；构建来源与校验值见 [发布说明](release/README.md)。

### 一键安装（推荐）

需要 Node.js ≥ 22.12.0，以及兼容的 dsh `>=0.2.1-rc.2 <0.3.0`（已验证 `0.2.1-rc.2`）。桌面端用户请先启动过 DeepSeek Harness Desktop，让它初始化 `desktop` profile，随后**完全退出客户端**，再在终端执行：

```bash
dsh plugin --profile desktop add https://raw.githubusercontent.com/wangzisfa/DSH-Message-UI/v0.3.0/release/dsh-agentarium-0.3.0.tgz
```

macOS 若提示 `dsh: command not found`，且应用安装在默认位置，可直接使用客户端附带的 CLI：

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add https://raw.githubusercontent.com/wangzisfa/DSH-Message-UI/v0.3.0/release/dsh-agentarium-0.3.0.tgz
```

安装后重新打开客户端，进入会话并选择「工作流」标签页。Web 用户将命令中的 `--profile desktop` 改为 `--profile web`，安装后重启对应的 dsh 服务。本安装链接已在隔离的 Web profile 中验证安装成功，并确认插件已加入激活配置。

### Git 源码安装的注意事项

`github:owner/plugin-repo#tag-or-commit` 拉取的是源码。dsh 不会自动替插件执行 `build`；要支持这种安装方式，插件作者需要在包清单中声明正确的插件入口和 `dsh.bundle`，并提供能完成构建的 `prepare` 脚本。

首次安装需要构建的 Git 包时，pnpm 可能因尚未授权构建而中止。应按终端提示，将**提示中给出的准确包名或包标识**加入目标 profile 的 `pnpm-workspace.yaml`，然后重新执行安装。例如，提示要求授权 `dsh-agentarium` 时：

```yaml
allowBuilds:
  dsh-agentarium: true
```

构建授权会执行包提供的脚本，应仅授权可信来源，并固定 Tag 或 commit。具体机制见 [dsh 官方插件发布指南](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)。

**本仓库根目录是开发工程，目前未配置供 Git 源码安装使用的 `prepare` 和插件清单，因此不能直接用 `github:wangzisfa/DSH-Message-UI#…` 安装插件。** 请使用上面的 `.tgz` 一键安装命令；该预构建包不包含安装构建脚本，无需配置 `allowBuilds`。
