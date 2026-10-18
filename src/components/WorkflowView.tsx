import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ChevronDown, Crosshair, Layers3, Radio, Sparkles, VolumeX } from 'lucide-react'
import { projectWorld } from '../model/projector'
import { actionKey, statusCode, statusText, timeLabel, type EvidenceEvent, type Selection } from '../model/types'
import { Scene, SceneBoundary } from './Scene'
import { Inspector } from './Inspector'

export interface WorkflowProps {
  sessionId: string
  events: readonly EvidenceEvent[]
  demo?: boolean
  disconnected?: boolean
  hasMore?: boolean
  onLoadOlder?: () => Promise<void>
  onTrace?: (event: EvidenceEvent) => void
  replay?: boolean
}

export function WorkflowView({ sessionId, events, demo = false, disconnected = false, hasMore = false, onLoadOlder, onTrace, replay = false }: WorkflowProps) {
  const world = useMemo(() => projectWorld(sessionId, events), [sessionId, events])
  const [selection, setSelection] = useState<Selection>(null)
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const [staticMode, setStaticMode] = useState(false)
  const [systemReduced, setSystemReduced] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [limit, setLimit] = useState(60)
  const focusOrigin = useRef<HTMLElement | null>(null)
  const select = (next: Selection) => {
    if (next) focusOrigin.current = document.activeElement as HTMLElement
    else focusOrigin.current?.focus()
    setSelection(next)
  }
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduced(media.matches)
    const visibility = () => setVisible(!document.hidden)
    const keyboard = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelection(null); focusOrigin.current?.focus() } }
    update(); media.addEventListener('change', update)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('keydown', keyboard)
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('keydown', keyboard) }
  }, [])
  useEffect(() => { setSelection(null); setLimit(60) }, [sessionId])
  const running = world.actions.filter(a => a.status === 'running')
  const failed = world.actions.filter(a => a.status === 'failed')
  const waiting = world.actions.filter(a => a.status === 'waiting')
  const filtered = world.events.filter(e => filter === 'all' || e.status === 'failed' || e.status === 'waiting' || e.status === 'cancelled').toReversed()
  const displayed = filtered.slice(0, limit)
  const motion = !staticMode && !systemReduced && visible && !replay
  const activeStatus = disconnected ? 'unknown' : world.status

  const loadOlder = async () => {
    setLoading(true); setLoadError('')
    try { await onLoadOlder?.() } catch { setLoadError('历史加载失败，请重试。') } finally { setLoading(false) }
  }
  return <section className="workflow">
    <div className="mission-heading"><div><h1>让每一步协作，都看得见<span className="title-dot">.</span></h1><p>一个安静的智能体基地。观察执行，追溯事实。</p></div><div className={`mission-status state-${activeStatus}`}><span className="status-dot" />{disconnected ? '连接中断 · 状态未知' : world.status === 'succeeded' ? '轮次已结束' : statusText[world.status]}<small>{replay ? '历史观察' : demo ? '演示快照' : '当前会话'}</small></div></div>
    <div className="status-strip" aria-label="任务概览"><span className="strip-live"><Radio size={14} />{replay ? 'REPLAY' : demo ? 'DEMO' : 'SESSION'}</span><span>可见队员 <b>{world.actors.length.toString().padStart(2, '0')}</b></span><span>{disconnected ? '未结算调用' : '执行中'} <b>{running.length.toString().padStart(2, '0')}</b></span><button className={failed.length ? 'state-failed' : ''} onClick={() => { setFilter('attention'); if (failed[0]) select({ type: 'action', id: failed[0].id }) }}>失败 <b>{failed.length.toString().padStart(2, '0')}</b></button><button className={waiting.length ? 'state-waiting' : ''} onClick={() => { if (waiting[0]) select({ type: 'action', id: waiting[0].id }) }}>待审批 <b>{waiting.length.toString().padStart(2, '0')}</b></button><span className="strip-end"><VolumeX size={13} /> 只读观察</span></div>
    {hasMore && <div className="history-notice"><span>部分历史未加载 · 计数仅覆盖当前窗口</span>{onLoadOlder && <button onClick={loadOlder} disabled={loading}><ArrowDownToLine size={13} />{loading ? '正在加载…' : '加载更早记录'}</button>}{loadError && <span role="alert">{loadError}</span>}</div>}
    <div className="workbench">
      <aside className="roster" aria-label="队员列表"><div className="panel-heading"><span>远征队</span><span className="mono">{world.actors.length.toString().padStart(2, '0')}</span></div><div className="roster-list">{world.actors.map((actor, i) => {
        const state = disconnected && ['running', 'waiting'].includes(actor.status) ? 'unknown' : actor.status
        const count = world.actions.filter(a => a.actorId === actor.id).length
        return <button key={actor.id} className={`crew ${selection?.type === 'actor' && selection.id === actor.id ? 'selected' : ''}`} onClick={() => select({ type: 'actor', id: actor.id })}><span className={`crew-avatar actor-color-${i % 4}`} aria-hidden="true">{actor.visibility === 'external' ? '<?>' : '[o]'}</span><span className="crew-info"><strong>{actor.name}</strong><small>{actor.label} / {actor.visibility === 'external' ? 'EXTERNAL' : actor.visibility === 'root' ? 'ROOT' : 'LOCAL'}</small><span className={`crew-state state-${state}`}>{statusCode[state]} <span>{actor.visibility === 'external' && state === 'unknown' ? '内部不可见' : statusText[state]}</span></span></span><span className="crew-count" title="已加载调用数">{count || '—'}</span></button>
      })}</div><div className="roster-note"><Layers3 size={15} /><p>每个队员，都有迹可循。<span>角色移动仅为视觉表达。</span></p></div></aside>
      <div className="map-panel"><div className="map-toolbar"><span><span className="tiny-square" /> 智能体基地 <small>TERMINAL COLONY</small></span><div><button className="icon-button" aria-label="聚焦需要关注的调用" title="聚焦需要关注的调用" onClick={() => { const action = waiting[0] ?? failed[0] ?? running[0]; select(action ? { type: 'action', id: action.id } : { type: 'actor', id: 'root' }) }}><Crosshair size={16} /></button><button className={`icon-button ${!motion ? 'active' : ''}`} aria-label={staticMode ? '开启动效' : '减少动效'} aria-pressed={staticMode || systemReduced} title={systemReduced ? '已遵循系统减少动效设置' : '切换静态地图'} onClick={() => setStaticMode(v => !v)}><Sparkles size={16} /></button></div></div><SceneBoundary><Scene world={world} selection={selection} onSelect={select} animate={motion} disconnected={disconnected} /></SceneBoundary><div className="map-legend"><span><i className="dot-running" />执行中</span><span><i className="dot-waiting" />待审批</span><span><i className="dot-failed" />失败记录</span><span><i className="dot-unknown" />未知</span><small>点击建筑或队员检查事实</small></div></div>
      <Inspector world={world} selection={selection} onSelect={select} onTrace={onTrace} demo={demo} disconnected={disconnected} />
    </div>
    <section className="event-panel" aria-label="事件记录"><div className="event-heading"><h2><Activity size={16} />执行事件 <span>{filtered.length}</span></h2><div className="event-controls"><div className="segmented"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>全部事件</button><button aria-pressed={filter === 'attention'} onClick={() => setFilter('attention')}>需要关注{failed.length + waiting.length > 0 && <i />}</button></div><button className="icon-button" aria-label={collapsed ? '展开事件' : '折叠事件'} aria-expanded={!collapsed} onClick={() => setCollapsed(v => !v)}><ChevronDown size={17} style={{ transform: collapsed ? 'rotate(180deg)' : undefined }} /></button></div></div>
      {!collapsed && <div className="event-list">{displayed.length ? displayed.map(event => {
        const actor = world.actors.find(a => a.id === event.actorId)
        return <button className={`event-row ${selection?.id === event.id || (event.callId && selection?.id === actionKey(event.sessionId, event.callId)) ? 'selected' : ''}`} key={event.id} onClick={() => select({ type: 'event', id: event.id })}><time>{timeLabel(event.time)}</time><span className={`event-marker state-${event.status ?? 'running'}`}>{event.status === 'failed' ? '!' : event.status === 'waiting' ? '?' : '+'}</span><span className="event-actor">{actor?.label ?? event.actorId}</span><span className="event-tool">{event.tool ?? (event.kind.startsWith('actor') ? 'subagent' : event.kind.startsWith('turn') ? 'session' : 'artifact')}</span><span className="event-summary">{event.summary}</span><span className={`event-status state-${event.status ?? 'idle'}`}>{event.status ? statusCode[event.status] : 'EVENT'}</span></button>
      }) : <div className="empty-events">{filter === 'attention' ? '当前记录中没有需要关注的事件。' : '尚无可见事件。开始任务后，执行事实会出现在这里。'}</div>}{filtered.length > limit && <button className="load-more" onClick={() => setLimit(v => v + 60)}>显示更早的 60 条记录</button>}</div>}
    </section>
    <footer className="workflow-footer"><span><span className="tiny-square" /> AGENTARIUM <span className="muted">/ 观察即理解</span></span><span>{demo ? '合成演示数据' : '会话记录'} · {hasMore ? '部分历史' : '当前已加载窗口'} · {world.events.length} 条可见事件</span></footer>
  </section>
}
