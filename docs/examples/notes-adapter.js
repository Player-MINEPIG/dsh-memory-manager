/** Integrating store owns scoped visibility, body revision and authorization. */
export function registerNotesAdapter(manager, notes) {
  return manager.registerAdapter({
    id: 'example.notes', name: 'Notes', authority: 'example.notes',
    catalogScope: 'all-sessions',
    optionCatalog: {
      version: 1,
      types: [{ id: 'note', label: 'Note' }],
      events: [{ id: 'before_model_request', label: 'Before request', mode: 'retrieve' }],
      strategies: [{ id: 'example.notes.text', label: 'Read note', mode: 'retrieve',
        events: ['before_model_request'],
        value: [{ operation: 'memory.read_content' }, { operation: 'memory.to_text' }] }],
      modes: { store: { supported: false, reason: 'Read-only provider' },
        retrieve: { supported: true, onSelection: 'multiple', strategySelection: 'chain' } },
    },
    async list({ scope, signal }) {
      const rows = await notes.list({ scope, signal })
      return rows.map(({ id, name, revision }) => ({ id, name, revision, type: 'note',
        capabilities: { bind: true, edit: false, copy: false } }))
    },
    async read({ id, scope, signal }) {
      const value = await notes.read({ id, scope, signal })
      return value === null ? null : { ...value, id, type: 'note', authority: 'example.notes' }
    },
    validateConfig(config) {
      if (config.type !== undefined && config.type !== 'note') throw new Error('Expected note type')
      if (config.store !== undefined) throw new Error('Store mode is unsupported')
    },
  })
}
