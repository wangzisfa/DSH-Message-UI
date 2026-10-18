import { Component, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { piece } from 'ascii.rest/kit'
import { mount } from 'ascii.rest'
import { facilities } from './facilities'
import { AsciiArt } from './AsciiArt'
import { useWorldSetting } from './WorldSetting'
import { statusCode, type Selection, type World, type Status } from '../model/types'

function Ambient({ active, channels }: { active: boolean; channels: string }) {
  const ref = useRef<HTMLPreElement>(null)
  const signal = useRef<HTMLPreElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!ref.current || !signal.current) return
    const dispose: (() => void)[] = []
    try {
      const scene = piece({ name: 'agentarium-base', cols: 120, rows: 50, fps: 0 }, (_t, surface) => {
        for (let y = 3; y < 48; y += 3) for (let x = 3; x < 118; x += 6) surface.set(x, y, (x + y) % 4 ? '.' : '+')
        // The bus is a visual layout, not a claim about tool dependencies.
        for (let x = 21; x <= 98; x++) { surface.set(x, 23, '-'); surface.set(x, 25, '-') }
        for (const x of [21, 60, 98]) {
          for (let y = 15; y < 35; y++) surface.set(x, y, '|')
          surface.set(x, 23, '+'); surface.set(x, 25, '+')
        }
      })
      const packets = piece({ name: 'agentarium-signal', cols: 120, rows: 50, fps: active ? 12 : 0 }, (t, surface) => {
        if (!active) return
        const head = Math.floor(t * 8)
        for (const id of channels.split(',')) {
          const facility = facilities.find(f => f.id === id)
          if (!facility) continue
          const x = Math.round(facility.x * 1.2)
          const y = facility.y < 48 ? 16 + head % 7 : 27 + head % 7
          surface.write(x - 1, y, '[+]')
          surface.set(x, y - 1, ':')
          const direction = x < 60 ? 1 : -1
          const travel = Math.abs(60 - x)
          if (travel) surface.write(x + direction * (head % travel), 23, direction > 0 ? '==>' : '<==')
        }
      })
      dispose.push(mount(ref.current, scene))
      dispose.push(mount(signal.current, packets))
    } catch { setFailed(true) }
    return () => dispose.forEach(stop => stop())
  }, [active, channels])
  return <><pre ref={ref} aria-hidden="true" className="ambient" /><pre ref={signal} aria-hidden="true" className="ambient signal-flow" />{failed && <span className="renderer-notice">字符背景不可用 · 事实视图正常</span>}</>
}

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="scene-fallback">场景暂时无法绘制。请使用队员列表和事件记录检查任务。</div> : this.props.children }
}

