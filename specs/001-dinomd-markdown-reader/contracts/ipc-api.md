# IPC API Contract: DinoMD — Main ↔ Renderer

**Branch**: `001-dinomd-markdown-reader` | **Date**: 2026-03-10  
**Plan**: [plan.md](../plan.md)

This document defines the complete contract between the Electron main process (Node.js backend) and the React renderer process, exposed via the `contextBridge` preload script.

The renderer accesses all main-process functionality through `window.api`. The preload script maps each `window.api.*` method to a typed `ipcRenderer.invoke` call.

---

## Exposed Surface (`window.api`)

```js
// Exposed by preload/index.js via contextBridge.exposeInMainWorld('api', { ... })
window.api = {
  documents: {
    importFiles,       // Open OS file dialog, import .md files
    getAll,            // Load persisted document list
    reorder,           // Persist new document order
    readContent,       // Read raw file content from disk
    remove,            // Remove a document from the store
  }
}
```

---

## Channels

### `documents:import-files`

Opens the operating system's native file picker filtered to `.md` files and imports selected files into the store.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:import-files')`

**Request payload**: none

**Response payload**:
```ts
{
  success: boolean,
  imported: Array<{
    id: string,          // UUID v4 assigned by main
    name: string,        // Filename without extension
    filePath: string,    // Absolute path
    orderIndex: number,  // Assigned last (appended)
    importedAt: string,  // ISO 8601
  }>,
  skipped: Array<{
    filePath: string,
    reason: "duplicate" | "invalid-type" | "unreadable",
  }>,
  error: string | null,  // Set if dialog cancelled or system error
}
```

**Behaviour**:
- If the user cancels the dialog: returns `{ success: true, imported: [], skipped: [], error: null }`.
- If a selected file's path already exists in the store: adds it to `skipped` with `reason: "duplicate"`.
- If a selected file is not a `.md` file: adds it to `skipped` with `reason: "invalid-type"`.
- If a file cannot be read (permissions): adds it to `skipped` with `reason: "unreadable"`.

---

### `documents:get-all`

Returns the full document list sorted by `orderIndex` ascending.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:get-all')`

**Request payload**: none

**Response payload**:
```ts
{
  success: boolean,
  documents: Array<{
    id: string,
    name: string,
    filePath: string,
    orderIndex: number,
    importedAt: string,
    status: "available" | "missing",  // Computed: file existence checked here
  }>,
  error: string | null,
}
```

**Behaviour**:
- Checks `fs.access` for each document's `filePath` and sets `status` accordingly.
- Returns documents in ascending `orderIndex` order.

---

### `documents:reorder`

Persists a new document ordering after a drag-and-drop operation.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:reorder', payload)`

**Request payload**:
```ts
{
  orderedIds: string[],  // Full list of document IDs in their new order
}
```

**Response payload**:
```ts
{
  success: boolean,
  error: string | null,
}
```

**Behaviour**:
- Main process rewrites `orderIndex` for each document based on the position in `orderedIds`.
- `orderedIds` must contain exactly all known document IDs (no additions or removals).
- If `orderedIds` contains an unknown ID or is missing an ID, returns `success: false` with an error message.

---

### `documents:read-content`

Reads the raw UTF-8 content of a document file from disk.

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:read-content', payload)`

**Request payload**:
```ts
{
  id: string,  // Document ID (used to look up filePath in the store)
}
```

**Response payload**:
```ts
{
  success: boolean,
  content: string | null,  // Raw Markdown string; null if file unreadable
  error: string | null,
}
```

**Behaviour**:
- Main process resolves `filePath` from store using `id`.
- Reads the file with `fs.readFile(filePath, 'utf8')`.
- If the file is missing or unreadable: returns `success: false, content: null, error: <message>`.

---

### `documents:remove`

Removes a document from the store (does not delete the file from disk).

**Direction**: renderer → main  
**Invoke**: `ipcRenderer.invoke('documents:remove', payload)`

**Request payload**:
```ts
{
  id: string,  // Document ID to remove
}
```

**Response payload**:
```ts
{
  success: boolean,
  error: string | null,
}
```

**Behaviour**:
- Removes the document entry from the store.
- Compacts `orderIndex` values to remain contiguous after removal.
- Does not touch the file on disk.

---

## Security Rules

All IPC handlers MUST:
1. Validate the payload shape before performing any filesystem or store operation.
2. Reject paths that escape the user's document scope (path traversal guard).
3. Never execute shell commands or spawn child processes based on IPC input.
4. Return structured `{ success, error }` responses — never throw uncaught exceptions across IPC.

The renderer MUST:
1. Never receive raw Node.js objects or Electron APIs through `contextBridge`.
2. Only interact with the filesystem indirectly via the defined IPC channels above.

---

## Versioning

This contract is at **version 1.0**. Breaking changes (renamed channels, removed fields, changed payload shapes) require a version bump and a migration note in this document.
