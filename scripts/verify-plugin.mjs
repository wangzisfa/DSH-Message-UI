/** Deterministic integration checks of evidence folding, host subscriptions and package contract. */
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
const temp = await mkdtemp(`${tmpdir()}/agentarium-verify-`)
try {
  for (const [name, entry] of Object.entries({ adapter: 'src/dsh/adapter.ts', model: 'src/model/projector.ts', setting: 'src/model/setting.ts', observation: 'src/dsh/observation.ts' })) {
    await build({ entryPoints: [entry], outfile: `${temp}/${name}.mjs`, bundle: true, platform: 'node', format: 'esm' })
  }
  const load = name => import(pathToFileURL(`${temp}/${name}.mjs`).href)
  const { normalizeDshWindow } = await load('adapter')
  const { projectWorld } = await load('model')
  const { parseWorldSetting } = await load('setting')
  const { DshObservation } = await load('observation')
  function source(snapshot) {
    const listeners = new Set()
    return { getSnapshot: () => snapshot, subscribe: f => { listeners.add(f); return () => listeners.delete(f) }, set: value => { snapshot = value; listeners.forEach(f => f()) }, count: () => listeners.size }
  }
  const record = (seq, type, data) => ({ type: 'event', event: { seq, time: 1000 + seq * 10, type, data } })
  const window = entries => ({ revision: 1, hasMore: false, entries })
  const rootWindow = window([
    record(0, 'turn/start', {}),
    record(1, 'subagent/catalog', { version: 0, childId: 'child', mode: 'one-shot', childCreatedAt: 1010, label: '审查员' }),
    record(2, 'subagent/catalog', { version: 2, childId: 'external', mode: 'external', childCreatedAt: 1020, label: '外部审查员' }),
    record(3, 'tool/call', { callId: 'same-id', name: 'bash', arguments: 'SECRET_INPUT' }),
    record(4, 'step/end', {}),
    record(5, 'tool/result', { message: { toolCallId: 'same-id', isError: true, content: 'SECRET_OUTPUT' } }),
    record(6, 'turn/end', { reason: { kind: 'blocked' } }),
  ])
  const normalized = normalizeDshWindow('root-session', rootWindow)
  assert.equal(normalized.length, 6)
  assert(!JSON.stringify(normalized).includes('SECRET'))
  assert.equal(projectWorld('root-session', normalized).status, 'blocked')
  assert.equal(projectWorld('other', normalized).events.length, 0)
  assert.equal(projectWorld('root-session', normalized.slice().reverse().concat(normalized)).actions.length, 1)
  assert.equal(projectWorld('root-session', normalized.slice(0, -2)).actions[0].status, 'running', 'step/end cannot settle a tool')
  const missing = normalizeDshWindow('missing', window([record(0, 'tool/result', { message: { toolCallId: 'absent', isError: false } })]))
  assert.equal(projectWorld('missing', missing).actions[0].start, undefined)
  const ptc = normalizeDshWindow('ptc', window([record(0, 'tool/ptc-dispatch-start', { subCallId: 'nested', name: 'read' }), record(1, 'tool/ptc-dispatch', { subCallId: 'nested', name: 'read', isError: true })]))
  assert.equal(projectWorld('ptc', ptc).actions[0].status, 'failed')
  const projections = new Map()
  function binding(id, entries, catalog = []) {
    const identity = source(id === 'child' ? { seq: 2, mode: 'one-shot' } : undefined)
    const children = source(catalog)
    const binding = { sessionId: id, eventSource: source(window(entries)), session: Object.assign(source({ openState: 'open', running: false }), { projections: { faceOf: key => key === 'subagent' ? identity : children }, loadOlder: async () => {} }) }
    projections.set(id, { identity, children }); return binding
  }
  const root = binding('root-session', rootWindow.entries, [{ id: 'child', mode: 'one-shot', createdAt: 1010, label: '审查员' }, { id: 'external', mode: 'external', createdAt: 1020 }])
  const child = binding('child', [record(0, 'tool/call', { callId: 'inherited', name: 'bash' }), record(2, 'subagent/descriptor', {}), record(3, 'turn/start', {}), record(4, 'tool/call', { callId: 'same-id', name: 'read' }), record(5, 'turn/end', { reason: { kind: 'completed' } })])
  let retained = 0; let released = 0
  const generation = source({ id: 1 })
  const sessionStatus = source(new Map())
  const ctx = { sessions: { retain: address => { assert.equal(address.childSessionId, 'child'); retained++; return { ready: Promise.resolve(child), release: () => released++ } } }, connection: { generation }, uiSession: { sessionStatus } }
  const observer = new DshObservation(ctx, root)
  const stop = observer.start()
  await new Promise(resolve => setImmediate(resolve))
  let state = observer.getSnapshot()
  assert.equal(retained, 1, 'external child must never be opened')
  assert(!state.events.some(e => e.callId === 'inherited'), 'fork inheritance must not be attributed to child')
  const world = projectWorld('root-session', state.events, state.actors)
  assert.equal(world.actions.length, 2, 'same callId in two sessions stays distinct')
  assert.equal(world.status, 'blocked', 'child completion cannot complete the parent')
  assert.equal(world.actors.find(a => a.id === 'external').status, 'unknown')
  sessionStatus.set(new Map([['child', { pendingInteraction: { kind: 'approval', key: 'approval-1', sessionId: 'child', callId: 'same-id', toolName: 'read' } }]]))
  await new Promise(resolve => setImmediate(resolve))
  state = observer.getSnapshot()
  assert.equal(state.liveStatuses.get('child'), 'waiting')
  assert.equal(state.approvals.length, 1)
  assert(!state.events.some(e => e.kind === 'action.wait'), 'live approval must not be fabricated as durable history')
  generation.set(undefined)
  await new Promise(resolve => setImmediate(resolve))
  assert(observer.getSnapshot().disconnected)
  assert.equal(observer.getSnapshot().approvals.length, 0, 'stale approvals disappear on disconnect')
  stop()
  assert.equal(released, 1)
  for (const source of [root.eventSource, root.session, child.eventSource, child.session, generation, sessionStatus, ...[...projections.values()].flatMap(row => [row.identity, row.children])]) assert.equal(source.count(), 0, 'dispose must unsubscribe')
  const stopAgain = observer.start()
  await new Promise(resolve => setImmediate(resolve))
  stopAgain()
  assert.equal(released, 2, 'effect remount releases its own child references')
  assert.equal(parseWorldSetting('{"version":1}').name, '智能体基地')
  assert.equal(parseWorldSetting('{"version":1,"facilities":{"archive":"样本室"}}').facilities.archive, '样本室')
  for (const raw of ['{', '{"version":2}', '{"version":1,"name":true}', '{"version":1,"accent":"url(x)"}', '{"version":1,"facilities":[]}', JSON.stringify({ version: 1, story: '测'.repeat(6000) })]) assert.throws(() => parseWorldSetting(raw))
  const hostile = parseWorldSetting('{"version":1,"name":"<img src=x onerror=x>"}')
  assert.equal(hostile.name, '<img src=x onerror=x>', 'presentation remains plain text for React escaping')
  const many = Array.from({ length: 1500 }, (_, i) => ({ id: `stress:${i}`, sessionId: 'stress', seq: i, time: i, actorId: 'root', kind: 'action.start', sourceType: 'tool/call', callId: `call-${i}`, tool: 'read', summary: 'read' }))
  const crew = Array.from({ length: 7 }, (_, i) => ({ id: `agent-${i}`, label: `A${i + 1}`, name: `agent-${i}`, role: 'child', visibility: 'local', status: 'unknown', facility: 'portal' }))
  const parallel = Array.from({ length: 16 }, (_, i) => ({ ...many[i], id: `parallel:${i}`, sessionId: 'parallel', actorId: i % 8 === 0 ? 'root' : `agent-${(i % 8) - 1}` }))
  const parallelWorld = projectWorld('parallel', parallel, crew)
  assert.equal(parallelWorld.actors.length, 8)
  assert.equal(parallelWorld.actions.filter(a => a.status === 'running').length, 16)
  const before = performance.now()
  assert.equal(projectWorld('stress', many).actions.length, 1500)
  const elapsed = performance.now() - before
  const manifest = JSON.parse(await readFile('dist/plugin/package.json', 'utf8'))
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert((await readFile('dist/plugin/cordis.patch.yml', 'utf8')).includes('name: dsh-agentarium'))
  assert((await readFile('dist/plugin/lib/client.js', 'utf8')).includes('window.__ModuleLoader__.load'))
  console.log(`PASS: event identity, privacy, tool/PTC settlement, forks, subagent ownership, approval isolation, reconnect, cleanup/remount, 8 actors/16 concurrent calls, world validation, package contract. 1500 actions: ${elapsed.toFixed(2)} ms.`)
} finally { await rm(temp, { recursive: true, force: true }) }
