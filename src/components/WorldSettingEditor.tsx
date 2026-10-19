import { useEffect, useState } from 'react'
import { defaultSetting, parseWorldSetting, worldPresets, type WorldSetting } from '../model/setting'
import { facilities } from './facilities'

const fields = [
  { key: 'name', label: '世界名称', max: 24 },
  { key: 'squadName', label: '队伍名称', max: 16 },
  { key: 'leaderTitle', label: '主 Agent 称谓', max: 24 },
  { key: 'specialistTitle', label: '子 Agent 称谓', max: 16 },
] as const

export function WorldSettingEditor({ setting, onApply, applyLabel, onSaveToProject }: {
  setting: WorldSetting
  onApply: (value: WorldSetting) => string
  applyLabel: string
  onSaveToProject?: (value: WorldSetting) => string
}) {
  const [draft, setDraft] = useState(setting)
  const [dirty, setDirty] = useState(false)
  const [json, setJson] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { if (!dirty) setDraft(setting) }, [setting, dirty])
  const edit = (value: WorldSetting) => { setDraft(value); setDirty(true) }
  const run = (action: (value: WorldSetting) => string) => {
    try {
      const value = parseWorldSetting(JSON.stringify(draft))
      setNotice(action(value)); setError('')
    } catch (error) { setError(error instanceof Error ? error.message : '请检查世界设定'); setNotice('') }
  }
  const load = (value: WorldSetting, message: string) => { edit(value); setNotice(message); setError('') }
  return <details className="world-editor">
    <summary>自定义世界观</summary>
    <p>先编辑，再应用。世界动态将沿用这里的名称与称谓，随执行事件持续生成。</p>
    <div className="setting-actions world-presets"><span>从预设开始</span>{worldPresets.map(preset => <button type="button" key={preset.label} onClick={() => load(preset.setting, '预设已载入编辑器，应用后生效。')}>{preset.label}</button>)}</div>
    <form onSubmit={event => { event.preventDefault(); run(value => { const message = onApply(value); setDirty(false); return message }) }}>
      <div className="world-field-grid">{fields.map(field => <label key={field.key}>{field.label}<input required maxLength={field.max} value={draft[field.key]} onChange={event => edit({ ...draft, [field.key]: event.target.value })} /></label>)}</div>
      <label className="world-story-field">背景设定 <small>{draft.story.length} / 240</small><input required maxLength={240} value={draft.story} onChange={event => edit({ ...draft, story: event.target.value })} /></label>
      <label className="world-color-field">主题色 <input type="color" aria-label="选择主题色" value={/^#[0-9a-f]{6}$/i.test(draft.accent) ? draft.accent : defaultSetting.accent} onChange={event => edit({ ...draft, accent: event.target.value })} /><input aria-label="主题色十六进制值" maxLength={7} value={draft.accent} onChange={event => edit({ ...draft, accent: event.target.value })} /></label>
      <fieldset><legend>设施名称 <span>留空使用默认名称</span></legend><div className="world-field-grid">{facilities.map(facility => <label key={facility.id}>{facility.name}<input maxLength={16} placeholder={facility.name} value={draft.facilities[facility.id] ?? ''} onChange={event => {
        const next = { ...draft.facilities }
        if (event.target.value === '') delete next[facility.id]
        else next[facility.id] = event.target.value
        edit({ ...draft, facilities: next })
      }} /></label>)}</div></fieldset>
      <div className="setting-actions"><button type="submit">{applyLabel}</button>{onSaveToProject && <button type="button" onClick={() => run(onSaveToProject)}>加入项目保存草稿</button>}<button type="button" onClick={() => { load(setting, '已载入当前使用的设定。'); setDirty(false) }}>载入当前设定</button><button type="button" onClick={() => load(defaultSetting, '默认设定已载入，应用后生效。')}>恢复默认</button><button type="button" onClick={() => run(value => {
        const url = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json;charset=utf-8' }))
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'world.json'; anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        return '已导出 world.json，可保存为项目内的 .agentarium/world.json。'
      })}>导出 JSON</button></div>
    </form>
    <details className="world-json"><summary>从 JSON 导入</summary><p>粘贴配置后载入编辑器，应用前可继续修改。</p><textarea aria-label="导入世界观 JSON" value={json} maxLength={16384} onChange={event => setJson(event.target.value)} spellCheck={false} /><div className="setting-actions"><button type="button" onClick={() => {
      try { load(parseWorldSetting(json), 'JSON 已载入编辑器，应用后生效。') }
      catch (error) { setError(error instanceof Error ? error.message : 'JSON 无效'); setNotice('') }
    }}>导入 JSON</button></div></details>
    {error && <p role="alert" className="world-error">{error}</p>}
    <p role="status">{notice}</p>
  </details>
}
