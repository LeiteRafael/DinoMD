import Store from 'electron-store'

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
        mtimeMs: { type: 'number' }
      },
      required: ['id', 'name', 'filePath', 'orderIndex', 'importedAt']
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
