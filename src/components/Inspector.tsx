import { ArrowUpRight, FileText, X } from 'lucide-react'
import { facilities } from './facilities'
import { useWorldSetting } from './WorldSetting'
import { actionKey, statusText, timeLabel, type Actor, type EvidenceEvent, type Selection, type World } from '../model/types'

export function Inspector({ world, selection, onSelect, onTrace, demo, disconnected, onOpenActor }: {
  world: World; selection: Selection; onSelect: (s: Selection) => void; onTrace?: (event: EvidenceEvent) => void; demo: boolean; disconnected: boolean; onOpenActor?: (actor: Actor) => void
}) {
  const setting = useWorldSetting()
  const actor = selection?.type === 'actor' ? world.actors.find(a => a.id === selection.id) : undefined
  const event = selection?.type === 'event' ? world.events.find(e => e.id === selection.id) : undefined
  const action = selection?.type === 'action' ? world.actions.find(a => a.id === selection.id) : event?.callId ? world.actions.find(a => a.id === actionKey(event.sessionId, event.callId!)) : undefined
  const facility = selection?.type === 'facility' ? facilities.find(f => f.id === selection.id) : undefined
  const evidence = event ?? action?.latest ?? actor?.lastEvent
  const owner = actor ?? world.actors.find(a => a.id === action?.actorId)
  const shownStatus = action?.status ?? actor?.status ?? event?.status
  const status = disconnected && (shownStatus === 'running' || shownStatus === 'waiting') ? 'unknown' : shownStatus
  const title = actor?.name ?? action?.tool ?? (facility && (setting.facilities[facility.id] ?? facility.name)) ?? (event ? '事件记录' : '选择一个现场')

  return <aside className="inspector" aria-label="检查器">
    <div className="panel-heading"><span>现场检查器</span>{selection && <button className="icon-button" aria-label="关闭检查器" onClick={() => onSelect(null)}><X size={15} /></button>}</div>
    <div className="inspector-content" key={`${selection?.type}:${selection?.id}`}>
      <div className="inspector-channel" aria-hidden="true">INSPECT://{selection?.type.toUpperCase() ?? 'STANDBY'}</div>
      {facility && <pre className="inspector-art" aria-hidden="true">{facility.art}</pre>}
      {!selection && <pre className="inspector-reticle" aria-hidden="true">{`   +-------+-------+
   |   .   |   .   |
   | .   .-+-.   . |
   +----(  +  )----+
   | .   '-+-'   . |
   |   .   |   .   |
   +-------+-------+
      SELECT TARGET`}</pre>}
      <div className="inspector-symbol" aria-hidden="true">{status === 'failed' ? '[ ! ]' : actor ? '[ o ]' : facility ? '[ # ]' : '[ >_ ]'}</div>
      <h3>{title}</h3>
      {status && <span className={`status state-${status}`}>{statusText[status]}</span>}
      {!selection && <p className="muted">点击地图上的队员、设施或下方事件，查看它背后的执行事实。</p>}
      {owner && <dl><dt>执行者</dt><dd>{owner.label} · {owner.name}</dd><dt>可见范围</dt><dd>{owner.visibility === 'external' ? '外部 · 内部不可见' : owner.visibility === 'root' ? '主会话' : '本地子会话'}</dd>{owner.parentId && <><dt>父级</dt><dd>{world.actors.find(a => a.id === owner.parentId)?.label ?? owner.parentId}</dd></>}</dl>}
      {action && <dl><dt>来源会话</dt><dd className="mono">{action.latest.sessionId}</dd><dt>调用身份</dt><dd className="mono">{action.latest.callId}</dd><dt>开始时间</dt><dd>{action.start ? timeLabel(action.start.time) : '未加载开始记录'}</dd><dt>结算时间</dt><dd>{action.end ? timeLabel(action.end.time) : '尚无结算记录'}</dd><dt>设施</dt><dd>{setting.facilities[action.facility] ?? facilities.find(f => f.id === action.facility)?.name ?? '通用站'}</dd></dl>}
      {owner?.sessionId && onOpenActor && <button className="trace-link" onClick={() => onOpenActor(owner)}>打开子会话 <ArrowUpRight size={15} /></button>}
      {owner && !evidence && <p className="muted">身份来源：宿主 subagentCatalog 投影；内部活动以已读取记录为准。</p>}
      {evidence && <div className="evidence-note"><span>已记录的事实</span><p>{evidence.summary}</p><small className="mono">{evidence.sourceType} · #{evidence.seq}</small></div>}
      {evidence?.detail && <details><summary>查看{demo ? '演示' : '安全'}摘要</summary><pre>{evidence.detail}</pre></details>}
      {actor?.visibility === 'external' && <p className="notice">仅展示已确认的关联与回传结果。没有可访问的内部轨迹。</p>}
      {evidence?.callId && onTrace && <button className="trace-link" onClick={() => onTrace(evidence)}>{evidence.actorId !== 'root' && !demo ? '打开来源子会话' : `在${demo ? '演示' : '原生'}轨迹中查看`} <ArrowUpRight size={15} /></button>}
      {facility && <><p className="muted">设施仅用于归类工具，不代表实际执行资源。</p><div className="facility-actions">{world.actions.filter(a => a.facility === facility.id).map(a => <button key={a.id} onClick={() => onSelect({ type: 'action', id: a.id })}><span>{a.tool}</span><span className={`state-${a.status}`}>{statusText[a.status]}</span></button>)}{!world.actions.some(a => a.facility === facility.id) && <p className="muted">尚无已记录调用</p>}</div></>}
    </div>
    <div className="depot"><div className="panel-heading"><span><FileText size={14} /> 成果仓库</span><span className="mono">{world.artifacts.length.toString().padStart(2, '0')}</span></div>{world.artifacts.length ? world.artifacts.map(e => <button className="artifact" key={e.id} onClick={() => { const url = URL.createObjectURL(new Blob([e.artifact!.content], { type: 'text/markdown;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = e.artifact!.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }}><FileText size={15} />{e.artifact!.name}<ArrowUpRight size={13} /></button>) : <p>等待已确认的交付物<span>工具成功不等于任务完成</span></p>}</div>
  </aside>
}
