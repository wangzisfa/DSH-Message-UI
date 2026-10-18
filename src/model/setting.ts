import type { FacilityId } from './types'

export interface WorldSetting {
  version: 1
  name: string
  squadName: string
  story: string
  leaderTitle: string
  specialistTitle: string
  accent: string
  facilities: Partial<Record<FacilityId, string>>
}
export const SETTING_PATH = '.agentarium/world.json'
export const defaultSetting: WorldSetting = {
  version: 1, name: '智能体基地', squadName: '远征队',
  story: '一个安静的智能体基地。观察执行，追溯事实。',
  leaderTitle: '主控 Agent', specialistTitle: '队员', accent: '#7aafff', facilities: {},
}
const ids: FacilityId[] = ['hq', 'archive', 'workshop', 'terminal', 'test', 'web', 'portal', 'utility']
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
/** Only bounded presentation text and a hex color are accepted. No HTML, URLs, or code. */
export function parseWorldSetting(raw: string): WorldSetting {
  if (new TextEncoder().encode(raw).length > 16384) throw new Error('世界设定不能超过 16 KiB')
  const value = object(JSON.parse(raw))
  if (value.version !== 1) throw new Error('世界设定需要 version: 1')
  const string = (key: string, fallback: string, max: number) => {
    if (value[key] === undefined) return fallback
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > max || /[\u0000-\u001f\u007f]/.test(value[key])) throw new Error(`${key} 需要 1–${max} 个可显示字符`)
    return value[key].trim()
  }
  if (value.facilities !== undefined && (value.facilities === null || typeof value.facilities !== 'object' || Array.isArray(value.facilities))) throw new Error('facilities 需要名称映射对象')
  const facilities: WorldSetting['facilities'] = {}
  for (const [key, label] of Object.entries(object(value.facilities))) {
    if (!ids.includes(key as FacilityId) || typeof label !== 'string' || !label.trim() || label.length > 16 || /[\u0000-\u001f\u007f]/.test(label)) throw new Error('设施需要有效 ID 和 1–16 字名称')
    facilities[key as FacilityId] = label.trim()
  }
  const accent = string('accent', defaultSetting.accent, 7)
  if (!/^#[0-9a-f]{6}$/i.test(accent)) throw new Error('accent 需要六位十六进制颜色')
  return { version: 1, name: string('name', defaultSetting.name, 24), squadName: string('squadName', defaultSetting.squadName, 16), story: string('story', defaultSetting.story, 240), leaderTitle: string('leaderTitle', defaultSetting.leaderTitle, 24), specialistTitle: string('specialistTitle', defaultSetting.specialistTitle, 16), accent, facilities }
}
export const settingPrompt = `请结合当前项目的用途，为 Agentarium 设计游戏世界背景，并使用文件工具创建或修改项目内的 ${SETTING_PATH}。先读取已有文件再修改。仅设置表现层，不添加执行状态或完成百分比。JSON 格式：${JSON.stringify(defaultSetting)}。version 必须为 1，name/leaderTitle 最多 24 字，squadName/specialistTitle/设施名最多 16 字，story 最多 240 字且不换行，accent 为六位十六进制颜色；设施 ID 为 hq/archive/workshop/terminal/test/web/portal/utility。保存后工作流会自动刷新，也可以点击“刷新设定”。`
