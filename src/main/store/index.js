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
        importedAt: { type: 'string' }
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
