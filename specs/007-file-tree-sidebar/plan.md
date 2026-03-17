# Implementation Plan: File Tree Sidebar

**Branch**: `007-file-tree-sidebar` | **Date**: 2026-03-16 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the existing document-list sidebar (feature 004) with a VS Code-style hierarchical file tree sidebar. Delivers: an "Open Folder" native OS picker, recursive folder/file tree with expand/collapse state, active-file highlight, per-item icons, dot-file filtering, and folders-first alphabetical sort. All unsaved editor changes auto-save silently before any file switch. No new npm dependencies; implemented with Node.js built-ins (`fs.readdir`) and two new Electron IPC channels.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX  
**Primary Dependencies**: Electron 34, electron-vite, React 18, react-resizable-panels, CSS Modules  
**Storage**: `electron-store` — extend `ui.sidebar` schema with `rootFolderPath: string | null`  
**Testing**: Jest 29 + @testing-library/react 16 + @testing-library/jest-dom  
**Target Platform**: Electron desktop (Linux / macOS / Windows)  
**Project Type**: Desktop application (Electron + React renderer)  
**Performance Goals**: Expand/collapse ≤ 100 children responds instantaneously (no perceived delay); 500-file trees render without layout degradation (SC-002, SC-006)  
**Constraints**: No new npm dependencies; all IPC follows `ipcMain.handle` / `ipcRenderer.invoke` / `contextBridge` pattern already established; dot-files and `node_modules` / `.git` excluded at the main-process layer  
**Scale/Scope**: 7 files modified, 6 files created, 2 files created in tests; zero new packages

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates: N/A.*

| Gate | Status | Notes |
|------|--------|-------|
| Architecture gates | N/A | No constitution file |
| Dependency gates | ✅ PASS | Zero new runtime npm dependencies |
| Scope gates | ✅ PASS | Replaces one component; two new IPC channels; one store field added |
| Test gates | ✅ PASS | Existing Jest + RTL infrastructure covers all new and modified files |

Post-design re-check: ✅ All gates still pass after Phase 1 design (data-model, contracts).

---

## Project Structure

### Documentation (this feature)

```text
specs/007-file-tree-sidebar/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity shapes and state model
├── quickstart.md        ← manual verification guide
├── checklists/
│   └── requirements.md
└── contracts/
    └── ipc.md           ← IPC channel contracts (folder:open-picker, folder:read-dir)
```

### Source Code — files touched by this feature

```text
src/main/
├── index.js                                    ← import + call registerFolderHandlers()
├── ipc/
│   └── folder.js                               ← NEW: folder:open-picker, folder:read-dir handlers
├── fs/
│   └── fileUtils.js                            ← ADD: readDirFiltered(dirPath) utility
└── store/
    └── index.js                                ← ADD: rootFolderPath field to ui.sidebar schema

src/preload/
└── index.js                                    ← ADD: folder.openPicker, folder.readDir to contextBridge

src/renderer/src/
├── services/
│   └── api.js                                  ← ADD: api.folder.openPicker(), api.folder.readDir()
├── hooks/
│   ├── useSidebar.js                           ← EXTEND: load/persist rootFolderPath alongside sidebar state
│   └── useFileTree.js                          ← NEW: tree state (rootPath, expandedPaths, activeFilePath, entries cache)
└── components/
    └── Sidebar/
        ├── index.jsx                           ← REPLACE: rewrite as FileTreeSidebar (Open Folder empty state + tree)
        ├── Sidebar.module.css                  ← REPLACE: new styles for tree layout
        └── TreeNode.jsx                        ← NEW: recursive file/folder row component

tests/
├── main/
│   └── folder.test.js                          ← NEW: unit tests for readDirFiltered, filter/sort logic
└── renderer/
    ├── Sidebar.test.js                         ← REWRITE: replace document-list assertions with tree assertions
    └── useFileTree.test.js                     ← NEW: hook unit tests (expand/collapse, reset, active path)
```

**Structure Decision**: Single-project layout. All changes are within the existing `src/` tree. No new directories at the repository root. The existing `Sidebar/` component folder is reused to avoid changing imports in `App.jsx`.
