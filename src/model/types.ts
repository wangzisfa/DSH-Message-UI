export type Status = 'idle' | 'running' | 'succeeded' | 'failed' | 'waiting' | 'blocked' | 'cancelled' | 'unknown'
export type FacilityId = 'hq' | 'archive' | 'workshop' | 'terminal' | 'test' | 'web' | 'portal' | 'utility'
export type EventKind = 'turn.start' | 'turn.end' | 'actor.spawn' | 'actor.end' | 'action.start' | 'action.end' | 'action.wait' | 'artifact'

export interface EvidenceEvent {
  id: string
  sessionId: string
  /** Root view that owns this evidence; sessionId always keeps the real source. */
  worldSessionId?: string
  seq: number
  time: number
  kind: EventKind
  actorId: string
  summary: string
  sourceType: string
  callId?: string
  tool?: string
  facility?: FacilityId
  status?: Status
  actor?: { label: string; name: string; role: string; visibility: 'root' | 'local' | 'external'; parentId?: string; sessionId?: string }
  detail?: string
  artifact?: { name: string; content: string }
}

export interface Actor {
  id: string
  label: string
  name: string
  role: string
  visibility: 'root' | 'local' | 'external'
  parentId?: string
  sessionId?: string
  status: Status
  facility: FacilityId
  lastEvent?: EvidenceEvent
}

export interface Action {
  id: string
  actorId: string
  tool: string
  facility: FacilityId
  status: Status
  start?: EvidenceEvent
  end?: EvidenceEvent
  latest: EvidenceEvent
}

export interface World {
  sessionId: string
  actors: Actor[]
  actions: Action[]
  events: EvidenceEvent[]
  artifacts: EvidenceEvent[]
  status: Status
}

export type Selection = { type: 'actor' | 'action' | 'facility' | 'event'; id: string } | null
export const statusText: Record<Status, string> = {
  idle: '待命', running: '执行中', succeeded: '已结算', failed: '失败', waiting: '等待审批', blocked: '已阻塞', cancelled: '已中断', unknown: '未知',
}
export const statusCode: Record<Status, string> = {
  idle: 'IDLE', running: 'RUN', succeeded: 'OK', failed: 'ERR', waiting: 'WAIT', blocked: 'BLOCK', cancelled: 'STOP', unknown: '?',
}
/** One session is sequenced by the host; independent sessions share only wall time. */
export function orderEvidence(input: readonly EvidenceEvent[]): EvidenceEvent[] {
  return [...new Map(input.map(e => [e.id, e])).values()].sort((a, b) =>
    a.sessionId === b.sessionId ? a.seq - b.seq || a.id.localeCompare(b.id) : a.time - b.time || a.sessionId.localeCompare(b.sessionId))
}
export const actionKey = (sessionId: string, callId: string) => `${sessionId}:${callId}`
export function timeLabel(time: number) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(time)
}
