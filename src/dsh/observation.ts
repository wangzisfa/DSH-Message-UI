import { normalizeDshWindow } from './adapter'
import type { Actor, EvidenceEvent, Status } from '../model/types'
import { orderEvidence } from '../model/types'
import type { ChildAddress, DshBinding, DshContext, Observable, PendingInteraction, SessionReference } from './contracts'

interface Child { id: string; createdAt: number; mode: 'one-shot' | 'continuable' | 'unknown' | 'external'; label?: string }
interface Entry { binding: DshBinding; parentId: string; releases: (() => void)[] }
export interface Observation {
  events: readonly EvidenceEvent[]
  actors: readonly Actor[]
  createdAt: ReadonlyMap<string, number>
  liveStatuses: ReadonlyMap<string, Status>
  approvals: readonly PendingInteraction[]
  hasMore: boolean
  disconnected: boolean
  notices: readonly string[]
}
function object(value: unknown): Record<string, unknown> { return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {} }
function catalog(value: unknown): Child[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    const row = object(item)
    return typeof row.id === 'string' && typeof row.createdAt === 'number' && Number.isFinite(row.createdAt)
      && ['one-shot', 'continuable', 'unknown', 'external'].includes(String(row.mode))
      ? [{ id: row.id, createdAt: row.createdAt, mode: row.mode as Child['mode'], label: typeof row.label === 'string' ? row.label : undefined }] : []
  })
}

