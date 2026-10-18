import { classifyTool } from '../model/projector'
import type { EvidenceEvent, Status } from '../model/types'
import type { DshEventWindow } from './contracts'

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined }

/** Read only verified durable vocabulary. Never retain arbitrary tool arguments/output.
 * Child sessions, approvals and artifacts require separate authoritative projections;
 * an arbitrary tool named "subagent" is not evidence of a spawned child.
 */
export function normalizeDshWindow(sessionId: string, window: DshEventWindow): EvidenceEvent[] {
  const result: EvidenceEvent[] = []
  const names = new Map<string, string>()
  const entries = window.entries.filter(e => e.type === 'event').toSorted((a, b) => a.event.seq - b.event.seq)
  for (const { event } of entries) {
    if (!Number.isSafeInteger(event.seq) || event.seq < 0 || !Number.isFinite(event.time)) continue
    const data = object(event.data)
    const base = { id: `${sessionId}:${event.seq}`, sessionId, seq: event.seq, time: event.time, actorId: 'root', sourceType: event.type }
    if (event.type === 'turn/start') result.push({ ...base, kind: 'turn.start', summary: '已记录轮次开始' })
    if (event.type === 'turn/end') {
      const reason = text(object(data.reason).kind)
      const statuses: Record<string, Status> = { completed: 'succeeded', aborted: 'cancelled', interrupted: 'cancelled', forked: 'cancelled', error: 'failed', blocked: 'unknown', 'max-tokens': 'unknown' }
      result.push({ ...base, kind: 'turn.end', status: statuses[reason ?? ''] ?? 'unknown', summary: `已记录轮次结束：${reason ?? '原因未知'}` })
    }
    if (event.type === 'tool/call' || event.type === 'tool/ptc-dispatch-start') {
      const callId = text(event.type === 'tool/call' ? data.callId : data.subCallId)
      const tool = text(data.name)
      if (!callId || !tool) continue
      names.set(callId, tool)
      result.push({ ...base, kind: 'action.start', callId, tool, facility: classifyTool(tool), summary: `${tool} 已发起`, detail: '参数与正文保留在 dsh 原生轨迹中。' })
    }
    if (event.type === 'tool/result' || event.type === 'tool/ptc-dispatch') {
      const message = event.type === 'tool/result' ? object(data.message) : data
      const callId = text(event.type === 'tool/result' ? message.toolCallId : data.subCallId)
      if (!callId) continue
      const tool = names.get(callId) ?? text(data.name)
      const isError = message.isError === true
      result.push({ ...base, kind: 'action.end', callId, tool, status: isError ? 'failed' : 'succeeded', summary: `${tool ?? '工具调用'} ${isError ? '失败' : '已结算'}`, detail: names.has(callId) ? '输出保留在 dsh 原生轨迹中。' : '当前窗口没有开始记录；没有补造开始时间。' })
    }
  }
  return result
}
