const documents = window.api?.documents ?? {}

export const api = {
  importFiles: () => documents.importFiles?.() ?? Promise.resolve({ success: false, imported: [], skipped: [], error: 'API not available' }),
  getAll: () => documents.getAll?.() ?? Promise.resolve({ success: false, documents: [], error: 'API not available' }),
  reorder: (payload) => documents.reorder?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  readContent: (payload) => documents.readContent?.(payload) ?? Promise.resolve({ success: false, content: null, error: 'API not available' }),
  remove: (payload) => documents.remove?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' })
}
