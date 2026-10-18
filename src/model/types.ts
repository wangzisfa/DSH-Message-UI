export type Status = 'idle' | 'running' | 'succeeded' | 'failed' | 'waiting' | 'cancelled' | 'unknown'
export type FacilityId = 'hq' | 'archive' | 'workshop' | 'terminal' | 'test' | 'web' | 'portal' | 'utility'
export type EventKind = 'turn.start' | 'turn.end' | 'actor.spawn' | 'actor.end' | 'action.start' | 'action.end' | 'action.wait' | 'artifact'

export interface EvidenceEvent {
  id: string
  sessionId: string
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
  actor?: { label: string; name: string; role: string; visibility: 'root' | 'local' | 'external'; parentId?: string }
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
  idle: '待命', running: '执行中', succeeded: '已结算', failed: '失败', waiting: '等待审批', cancelled: '已中断', unknown: '未知',
}
export const statusCode: Record<Status, string> = {
  idle: 'IDLE', running: 'RUN', succeeded: 'OK', failed: 'ERR', waiting: 'WAIT', cancelled: 'STOP', unknown: '?',
}
export const actionKey = (sessionId: string, callId: string) => `${sessionId}:${callId}`
export function timeLabel(time: number) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(time)
}
