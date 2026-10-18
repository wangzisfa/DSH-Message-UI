import type { ComponentType } from 'react'

/** Minimal structural port, verified against dsh commit 687f282e8625.
 * These are NOT a replacement public SDK. Keep this boundary versioned.
 * The installed 0.1.0-rc.5 checkout has no binding.eventSource and is unsupported.
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
export interface DshBinding {
  sessionId: string
  eventSource: Observable<DshEventWindow>
  session: Observable<{ openState: 'cold' | 'loading' | 'open' | 'error'; running: boolean }> & { loadOlder(): Promise<unknown> }
}
export interface PluginViewProps {
  binding: DshBinding
  connection: Observable<unknown>
  inspectCall?: (callId: string) => void
}
export interface DshContext {
  effect(callback: () => (() => void), label?: string): unknown
  sessions: { binding(sessionId: string): DshBinding | undefined }
  connection: { generation: Observable<unknown> }
  uiConversation: { views: { register(definition: { target: string; create: () => { empty: null; replace(): null; apply(): null }; isActive: () => boolean }): unknown } }
  slots: {
    inject(name: 'conversation.view', register: () => unknown): unknown
    register(options: {
      name: 'conversation.view'; id: string; order: number; label: () => string
      inject(sessionId: string): Pick<PluginViewProps, 'binding' | 'connection'>
    }, component: ComponentType<PluginViewProps>): unknown
  }
}
