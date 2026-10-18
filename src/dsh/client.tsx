import { useMemo, useSyncExternalStore } from 'react'
import { WorkflowView } from '../components/WorkflowView'
import { normalizeDshWindow } from './adapter'
import type { DshContext, Observable, PluginViewProps } from './contracts'
import css from '../styles.css?inline'

export const inject = ['slots', 'sessions', 'uiConversation', 'connection']

function useSource<T>(source: Observable<T>): T {
  const bound = useMemo(() => ({ subscribe: (listener: () => void) => source.subscribe(listener), snapshot: () => source.getSnapshot() }), [source])
  return useSyncExternalStore(bound.subscribe, bound.snapshot)
}

function SessionView({ binding, connection, inspectCall }: PluginViewProps) {
  const window = useSource(binding.eventSource)
  const lifecycle = useSource(binding.session)
  const generation = useSource(connection)
  const events = useMemo(() => normalizeDshWindow(binding.sessionId, window), [binding.sessionId, window])
  return <div className="agentarium plugin-view">
    <div className="history-notice">dsh 接入预览 · 当前仅投影本会话轮次与工具事件；子会话、审批与产物尚未接入。</div>
    {lifecycle.openState === 'cold' || lifecycle.openState === 'loading' ? <p className="notice">正在同步会话记录…</p> : null}
    <WorkflowView key={binding.sessionId} sessionId={binding.sessionId} events={events}
      disconnected={generation === undefined || lifecycle.openState !== 'open'} hasMore={window.hasMore}
      onLoadOlder={async () => { await binding.session.loadOlder() }}
      onTrace={inspectCall ? event => { if (event.callId) inspectCall(event.callId) } : undefined} />
  </div>
}

/** Browser entry. Cordis services own their registration effects. */
export function apply(ctx: DshContext): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-agentarium'
    style.textContent = css
    document.head.append(style)
    return () => style.remove()
  }, 'agentarium: scoped styles')
  // Register the view target so native select/activate can resolve it.
  // It contributes no execution activity: eventSource remains the evidence source.
  ctx.uiConversation.views.register({ target: 'agentarium', create: () => ({ empty: null, replace: () => null, apply: () => null }), isActive: () => false })
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view', id: 'agentarium', order: 20, label: () => '工作流',
    inject: sessionId => {
      const binding = ctx.sessions.binding(sessionId)
      if (!binding?.eventSource) throw new Error('Agentarium requires the dsh SessionBinding.eventSource contract (verified commit 687f282e8625).')
      return { binding, connection: ctx.connection.generation }
    },
  }, SessionView))
}
