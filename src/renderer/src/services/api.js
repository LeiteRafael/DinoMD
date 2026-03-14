const documents = window.api?.documents ?? {}
const uiApi = window.api?.ui ?? {}

export const api = {
  importFiles: () => documents.importFiles?.() ?? Promise.resolve({ success: false, imported: [], skipped: [], error: 'API not available' }),
  getAll: () => documents.getAll?.() ?? Promise.resolve({ success: false, documents: [], error: 'API not available' }),
  reorder: (payload) => documents.reorder?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  readContent: (payload) => documents.readContent?.(payload) ?? Promise.resolve({ success: false, content: null, error: 'API not available' }),
  remove: (payload) => documents.remove?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  create: () => documents.create?.() ?? Promise.resolve({ success: false, draft: null, error: 'API not available' }),
  save: (payload) => documents.save?.(payload) ?? Promise.resolve({ success: false, canceled: false, filePath: null, name: null, mtimeMs: null, error: 'API not available' }),
  rename: (payload) => documents.rename?.(payload) ?? Promise.resolve({ success: false, newFilePath: null, error: 'API not available' }),
  delete: (payload) => documents.delete?.(payload) ?? Promise.resolve({ success: false, canForceDelete: false, error: 'API not available' }),
  onFileChangedExternally: (callback) => window.api?.onFileChangedExternally?.(callback),
  removeFileChangedListener: () => window.api?.removeFileChangedListener?.(),
  ui: {
    getSidebarState: () => uiApi.getSidebarState?.() ?? Promise.resolve({ open: true, widthPercent: 22 }),
    setSidebarState: (payload) => uiApi.setSidebarState?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' })
  }
}
