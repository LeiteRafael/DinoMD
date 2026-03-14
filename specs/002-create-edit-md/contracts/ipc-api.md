# IPC API Contract: DinoMD — Create & Edit (Feature 002)

**Branch**: `002-create-edit-md` | **Date**: 2026-03-14  
**Plan**: [plan.md](../plan.md)

This document defines the **new and modified** IPC channels added by feature 002. For the full channel set from feature 001, see [../001-dinomd-markdown-reader/contracts/ipc-api.md](../../001-dinomd-markdown-reader/contracts/ipc-api.md).

The renderer accesses all main-process functionality through `window.api`. The preload script maps each `window.api.*` method to a typed `ipcRenderer.invoke` call.

---

## Updated Exposed Surface (`window.api`)

```js
// preload/index.js — full surface after feature 002
window.api = {
  documents: {
    // ── Feature 001 (unchanged) ──────────────────────────────────────────
    importFiles,      // Open OS file dialog, import .md files
    getAll,           // Load persisted document list
    reorder,          // Persist new document order
    readContent,      // Read raw file content from disk
    remove,           // Remove a document from the store (untrack, no disk delete)
    // ── Feature 002 (new) ────────────────────────────────────────────────
    create,           // Create an in-memory draft descriptor (no disk I/O)
    save,             // Write content to disk; opens save dialog for new drafts
    rename,           // Rename file on disk + update store entry
    delete,           // Move file to OS trash + remove from store
  },
  // ── Feature 002 push events (main → renderer) ─────────────────────────
  // Subscribed via window.api.onFileChangedExternally(callback)
  onFileChangedExternally,   // Notifies renderer when active file is modified on disk
  removeFileChangedListener, // Unsubscribes the above listener
}
```

---

## New Channels

### `documents:create`

Creates an in-memory draft descriptor. No file is written to disk.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:create')`

**Request payload**: none

**Response payload**:
```ts
{
  success: boolean,
  draft: {
    id: string,       // UUID v4 — stable ID for this session
    name: string,     // Always 'Untitled'
    filePath: null,   // No path until first save
    isDraft: true,
  },
  error: string | null,
}
```

**Behaviour**:
- Generates a UUID for the session. Does NOT write to store yet — the document is added to the store only on the first `documents:save` call.
- The `draft.id` is the same UUID that will be used when the document is eventually saved.

---

### `documents:save`

Writes the editor content to disk. For drafts (`filePath === null`), opens a native Save dialog first.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:save', payload)`

**Request payload**:
```ts
{
  id: string,              // Document ID (from draft or existing document)
  filePath: string | null, // null for new drafts; existing path for saves
  name: string,            // Desired document name (used as default filename in dialog)
  content: string,         // UTF-8 Markdown content to write
}
```

**Response payload**:
```ts
{
  success: boolean,
  canceled: boolean,       // true if user dismissed the Save dialog (drafts only)
  filePath: string | null, // Resolved file path after save; null if canceled
  name: string | null,     // Resolved document name (derived from chosen filename)
  mtimeMs: number | null,  // mtime after write (for external change detection baseline)
  error: string | null,
}
```

**Behaviour**:
- **New draft** (`filePath === null`):
  1. Calls `dialog.showSaveDialog({ defaultPath: '<name>.md', filters: [{ name: 'Markdown', extensions: ['md'] }] })`.
  2. If the user cancels: returns `{ success: true, canceled: true, filePath: null }`.
  3. If confirmed: writes `content` to the chosen path with `fs.promises.writeFile(..., 'utf8')`.
  4. Creates a new store entry `{ id, name, filePath, orderIndex: last, importedAt: now, mtimeMs }`.
  5. Returns resolved `filePath`, `name`, and `mtimeMs`.
- **Existing document** (`filePath !== null`):
  1. Writes `content` to `filePath` with `fs.promises.writeFile(..., 'utf8')`.
  2. Updates the store entry's `mtimeMs`.
  3. Returns the same `filePath` and updated `mtimeMs`.
- **Error handling**: If the write fails (permissions, disk full), returns `{ success: false, error: err.message }`. The renderer must not clear its in-memory content on failure.

---

### `documents:rename`

Renames the file on disk and updates the store entry.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:rename', payload)`

**Request payload**:
```ts
{
  id: string,      // Document ID to rename
  newName: string, // New display name (without .md extension)
}
```

