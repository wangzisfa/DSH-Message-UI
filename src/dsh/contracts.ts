import type { ComponentType } from 'react'

/** Read-only structural ports verified against official dsh 687f282e and Desktop 0.2.1-rc.2.
 * Runtime services come from the host; no private Session fields are accessed.
 */
export interface Observable<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}
export interface DshRecord { type: string; seq: number; time: number; data: unknown }
export interface DshEventWindow {
  entries: readonly { type: 'event' | 'transient'; event: DshRecord }[]
  hasMore: boolean
  revision: number
}
export interface ChildAddress { parentSessionId: string; childSessionId: string; mode: 'one-shot' | 'continuable' | 'unknown' }
export interface DshBinding {
  sessionId: string
  eventSource: Observable<DshEventWindow>
  session: Observable<{ openState: 'cold' | 'loading' | 'open' | 'error'; running: boolean; loadingOlder?: boolean; openError?: unknown }> & {
    loadOlder(): Promise<void>
    projections: { faceOf(key: string): Observable<unknown> }
  }
}
export interface SessionReference { ready: Promise<DshBinding>; release(): void }
export interface PendingInteraction { kind: string; key: string; sessionId: string; callId?: string; toolName?: string }
export interface SessionStatus { running?: boolean; pendingInteraction?: PendingInteraction }
export type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } }
export interface PluginViewProps {
  binding: DshBinding
  context: DshContext
  inspectCall?: (callId: string) => void
  openView?: (view: string, focus: string) => void
  inputActions?: { captureInsertion(): unknown; insertText(text: string, span: unknown): boolean }
}
export interface DshContext {
  effect(callback: () => (() => void), label?: string): unknown
  sessions: {
    binding(sessionId: string): DshBinding | undefined
    retain(target: ChildAddress, options: { source: 'agentarium'; signal: AbortSignal }): SessionReference
  }
  connection: { generation: Observable<unknown> }
  uiSession: { sessionStatus: Observable<ReadonlyMap<string, SessionStatus>> }
  uiWorkspace: { openSession(address: ChildAddress): void }
  remote: { workspaceFiles: { read(sessionId: string, path: string, range: { offset: number; limit: number }, signal?: AbortSignal): Promise<RemoteResult<{ text: string; eof: boolean }>> } }
  uiConversation: { views: { register(definition: { target: string; create: () => { empty: null; replace(): null; apply(): null }; isActive: () => boolean }): unknown } }
  slots: {
    inject(name: 'conversation.view', register: () => unknown): unknown
    register(options: {
      name: 'conversation.view'; id: string; order: number; label: () => string
      inject(sessionId: string): Pick<PluginViewProps, 'binding' | 'context'>
    }, component: ComponentType<PluginViewProps>): unknown
  }
}
