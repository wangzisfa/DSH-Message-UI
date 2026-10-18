import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { piece } from 'ascii.rest/kit'
import { mount } from 'ascii.rest'
import { facilities } from './facilities'
import { statusCode, type Selection, type World, type Status } from '../model/types'

function Ambient({ active }: { active: boolean }) {
  const ref = useRef<HTMLPreElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    try {
      const scene = piece({ name: 'agentarium-base', cols: 100, rows: 34, fps: active ? 12 : 0 }, (t, surface) => {
        for (let y = 1; y < 34; y += 3) for (let x = 2; x < 100; x += 5) surface.set(x, y, '.')
        for (let x = 17; x < 84; x += 2) { surface.set(x, 15, '-'); surface.set(x, 17, '-') }
        for (let y = 7; y < 29; y += 2) { surface.set(17, y, ':'); surface.set(82, y, ':') }
        surface.write(3, 31, '[ SECTOR 01 / LOCAL OBSERVATION ]')
        surface.write(78, 31, active && Math.floor(t) % 2 ? '[ SIGNAL . ]' : '[ SIGNAL : ]')
      })
      return mount(ref.current, scene)
    } catch { setFailed(true) }
  }, [active])
  return failed ? <span className="renderer-notice">字符背景不可用 · 事实视图正常</span> : <pre ref={ref} aria-hidden="true" className="ambient" />
}

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="scene-fallback">场景暂时无法绘制。请使用队员列表和事件记录检查任务。</div> : this.props.children }
}

export function Scene({ world, selection, onSelect, animate, disconnected }: {
  world: World; selection: Selection; onSelect: (s: Selection) => void; animate: boolean; disconnected: boolean
}) {
  return <div className="scene" aria-label="智能体基地地图" onClick={e => { if (e.target === e.currentTarget) onSelect(null) }}>
    <Ambient active={animate && !disconnected && world.actions.some(a => a.status === 'running')} />
    <span className="map-axis axis-left">N / 001</span><span className="map-axis axis-right">BASE MAP</span>
    {facilities.filter(f => f.id !== 'utility' || world.actions.some(a => a.facility === 'utility')).map(f => {
      const actions = world.actions.filter(a => a.facility === f.id)
      const active = actions.filter(a => a.status === 'running' || a.status === 'waiting')
      const state: Status = disconnected && active.length ? 'unknown' : active.some(a => a.status === 'waiting') ? 'waiting' : active.length ? 'running' : actions.some(a => a.status === 'failed') ? 'failed' : actions.length ? 'succeeded' : 'idle'
      const selected = selection?.type === 'facility' && selection.id === f.id
      const selectedActor = selection?.type === 'actor' && world.actors.find(a => a.id === selection.id)?.facility === f.id
      const selectedEvent = selection?.type === 'event' ? world.events.find(e => e.id === selection.id) : undefined
      const selectedAction = (selection?.type === 'action' && world.actions.find(a => a.id === selection.id)?.facility === f.id)
        || (selectedEvent?.callId && world.actions.find(a => a.latest.callId === selectedEvent.callId)?.facility === f.id)
      return <button key={f.id} className={`facility facility-${f.id} state-${state} ${selected || selectedActor || selectedAction ? 'selected' : ''}`} style={{ left: `${f.x}%`, top: `${f.y}%` }} onClick={() => onSelect({ type: 'facility', id: f.id })} aria-label={`${f.name}，${active.length} 个活动调用`}>
        <pre aria-hidden="true">{f.art}</pre>
        <span className="facility-label">{f.name}<span>{f.code}</span></span>
        {actions.length > 0 && <span className="facility-state">{statusCode[state]}{active.length > 1 ? ` ×${active.length}` : ''}</span>}
      </button>
    })}
    {world.actors.map((actor, i) => {
      const f = facilities.find(f => f.id === actor.facility) ?? facilities.find(f => f.id === 'hq')!
      const siblings = world.actors.filter(a => a.facility === actor.facility)
      const offset = siblings.findIndex(a => a.id === actor.id)
      return <button key={actor.id} className={`map-actor actor-color-${i % 4} ${selection?.type === 'actor' && selection.id === actor.id ? 'selected' : ''}`} style={{ left: `${f.x + (offset % 2 ? -13 : 13)}%`, top: `${f.y + (f.id === 'portal' ? -8 : 2) + Math.floor(offset / 2) * 9}%` }} onClick={() => onSelect({ type: 'actor', id: actor.id })} aria-label={`查看 ${actor.label} ${actor.name}`}>
        <pre aria-hidden="true">{actor.visibility === 'external' ? ' ? \n/|\\\n/ \\' : ' o \n/|\\\n/ \\'}</pre><span>{actor.label}</span>
      </button>
    })}
    {disconnected && <div className="connection-overlay"><span>连接已断开</span><small>当前运行状态未知 · 保留最后记录</small></div>}
    {!world.events.length && <div className="empty-scene">基地已就绪<small>尚无可见执行记录，任务开始后会出现在这里。</small></div>}
  </div>
}
