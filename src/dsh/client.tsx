import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { WorkflowView } from '../components/WorkflowView'
import { WorldSettingContext } from '../components/WorldSetting'
import { WorldSettingEditor } from '../components/WorldSettingEditor'
import { actionKey, type Actor, type EvidenceEvent } from '../model/types'
import { defaultSetting, parseWorldSetting, SETTING_PATH, settingPrompt, settingSavePrompt, type WorldSetting } from '../model/setting'
import type { DshContext, Observable, PluginViewProps } from './contracts'
import { DshObservation } from './observation'
import css from '../styles.css?inline'

export const name = 'agentarium'
export const inject = ['slots', 'sessions', 'uiConversation', 'connection', 'uiSession', 'uiWorkspace', 'remote', 'remote.workspaceFiles']

function useSource<T>(source: Observable<T>): T {
  const bound = useMemo(() => ({ subscribe: (listener: () => void) => source.subscribe(listener), snapshot: () => source.getSnapshot() }), [source])
  return useSyncExternalStore(bound.subscribe, bound.snapshot)
}

export function SessionView(props: PluginViewProps) {
  return <BoundSessionView key={props.binding.sessionId} {...props} />
}

function BoundSessionView({ binding, context, inspectCall, openView, inputActions }: PluginViewProps) {
  const observation = useMemo(() => new DshObservation(context, binding), [context, binding])
  useEffect(() => observation.start(), [observation])
  const snapshot = useSource(observation)
  const lifecycle = useSource(binding.session)
  const generation = useSource(context.connection.generation)
  const [boundary, setBoundary] = useState<{ id: string; time: number } | null>(null)
  const [projectSetting, setSetting] = useState(defaultSetting)
  const [previewSetting, setPreviewSetting] = useState<WorldSetting | null>(null)
  const setting = previewSetting ?? projectSetting
  const [settingNotice, setSettingNotice] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [promptOpen, setPromptOpen] = useState(false)
  const [worldRequest, setWorldRequest] = useState('结合这个项目的用途，重新设计远征队的背景设定。')
  const [draftNotice, setDraftNotice] = useState('')
  // Reload after a settled file/shell tool, never on token-stream frames.
  const lastMutation = snapshot.events.findLast(e => e.kind === 'action.end' && ['workshop', 'terminal'].includes(e.facility ?? ''))?.id
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void Promise.resolve().then(() => context.remote.workspaceFiles.read(binding.sessionId, SETTING_PATH, { offset: 1, limit: 100 }, controller.signal)).then(result => {
        if (controller.signal.aborted) return
        if (!result.ok) {
          if (result.error.code === 'workspace-file/not-found') setSetting(defaultSetting)
          setSettingNotice(result.error.code === 'workspace-file/not-found' ? '默认世界 · 项目尚未设置背景' : '设定暂不可读 · 保留有效设定')
          return
        }
        try {
          if (!result.value.eof) throw new Error('设定超过 100 行')
          const next = parseWorldSetting(result.value.text)
          setSetting(next)
          setPreviewSetting(current => current && JSON.stringify(current) === JSON.stringify(next) ? null : current)
          setSettingNotice('项目世界 · 已同步')
        } catch (error) { setSettingNotice(`设定无效 · 保留有效设定 · ${error instanceof Error ? error.message : '请检查 JSON'}`) }
      }).catch(() => { if (!controller.signal.aborted) setSettingNotice('设定读取失败 · 保留有效设定') })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [binding, context, refresh, lastMutation, generation])
  const events = useMemo(() => {
    if (!boundary) return snapshot.events
    const index = snapshot.events.findIndex(e => e.id === boundary.id)
    return index >= 0 ? snapshot.events.slice(0, index + 1) : snapshot.events.filter(e => e.time <= boundary.time)
  }, [snapshot.events, boundary])
  const actors = useMemo(() => snapshot.actors.filter(actor => !boundary || (snapshot.createdAt.get(actor.id) ?? Infinity) <= boundary.time), [snapshot.actors, snapshot.createdAt, boundary])
  const waitingCalls = useMemo(() => new Set(snapshot.approvals.flatMap(p => p.callId ? [actionKey(p.sessionId, p.callId)] : [])), [snapshot.approvals])
  const cursor = boundary ? events.length : snapshot.events.length
  const openActor = (actor: Actor) => { const address = actor.sessionId && observation.childAddress(actor.sessionId); if (address) context.uiWorkspace.openSession(address) }
  const trace = (event: EvidenceEvent) => {
    if (event.sessionId === binding.sessionId) { if (event.callId) inspectCall?.(event.callId) }
    else { const address = observation.childAddress(event.sessionId); if (address) context.uiWorkspace.openSession(address) }
  }
  return <WorldSettingContext.Provider value={setting}><div className="agentarium plugin-view" style={{ '--world-accent': setting.accent } as CSSProperties}>
    <div className="plugin-toolbar"><span className="mono">AGENTARIUM / {setting.name}</span><div className="segmented"><button aria-pressed={!boundary} onClick={() => setBoundary(null)}>实时现场</button><button disabled={!snapshot.events.length} aria-pressed={!!boundary} onClick={() => { const e = snapshot.events.at(-1); if (e) setBoundary({ id: e.id, time: e.time }) }}>历史回放</button></div></div>
    <details className="world-setting-panel">
      <summary>项目世界设定 <span>{previewSetting ? '预览中 · 尚未保存到项目' : settingNotice}</span></summary>
      {previewSetting && <p role="status">项目文件状态 · {settingNotice || '正在读取'}</p>}
      <p>背景设定 · {setting.story}</p>
      <div className="setting-actions">
        <button onClick={() => setPromptOpen(v => !v)}>让模型修改设定</button>
        <button onClick={() => setRefresh(n => n + 1)}>刷新设定</button>
        {previewSetting && <button onClick={() => setPreviewSetting(null)}>使用项目设定</button>}
        <code>{SETTING_PATH}</code>
      </div>
      <WorldSettingEditor setting={setting} applyLabel="预览世界观" onApply={value => {
        setPreviewSetting(value); return '预览已应用。可加入项目保存草稿，或导出 JSON 后保存到项目。'
      }} onSaveToProject={inputActions ? value => {
        const span = inputActions.captureInsertion()
        const inserted = inputActions.insertText(settingSavePrompt(value), span)
        const message = inserted ? '已加入对话草稿，发送后由模型保存到项目。' : '输入框正在处理请求，请稍后重试。'
        setDraftNotice(message)
        if (inserted) openView?.('chat', '')
        return message
      } : undefined} />
      {promptOpen && <>
        <p>说明希望的风格，交给当前项目中的模型修改。</p>
        <input className="world-request" aria-label="世界设定修改要求" value={worldRequest} maxLength={500} onChange={e => setWorldRequest(e.target.value)} />
        {inputActions && <button className="trace-link" onClick={() => {
          const span = inputActions.captureInsertion()
          if (inputActions.insertText(`${worldRequest}\n${settingPrompt}`, span)) { setDraftNotice('已加入对话草稿，发送后由模型修改。'); openView?.('chat', '') }
          else setDraftNotice('输入框正在处理请求，请稍后重试。')
        }}>将要求加入对话草稿</button>}
        <p role="status">{draftNotice || '也可以复制完整提示词到对话中。'}</p>
        <textarea aria-label="世界设定修改提示词" readOnly value={`${worldRequest}\n${settingPrompt}`} onFocus={e => e.currentTarget.select()} />
      </>}
    </details>
    {boundary && <div className="replay-bar"><input type="range" aria-label="真实历史事件游标" min="1" max={Math.max(1, snapshot.events.length)} value={Math.max(1, cursor)} onChange={e => { const event = snapshot.events[Number(e.target.value) - 1]; if (event) setBoundary({ id: event.id, time: event.time }) }} /><span className="mono">{cursor} / {snapshot.events.length}</span><span>使用当前世界设定 · Agent 继续执行</span></div>}
    {!boundary && snapshot.approvals.map(p => <div className="approval-notice" role="status" key={p.key}><span>需要审批 · {p.toolName ?? '工具'} · {p.sessionId === binding.sessionId ? setting.leaderTitle : snapshot.actors.find(a => a.id === p.sessionId)?.label}</span><button onClick={() => { if (p.sessionId === binding.sessionId) openView?.('chat', ''); else { const address = observation.childAddress(p.sessionId); if (address) context.uiWorkspace.openSession(address) } }}>打开原生审批</button></div>)}
    {snapshot.notices.map(notice => <p className="history-notice" role="status" key={notice}>{notice}</p>)}
    {lifecycle.openState === 'cold' || lifecycle.openState === 'loading' ? <p className="notice" role="status">正在同步会话记录…</p> : null}
    <WorkflowView key={binding.sessionId} sessionId={binding.sessionId} events={events} knownActors={actors}
      liveStatuses={boundary ? undefined : snapshot.liveStatuses} waitingCalls={boundary ? undefined : waitingCalls}
      disconnected={!boundary && snapshot.disconnected} hasMore={snapshot.hasMore} replay={!!boundary}
      onLoadOlder={() => observation.loadOlder()} onOpenActor={openActor} onTrace={inspectCall ? trace : undefined} />
  </div></WorldSettingContext.Provider>
}

/** Cordis owns registration and style effects; the view owns its read subscriptions. */
export function apply(ctx: DshContext): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-agentarium'
    style.textContent = css
    document.head.append(style)
    return () => style.remove()
  }, 'agentarium: scoped styles')
  ctx.uiConversation.views.register({ target: 'agentarium', create: () => ({ empty: null, replace: () => null, apply: () => null }), isActive: () => false })
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view', id: 'agentarium', order: 20, label: () => '工作流',
    inject: sessionId => {
      const binding = ctx.sessions.binding(sessionId)
      if (!binding?.eventSource) throw new Error('Agentarium requires dsh 0.2.1-rc.2 SessionBinding.eventSource.')
      return { binding, context: ctx }
    },
  }, SessionView))
}
