import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Box, GitBranch, MessageSquare, Moon, Network, Pause, Play, RotateCcw, Sun, Terminal, Wifi, WifiOff } from 'lucide-react'
import { WorkflowView } from './components/WorkflowView'
import { DEMO_SESSION, demoEvents, initialDemoCount } from './demo/fixture'
import { timeLabel, type EvidenceEvent } from './model/types'

export default function App() {
  const [tab, setTab] = useState('workflow')
  const [count, setCount] = useState(initialDemoCount)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<'live' | 'replay'>('live')
  const [scenario, setScenario] = useState('review')
  const [disconnected, setDisconnected] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [traceFocus, setTraceFocus] = useState<string | null>(null)
  const [cursor, setCursor] = useState(initialDemoCount)
  const isEmpty = scenario === 'empty'
  const visibleCount = mode === 'replay' ? cursor : count
  const events = useMemo(() => isEmpty ? [] : demoEvents.slice(0, visibleCount), [visibleCount, isEmpty])
  useEffect(() => {
    if (!playing || disconnected || isEmpty) return
    const id = setInterval(() => setCount(n => { if (n >= demoEvents.length) { setPlaying(false); return n } return n + 1 }), 1800)
    return () => clearInterval(id)
  }, [playing, disconnected, isEmpty])
  const trace = (event: EvidenceEvent) => { setTraceFocus(event.callId ?? event.id); setTab('trajectory') }
  const switchMode = (value: 'live' | 'replay') => { if (value === 'replay') setCursor(count); setMode(value) }
  const reset = () => { setCount(1); setCursor(1); setMode('live'); setPlaying(true); setDisconnected(false); setScenario('review') }

  return <div className="agentarium" data-theme={theme}>
    <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true">a<span>_</span></span><strong>agentarium</strong><span className="version">v0.1</span></div><div className="demo-badge"><span />DEMO<span className="demo-explain">演示数据 · 未连接 dsh</span></div><button className="icon-button theme-button" aria-label={theme === 'dark' ? '切换浅色主题' : '切换深色主题'} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button></header>
    <div className="session-bar"><div className="session-title"><Box size={16} /><span>DSH-Message-UI</span><span className="slash">/</span><strong>{isEmpty ? '新的任务' : '审查项目架构与测试'}</strong><GitBranch size={13} /><span className="mono branch-label">main</span></div><nav className="view-tabs" aria-label="会话视图">{[{ id: 'chat', label: '对话', icon: MessageSquare }, { id: 'trajectory', label: '轨迹', icon: Terminal }, { id: 'workflow', label: '工作流', icon: Network }].map(t => <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}><t.icon size={15} />{t.label}</button>)}</nav></div>
    <main>
      <div className="demo-toolbar"><label>演示场景<select aria-label="演示场景" value={scenario} onChange={e => { setScenario(e.target.value); setPlaying(false); setCount(initialDemoCount); setMode('live'); setDisconnected(false) }}><option value="review">多 Agent 仓库审查</option><option value="empty">新会话 · 空基地</option></select></label><div className="demo-playback"><button className="icon-button" aria-label="从头播放演示" title="从头播放演示" onClick={reset}><RotateCcw size={15} /></button><button className="play-button" disabled={isEmpty || disconnected || count >= demoEvents.length} onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={13} /> : <Play size={13} />}{playing ? '暂停演示' : count >= demoEvents.length ? '演示已结束' : '继续演示'}</button><button className="icon-button" disabled={isEmpty || disconnected || count >= demoEvents.length} aria-label="下一个演示事件" title="下一个演示事件" onClick={() => setCount(n => Math.min(n + 1, demoEvents.length))}><ArrowRight size={15} /></button><button className={`connection-button ${disconnected ? 'state-waiting' : ''}`} aria-pressed={disconnected} onClick={() => setDisconnected(v => !v)}>{disconnected ? <WifiOff size={14} /> : <Wifi size={14} />}{disconnected ? '恢复连接' : '模拟断连'}</button></div><div className="segmented mode-switch"><button aria-pressed={mode === 'live'} onClick={() => switchMode('live')}>演示现场</button><button aria-pressed={mode === 'replay'} onClick={() => switchMode('replay')}>历史回放</button></div></div>
      {mode === 'replay' && <div className="replay-bar"><button className="icon-button" aria-label="上一条历史事件" disabled={cursor <= 0} onClick={() => setCursor(n => Math.max(0, n - 1))}><ArrowLeft size={14} /></button><input aria-label="历史事件游标" type="range" min="0" max={count} value={Math.min(cursor, count)} onChange={e => setCursor(Number(e.target.value))} /><span className="mono">{cursor} / {count}</span><span>回放只改变观察时间，后台演示可继续。</span></div>}
      {tab === 'workflow' && <WorkflowView key={scenario} sessionId={isEmpty ? 'demo-empty' : DEMO_SESSION} events={events} demo disconnected={disconnected && mode === 'live'} replay={mode === 'replay'} onTrace={trace} />}
      {tab === 'chat' && <section className="chat-preview"><div className="preview-label">DEMO 对话预览</div><h1>审查项目架构与测试</h1><div className="chat-message"><span>你</span><p>扫描项目架构，运行测试，给出改进报告。</p></div><div className="chat-message"><span>A0</span><p>这是一段合成的多 Agent 审查记录。切换到工作流，可以查看各个队员、工具调用与异常；演示不会执行实际命令。</p><button className="trace-link" onClick={() => setTab('workflow')}>进入智能体基地 <ArrowRight size={16} /></button></div></section>}
      {tab === 'trajectory' && <section className="trajectory"><div className="trajectory-heading"><div><h1>执行轨迹</h1><p>演示记录的原始身份与时间；真实插件将跳转到 dsh 原生轨迹。</p></div><button onClick={() => setTab('workflow')}><ArrowLeft size={15} />返回工作流</button></div>{events.length ? events.filter(e => !traceFocus || e.callId === traceFocus || e.id === traceFocus).map(e => <article key={e.id}><header><span className="mono">#{e.seq} {e.sourceType}</span><time>{timeLabel(e.time)}</time></header><h3>{e.summary}</h3><pre>{JSON.stringify(e, null, 2)}</pre></article>) : <p className="muted">尚无可见记录。</p>}{traceFocus && <button className="load-more" onClick={() => setTraceFocus(null)}>显示全部轨迹</button>}</section>}
    </main>
  </div>
}
