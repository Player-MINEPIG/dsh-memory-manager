// Independent synthetic regression probes. Never uses a running Host or user profile.
// Run: node --test test/review-regressions.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { MemoryManager } from '../src/manager.js'
import { Usage } from '../src/usage.js'
import { validateDocument } from '../src/config.js'

const root = new URL('../src/', import.meta.url)
for (const name of ['config.js', 'manager.js', 'usage.js']) {
  console.log(`${name} SHA256 ${createHash('sha256').update(await readFile(new URL(name, root))).digest('hex')}`)
}
const document = () => ({ schemaVersion: 1, revision: 1, presets: {}, entries: [
  { id: 'review:r', adapterId: 'a', type: 'text', whitelist: [{ global: true }], blacklist: [],
    retrieve: { on: 'request', rule: true, strategy: 'review.operation' } },
] })
const row = () => ({ id: 'review:r', type: 'text', content: 'synthetic', revision: 1, managementMode: 'managed' })
const request = () => ({ id: 'review:r', event: { eventId: 'synthetic-event', on: 'request', scope: { sessionId: 'synthetic-session' } } })
const setup = () => {
  const manager = new MemoryManager({ configPath: '/tmp/dmm-review-unused-config' })
  manager.configuration.document = validateDocument(document())
  return { manager, usage: new Usage(manager) }
}

test('reload error blocks managed execution (original finding withdrawn after fix)', async () => {
  const directory = await mkdtemp('/tmp/dmm-review-')
  try {
    const path = directory + '/config.json'
    await writeFile(path, JSON.stringify(document()))
    const manager = await new MemoryManager({ configPath: path }).init()
    const usage = new Usage(manager)
    manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [row()], read: async () => row() })
    let calls = 0
    usage.registerOperation({ id: 'review.operation', run: () => ++calls })
    await writeFile(path, '{broken')
    await assert.rejects(() => manager.reload())
    await assert.rejects(() => usage.trigger(request()), { code: 'CONFIG_UNAVAILABLE' })
    assert.equal(calls, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('preview cannot swap a validated readonly operation for a new writing registration', async () => {
  const { manager, usage } = setup()
  let releaseRead, beganRead
  const readStarted = new Promise(resolve => { beganRead = resolve })
  manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [], read: () => {
    beganRead()
    return new Promise(resolve => { releaseRead = resolve })
  } })
  let writes = 0
  const unregister = usage.registerOperation({ id: 'review.operation', readOnly: true, run: () => 'readonly' })
  const pending = usage.trigger({ ...request(), preview: true })
  await readStarted
  unregister()
  usage.registerOperation({ id: 'review.operation', readOnly: false, run: () => ++writes })
  releaseRead(row())
  // Aborting the old execution or keeping its validated readonly snapshot is acceptable.
  await pending.catch(() => {})
  assert.equal(writes, 0, 'replacement write operation executed in preview')
})

test('known identity conflict is rejected before invoking a different provider write', async () => {
  const { manager } = setup()
  manager.registerAdapter({ id: 'a', authority: 'synthetic-a', list: async () => [row()], read: async () => row() })
  let writes = 0
  manager.registerAdapter({ id: 'b', authority: 'synthetic-b', list: async () => [], read: async () => row(), update: async () => {
    writes++
    return row()
  } })
  await manager.read({ adapterId: 'a', id: 'review:r' })
  await assert.rejects(() => manager.update({ adapterId: 'b', id: 'review:r', content: 'changed', expectedRevision: 1, operationId: 'synthetic-edit' }), { code: 'OWNERSHIP_CONFLICT' })
  assert.equal(writes, 0, 'provider state was changed before ownership rejection')
})

test('queued observer callback from old registration cannot populate replacement traces', async () => {
  const { manager } = setup()
  let oldCallback
  const unregister = manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [], read: async () => null,
    observe: callback => { oldCallback = callback; return () => {} } })
  unregister()
  manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [row()], read: async () => row() })
  // Models a callback already queued when the provider's unsubscribe was called.
  try { oldCallback({ id: 'review:r', eventId: 'old-event', phase: 'applied', sessionId: 'synthetic-session' }) } catch {}
  assert.equal(manager.traces.length, 0, 'old generation was accepted as new generation evidence')
})

test('cancellation during last operation cannot finish as successful completed execution', async () => {
  const { manager, usage } = setup()
  manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [row()], read: async () => row() })
  const controller = new AbortController()
  usage.registerOperation({ id: 'review.operation', run: () => { controller.abort(); return 'after-cancel' } })
  await assert.rejects(() => usage.trigger({ ...request(), signal: controller.signal }), { name: 'AbortError' })
  assert.equal(manager.traces.some(fact => fact.phase === 'completed'&&fact.evidence!=='content-read'), false)
})

test('adapter loaded after config initialization must validate policy before execution', async () => {
  const { manager, usage } = setup()
  let validations = 0, calls = 0
  manager.registerAdapter({ id: 'a', authority: 'synthetic', list: async () => [row()], read: async () => row(),
    validateConfig: () => { validations++; throw Object.assign(new Error('Rejected by source schema'), { code: 'UNSUPPORTED_POLICY' }) } })
  usage.registerOperation({ id: 'review.operation', run: () => ++calls })
  await assert.rejects(() => usage.trigger(request()))
  assert.ok(validations > 0, 'provider schema was never consulted')
  assert.equal(calls, 0)
})
