import { actionKey, type Actor, type EvidenceEvent, type FacilityId, type World, type Action } from './types'

export function classifyTool(tool: string): FacilityId {
  if (/^(read_file|read|glob|grep|search|list_directory|ls)$/.test(tool)) return 'archive'
  if (/^(write_file|edit_file|apply_patch|write|edit)$/.test(tool)) return 'workshop'
  if (/^(bash|shell|exec_command|terminal|run_code)$/.test(tool)) return 'terminal'
  if (/^(run_tests|test|verify)$/.test(tool)) return 'test'
  if (/^(web_search|web_fetch|fetch|browser|web)$/.test(tool)) return 'web'
  if (/^(subagent|spawn_agent|workflow)$/.test(tool)) return 'portal'
  return 'utility'
}

/** Replay and live views use the same pure fold. A turn boundary never settles a tool. */
export function projectWorld(sessionId: string, input: readonly EvidenceEvent[]): World {
  const events = [...new Map(input.filter(e => e.sessionId === sessionId).map(e => [e.id, e])).values()]
    .sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id))
  const actors = new Map<string, Actor>()
  actors.set('root', { id: 'root', label: 'A0', name: '主控 Agent', role: '协调与交付', visibility: 'root', status: 'idle', facility: 'hq' })
  const actions = new Map<string, Action>()
  const artifacts: EvidenceEvent[] = []
  let status: World['status'] = 'idle'
  for (const event of events) {
    if (event.kind === 'actor.spawn' && event.actor) {
      actors.set(event.actorId, { id: event.actorId, ...event.actor, status: event.actor.visibility === 'external' ? 'unknown' : 'idle', facility: 'portal', lastEvent: event })
    }
    const actor = actors.get(event.actorId)
    if (event.kind === 'turn.start') status = 'running'
    if (event.kind === 'turn.end') status = event.status ?? 'unknown'
    if (event.kind === 'artifact' && event.artifact) artifacts.push(event)
    if (event.callId && ['action.start', 'action.end', 'action.wait'].includes(event.kind)) {
      const id = actionKey(event.sessionId, event.callId)
      const previous = actions.get(id)
      const facility = event.facility ?? previous?.facility ?? classifyTool(event.tool ?? '')
      const action: Action = {
        id, actorId: event.actorId, tool: event.tool ?? previous?.tool ?? event.callId,
        facility, status: event.status ?? (event.kind === 'action.start' ? 'running' : event.kind === 'action.wait' ? 'waiting' : 'unknown'),
        start: event.kind === 'action.start' ? event : previous?.start,
        end: event.kind === 'action.end' ? event : previous?.end,
        latest: event,
      }
      actions.set(id, action)
      if (actor && actor.visibility !== 'external') actor.facility = facility
    }
    if (actor) {
      actor.lastEvent = event
      if (event.kind === 'actor.end' || event.kind === 'turn.end' || event.kind === 'turn.start') {
        actor.status = event.status ?? (event.kind === 'turn.start' ? 'running' : 'unknown')
      }
    }
  }
  for (const actor of actors.values()) {
    if (actor.visibility === 'external') continue
    const owned = [...actions.values()].filter(a => a.actorId === actor.id)
    const active = owned.find(a => a.status === 'waiting') ?? owned.findLast(a => a.status === 'running')
    if (active) { actor.status = active.status; actor.facility = active.facility }
    else if (actor.lastEvent && ['action.end', 'action.wait'].includes(actor.lastEvent.kind)) actor.status = actor.lastEvent.status ?? 'idle'
  }
  return { sessionId, actors: [...actors.values()], actions: [...actions.values()], events, artifacts, status }
}
