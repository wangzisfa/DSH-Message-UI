# Agentarium 技术方案与调研结论

核查日期：2026-10-18。需求源：[PRD](./PRD.md)。本次交付：独立网页 demo + 可构建的实验性 dsh 插件入口，**不是完整 MVP**。

## 互联网核查

核查官方文档、GitHub 源码及 npm 包元数据。dsh master 核查时提交为 [`687f282e8625c6b8d11ff58211a90524be2e4317`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。本机相邻源码为 `47f943859bef60e4160492346772ded9b24f765a`，其 ui-trajectory 为 `0.1.0-rc.5`；两者存在破坏性接口差异，不能混用。

| 议题 | 核查结果与工程决策 | 官方依据 |
| --- | --- | --- |
| 第三个 Tab | 使用 `slots.inject` + `slots.register`，`name: conversation.view`、`id: agentarium`、`order: 20`；保持宿主 Chat fallback | [Trajectory 入口](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/client/ui-trajectory/src/client/index.ts)、[视图选择规则](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/client/ui-conversation/src/client/view-selection.ts) |
| 会话事件 | 最新 `SessionBinding.eventSource` 是可订阅的连续事件窗口，区分持久 event 与 transient；窗口支持 append/prepend/replace | [事件契约](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/api/session-controller/src/client/contract/events.ts)、[SessionBinding](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/api/session-controller/src/client/sessions/service.ts) |
| 原生导航 | 新版 View props 提供 `inspectCall`，可定位真实调用；仅在回调可用时提供按钮，不能假定任何版本都有跨会话导航 | [Slot 契约](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/client/ui-conversation/src/client/contract/slots.ts) |
| 插件产物 | 需要 Host 空入口、`dsh.client` manifest、`window.__ModuleLoader__.load({ id, factory })` 浏览器产物；React 由宿主提供 | [官方构建器](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/client/tsdown.client.ts)、[模块协议](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/client/modules/src/client/manifest.ts) |
| ASCII | 锁定实际安装的 `ascii.rest@0.4.0`，使用 kit `piece` 和 `mount`；一个稳定背景绘制单元，12 fps 或静帧，effect 清理 | [Kit](https://ascii.rest/docs/kit/)、[React](https://ascii.rest/docs/react/)、[离线、性能与许可](https://ascii.rest/docs/faq/) |
| 事件语义 | `tool/result.data.message.toolCallId` 配对调用；不能假设结果 ID 在 `data.callId`；嵌套工具使用 `subCallId` | [Session 事件](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/session/src/types.ts)、[PTC 事件](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/types.ts) |

注意：核查时官方源码包版本与 npm `latest` 标签并不一致，不能把安装 npm latest 当作接口兼容证明。本次使用一个有源码依据的最小结构化 port，集中在 `src/dsh/contracts.ts`；它不是官方 SDK，也没有宣称通过真实宿主类型/运行验证。

## 实现结构

```text
demo/fixture ──────────────┐
                          ├→ EvidenceEvent[] → projectWorld → WorkflowView
dsh eventSource → adapter ┘                      ├─ ASCII background + DOM map
                                                ├─ actor roster / event list
                                                └─ inspector / native navigation
```

- `src/model`：稳定事件身份、工具分类、纯投影。按会话过滤、按 seq 排序、同 ID 去重。实时与历史共用同一折叠函数；开始事件缺失时不补造开始时间。
- `src/demo`：完全独立的合成记录，持续标注 DEMO；演示浏览器不连接用户的 dsh，也不执行工具。
- `src/components`：业务视图在 demo 和插件之间复用。HTML 承担中文标签、命中区域和键盘行为，ASCII 不承担权限或真相。
- `src/dsh`：只读取已核实的持久轮次、工具与 PTC 子调用；任意工具输出不进入场景。订阅由 React 卸载清理，样式由 Cordis effect 清理。
- `scripts/build-plugin.mjs`：输出原生模块协议，CSS 以字符串由插件生命周期注入；第三方依赖许可随产物输出。

## 已实现的 demo

- 多 Agent 基地、工具分类、失败与审批等待、外部身份占位。
- 队员/建筑/事件检查器、调用 ID 和时间、演示轨迹跳转。
- 连续演示、逐事件推进、历史游标、断连演示、新会话空态。
- 深浅主题、静态地图、系统 reduced-motion、隐藏页面停止装饰绘制。
- 事件按最近记录优先排列，60 条一页，避免一次挂载千行；回放按原始 seq 投影。
- 已确认演示报告可下载，文档正文明确说明不是真实仓库审查。

## 明确未完成

1. 真实 dsh Desktop/Web 安装联调；不能宣称 Phase 0 已退出。
2. 真实子会话订阅、外部任务目录、原生审批投影、Workflow phase/member、可访问产物识别。
3. 旧版 `0.1.0-rc.5` 适配；不读取私有 `session.events`，也不修改相邻 dsh 仓库。
4. 真实会话回放 UI（目前仅 demo 有时间游标），30 分钟性能、Windows、多窗口及 8 Agent / 16 并发渲染基准。
5. 世界投影目前是按窗口重新折叠；短会话简单可靠，大型高频流需要基于窗口 change 做增量缓存。局部性能检查不等同 PRD 性能验收。

下一步应锁定用户实际 dsh 版本，优先验证安装、真实工具流、Tab 切换清理与原生轨迹定位，再扩充子会话适配。
