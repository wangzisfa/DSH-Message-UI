import { defaultFacilityNames, type WorldSetting } from './setting'
import { actionKey, statusText, type EvidenceEvent, type World } from './types'

export interface WorldChapter {
  event: EvidenceEvent
  text: string
}
export interface WorldNarrative {
  chapters: WorldChapter[]
  count: number
  places: number
}

/** A bounded, deterministic presentation of visible evidence, never a second event log.
 * No wall clock, random state, tool bodies, or model requests: replay uses the same fold.
 */
export function generateWorldNarrative(world: World, setting: WorldSetting): WorldNarrative {
  const actors = new Map(world.actors.map(actor => [actor.id, actor]))
  const actions = new Map(world.actions.map(action => [action.id, action]))
  const chapters = world.events.slice(-40).map(event => {
    const actor = actors.get(event.actorId)
    const label = actor?.label ?? event.actor?.label ?? event.actorId
    const person = `${event.actorId === 'root' ? setting.leaderTitle : setting.specialistTitle} ${label}`
    const action = event.callId ? actions.get(actionKey(event.sessionId, event.callId)) : undefined
    const id = event.facility ?? action?.facility ?? 'hq'
    const place = `「${setting.facilities[id] ?? defaultFacilityNames[id]}」`
    const tool = event.tool ?? action?.tool ?? '工具'
    const state = statusText[event.status ?? 'unknown']
    const external = actor?.visibility === 'external' || event.actor?.visibility === 'external'
    let text: string
    switch (event.kind) {
      case 'turn.start': text = `${person}在「${setting.name}」展开新一轮行动，${setting.squadName}的故事随执行续写。`; break
      case 'turn.end': text = `${person}的这一轮行动留下了结束记录：${state}。`; break
      case 'actor.spawn': text = external
        ? `${setting.squadName}收到外部队员 ${label} 的关联信号；内部行程仍不可见。`
        : `${person}加入${setting.squadName}，从「${setting.facilities.portal ?? defaultFacilityNames.portal}」进入观测视野。`; break
      case 'actor.end': text = `${person}传回行动结算信号：${state}。${external ? '内部过程仍不可见。' : ''}`; break
      case 'action.start': text = `${person}在${place}启动 ${tool}，新的行动正在展开。`; break
      case 'action.wait': text = `${place}的 ${tool} 行动停在审批关口，等待原生审批。`; break
      case 'action.end': text = event.status === 'failed'
        ? `${place}亮起异常信号：${person}的 ${tool} 调用失败，线索留在来源记录中。`
        : `${place}传回 ${tool} 的结算信号：${state}；这是一次调用的记录。`; break
      case 'artifact': text = `${person}为成果仓库登记了「${event.artifact?.name ?? '成果'}」，${setting.squadName}留下新的可查记录。`; break
    }
    return { event, text }
  })
  return { chapters, count: world.events.length, places: new Set(world.actions.map(action => action.facility)).size }
}
