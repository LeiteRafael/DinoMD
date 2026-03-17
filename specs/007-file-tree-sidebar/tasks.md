# Tasks: File Tree Sidebar

**Branch**: `007-file-tree-sidebar`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **IPC Contract**: [contracts/ipc.md](./contracts/ipc.md)

**Total tasks**: 24  
**User stories**: US0 (2 tasks), US1 (3 tasks), US2 (2 tasks), US3 (3 tasks), US4 (2 tasks) + 7 foundational + 3 polish/tests  
**Suggested MVP scope**: Phase 2 + Phase 3 (US0) + Phase 4 (US1) — delivers a working, Browse-only tree

---

## Phase 1: Setup

**Purpose**: Extend the electron-store schema before any code that reads/writes the new field is wired up. Must be done first to avoid runtime schema validation errors.

- [X] T001 Extend `ui.sidebar` schema in `src/main/store/index.js` to add `rootFolderPath: string | null` with default `null`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: IPC channels, filesystem utilities, preload bridge, and renderer API surface. Every user story depends on these — no story can be implemented until this phase is complete.

**⚠️ CRITICAL**: All Phase 3–7 work is blocked until T002–T007 are complete.

- [X] T002 Add `isVisible(dirent)`, `compareEntries(a, b)`, and `readDirFiltered(dirPath)` to `src/main/fs/fileUtils.js` (dot-file filter + `SYSTEM_NAMES` set + folders-first alphabetical sort)
- [X] T003 [P] Create `src/main/ipc/folder.js` with `registerFolderHandlers()` registering three channels: `folder:open-picker` (dialog), `folder:read-dir` (filtered+sorted entries), `folder:read-file` (read arbitrary file content by path)
- [X] T004 Import and call `registerFolderHandlers()` in `src/main/index.js` alongside existing handler registrations
- [X] T005 [P] Add `folder: { openPicker, readDir, readFile }` to `contextBridge.exposeInMainWorld` in `src/preload/index.js`
- [X] T006 [P] Add `api.folder.{ openPicker(), readDir(dirPath), readFile(filePath) }` wrappers to `src/renderer/src/services/api.js` with `Promise.resolve` fallbacks
- [X] T007 Extend `useSidebar` in `src/renderer/src/hooks/useSidebar.js` to load `rootFolderPath` from `api.ui.getSidebarState()` on mount and persist it via `api.ui.setSidebarState({ rootFolderPath })` on change

**Checkpoint**: IPC wired end-to-end. `window.api.folder.*` calls reachable from renderer. ✅

---

## Phase 3: User Story 0 — Open a Folder to Populate the Tree (Priority: P1) 🎯 MVP Entry Point

**Goal**: User can trigger a native OS folder picker and the sidebar transitions from empty-state to showing that folder's name.

**Independent Test**: Launch app → sidebar shows "No folder open" + "Open Folder" button → click button → native dialog opens → select `/tmp/dino-test` → sidebar header now shows the folder name (tree content rendered in Phase 4).

- [X] T008 [US0] Create `src/renderer/src/hooks/useFileTree.js` with initial state (`rootFolderPath`, `rootEntries`, `expandedPaths`, `activeFilePath`, `loading`, `error`) and `openFolder()` action (calls `api.folder.openPicker()`, stores returned path, persists via `useSidebar`)
- [X] T009 [US0] Rewrite `src/renderer/src/components/Sidebar/index.jsx` to: (a) render empty-state with "Open Folder" button when `rootFolderPath` is null; (b) render folder name in header + "Open Folder" re-trigger button when a folder is open; (c) accept `activeFilePath` and `onOpenFile` props forwarded from App.jsx
- [X] T010 [P] [US0] Replace `src/renderer/src/components/Sidebar/Sidebar.module.css` with new styles: sidebar container, header bar with title + open-folder button, empty-state centered layout
- [X] T011 [US0] Update `src/renderer/src/App.jsx`: remove `documents`, `activeDocumentId`, `onOpenDocument`, `onNewDocument` props from `<Sidebar>`; pass `activeFilePath` (string|null) and `onOpenFile` callback

---

## Phase 4: User Story 1 — Browse Directory Tree (Priority: P1) 🎯 MVP

**Goal**: After opening a folder, the sidebar displays a flat list of its root entries (subfolders and files) with correct names, depth indentation, and dot-file filtering.

**Independent Test**: Open `/tmp/dino-test` → sidebar shows `archive/`, `notes/`, `README.md` in that order → `.gitignore` and `node_modules/` are absent → all items are indented at depth 0.

- [X] T012 [US1] Extend `useFileTree` in `src/renderer/src/hooks/useFileTree.js` to call `api.folder.readDir(rootFolderPath)` when `rootFolderPath` is set; store results as `rootEntries`; show `loading` during fetch and `error` on failure  
- [X] T013 [P] [US1] Create `src/renderer/src/components/Sidebar/TreeNode.jsx` — renders one row (folder or file) with `paddingLeft: depth * 16 + 'px'` indentation; accepts `node`, `depth`, `expandedPaths`, `onToggle`, `onOpenFile`, `activeFilePath` props; placeholder text icons for now (replaced in Phase 7)
- [X] T014 [US1] Update `src/renderer/src/components/Sidebar/index.jsx` to render `rootEntries` as a scrollable list of `<TreeNode>` at `depth={0}` when a folder is open; show loading spinner and error message when appropriate

---

## Phase 5: User Story 2 — Expand and Collapse Folders (Priority: P1) 🎯 MVP

**Goal**: Clicking a folder node toggles its children on/off; children are fetched once and cached; expanded state resets when root folder changes.

**Independent Test**: Click `notes/` → children `daily/`, `ideas.md` appear below it indented → click `notes/` again → children hidden → click again → children reappear instantly (no second IPC call).