**Response payload**:
```ts
{
  success: boolean,
  newFilePath: string | null, // Resolved new absolute path after rename
  error: string | null,       // Includes 'EEXIST' message if name is already taken
}
```

**Behaviour**:
1. Looks up the document by `id` from the store.
2. Constructs `newFilePath` by replacing the filename component of `filePath` with `<newName>.md`.
3. Pre-flight check: calls `fs.promises.access(newFilePath)`.
   - If the file exists: returns `{ success: false, error: 'A document with that name already exists.' }`.
   - If `ENOENT`: proceed.
4. Calls `fs.promises.rename(oldPath, newFilePath)`. On `EXDEV` error, falls back to `copyFile + unlink`.
5. Updates the store entry: `{ name: newName, filePath: newFilePath }`.
6. Returns `{ success: true, newFilePath }`.

**Error cases**:
- `id` not found in store → `{ success: false, error: 'Document not found' }`.
- `newName` is empty or contains `/` or `\` → `{ success: false, error: 'Invalid document name' }`.
- OS rename failure → `{ success: false, error: err.message }`.

---

### `documents:delete`

Moves the document's file to the OS trash and removes the entry from the store.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:delete', payload)`

**Request payload**:
```ts
{
  id: string,              // Document ID to delete
  force?: boolean,         // If true, use fs.unlink instead of shell.trashItem (fallback)
}
```

**Response payload**:
```ts
{
  success: boolean,
  canForceDelete: boolean, // true if trashItem failed but unlink is available as fallback
  error: string | null,
}
```

**Behaviour**:
1. Looks up the document by `id`. If not found: returns `{ success: false, error: 'Document not found' }`.
2. Checks if `filePath` exists on disk via `fs.promises.access`. If missing: removes from store and returns `{ success: true }` (stale entry cleanup).
3. If `force !== true`: calls `shell.trashItem(filePath)`.
   - On success: removes the store entry, reindexes `orderIndex`, returns `{ success: true }`.
   - On failure (e.g., headless Linux): returns `{ success: false, canForceDelete: true, error: err.message }`.
4. If `force === true`: calls `fs.promises.unlink(filePath)`, then removes the store entry.

**Note**: The renderer is responsible for showing the confirmation dialog **before** invoking this channel. This channel performs the deletion unconditionally.

---

### `documents:remove` *(unchanged from feature 001)*

Removes a document from the store **without** deleting the file from disk. Retained for "untrack" use cases (e.g., a user wants to remove a document from the list but keep the file). Used by internal cleanup paths; not exposed as a primary user action in feature 002.

---

## New Push Event (main → renderer)

### `file:changed-externally`

Sent by the main process to the renderer when the file currently open in the editor is modified on disk by an external process.

**Direction**: main → renderer  
**Channel**: `ipcRenderer.on('file:changed-externally', handler)` (via `contextBridge` as `window.api.onFileChangedExternally(callback)`)

**Payload**:
```ts
{
  id: string,        // Document ID of the affected file
  filePath: string,  // Absolute path of the file
  mtimeMs: number,   // New mtime; compare to EditorSession.mtimeMs to confirm actual content change
}
```

**Behaviour**:
- The renderer shows a non-blocking banner: *"File changed on disk — Reload or Keep editing?"*
- **Reload**: calls `documents:read-content` and resets `content`, `savedContent`, and `mtimeMs` in `EditorSession`.
- **Keep editing**: dismisses the banner. `isDirty` remains unchanged.
- The main process starts watching the active file when the editor opens it (`documents:read-content` triggers `watchFile`). The watcher is stopped when the editor is closed or the document is deleted.

---

## Preload Additions

```js
// preload/index.js — additions for feature 002
contextBridge.exposeInMainWorld('api', {
  documents: {
    // ... existing feature 001 methods ...
    create: () => ipcRenderer.invoke('documents:create'),
    save: (payload) => ipcRenderer.invoke('documents:save', payload),
    rename: (payload) => ipcRenderer.invoke('documents:rename', payload),
    delete: (payload) => ipcRenderer.invoke('documents:delete', payload),
  },
  onFileChangedExternally: (callback) =>
    ipcRenderer.on('file:changed-externally', (_event, data) => callback(data)),
  removeFileChangedListener: () =>
    ipcRenderer.removeAllListeners('file:changed-externally'),
})
```
