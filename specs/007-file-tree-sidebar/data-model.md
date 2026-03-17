# Data Model: File Tree Sidebar

**Feature**: 007-file-tree-sidebar  
**Date**: 2026-03-16

---

## Entities

### 1. `DirEntry` — IPC transport shape

Returned by `folder:read-dir`. Represents one visible item in a directory at a single level (not recursive). Dot-files and system folders are excluded at the main-process layer before this object is created.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name of the file or folder (basename only) |
| `isDirectory` | `boolean` | `true` for folders, `false` for files |
| `path` | `string` | Absolute filesystem path |

**Invariants**:
- `name` never starts with `.`
- `name` is never in the system-folder exclusion set (`node_modules`, `.git`, etc.)
- Entries within a response are sorted: directories before files, each group A→Z case-insensitive

---

### 2. `TreeNode` — renderer-side in-memory shape

Built in `useFileTree` from `DirEntry` responses. Holds UI state (expanded, loaded children) alongside the data fields.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name |
| `path` | `string` | Absolute filesystem path (used as stable ID) |
| `type` | `'folder' \| 'file'` | Node kind |
| `extension` | `string \| null` | Lowercase file extension (`'md'`, `'txt'`, …) or `null` for folders |
| `depth` | `number` | 0 = root-level items, +1 per nesting level |
| `children` | `TreeNode[] \| null` | `null` = not yet loaded; `[]` = loaded, empty; array = loaded children |

**Derivation**: Built from `DirEntry` by `useFileTree`. `extension` is derived from `name` via `path.extname(name).slice(1).toLowerCase()`.

---

### 3. `FileTreeState` — `useFileTree` hook state

All mutable state owned by the `useFileTree` hook.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `rootFolderPath` | `string \| null` | `null` | Absolute path to the open root folder |
| `rootEntries` | `TreeNode[]` | `[]` | Top-level nodes under the root |
| `expandedPaths` | `Set<string>` | `new Set()` | Paths of currently expanded folders |
| `activeFilePath` | `string \| null` | `null` | Absolute path of the file currently open in the editor |
| `loading` | `boolean` | `false` | `true` while an IPC `folder:read-dir` call is in flight |
| `error` | `string \| null` | `null` | Last IPC error message, if any |

**Reset rule**: when `rootFolderPath` changes, `expandedPaths` resets to `new Set()` and `rootEntries` reloads.

---

### 4. Persisted sidebar state — `electron-store` `ui.sidebar` schema extension

Extends the existing `ui.sidebar` object already stored by `electron-store`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `open` | `boolean` | `true` | Sidebar panel open/collapsed (existing) |
| `widthPercent` | `number` | `22` | Sidebar panel width as % of window (existing) |
| `rootFolderPath` | `string \| null` | `null` | **NEW** — last opened folder path; restored on app launch |

---

## State Transitions

### Root Folder State Machine

```
UNSET (rootFolderPath = null)
  │
  │  user clicks "Open Folder" → folder:open-picker returns path
  ▼
LOADING (loading = true, rootFolderPath = path)
  │
  │  folder:read-dir resolves
  ▼
READY (loading = false, rootEntries populated)
  │
  │  user clicks "Open Folder" again → new path selected
  ▼
LOADING (expandedPaths reset, rootEntries cleared, new load starts)
  │
  │  user cancels folder picker
  ▼
READY (unchanged — previous state preserved, US0 scenario 4)
```

### Folder Expand/Collapse (per folder node)

```
COLLAPSED (path not in expandedPaths, children not loaded)
  │
  │  user clicks folder
  ▼
LOADING_CHILDREN (folder:read-dir called for this path)
  │
  │  response arrives
  ▼
EXPANDED (path in expandedPaths, children = loaded array)
  │
  │  user clicks folder again
  ▼
COLLAPSED (path removed from expandedPaths; children array retained in cache)
  │
  │  user clicks folder again (re-expand)
  ▼
EXPANDED (children served from cache — no new IPC call)
```

**Cache rule**: once a folder's children have been loaded, they are cached in the `children` field of the `TreeNode`. Re-expanding does not trigger a new `folder:read-dir` call in the same session.
