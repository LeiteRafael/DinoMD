# Research: File Tree Sidebar

**Feature**: 007-file-tree-sidebar  
**Date**: 2026-03-16

---

## 1. Electron Folder Picker

**Decision**: Use `dialog.showOpenDialog` with `properties: ['openDirectory']`.

**Implementation**:
```js
const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
if (result.canceled || !result.filePaths.length) return null
return result.filePaths[0]
```

**Rationale**: `openDirectory` is the standard Electron property for single folder selection. Cancellation check `result.canceled || !result.filePaths.length` is already the established pattern in `src/main/ipc/documents.js` (handleImportFiles).

**Alternatives considered**: `shell.openExternal` — rejected, not a picker.

---

## 2. Directory Listing

**Decision**: `fs.readdir(dirPath, { withFileTypes: true })` returning `Dirent[]`.

**Implementation**:
```js
const entries = await fs.readdir(dirPath, { withFileTypes: true })
const items = entries.map(d => ({
    name: d.name,
    isDirectory: d.isDirectory(),
    path: join(dirPath, d.name),
}))
```

**Rationale**: `withFileTypes: true` provides `Dirent` objects with `.isDirectory()` as synchronous methods, avoiding separate `stat` calls per entry (O(1) vs O(n) syscalls). `promises as fs` is the existing import style in `documents.js`.

**Alternatives considered**: `fs.stat` per entry — rejected, unnecessary syscall overhead.

---

## 3. Dot-file and System Folder Filtering

**Decision**: Two-guard predicate applied at the main-process layer (before data leaves IPC).

```js
const SYSTEM_NAMES = new Set(['node_modules', '.git', '.DS_Store', '.hg', '.svn', 'dist', 'build'])

function isVisible(dirent) {
    if (dirent.name.startsWith('.')) return false
    if (SYSTEM_NAMES.has(dirent.name)) return false
    return true
}
```

**Rationale**: Filtering at the main-process layer means the renderer never receives hidden entries — no accidental rendering. Dot-prefix covers `.gitignore`, `.env`, `.DS_Store`, hidden dirs. The explicit set covers non-dotted system dirs like `node_modules`.

**Alternatives considered**: Filtering in the renderer — rejected, sends unnecessary data over IPC. User-configurable toggle — deferred to future enhancement per spec Assumptions.

---

## 4. Sort Order

**Decision**: Folders first, files second; each group sorted case-insensitively A→Z using `localeCompare`.

```js
function compareEntries(a, b) {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}
```

**Rationale**: `localeCompare` with `sensitivity: 'base'` treats `a === A` for ordering without mutating display names. Matches VS Code behavior (stated inspiration in spec).

**Alternatives considered**: Alphabetical only (files and folders interleaved) — rejected per clarification Q4 (Option A chosen).

---

## 5. IPC Architecture

**Decision**: Two new IPC channels using the existing `ipcMain.handle` / `ipcRenderer.invoke` / `contextBridge.exposeInMainWorld` pattern. New handler file `src/main/ipc/folder.js` mirrors the structure of `documents.js` and `ui.js`.

| Channel | Direction | Payload | Return |
|---------|-----------|---------|--------|
| `folder:open-picker` | renderer → main | none | `string \| null` (selected path or null) |
| `folder:read-dir` | renderer → main | `{ dirPath: string }` | `{ name, isDirectory, path }[]` |

**Rationale**: No new IPC patterns introduced. Renderer calls `window.api.folder.openPicker()` and `window.api.folder.readDir(dirPath)` through the preload bridge.

---

## 6. React Tree Component Pattern

**Decision**: Single recursive `TreeNode` component. `onOpenFile` passed as a prop at every recursive level (no React Context).

**Rationale**: Context adds a Provider + useContext indirection for a single callback that is passed to the same component calling itself. At this scope the prop is cleaner and easier to trace. If the tree grows beyond 3–4 levels of unrelated components, Context can be added as a future refactor.

---

## 7. Expand/Collapse State

**Decision**: `Set<string>` of expanded folder paths held in `useFileTree` hook (not local `useState` inside `TreeNode`).

```js
const [expandedPaths, setExpandedPaths] = useState(new Set())
const toggle = (path) => setExpandedPaths(prev => {
    const next = new Set(prev)
    next.has(path) ? next.delete(path) : next.add(path)
    return next
})
// Reset when root changes:
useEffect(() => { setExpandedPaths(new Set()) }, [rootFolderPath])
```

**Rationale**: The spec (US0, scenario 3) requires expanded state to reset when the root folder changes. Local per-node `useState` can't be reset without unmounting the entire tree. Hook-level `Set` resets atomically via `setExpandedPaths(new Set())`.

---

## 8. Visual Indentation

**Decision**: Inline style `paddingLeft: depth * 16 + 'px'` on each row element.

**Rationale**: Explicit, zero-overhead, no extra DOM nodes. The 16px step size is a single named constant. Suitable for a tree that doesn't require responsive or theme-variable sizing.

**Alternatives considered**: CSS custom property `--depth` — rejected, unnecessary indirection for a fixed step. Nested wrapper divs — rejected, bloats DOM.

---

## 9. File Type Icons

**Decision**: Unicode characters, consistent with existing codebase (`‹`, `›` used in `App.jsx` and `Sidebar/index.jsx`).

| Item | Icon |
|------|------|
| Closed folder | `▶` |
| Open folder | `▼` |
| `.md` file | `📝` |
| Generic file | `📄` |

**Rationale**: No new dependency; immediate readability; consistent with existing text-icon pattern in the codebase.

**Alternatives considered**: SVG inline icons (more controllable color/sizing) — deferred, not justified without a design requirement for color theming of icons.

---

## 10. Active File Highlight

**Decision**: `activeFilePath` string prop-drilled from `useFileTree` through `FileTreeSidebar` → `TreeNode` (recursive). Each node computes `isActive = node.type === 'file' && node.path === activeFilePath`.

**Rationale**: Same reasoning as item 6 — the recursive self-call means there are no unrelated intermediary components. Context would add overhead with no ergonomic gain. If performance becomes a concern (large trees, frequent re-renders), wrap `TreeNode` in `React.memo` and switch to passing a boolean `isActive` to limit re-render scope.

---

## 11. Root Folder Path Persistence

**Decision**: Persist `rootFolderPath: string | null` in the existing `electron-store` `ui.sidebar` schema. Loaded on startup alongside `open` and `widthPercent` in `useSidebar`.

**Rationale**: Users expect the sidebar to remember which folder was open across restarts — this is standard behavior for all file-tree tools (VS Code, Finder, etc.). The store schema already exists and is the correct place for UI state persistence. The spec's Assumptions only say *expand/collapse state* does not persist across restarts; it makes no such exclusion for the root folder path.

**Alternatives considered**: Don't persist (in-memory only) — rejected as a poor UX with no justification.
