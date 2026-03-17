# IPC Contract: File Tree Sidebar

**Feature**: 007-file-tree-sidebar  
**Date**: 2026-03-16  
**Pattern**: `ipcMain.handle` / `ipcRenderer.invoke` / `contextBridge.exposeInMainWorld`

This document defines the two new Electron IPC channels introduced by this feature.

---

## Channel: `folder:open-picker`

### Purpose
Opens the native OS folder-picker dialog and returns the selected directory path.

### Direction
Renderer → Main process (invoked by the renderer, handled in main)

### Invocation
```js
// renderer (via preload bridge)
const path = await window.api.folder.openPicker()
```

### Request payload
None.

### Response

| Case | Return value | Type |
|------|-------------|------|
| User selects a folder | Absolute filesystem path | `string` |
| User cancels the dialog | `null` | `null` |

### Errors
No error response shape — the handler returns `null` on cancellation. Unhandled OS errors propagate as rejected promises (caller should catch).

### Main-process handler signature
```js
ipcMain.handle('folder:open-picker', async (_event) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths[0]
})
```

### Preload bridge registration
```js
// added inside contextBridge.exposeInMainWorld('api', { ... })
folder: {
    openPicker: () => ipcRenderer.invoke('folder:open-picker'),
    readDir:    (dirPath) => ipcRenderer.invoke('folder:read-dir', dirPath),
},
```

### Renderer `api.js` wrapper
```js
folder: {
    openPicker: () =>
        window.api?.folder?.openPicker?.() ?? Promise.resolve(null),
    readDir: (dirPath) =>
        window.api?.folder?.readDir?.(dirPath) ?? Promise.resolve([]),
},
```

---

## Channel: `folder:read-dir`

### Purpose
Reads one directory level and returns its visible, sorted contents.

### Direction
Renderer → Main process

### Invocation
```js
// renderer (via preload bridge)
const entries = await window.api.folder.readDir('/absolute/path/to/dir')
```

### Request payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dirPath` | `string` | yes | Absolute path to the directory to read |

### Response — success

Array of `DirEntry` objects (see `data-model.md`):

```json
[
  { "name": "docs",       "isDirectory": true,  "path": "/home/user/notes/docs" },
  { "name": "ideas",      "isDirectory": true,  "path": "/home/user/notes/ideas" },
  { "name": "README.md",  "isDirectory": false, "path": "/home/user/notes/README.md" },
  { "name": "todo.txt",   "isDirectory": false, "path": "/home/user/notes/todo.txt" }
]
```

**Ordering guarantee**: Directories before files; each group sorted A→Z case-insensitive.  
**Filtering guarantee**: No dot-files, no entries named `node_modules`, `.git`, `.DS_Store`, `.hg`, `.svn`, `dist`, or `build`.

### Response — error

If the directory cannot be read (permissions denied, path does not exist), returns:

```json
{ "error": "EACCES: permission denied, scandir '/root/secret'" }
```

Caller must check for the presence of the `error` key.

### Main-process handler signature
```js
ipcMain.handle('folder:read-dir', async (_event, dirPath) => {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        return entries
            .filter(isVisible)
            .map(d => ({ name: d.name, isDirectory: d.isDirectory(), path: join(dirPath, d.name) }))
            .sort(compareEntries)
    } catch (err) {
        return { error: err.message }
    }
})
```

---

## Unchanged channels used by this feature

| Channel | Usage |
|---------|-------|
| `ui:get-sidebar-state` | Load persisted `rootFolderPath` (extended in store schema) |
| `ui:set-sidebar-state` | Persist `rootFolderPath` when folder changes |
| `documents:save` | Auto-save current file before switching files (FR-013) |
| `documents:read-content` | Load file content when user clicks a file node |
