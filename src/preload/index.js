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
        delete: (payload) => ipcRenderer.invoke('documents:delete', payload),
    },
    folder: {
        openPicker: () => ipcRenderer.invoke('folder:open-picker'),
        readDir: (dirPath) => ipcRenderer.invoke('folder:read-dir', dirPath),
        readFile: (filePath) => ipcRenderer.invoke('folder:read-file', filePath),
        writeFile: (filePath, content) =>
            ipcRenderer.invoke('folder:write-file', filePath, content),
    },
    ui: {
        getSidebarState: () => ipcRenderer.invoke('ui:get-sidebar-state'),
        setSidebarState: (payload) => ipcRenderer.invoke('ui:set-sidebar-state', payload),
    },
    onFileChangedExternally: (callback) =>
        ipcRenderer.on('file:changed-externally', (_event, data) => callback(data)),
    removeFileChangedListener: () => ipcRenderer.removeAllListeners('file:changed-externally'),
})
