# Quickstart: DinoMD — Create & Edit Markdown Files

**Branch**: `002-create-edit-md` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

Step-by-step implementation guide. Follow sections in order; each section is independently testable.

---

## Prerequisites

- Feature 001 fully merged to `main` (all tests passing).
- Working dev environment: `npm run dev` launches Electron with the React renderer.
- Run tests: `npm test` passes cleanly.

---

## Step 1 — Extend the Store

**Files**: `src/main/store/index.js`

1. Add `mtimeMs: { type: 'number' }` to the document schema (optional field — no schema migration needed, `electron-store` schemas are additive).
2. Export two new helper functions:

```js
// Merge a partial patch into a document by id
export function updateDocument(id, patch) {
  const docs = getDocuments().map((doc) =>
    doc.id === id ? { ...doc, ...patch } : doc
  )
  setDocuments(docs)
}

// Remove a document by id and reindex orderIndex
export function removeDocumentById(id) {
  const docs = getDocuments()
    .filter((doc) => doc.id !== id)
    .map((doc, i) => ({ ...doc, orderIndex: i }))
  setDocuments(docs)
}
```

**Test**: `tests/main/documents-edit.test.js` — unit test `updateDocument` and `removeDocumentById` against an in-memory mock store.

---

## Step 2 — Extend File Utilities

**Files**: `src/main/fs/fileUtils.js`

Add three new exports:

```js
import fs from 'fs'
import path from 'path'

// Write UTF-8 content to a file path
export async function writeFileUtf8(filePath, content) {
  await fs.promises.writeFile(filePath, content, 'utf8')
  const stat = await fs.promises.stat(filePath)
  return stat.mtimeMs
}

// Rename a file; handles cross-device moves and pre-checks for existing target
export async function renameFile(oldPath, newPath) {
  if (oldPath === newPath) return newPath
  try {
    await fs.promises.access(newPath)
    const err = new Error('File already exists at target path')
    err.code = 'EEXIST'
    throw err
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  try {
    await fs.promises.rename(oldPath, newPath)
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.promises.copyFile(oldPath, newPath)
      await fs.promises.unlink(oldPath)
    } else {
      throw err
    }
  }
  return newPath
}

// Watch a single file for external changes; calls onChange({ filePath, mtimeMs })
let _activeWatcher = null
export function watchFile(filePath, onChange) {
  stopWatching()
  let debounce = null
  _activeWatcher = fs.watch(filePath, { persistent: false }, (eventType) => {
    if (eventType !== 'change') return
    clearTimeout(debounce)
    debounce = setTimeout(async () => {
      try {
        const stat = await fs.promises.stat(filePath)
        onChange({ filePath, mtimeMs: stat.mtimeMs })
      } catch { /* file deleted — handled separately */ }
    }, 200)
  })
  _activeWatcher.on('error', () => stopWatching())
}

export function stopWatching() {
  _activeWatcher?.close()
  _activeWatcher = null
}
```

**Test**: mock `fs.watch` and `fs.promises.*` in Jest; verify `renameFile` throws on existing target, the EXDEV fallback path, and `watchFile` debounce.

---

## Step 3 — Add IPC Handlers

**Files**: `src/main/ipc/documents.js`

Import the new store and fs helpers, then register four new handlers:

```js
import { ipcMain, dialog, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import {
  getDocuments, setDocuments, findDocumentById,
  updateDocument, removeDocumentById            // ← new
} from '../store/index.js'
import {
  fileExists, readFileAsUtf8,
  writeFileUtf8, renameFile,                    // ← new
  watchFile, stopWatching                       // ← new
} from '../fs/fileUtils.js'

// In registerDocumentHandlers():
ipcMain.handle('documents:create',  handleCreate)
ipcMain.handle('documents:save',    handleSave)
ipcMain.handle('documents:rename',  handleRename)
ipcMain.handle('documents:delete',  handleDelete)
```