- [X] T015 [US2] Extend `useFileTree` in `src/renderer/src/hooks/useFileTree.js` to add `toggle(path)` — updates `expandedPaths` Set; on first expand calls `api.folder.readDir(path)` and caches children into the node; subsequent toggles use cached data
- [X] T016 [US2] Update `src/renderer/src/components/Sidebar/TreeNode.jsx` to render children recursively when `expandedPaths.has(node.path)`; call `onToggle(node.path)` on folder click; pass `depth + 1` to child nodes

---

## Phase 6: User Story 3 — Open a File from the Tree (Priority: P2)

**Goal**: Clicking a file loads its content in the editor, highlights it as active in the tree, auto-saves the current file first if dirty, and notifies the user for unsupported file types.

**Independent Test**: Click `README.md` → content loads in editor; type something to make it dirty → click `ideas.md` → no prompt, `README.md` saved silently, `ideas.md` content loads; `ideas.md` is highlighted in tree; click a `.txt` file → "File type not supported" message shown.

- [X] T017 [US3] Update `src/renderer/src/components/Sidebar/TreeNode.jsx` to call `onOpenFile(node.path, node.extension)` on file-node click; add inline "not supported" message for extensions other than `md` (case-insensitive)
- [X] T018 [US3] Add `handleTreeOpenFile(filePath)` to `src/renderer/src/App.jsx` — auto-saves current editor content via `editorHook.save()` if dirty, reads new file via `api.folder.readFile(filePath)`, loads it into `editorHook` session, sets `activeFilePath` state; pass `activeFilePath` and `handleTreeOpenFile` as props to `<Sidebar>`
- [X] T019 [US3] Update `src/renderer/src/components/Sidebar/TreeNode.jsx` to apply an `active` CSS class when `node.path === activeFilePath`; add the active-highlight rule to `Sidebar.module.css`

---

## Phase 7: User Story 4 — Visual File Type Icons (Priority: P3)

**Goal**: Every tree node shows a meaningful Unicode icon; folder icons change state on expand/collapse; `.md` files look distinct from generic files.

**Independent Test**: View tree with mixed types → closed `archive/` shows `▶` → expand it → shows `▼` → `README.md` shows `📝` → any `.txt` file shows `📄`.

- [X] T020 [P] [US4] Add icon constants (`ICON_FOLDER_CLOSED = '▶'`, `ICON_FOLDER_OPEN = '▼'`, `ICON_MD = '📝'`, `ICON_FILE = '📄'`) to `src/renderer/src/components/Sidebar/TreeNode.jsx`; render appropriate icon in the row before the node name
- [X] T021 [P] [US4] Add `.icon` rule to `src/renderer/src/components/Sidebar/Sidebar.module.css` — fixed width, vertically centered, prevents text-wrap, consistent `font-size`

---

## Final Phase: Polish & Tests

**Purpose**: Test coverage for all new logic; cleanup of old document-list sidebar code residue.

- [X] T022 [P] Write `tests/main/folder.test.js` — unit tests for `isVisible()` (dot-file, system-name exclusions), `compareEntries()` (dirs before files, alphabetical order), and `folder:read-dir` error path
- [X] T023 [P] Write `tests/renderer/useFileTree.test.js` — tests for: `openFolder()` sets `rootFolderPath`; `toggle()` adds/removes from `expandedPaths`; `expandedPaths` resets to empty Set when `rootFolderPath` changes; `activeFilePath` updates on `openFile()`
- [X] T024 Rewrite `tests/renderer/Sidebar.test.js` — replace all document-list assertions with file-tree assertions: empty-state renders Open Folder button; tree renders after folder selected; active file is highlighted; folder toggle shows/hides children

---

## Dependencies

```
T001 → T002 → T003 → T004   (main-process chain: schema → utils → handler → register)
T005, T006 run in parallel with T003/T004 (preload + renderer API)
T007 requires T001, T005, T006
T008 requires T006, T007
T009, T010 require T008
T011 requires T009, T010
T012 requires T008, T006
T013 requires T012 (uses useFileTree hook shape)
T014 requires T009, T013
T015 requires T012, T006
T016 requires T013, T015
T017, T018, T019 require T016
T020, T021 require T013
T022 requires T003
T023 requires T008, T015
T024 requires T009, T013, T016, T019
```

### User story completion order

```
Phase 2 (Foundational)
    └─ Phase 3 (US0: Open Folder) ─ MVP Entry Point
           └─ Phase 4 (US1: Browse Tree) ─ MVP Complete
                  └─ Phase 5 (US2: Expand/Collapse) ─ MVP Usable
                         └─ Phase 6 (US3: Open File)
                                └─ Phase 7 (US4: Icons)
                                       └─ Final Phase (Tests)
```

---

## Parallel Opportunities

Within each phase the `[P]` tasks can be executed in parallel since they touch different files:

| Parallel group | Tasks |
|---------------|-------|
| Foundational wiring | T003, T005, T006 — different files (`ipc/folder.js`, `preload/index.js`, `api.js`) |
| Sidebar empty-state | T010 alongside T008 and T009 — CSS can be written independently |
| Icons | T020, T021 — JSX constants + CSS rule are independent |
| Tests | T022, T023 — different test files, no shared state |

---

## Implementation Strategy

**MVP** (Phases 2–5): Foundational IPC + US0 (Open Folder picker + empty state) + US1 (tree renders with names) + US2 (expand/collapse). At this point the sidebar is a fully working read-only file explorer.

**Increment 2** (Phase 6 / US3): File opening + active highlight + auto-save. The sidebar becomes a file navigation tool that integrates with the editor.

**Increment 3** (Phase 7 / US4): Visual icons — polish the scannability without touching any logic.

**Complete** (Final Phase): Test coverage.