export function Scene({ world, selection, onSelect, animate, disconnected }: {
  world: World; selection: Selection; onSelect: (s: Selection) => void; animate: boolean; disconnected: boolean
}) {
  const setting = useWorldSetting()
  const moving = animate && !disconnected && world.events.length > 0
  const live = moving && (world.status === 'running' || world.actions.some(a => a.status === 'running'))
  const channels = [...new Set(world.actions.filter(a => a.status === 'running').map(a => a.facility))].join(',')
  return <div className="scene" data-motion={moving ? 'on' : 'off'} data-disconnected={disconnected} aria-label="智能体基地地图" onClick={e => { if (e.target === e.currentTarget) onSelect(null) }}>
    <Ambient active={live} channels={channels} />
    <div className="scene-sweep" aria-hidden="true" />
    <div className="scene-hud" aria-hidden="true"><span><b>[+]</b> COLONY_OS <i>/</i> SECTOR 001</span><span className={live ? 'hud-active' : ''}><i className="hud-led" />{disconnected ? 'SIGNAL LOST' : moving ? 'ASCII ENGINE' : 'STATIC VIEW'}</span></div>
    <span className="bus-label" aria-hidden="true">:: OBSERVATION BUS ::</span>
    <span className="scene-tag tag-left" aria-hidden="true">X:120 / Y:050 <span>· 字符动效</span></span>
    <span className={`scene-tag tag-right ${live ? 'live' : ''}`} aria-hidden="true">{disconnected ? 'OFFLINE' : 'LOCAL OBSERVATION'} <i className="signal-dot" /></span>
    {facilities.filter(f => f.id !== 'utility' || world.actions.some(a => a.facility === 'utility')).map((f, i) => {
      const actions = world.actions.filter(a => a.facility === f.id)
      const active = actions.filter(a => a.status === 'running' || a.status === 'waiting')
      const state: Status = disconnected && (active.length || f.id === 'hq') ? 'unknown' : active.some(a => a.status === 'waiting') ? 'waiting' : active.length ? 'running' : actions.some(a => a.status === 'failed') ? 'failed' : actions.length ? 'succeeded' : f.id === 'hq' ? world.status : 'idle'
      const selected = selection?.type === 'facility' && selection.id === f.id
      const selectedActor = selection?.type === 'actor' && world.actors.find(a => a.id === selection.id)?.facility === f.id
      const selectedEvent = selection?.type === 'event' ? world.events.find(e => e.id === selection.id) : undefined
      const selectedAction = (selection?.type === 'action' && world.actions.find(a => a.id === selection.id)?.facility === f.id)
        || (selectedEvent?.callId && world.actions.find(a => a.latest.callId === selectedEvent.callId && a.latest.sessionId === selectedEvent.sessionId)?.facility === f.id)
      return <button key={f.id} className={`facility facility-${f.id} state-${state} ${selected || selectedActor || selectedAction ? 'selected' : ''}`} style={{ left: `${f.x}%`, top: `${f.y}%`, '--enter-delay': `${i * 65}ms` } as CSSProperties} onClick={() => onSelect({ type: 'facility', id: f.id })} aria-pressed={!!(selected || selectedActor || selectedAction)} aria-label={`${setting.facilities[f.id] ?? f.name}，${disconnected ? '连接已断开' : `${active.length} 个活动调用`}`}>
        <span className="facility-bracket bracket-tl" aria-hidden="true" /><span className="facility-bracket bracket-br" aria-hidden="true" />
        <AsciiArt facility={f} active={moving && (state === 'running' || f.id === 'hq' && live)} />
        <span className="facility-label">{setting.facilities[f.id] ?? f.name}<span>{f.code}</span></span>
        <span className="facility-state" key={state}><i />{statusCode[state]}{active.length > 1 ? ` ×${active.length}` : ''}</span>
      </button>
    })}
    {world.actors.map((actor, i) => {
      const f = facilities.find(f => f.id === actor.facility) ?? facilities.find(f => f.id === 'hq')!
      const siblings = world.actors.filter(a => a.facility === actor.facility)
      const offset = siblings.findIndex(a => a.id === actor.id)
      return <button key={actor.id} className={`map-actor ${moving && actor.status === 'running' ? 'actor-moving' : ''} actor-color-${i % 4} ${selection?.type === 'actor' && selection.id === actor.id ? 'selected' : ''}`} style={{ left: `${Math.max(5, Math.min(95, f.x + ((offset % 4) - (Math.min(siblings.length, 4) - 1) / 2) * 8))}%`, top: `${Math.min(94, f.y + 17 + Math.floor(offset / 4) * 7)}%` }} onClick={() => onSelect({ type: 'actor', id: actor.id })} aria-pressed={selection?.type === 'actor' && selection.id === actor.id} aria-label={`查看 ${actor.label} ${actor.name}`}>
        <pre aria-hidden="true">{actor.visibility === 'external' ? ' .-. \n[?-?]\n /|\\' : [' .^. \n[o_o]\n /|\\', ' .-. \n[0_0]\n /|\\', ' ._. \n[>_<]\n /|\\'][i % 3]}</pre><span>{actor.label}<i aria-hidden="true" /></span>
      </button>
    })}
    {disconnected && <div className="connection-overlay"><span>连接已断开</span><small>当前运行状态未知 · 保留最后记录</small></div>}
    {!world.events.length && <div className="empty-scene">基地已就绪<small>尚无可见执行记录，任务开始后会出现在这里。</small></div>}
  </div>
}