**`handleCreate`** — returns a draft descriptor, no disk I/O:
```js
async function handleCreate() {
  return { success: true, draft: { id: uuidv4(), name: 'Untitled', filePath: null, isDraft: true }, error: null }
}
```

**`handleSave`** — new draft opens Save dialog; existing doc writes directly:
```js
async function handleSave(_event, { id, filePath, name, content }) {
  try {
    let targetPath = filePath
    if (!targetPath) {
      const { canceled, filePath: chosen } = await dialog.showSaveDialog({
        title: 'Save Markdown File',
        defaultPath: `${name || 'Untitled'}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      })
      if (canceled) return { success: true, canceled: true, filePath: null, name: null, mtimeMs: null, error: null }
      targetPath = chosen
    }
    const mtimeMs = await writeFileUtf8(targetPath, content)
    const resolvedName = path.basename(targetPath, '.md')
    const existing = findDocumentById(id)
    if (existing) {
      updateDocument(id, { name: resolvedName, filePath: targetPath, mtimeMs })
    } else {
      const docs = getDocuments()
      setDocuments([...docs, { id, name: resolvedName, filePath: targetPath, orderIndex: docs.length, importedAt: new Date().toISOString(), mtimeMs }])
    }
    return { success: true, canceled: false, filePath: targetPath, name: resolvedName, mtimeMs, error: null }
  } catch (err) {
    return { success: false, canceled: false, filePath: null, name: null, mtimeMs: null, error: err.message }
  }
}
```

**`handleRename`**:
```js
async function handleRename(_event, { id, newName }) {
  try {
    if (!newName?.trim() || /[/\\]/.test(newName)) return { success: false, newFilePath: null, error: 'Invalid document name' }
    const doc = findDocumentById(id)
    if (!doc) return { success: false, newFilePath: null, error: 'Document not found' }
    const dir = path.dirname(doc.filePath)
    const newFilePath = path.join(dir, `${newName.trim()}.md`)
    await renameFile(doc.filePath, newFilePath)
    updateDocument(id, { name: newName.trim(), filePath: newFilePath })
    return { success: true, newFilePath, error: null }
  } catch (err) {
    return { success: false, newFilePath: null, error: err.message }
  }
}
```

**`handleDelete`**:
```js
async function handleDelete(_event, { id, force = false }) {
  try {
    const doc = findDocumentById(id)
    if (!doc) return { success: false, canForceDelete: false, error: 'Document not found' }
    const exists = await fileExists(doc.filePath)
    if (!exists) { removeDocumentById(id); return { success: true, canForceDelete: false, error: null } }
    if (force) {
      await fs.promises.unlink(doc.filePath)
    } else {
      await shell.trashItem(doc.filePath)
    }
    removeDocumentById(id)
    return { success: true, canForceDelete: false, error: null }
  } catch (err) {
    return { success: false, canForceDelete: !force, error: err.message }
  }
}
```

Also: in `handleReadContent`, after reading the file, start watching it and emit `file:changed-externally` when the watcher fires:

```js
// At the top of documents.js, store a reference to mainWindow
let _mainWindow = null
export function setMainWindow(win) { _mainWindow = win }

