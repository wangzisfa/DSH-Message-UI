import type { EvidenceEvent } from '../model/types'

export const DEMO_SESSION = 'demo-repository-review'
const start = Date.parse('2026-10-18T14:32:00+08:00')
const rows: Omit<EvidenceEvent, 'id' | 'sessionId' | 'seq' | 'time'>[] = [
  { kind: 'turn.start', actorId: 'root', summary: '开始仓库审查，准备委派检索与验证任务', sourceType: 'turn/start' },
  { kind: 'action.start', actorId: 'root', callId: 'call-001', tool: 'read_file', summary: '读取项目约定', detail: '{ "path": "AGENTS.md" }', sourceType: 'tool/call' },
  { kind: 'action.end', actorId: 'root', callId: 'call-001', tool: 'read_file', status: 'succeeded', summary: '已读取项目约定', sourceType: 'tool/result' },
  { kind: 'actor.spawn', actorId: 'scout', actor: { label: 'A1', name: '架构侦察员', role: '检索 · 模块分析', visibility: 'local', parentId: 'root' }, summary: '已创建本地子任务：梳理模块边界', sourceType: 'demo/confirmed-child' },
  { kind: 'actor.spawn', actorId: 'engineer', actor: { label: 'A2', name: '验证工程师', role: '执行 · 测试验证', visibility: 'local', parentId: 'root' }, summary: '已创建本地子任务：验证构建与测试', sourceType: 'demo/confirmed-child' },
  { kind: 'action.start', actorId: 'scout', callId: 'call-002', tool: 'grep', summary: '检索模块之间的引用', detail: '{ "pattern": "import", "path": "src/" }', sourceType: 'tool/call' },
  { kind: 'action.start', actorId: 'engineer', callId: 'call-003', tool: 'bash', facility: 'test', summary: '执行项目测试', detail: '{ "command": "npm run test" }\n测试分类来自此演示的显式元数据。', sourceType: 'tool/call' },
  { kind: 'actor.spawn', actorId: 'remote', actor: { label: 'A3', name: '远程审查员', role: '外部任务 · 内部不可见', visibility: 'external', parentId: 'root' }, summary: '已关联外部审查任务；内部执行状态未知', sourceType: 'demo/external-reference' },
  { kind: 'action.start', actorId: 'root', callId: 'call-004', tool: 'web_search', summary: '查阅依赖的官方文档', sourceType: 'tool/call' },
  { kind: 'action.end', actorId: 'scout', callId: 'call-002', tool: 'grep', status: 'succeeded', summary: '模块引用检索完成', sourceType: 'tool/result' },
  { kind: 'action.start', actorId: 'scout', callId: 'call-005', tool: 'read_file', summary: '检查会话订阅的生命周期', detail: '{ "path": "src/session.ts" }', sourceType: 'tool/call' },
  { kind: 'action.end', actorId: 'engineer', callId: 'call-003', tool: 'bash', status: 'failed', summary: '测试失败：会话切换后订阅未释放', detail: 'FAIL session lifecycle\nExpected listeners: 0\nReceived listeners: 1\n\nExit code: 1\n此输出为合成演示记录。', sourceType: 'tool/result' },
  { kind: 'action.end', actorId: 'root', callId: 'call-004', tool: 'web_search', status: 'succeeded', summary: '官方接口资料已核对', sourceType: 'tool/result' },
  { kind: 'action.start', actorId: 'root', callId: 'call-006', tool: 'apply_patch', summary: '准备修复订阅释放逻辑', detail: '{ "path": "src/session.ts", "operation": "add cleanup" }', sourceType: 'tool/call' },
  { kind: 'action.wait', actorId: 'root', callId: 'call-006', tool: 'apply_patch', status: 'waiting', summary: '文件修改需要审批', sourceType: 'demo/approval-state', detail: '审批属于原生 dsh 权限流程。演示视图不提供批准按钮。' },
  { kind: 'action.end', actorId: 'scout', callId: 'call-005', tool: 'read_file', status: 'succeeded', summary: '确认缺失的 cleanup 回调', sourceType: 'tool/result' },
  { kind: 'actor.end', actorId: 'scout', status: 'succeeded', summary: '架构分析结果已回传', sourceType: 'demo/child-settled' },
  { kind: 'action.end', actorId: 'root', callId: 'call-006', tool: 'apply_patch', status: 'succeeded', summary: '录制事件确认：变更已应用', sourceType: 'tool/result' },
  { kind: 'action.start', actorId: 'engineer', callId: 'call-007', tool: 'bash', facility: 'test', summary: '重新执行项目测试', detail: '{ "command": "npm run test" }', sourceType: 'tool/call' },
  { kind: 'action.end', actorId: 'engineer', callId: 'call-007', tool: 'bash', status: 'succeeded', summary: '本次测试调用成功', detail: 'PASS session lifecycle\nExit code: 0\n这是演示结果，不是当前仓库的验证报告。', sourceType: 'tool/result' },
  { kind: 'actor.end', actorId: 'engineer', status: 'succeeded', summary: '验证结果已回传', sourceType: 'demo/child-settled' },
  { kind: 'actor.end', actorId: 'remote', status: 'succeeded', summary: '收到外部任务结果；内部过程仍不可见', sourceType: 'demo/external-result' },
  { kind: 'artifact', actorId: 'root', summary: '演示审查报告已登记', sourceType: 'demo/artifact', artifact: { name: 'review-report.md', content: '# 演示审查报告\n\n此文件由 Agentarium demo fixture 提供，不是当前仓库的真实审查结果。\n\n- 已识别会话订阅释放问题\n- 记录包含一次失败与一次重试成功\n- 外部任务内部过程不可见\n' } },
  { kind: 'turn.end', actorId: 'root', status: 'succeeded', summary: '收到明确的轮次结束记录', sourceType: 'turn/end' },
]
export const demoEvents: EvidenceEvent[] = rows.map((row, seq) => ({ ...row, id: `${DEMO_SESSION}:${seq}`, sessionId: DEMO_SESSION, seq, time: start + seq * 4000 }))
export const initialDemoCount = 15
