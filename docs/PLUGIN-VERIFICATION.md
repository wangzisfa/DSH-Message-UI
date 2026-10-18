# 插件实现与验证记录

日期：2026-10-18。发布产物：`dsh-agentarium@0.2.0`。

## 需求理解与 Jev

本次范围是把仓库原型实现为官方插件：第三个工作流 Tab、ASCII 场景、真实工具和子 Agent 事实、详情导航、回放、安装包，以及用户补充的按项目由模型修改世界设定。

指定的 `/Users/bytedance/.codex/skills/ask-jev/SKILL.md` 已不存在；在 `/Users/bytedance/Desktop/Dev/jev/.worktrees/ask-jev-skill/skills/ask-jev/SKILL.md` 找到并读取同名技能。当前会话没有 `ask_jev` MCP 工具；按技能失败规则继续已授权实现和直接验证。需求理解与交付前的 **Jev 检查均未完成**，没有 Jev 模型或通过结论。

## 已执行的直接验证

| 范围 | 证据和结果 |
| --- | --- |
| 构建 | TypeScript strict、Vite demo、esbuild closure factory 插件均构建通过；最终使用仓库指定 pnpm 12.14.0 |
| 集成检查 | `node scripts/verify-plugin.mjs`：跨会话同名 callId、乱序去重、缺少开始记录、PTC 错误、step/end 不结算、子会话结束不结算父会话、敏感正文过滤均通过 |
| 引用生命周期 | 模拟官方 Observable/retain 契约，检查子会话引用、外部禁止读取、fork 祖先过滤、断连、审批仅实时存在、卸载和 effect remount 后所有订阅与引用释放 |
| 压力语义 | 1500 个调用与 8 个角色/16 个同时活动调用投影通过；1500 调用的本机一次投影约 1–2 ms。这不是浏览器持续帧率基准 |
| 设定校验 | version、UTF-8 16 KiB 限制、字段类型、设施映射、控制字符、颜色、默认值和部分覆盖均检查；配置文本由 React 普通文本节点转义 |
| 真实安装 | 使用已安装 Desktop 内官方 dsh **0.2.1-rc.2** CLI，隔离 `DSH_HOME` 下创建 Web profile，以 `dsh plugin ... add` 安装；`--dump-config` 确认 bundle 层插入 |
| 真实 Slot | 浏览器中默认仍为对话，显示 `[对话][轨迹][工作流]`；选择工作流后正常加载。没有修改 Electron 源码或官方安装目录 |
| 真实数据接口 | 在真实 Host `SessionStore` 和持久化服务中写入明确标注的合成测试日志；插件通过真实 eventSource 和子会话投影读取出主 Agent、本地子 Agent、外部未知占位及工具结果 |
| 失败定位 | 失败计数打开 `smoke-fail` 检查器；点击原生轨迹，原生工具详情显示 Synthetic failure 和对应计时 |
| 子会话导航 | 选择验证工程师，点击打开子会话，宿主显示该一次性子会话及父级面包屑 |
| 项目设定 | 通过真实会话授权文件接口读取 `.agentarium/world.json`；世界、队伍、主/子角色称谓、设施名称统一切换为深海研究所/科考队，失败和调用身份保持不变 |
| 无效设定 | 同一视图中将文件改为 version 2 并刷新，显示版本错误且保留有效深海背景；恢复有效文件并刷新成功 |
| 模型修改入口 | 点击加入对话草稿，原生输入框出现风格要求和 JSON 格式说明；用户仍通过原生发送操作交给模型，本次未发起模型请求 |
| 回放 | 历史游标到首条记录，只展示主 Agent、零工具、零失败；回到实时恢复全部记录，界面标明使用当前世界设定 |
| 视觉 | 官方宿主中检查 ASCII 地图、队员、设施、检查器、深海主题与桌面容器布局；截图保存在忽略提交的 `artifacts/plugin-host-desktop.png` |

## 未执行与限制

- 未调用真实模型生成设定；没有支付模型费用。文件修改→真实模型工具结算→自动刷新的完整端到端链路尚未执行；文件读取、手动刷新及触发逻辑分别已验证。
- 审批的实时状态投影通过契约检查，未在宿主运行实际需审批的模型工具；插件没有审批写入能力。
- 未验证 Windows、原生 Electron 窗口中的完整任务、30 分钟连续运行、多窗口、全部权限模式、完整无障碍或浏览器性能基准。
- 宿主启动期间出现自身的 locale / dynamicCordisRunner 日志；文件接口漏声明 `remote` 的插件错误已修复，并经实际读取复验。未宣称宿主控制台全局无错误。
- 显式 Workflow 阶段、真实成果文件识别、战报和细粒度耗时不在这次新增实现中，仍按 PRD 的后续阶段处理。
- 尚不能把本次结果表述为第 18 章所有 MVP 验收项全部通过。

此前纯 demo 的验证记录保留在 `docs/VERIFICATION.md`，不作为本次插件接入的替代证据。

## 0.2.1：宿主浅色主题修复（2026-10-18）

问题来自浅色样式仅匹配 demo 的局部 `data-theme="light"`，而 DSH 使用 `body[data-ds-dark-theme]` 选择深色、移除该属性选择浅色。插件的文字读取了宿主浅色变量，但地图保留写死的深色背景，导致深色文字叠在深色地图上。

- 修复：插件跟随宿主的主题属性，地图背景读取宿主 `--dsw-alias-bg-document-preview`；demo 保留自己的显式主题切换。无需订阅或修改宿主主题状态。
- 最小复现：使用官方 `design-platform.css`、插件实际的 `.agentarium.plugin-view` 容器和样式，在浅色宿主下读取地图 computed style。修复前背景与文字均为 `rgb(15, 17, 21)`，`color-scheme` 为 `dark`，断言失败。
- 回归：同一检查修复后通过。浅色地图为 `rgb(235, 238, 242)`、文字为 `rgb(15, 17, 21)`；深色地图为 `rgb(21, 21, 23)`、文字为 `rgb(249, 250, 251)`。浅色 → 深色 → 浅色无需重新挂载即可同步，`color-scheme` 同步切换。
- 完整界面：加载构建后的 `lib/client.js`，通过插件自身的 style effect 安装样式，再渲染共享 WorkflowView 与明确标注的合成数据。地图、头像、检查器和失败详情均正常，浏览器未记录警告或错误。截图：本地 `artifacts/theme-check/light-fixed.jpg`。
- demo：生产预览页的深色与浅色按钮切换通过，独立主题未被宿主选择器覆盖。
- 构建：`pnpm build`（含类型检查）与 `pnpm verify:plugin` 通过。
- 安装：官方 dsh `0.2.1-rc.2` 在独立 `DSH_HOME` 的 Web profile 安装 `dsh-agentarium@0.2.1` 成功，组合配置含插件激活层。

浏览器主题验证使用官方颜色变量和主题 DOM 契约的隔离夹具，不代表已在用户当前 Desktop 会话中升级验证。本次尝试启动的独立 Web 宿主返回 HTTP 401，未作为视觉验证证据；用户实际 profile 未修改。临时验证文件留在忽略提交的 `artifacts/theme-check/`。

需求理解与交付前均读取 ask-jev 技能，但当前没有 `ask_jev` 工具，**Jev 检查未完成**。