/** Owns only read subscriptions and explicitly retained child sessions. Disposal releases all of them. */
export class DshObservation implements Observable<Observation> {
  private entries = new Map<string, Entry>()
  private references = new Map<string, SessionReference>()
  private failures = new Set<string>()
  private labels = new Map<string, string>()
  private listeners = new Set<() => void>()
  private releases: (() => void)[] = []
  private abort = new AbortController()
  private queued = false
  private active = false
  private snapshot: Observation = { events: [], actors: [], createdAt: new Map(), liveStatuses: new Map(), approvals: [], hasMore: false, disconnected: false, notices: [] }
  constructor(private ctx: DshContext, private root: DshBinding) {}
  getSnapshot = (): Observation => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  start = () => {
    this.abort = new AbortController()
    this.releases = []
    this.failures.clear()
    this.active = true
    this.attach(this.root, 'root')
    this.releases.push(this.ctx.connection.generation.subscribe(this.schedule), this.ctx.uiSession.sessionStatus.subscribe(this.schedule))
    this.rebuild()
    return () => {
      this.active = false
      this.abort.abort()
      this.releases.forEach(release => release())
      for (const entry of this.entries.values()) entry.releases.forEach(release => release())
      for (const reference of this.references.values()) reference.release()
      this.entries.clear(); this.references.clear()
    }
  }
  private attach(binding: DshBinding, parentId: string) {
    if (!this.active || this.entries.has(binding.sessionId)) return
    this.entries.set(binding.sessionId, { binding, parentId, releases: [
      binding.eventSource.subscribe(this.schedule), binding.session.subscribe(this.schedule),
      binding.session.projections.faceOf('subagentCatalog').subscribe(this.schedule),
      binding.session.projections.faceOf('subagent').subscribe(this.schedule),
    ] })
  }
  private schedule = () => {
    if (!this.active || this.queued) return
    this.queued = true
    queueMicrotask(() => { this.queued = false; if (this.active) this.rebuild() })
  }
  private rebuild() {
    const events: EvidenceEvent[] = []
    const actors = new Map<string, Actor>()
    const createdAt = new Map<string, number>()
    const liveStatuses = new Map<string, Status>()
    const notices: string[] = []
    let hasMore = false
    const status = this.ctx.uiSession.sessionStatus.getSnapshot()
    const connected = this.ctx.connection.generation.getSnapshot() !== undefined
    for (const [sessionId, { binding }] of this.entries) {
      const isRoot = sessionId === this.root.sessionId
      const window = binding.eventSource.getSnapshot()
      const lifecycle = binding.session.getSnapshot()
      const identity = object(binding.session.projections.faceOf('subagent').getSnapshot())
      // Forked children contain ancestor history. Only the own descriptor suffix is theirs.
      let afterSeq = typeof identity.seq === 'number' ? identity.seq : undefined
      if (!isRoot && afterSeq === undefined) {
        afterSeq = window.entries.findLast(row => row.type === 'event' && row.event.type === 'subagent/descriptor')?.event.seq
      }
      if (isRoot || afterSeq !== undefined) events.push(...normalizeDshWindow(sessionId, window, { worldSessionId: this.root.sessionId, actorId: isRoot ? 'root' : sessionId, afterSeq }))
      else notices.push(`${this.label(sessionId)}：尚未读取子会话身份，内部记录暂不可见。`)
      hasMore ||= window.hasMore
      if (!connected || lifecycle.openState !== 'open') liveStatuses.set(isRoot ? 'root' : sessionId, 'unknown')
      else if (lifecycle.running) liveStatuses.set(isRoot ? 'root' : sessionId, 'running')
      if (lifecycle.openState === 'error') notices.push(`${isRoot ? '主会话' : this.label(sessionId)}记录读取失败，可重新进入工作流重试。`)
      const children = catalog(binding.session.projections.faceOf('subagentCatalog').getSnapshot())
      for (const child of children) {
        if (child.id === this.root.sessionId || actors.has(child.id)) continue
        actors.set(child.id, { id: child.id, label: this.label(child.id), name: child.label ?? `子 Agent ${this.label(child.id)}`, role: 'subagentCatalog', parentId: isRoot ? 'root' : sessionId, sessionId: child.mode === 'external' ? undefined : child.id, visibility: child.mode === 'external' ? 'external' : 'local', status: 'unknown', facility: 'portal' })
        createdAt.set(child.id, child.createdAt)
        if (child.mode === 'external' || this.references.has(child.id) || this.failures.has(child.id)) continue
        if (this.references.size >= 32) { notices.push('子会话订阅已达 32 个，其余队员仅展示身份。'); continue }
        const address: ChildAddress = { parentSessionId: sessionId, childSessionId: child.id, mode: child.mode }
        try {
          const reference = this.ctx.sessions.retain(address, { source: 'agentarium', signal: this.abort.signal })
          this.references.set(child.id, reference)
          void reference.ready.then(childBinding => {
            if (!this.active || this.references.get(child.id) !== reference) return
            this.attach(childBinding, sessionId); this.schedule()
          }, () => {
            if (!this.active || this.references.get(child.id) !== reference) return
            this.failures.add(child.id); reference.release(); this.references.delete(child.id); this.schedule()
          })
        } catch { this.failures.add(child.id) }
      }
    }
    for (const id of this.failures) notices.push(`${this.label(id)}：子会话不可读，保留已确认身份。`)
    const approvals = connected ? [...status.values()].flatMap(item => item.pendingInteraction?.kind === 'approval' && this.entries.get(item.pendingInteraction.sessionId)?.binding.session.getSnapshot().openState === 'open' ? [item.pendingInteraction] : []) : []
    for (const approval of approvals) liveStatuses.set(approval.sessionId === this.root.sessionId ? 'root' : approval.sessionId, 'waiting')
    this.snapshot = { events: orderEvidence(events), actors: [...actors.values()], createdAt, liveStatuses, approvals, hasMore, disconnected: !connected || this.root.session.getSnapshot().openState !== 'open', notices: [...new Set(notices)] }
    this.listeners.forEach(listener => listener())
  }
  private label(id: string) {
    if (!this.labels.has(id)) this.labels.set(id, `A${this.labels.size + 1}`)
    return this.labels.get(id)!
  }
  async loadOlder() {
    await Promise.all([...this.entries.values()].map(async ({ binding }) => {
      if (!binding.eventSource.getSnapshot().hasMore) return
      await binding.session.loadOlder()
      if (binding.session.getSnapshot().openState === 'error') throw new Error('历史加载失败')
    }))
  }
  childAddress(id: string): ChildAddress | undefined {
    for (const [parentSessionId, { binding }] of this.entries) {
      const child = catalog(binding.session.projections.faceOf('subagentCatalog').getSnapshot()).find(row => row.id === id)
      if (child && child.mode !== 'external') return { parentSessionId, childSessionId: id, mode: child.mode }
    }
    return undefined
  }
}
