import Store from 'electron-store'

const SIDEBAR_DEFAULTS = { open: true, widthPercent: 22 }

const schema = {
  documents: {
    type: 'array',
    default: [],
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        filePath: { type: 'string' },
        orderIndex: { type: 'number' },
        importedAt: { type: 'string' },
        mtimeMs: { type: 'number' },
        preview: { type: 'string' }
      },
      required: ['id', 'name', 'filePath', 'orderIndex', 'importedAt']
    }
  },
  ui: {
    type: 'object',
    default: {},
    properties: {
      sidebar: {
        type: 'object',
        default: SIDEBAR_DEFAULTS,
        properties: {
          open: { type: 'boolean' },
          widthPercent: { type: 'number' }
        }
      }
    }
  }
}

const store = new Store({ schema, name: 'dinomd-data' })

export function getDocuments() {
  return store.get('documents', [])
}

export function setDocuments(docs) {
  store.set('documents', docs)
}

export function findDocumentById(id) {
  return getDocuments().find((doc) => doc.id === id) || null
}

export function findDocumentByPath(filePath) {
  return getDocuments().find((doc) => doc.filePath === filePath) || null
}

/**
 * Merge `patch` into the document with the given `id`. No-ops if not found.
 */
export function updateDocument(id, patch) {
  const docs = getDocuments().map((doc) =>
    doc.id === id ? { ...doc, ...patch } : doc
  )
  setDocuments(docs)
}

export function getSidebarState() {
  const stored = store.get('ui.sidebar', null)
  if (!stored) return { ...SIDEBAR_DEFAULTS }
  return {
    open: typeof stored.open === 'boolean' ? stored.open : SIDEBAR_DEFAULTS.open,
    widthPercent: typeof stored.widthPercent === 'number' ? stored.widthPercent : SIDEBAR_DEFAULTS.widthPercent
  }
}

export function setSidebarState(patch) {
  const current = getSidebarState()
  const next = { ...current }
  if (typeof patch.open === 'boolean') next.open = patch.open
  if (typeof patch.widthPercent === 'number') {
    next.widthPercent = Math.min(35, Math.max(15, patch.widthPercent))
  }
  store.set('ui.sidebar', next)
}

/**
 * Remove a document by `id`, then rewrite contiguous `orderIndex` values.
 */
export function removeDocumentById(id) {
  const docs = getDocuments().filter((doc) => doc.id !== id)
  docs.forEach((doc, i) => {
    doc.orderIndex = i
  })
  setDocuments(docs)
}
