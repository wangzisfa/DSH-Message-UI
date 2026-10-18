# 实验性 dsh 插件入口

此产物是 **接入预览**。独立 demo 已可运行，但还没有在真实 dsh 宿主中完成安装验收。

## 兼容基线

对应 dsh 源码提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（2026-10-18 核查）。依赖这些服务：`slots`、`sessions`、`uiConversation`、`connection`，以及 `SessionBinding.eventSource`。

本机相邻 `deepseek-harness` 仓库的 `0.1.0-rc.5` 没有该事件窗口接口，**不兼容此入口**。源码版本与 npm latest 标签不一致，暂不提供未经验证的一键安装命令。

## 构建与交付

在源码仓库运行 `pnpm install --frozen-lockfile && pnpm build`。插件目录为 `dist/plugin`，可在该目录运行 `npm pack` 生成供宿主导入的 tgz。实际挂载通过目标 dsh 版本的 Profile/Bundles/插件管理完成；使用前需要核对其本地包导入约定。

产物包括：

- `package.json`：`dsh.client.platform: web` 与依赖声明。
- `lib/index.js`：Host 空入口，不修改 Agent Runtime。
- `lib/client.js`：dsh 模块加载器 closure factory；复用宿主 React，不创建第二份 React。
- `THIRD_PARTY_NOTICES.md`：随包许可声明。

注册 `conversation.view / agentarium / order 20` 与对应视图 target，不改宿主默认选择。源码入口为 `src/dsh/client.tsx`。CSS 仅匹配 `.agentarium`，在卸载时移除。

## 当前真实能力

读取当前会话的持久 `turn/start`、`turn/end`、`tool/call`、`tool/result`、`tool/ptc-dispatch-start`、`tool/ptc-dispatch`。支持历史加载、缺少开始记录、真实 callId 导航和连接代次丢失时的未知状态。敏感工具参数和结果留在原生轨迹，不复制到场景。

真实入口 **不会注入 demo 数据**。真实子 Agent、审批状态、Workflow 阶段和产物尚未接入；视图顶部始终告知这一范围。工具名为 `subagent` 不足以证明已创建子会话。

## 联调验收步骤

1. 在上述兼容版本的独立测试 Profile 中加载产物；确认 `[对话][轨迹][工作流]` 顺序与默认对话不变。
2. 执行一次读文件、一次成功命令、一次失败命令；核对 callId、seq、失败状态和点击原生轨迹后的目标。
3. 断开/重连、加载更早记录、切换会话；确认旧会话角色不会串入，历史缺页有提示。
4. 关闭 Tab、卸载插件；确认 React 事件订阅、ascii.rest 绘制与 style 清理。
5. 再接真实子会话与审批投影；未验证前保持界面范围说明。

相关源码证据见仓库的 `docs/TECHNICAL-PLAN.md`。
