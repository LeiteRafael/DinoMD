import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  documents: {
    importFiles: () => ipcRenderer.invoke('documents:import-files'),
    getAll: () => ipcRenderer.invoke('documents:get-all'),
    reorder: (payload) => ipcRenderer.invoke('documents:reorder', payload),
    readContent: (payload) => ipcRenderer.invoke('documents:read-content', payload),
    remove: (payload) => ipcRenderer.invoke('documents:remove', payload),
    create: () => ipcRenderer.invoke('documents:create'),
    save: (payload) => ipcRenderer.invoke('documents:save', payload),
    rename: (payload) => ipcRenderer.invoke('documents:rename', payload),
    delete: (payload) => ipcRenderer.invoke('documents:delete', payload)
  },
  onFileChangedExternally: (callback) =>
    ipcRenderer.on('file:changed-externally', (_event, data) => callback(data)),
  removeFileChangedListener: () =>
    ipcRenderer.removeAllListeners('file:changed-externally')
})
