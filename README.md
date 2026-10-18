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

- 四个队员的并行审查，ASCII 设施、工具状态与可追溯检查器。
- 失败/审批筛选、原始演示轨迹、历史游标和演示报告下载。
- 新会话空态、模拟断连、深浅主题、静态地图和窄屏布局。
- 插件读取当前会话及本地子 Agent 轨迹，支持外部占位、实时审批提示、历史回放和原生详情导航。
- 按项目读取 `.agentarium/world.json`，支持将世界设定要求加入对话草稿，由模型用现有文件工具修改。
- 插件安装步骤与验证边界见 [DSH 接入说明](docs/DSH-INTEGRATION.md)。

## 文档

- [产品需求](docs/PRD.md)
- [按项目定制远征队世界设定](docs/WORLD-SETTING.md)
- [联网核查与技术方案](docs/TECHNICAL-PLAN.md)
- [dsh 入口、版本约束与联调步骤](docs/DSH-INTEGRATION.md)
- [本次验证记录](docs/VERIFICATION.md)

目录：`src/model` 事件模型，`src/demo` 合成记录，`src/components` 共享 UI，`src/dsh` 真实协议适配，`scripts` 插件构建。

按仓库要求未创建单测文件。构建、可重复的 `node scripts/verify-plugin.mjs` 集成检查与浏览器验证记录见 [插件验证](docs/PLUGIN-VERIFICATION.md)；此前 demo 的记录保留在原验证文档中。