// In handleReadContent, after successful read:
const stat = await fs.promises.stat(doc.filePath)
watchFile(doc.filePath, ({ filePath, mtimeMs }) => {
  _mainWindow?.webContents.send('file:changed-externally', { id: doc.id, filePath, mtimeMs })
})
return { success: true, content, mtimeMs: stat.mtimeMs, error: null }
```

In `src/main/index.js`, call `setMainWindow(mainWindow)` after creating the window.

**Test**: `tests/main/documents-edit.test.js` — mock `dialog`, `shell`, `fs.promises`, and the store helpers.

---

## Step 4 — Update Preload

**Files**: `src/preload/index.js`

Add the four new invoke wrappers and the two event listener helpers:

```js
contextBridge.exposeInMainWorld('api', {
  documents: {
    // ... existing ...
    create: () => ipcRenderer.invoke('documents:create'),
    save: (payload) => ipcRenderer.invoke('documents:save', payload),
    rename: (payload) => ipcRenderer.invoke('documents:rename', payload),
    delete: (payload) => ipcRenderer.invoke('documents:delete', payload),
  },
  onFileChangedExternally: (cb) =>
    ipcRenderer.on('file:changed-externally', (_e, data) => cb(data)),
  removeFileChangedListener: () =>
    ipcRenderer.removeAllListeners('file:changed-externally'),
})
```

Also update the mock: `tests/__mocks__/electron.js` — add stubs for the four new channels and the push-event methods.

---

## Step 5 — Update the API Service

**Files**: `src/renderer/src/services/api.js`

```js
export const api = {
  // ... existing ...
  create: () => documents.create?.() ?? Promise.resolve({ success: false, error: 'API not available' }),
  save: (payload) => documents.save?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  rename: (payload) => documents.rename?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  delete: (payload) => documents.delete?.(payload) ?? Promise.resolve({ success: false, error: 'API not available' }),
  onFileChangedExternally: (cb) => window.api?.onFileChangedExternally?.(cb),
  removeFileChangedListener: () => window.api?.removeFileChangedListener?.(),
}
```

---

## Step 6 — `MarkdownEditor` Component

**Files**: `src/renderer/src/components/MarkdownEditor/index.jsx`, `MarkdownEditor.module.css`

```jsx
export default function MarkdownEditor({ value, onChange, disabled = false }) {
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: end } = e.target
      const next = value.substring(0, s) + '  ' + value.substring(end)
      onChange(next)
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = s + 2
      })
    }
  }

  return (
    <textarea
      className={styles.editor}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      spellCheck={false}
      aria-label="Markdown editor"
    />
  )
}
```

CSS: `font-family: monospace; resize: none; width: 100%; height: 100%;`

**Test**: `tests/renderer/MarkdownEditor.test.js` — Tab inserts two spaces, `onChange` fires on text input, `disabled` prevents editing.

---

## Step 7 — `ConfirmModal` Component

**Files**: `src/renderer/src/components/ConfirmModal/index.jsx`

A generic controlled modal with title, message, and up to three action buttons (primary, secondary, cancel).

```jsx
export default function ConfirmModal({ title, message, primaryLabel, secondaryLabel, cancelLabel = 'Cancel', onPrimary, onSecondary, onCancel }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={styles.overlay}>
      <div className={styles.modal}>
        <h2 id="modal-title">{title}</h2>
        <p>{message}</p>
        <div className={styles.actions}>
          {onSecondary && <button onClick={onSecondary}>{secondaryLabel}</button>}
          <button onClick={onCancel}>{cancelLabel}</button>
          <button className={styles.primary} onClick={onPrimary}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 8 — `useEditor` Hook

**Files**: `src/renderer/src/hooks/useEditor.js`

Manages all editor state: content, dirty flag, save, rename, delete.

```js
export default function useEditor() {
  const [session, setSession] = useState(null) // EditorSession | null

  async function openNew() {
    const result = await api.create()
    if (!result.success) return
    setSession({ ...result.draft, content: '', savedContent: '', isDirty: false, mtimeMs: null })
  }

  async function openExisting(doc) {
    const result = await api.readContent({ id: doc.id })
    if (!result.success) return
    setSession({ documentId: doc.id, filePath: doc.filePath, name: doc.name,
      content: result.content, savedContent: result.content,
      isDraft: false, isDirty: false, mtimeMs: result.mtimeMs ?? null })
  }

  function updateContent(text) {
    setSession(prev => prev ? { ...prev, content: text, isDirty: text !== prev.savedContent } : prev)
  }

  async function save() {
    if (!session) return { success: false }
    const result = await api.save({ id: session.documentId ?? session.id,
      filePath: session.filePath, name: session.name, content: session.content })
    if (result.success && !result.canceled) {
      setSession(prev => ({ ...prev, documentId: prev.documentId ?? prev.id,
        filePath: result.filePath, name: result.name,
        savedContent: prev.content, isDraft: false, isDirty: false, mtimeMs: result.mtimeMs }))
    }
    return result
  }

  async function rename(newName) {
    if (!session?.documentId) return { success: false }
    const result = await api.rename({ id: session.documentId, newName })
    if (result.success) setSession(prev => ({ ...prev, name: newName, filePath: result.newFilePath }))
    return result
  }

  async function deleteDocument() {
    if (!session?.documentId) return { success: false }
    return api.delete({ id: session.documentId })
  }

  function discard() { setSession(null) }

  return { session, openNew, openExisting, updateContent, save, rename, deleteDocument, discard }
}
```

**Test**: `tests/renderer/useEditor.test.js` — `isDirty` transitions, save sets `savedContent`, discard resets.

---

## Step 9 — `EditorPage`

**Files**: `src/renderer/src/pages/EditorPage.jsx`

Wires together `MarkdownEditor`, `ConfirmModal`, `useEditor`, and navigation guards.

Key responsibilities:
- `onBack` prop: wrapped in `requestNavigation` to check `isDirty` before navigating.
- Save button: calls `useEditor.save()`; on success for a new draft, calls `onDocumentCreated(doc)` prop so `App.jsx` can refresh the document list.
- Delete button: shows `ConfirmModal` then calls `useEditor.deleteDocument()`; on success calls `onDocumentDeleted(id)` and navigates back.
- Rename: inline editable title field in the header; on blur/Enter, calls `useEditor.rename(newName)`.
- External change banner: subscribes to `api.onFileChangedExternally` in `useEffect`; renders a dismissible banner with Reload/Keep options.

---

## Step 10 — Wire `EditorPage` into `App.jsx`

**Files**: `src/renderer/src/App.jsx`

1. Add `EditorPage` import.
2. Add `isDirty`, `pendingNav`, `setPendingNav` state at the App root.
3. Wrap all navigation callbacks (`onOpenDocument`, `onBack`) in a `requestNavigation(action)` helper that checks dirty state.
4. Render `ConfirmModal` at root when `pendingNav !== null`.
5. Pass `onNewDocument` and `onEditDocument` props from `MainPage` to open the `EditorPage` in the appropriate mode.
6. Add an "Edit" button to `ReaderPage`'s header that calls `onEditDocument(doc)` — this satisfies FR-002 ("editable from either the main page or the read view"). Pass `onEditDocument` down to `ReaderPage` in `src/renderer/src/pages/ReaderPage.jsx`.
7. Handle `mainWindow.on('close')` via `ipcRenderer.on('app:confirm-close')` and `ipcRenderer.send('app:close-confirmed')` after user confirms discard — set up in `src/main/index.js`.

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Single file
npm test -- tests/main/documents-edit.test.js
```

---

## Manual Smoke Tests

1. **Create**: Click "New document" → editor opens as "Untitled" → type content → Save → verify OS Save dialog appears → confirm → file on disk and card on MainPage.
2. **Edit from MainPage**: Open existing document card → modify → Save → reopen → verify changes persisted.
2b. **Edit from ReaderPage**: Open a document in read view → click "Edit" button in header → verify editor opens with document content.
3. **Unsaved changes guard**: Edit without saving → click Back → confirm discard prompt appears → choose Cancel → still on EditorPage.
4. **Delete**: Open document → Delete → confirm → verify card gone from MainPage and file is in OS trash (not permanently deleted).
5. **Rename**: Open document → click name in header → type new name → press Enter → verify filename updated on disk.
6. **Conflict on rename**: Rename to a name that already exists → verify error message shown, file not renamed.
7. **External change**: Open document in DinoMD, modify the file externally → banner appears in DinoMD → Reload reflects external content.
