# Data Model: DinoMD — Create & Edit Markdown Files

**Branch**: `002-create-edit-md` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

This document defines all entities, their fields, validation rules, and state transitions introduced or modified by this feature.

---

## Entities

### Document *(extended from feature 001)*

A single `.md` file tracked by the application. Feature 002 adds the `mtimeMs` field and extends the semantics of `name` and `filePath` to support renaming.

**Persisted in**: `electron-store` → `dinomd-data.json` → `documents[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID v4) | ✅ | Stable primary key — never changes, even on rename |
| `name` | `string` | ✅ | Display name (filename without `.md` extension). Updated on rename. |
| `filePath` | `string` | ✅ | Absolute path on disk. Updated on rename. |
| `orderIndex` | `number` (integer ≥ 0) | ✅ | Sort position in the document list. |
| `importedAt` | `string` (ISO 8601) | ✅ | When the document was first added to the store. |
| `mtimeMs` | `number` (epoch ms) | ❌ | Last-modified timestamp recorded at the time of most recent read or save. Used to detect external changes. Added by feature 002. |

**Validation rules**:
- `name` must be non-empty after trimming whitespace.
- `name` must not contain path separators (`/`, `\`) or null bytes.
- `name` must be unique within the document list (case-insensitive on case-insensitive filesystems; case-sensitive on Linux).
- `filePath` must end with `.md` (case-insensitive).
- After rename: the file at the new `filePath` must not already exist on disk (pre-flight check before the rename syscall).

---

### EditorSession *(new — transient, not persisted)*

Represents the in-progress editing state for a single open document. Lives entirely in React component state (`useEditor` hook). Never written to `electron-store`.

| Field | Type | Description |
|-------|------|-------------|
| `documentId` | `string \| null` | ID of the document being edited. `null` for a draft not yet saved. |
| `filePath` | `string \| null` | Current file path. `null` for an unsaved draft. |
| `name` | `string` | Display name shown in the editor header. Defaults to `'Untitled'` for new drafts. |
| `content` | `string` | Current text content in the editor textarea. |
| `savedContent` | `string` | Content at the last successful save (or the content loaded from disk on open). Used to compute `isDirty`. |
| `isDraft` | `boolean` | `true` if the document has never been saved to disk (no `filePath` yet). |
| `isDirty` | `boolean` | Derived: `content !== savedContent`. `true` means there are unsaved changes. |
| `mtimeMs` | `number \| null` | `mtime` of the file at the time of last load or save. Used to detect external file modification. |

**State transitions**:

```
[New Document Action]
  → EditorSession { documentId: null, filePath: null, name: 'Untitled',
                    content: '', savedContent: '', isDraft: true, isDirty: false }

[User types in editor]
  → content changes → isDirty = (content !== savedContent)

[Save (first time, isDraft = true)]
  → showSaveDialog → user picks path
  → fs.writeFile(path, content)
  → store entry created (new Document)
  → EditorSession { documentId: <new id>, filePath: <chosen path>,
                    savedContent: content, isDraft: false, isDirty: false }

[Save (subsequent, isDraft = false)]
  → fs.writeFile(filePath, content)
  → store entry updated (mtimeMs)
  → EditorSession { savedContent: content, isDirty: false }

[Open Existing Document]
  → fs.readFile(filePath) → disk content
  → EditorSession { documentId, filePath, name, content: diskContent,
                    savedContent: diskContent, isDraft: false, isDirty: false,
                    mtimeMs: stat.mtimeMs }

[Rename]
  → fs.rename(oldPath, newPath)
  → store entry updated (name, filePath)
  → EditorSession { name: newName, filePath: newPath }

[External file change detected]
  → EditorSession { externallyModified: true }  ← banner shown
  → User chooses Reload → content = diskContent, savedContent = content, isDirty = false
  → User chooses Keep editing → externallyModified cleared, isDirty unchanged

[Delete]
  → Confirmation modal → shell.trashItem(filePath)
  → Store entry removed
  → EditorSession discarded → navigate back to MainPage

[Navigate away with isDirty = true]
  → ConfirmModal shown (Save / Discard / Cancel)
  → Save → triggers save flow → then navigate
  → Discard → EditorSession discarded → navigate
  → Cancel → remain on EditorPage
```

---

## Store Schema Update

The `electron-store` schema in `src/main/store/index.js` must add the optional `mtimeMs` property to the document item schema:

```js
// Before (feature 001):
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

// After (feature 002 addition):
items: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    filePath: { type: 'string' },
    orderIndex: { type: 'number' },
    importedAt: { type: 'string' },
    mtimeMs: { type: 'number' }   // ← new, optional
  },
  required: ['id', 'name', 'filePath', 'orderIndex', 'importedAt']
}
```

---

## Store Accessor Functions Added

New functions in `src/main/store/index.js`:

| Function | Signature | Description |
|----------|-----------|-------------|
| `updateDocument` | `(id, patch) → void` | Merges `patch` into the document with the given `id`. |
| `removeDocumentById` | `(id) → void` | Removes the document from the store and reindexes `orderIndex`. *(Renamed from implicit filter in `handleRemove` — extracted for reuse by the new delete handler.)* |
