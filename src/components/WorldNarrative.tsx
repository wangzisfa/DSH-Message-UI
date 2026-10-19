import { useMemo, useState } from 'react'
import { generateWorldNarrative, type WorldNarrative as Narrative } from '../model/narrative'
import { timeLabel, type Selection, type World } from '../model/types'
import { useWorldSetting } from './WorldSetting'

export function WorldNarrative({ world, replay, disconnected, onSelect }: {
  world: World; replay: boolean; disconnected: boolean; onSelect: (selection: Selection) => void
}) {
  const setting = useWorldSetting()
  const generated = useMemo(() => generateWorldNarrative(world, setting), [world, setting])
  const [frozen, setFrozen] = useState<{ sessionId: string; narrative: Narrative } | null>(null)
  const [expanded, setExpanded] = useState(false)
  // Replay always follows its cursor; switching sessions cannot retain a frozen world.
  const paused = !replay && frozen?.sessionId === world.sessionId
  const narrative = paused ? frozen.narrative : generated
  const chapters = narrative.chapters.slice(expanded ? -40 : -3).toReversed()
  return <section className="world-narrative" aria-label="世界动态">
    <div className="world-narrative-heading"><div><span className="mono">WORLD / </span><h2>世界动态</h2><span className="world-narrative-mode">{replay ? '按历史游标重建' : disconnected ? '连接中断 · 等待同步' : paused ? '叙事已暂停' : '随执行持续生成'}</span></div><button aria-pressed={paused} disabled={replay} onClick={() => setFrozen(paused ? null : { sessionId: world.sessionId, narrative: generated })}>{paused ? '继续世界叙事' : '暂停世界叙事'}</button></div>
    <p className="world-narrative-note">背景演绎 · 基于可见执行事件生成，点击可追溯来源。暂停叙事时 Agent 仍继续执行。</p>
    {chapters.length ? <ol>{chapters.map(chapter => <li key={chapter.event.id}><button onClick={() => onSelect({ type: 'event', id: chapter.event.id })}><time>{timeLabel(chapter.event.time)}</time><span>{chapter.text}</span><small className={`state-${chapter.event.status ?? 'idle'}`}>#{chapter.event.seq} ↗</small></button></li>)}</ol> : <p className="world-narrative-empty">「{setting.name}」等待第一条行动信号。执行开始后，{setting.squadName}的世界将逐步展开。</p>}
    <div className="world-narrative-footer"><span>{narrative.count} 条来源事件 · {narrative.places} 处设施留下行动记录</span>{narrative.chapters.length > 3 && <button onClick={() => setExpanded(value => !value)}>{expanded ? '收起篇章' : '展开最近篇章'}</button>}<span>{replay ? '使用当前世界设定' : '保留最近 40 条篇章'}</span></div>
  </section>
}
