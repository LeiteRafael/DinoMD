# Tasks: DinoMD — Left-Side File Browser Sidebar

**Input**: Design documents from `/specs/004-file-browser-sidebar/`  
**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/ipc-api.md](./contracts/ipc-api.md) · [quickstart.md](./quickstart.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US4)
- Every task includes an exact file path

---

## Phase 1: Setup

**Purpose**: Confirm no new packages are required and the feature can be layered cleanly onto the existing project.

- [X] T001 Confirm `react-resizable-panels`, `electron-store`, and `uuid` are present in `package.json` — no new `npm install` needed for this feature

**Checkpoint**: Dependencies verified — proceed to foundational implementation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Main-process store extension, preview generation, new IPC surface, preload bridge, and renderer service layer. **All user stories depend on this phase being complete.**

- [X] T002 [P] Extend `electron-store` schema in `src/main/store/index.js` — add `ui.sidebar { open: boolean, widthPercent: number }` key with defaults `(true, 22)` and export `getSidebarState()` / `setSidebarState(patch)` helpers
- [X] T003 [P] Add `generatePreview(content)` helper to `src/main/ipc/documents.js` — regex-strips markdown tokens, trims to 150 chars with `…`; call it inside `handleImportFiles`, `handleCreate`, and `handleSave` to write `preview` into the store on every document write
- [X] T004 [P] Create `src/main/ipc/ui.js` — export `registerUiHandlers()` that registers `ipcMain.handle('ui:get-sidebar-state', …)` and `ipcMain.handle('ui:set-sidebar-state', …)` per the contract in `contracts/ipc-api.md`
- [X] T005 Import and call `registerUiHandlers()` from `src/main/ipc/ui.js` inside `src/main/index.js` (alongside the existing `registerDocumentHandlers()` call)
- [X] T006 [P] Add `window.api.ui = { getSidebarState, setSidebarState }` to `src/preload/index.js` via `contextBridge.exposeInMainWorld`
- [X] T007 [P] Add `api.ui.getSidebarState()` and `api.ui.setSidebarState(payload)` wrappers to `src/renderer/src/services/api.js`

**Checkpoint**: Main process, preload, and service layer are complete. All user stories can now begin.

---

## Phase 3: User Story 1 — Browse and Open Files from Sidebar (Priority: P1) 🎯 MVP

**Goal**: A visible sidebar showing all documents with titles and preview snippets; clicking a document opens it in the current view; active document is highlighted; empty state shown when no documents exist.

**Independent Test**: Launch the app with ≥2 documents, navigate to Editor/Reader/Split view — sidebar lists all documents, clicking one opens it, active row is highlighted. Delete all documents — sidebar shows empty state.

### Implementation

- [X] T008 [US1] Create `src/renderer/src/components/Sidebar/index.jsx` — renders a scrollable list of document entries (title + preview per entry), visually marks the `activeDocumentId` row, renders an empty-state prompt when `documents` is empty, calls `onOpenDocument(id, name)` on row click
- [X] T008a [P] [US1] In `src/renderer/src/App.jsx`, sort `docsHook.documents` by `mtimeMs` descending before passing to `<Sidebar>` — satisfies FR-001 ("ordered by most recently modified first"); sort is a derived value, not a mutation of hook state
- [X] T009 [P] [US1] Create `src/renderer/src/components/Sidebar/Sidebar.module.css` — sidebar container layout, individual entry styles, active entry highlight colour, empty state styles, scrollable list container (`overflow-y: auto`)
- [X] T010 [US1] Mount `<Sidebar>` in `src/renderer/src/App.jsx` for all non-main views — pass `docsHook.documents` (sorted by `mtimeMs` desc, see T008a), `activeDocumentId`, `onOpenDocument`, and `onNewDocument` as props; wrap non-main renders in a temporary flex-row container (`display: flex`) alongside the existing page component — **note**: this flex wrapper is upgraded to `<PanelGroup>` in T017 (Phase 5); T010 delivers a visible sidebar, T017 makes it resizable

### Tests

- [X] T011 [P] [US1] Write `tests/renderer/Sidebar.test.jsx` — assert: document entries render with title and preview; active document row has active CSS class; empty-state element appears when documents array is empty; clicking a row fires `onOpenDocument` with correct id and name
- [X] T012 [P] [US1] Write `tests/main/ui-state.test.js` — assert: `ui:get-sidebar-state` returns `{ open: true, widthPercent: 22 }` when store is empty; returns persisted value after a `ui:set-sidebar-state` call; `ui:set-sidebar-state` clamps `widthPercent` to `[15, 35]`; returns `{ success: false, error: 'invalid-payload' }` for non-boolean `open`

**Checkpoint**: US1 is fully functional and independently testable. The sidebar lists and opens documents.

---

## Phase 4: User Story 2 — Search/Filter Documents in Sidebar (Priority: P2)

**Goal**: A search field inside the sidebar filters the document list in real time (150 ms debounce) by title or preview text; clearing the field restores the full list; no-results state shown when query matches nothing.

**Independent Test**: Open sidebar with ≥3 documents — type part of a title in the search box and confirm the list filters live. Clear it and confirm all documents return. Enter a nonsense string and confirm the no-results message appears.

### Implementation

- [X] T013 [US2] Add debounced search state to `src/renderer/src/components/Sidebar/index.jsx` — local `useState` for `query`; derive `filteredDocuments` via case-insensitive substring match on `doc.name` and `doc.preview` using the existing `useDebounce` hook (`src/renderer/src/hooks/useDebounce.js`) at 150 ms
- [X] T014 [US2] Add search input element and "no results" placeholder to the Sidebar render in `src/renderer/src/components/Sidebar/index.jsx` — search `<input>` above the list, "no results" message when `filteredDocuments` is empty and `query` is non-empty; style additions in `src/renderer/src/components/Sidebar/Sidebar.module.css`

### Tests

- [X] T015 [P] [US2] Add search test cases to `tests/renderer/Sidebar.test.jsx` — typing a query filters entries to matching documents only; clearing the input restores all entries; a non-matching query renders the no-results message; filtering is case-insensitive

**Checkpoint**: US2 is independently testable. Search works on top of the US1 document list.

---

## Phase 5: User Story 3 — Toggle Sidebar Visibility (Priority: P3)

**Goal**: A toggle button shows/hides the sidebar; the sidebar is resizable via drag handle; both open/closed state and width are persisted across app restarts via IPC.

**Independent Test**: Click the toggle button — sidebar collapses and main content expands. Click again — sidebar restores. Drag the resize handle to a new width. Quit and reopen the app — sidebar appears at the saved width and saved open/closed state.

### Implementation

- [X] T016 [US3] Create `src/renderer/src/hooks/useSidebar.js` — on mount calls `api.ui.getSidebarState()` to set `{ open, widthPercent }` state; exposes `toggle()` (flips `open`, persists via `api.ui.setSidebarState`); exposes `handleResize(pct)` (debounced 300 ms, persists `widthPercent`); provides defaults `(true, 22)` when IPC returns nothing
- [X] T017 [US3] Upgrade `src/renderer/src/App.jsx` non-main layout from the temporary flex container (T010) to `<PanelGroup direction="horizontal">` — add sidebar `<Panel defaultSize={widthPercent} minSize={15} maxSize={35}>`, `<PanelResizeHandle>` between panels, and a toggle button that calls `useSidebar().toggle()`; wire `onResize` on the sidebar panel to `useSidebar().handleResize`; this replaces the flex wrapper added in T010

### Tests

- [X] T018 [P] [US3] Write `tests/renderer/useSidebar.test.js` — assert: mount calls `api.ui.getSidebarState`; `toggle()` calls `api.ui.setSidebarState({ open: false })` then `{ open: true }` on second call; `handleResize(25)` eventually calls `api.ui.setSidebarState({ widthPercent: 25 })` after debounce; defaults applied when getSidebarState returns null

**Checkpoint**: US3 is independently testable. Toggle and resize both persist across restarts.

---

## Phase 6: User Story 4 — Create New Document from Sidebar (Priority: P4)

**Goal**: A "+" (New Document) button in the sidebar header creates a blank document and opens it in the editor; the sidebar list immediately updates to show the new document as the selected (active) entry at the top.

**Independent Test**: While in Editor/Reader view, click the "+" button in the sidebar — a new blank document opens in the editor, and the sidebar list updates to show it as the topmost, selected entry.

### Implementation

- [X] T019 [US4] Add a "New Document" `+` button to the header of `src/renderer/src/components/Sidebar/index.jsx` — on click fires the `onNewDocument` prop; style the button in `src/renderer/src/components/Sidebar/Sidebar.module.css`
- [X] T020 [US4] Verify `handleNewDocument` in `src/renderer/src/App.jsx` calls `docsHook.refreshDocuments()` after `editorHook.openNew()` so the sidebar list (driven by `docsHook.documents`) immediately reflects the new document
- [X] T020b [US1] Ensure `docsHook.refreshDocuments()` is called after every successful `documents:rename` IPC response in `src/renderer/src/pages/EditorPage.jsx` — satisfies FR-009 (sidebar auto-updates on rename); sidebar title and preview must reflect the new name without a manual refresh

### Tests

- [X] T021 [P] [US4] Add new-document test cases to `tests/renderer/Sidebar.test.jsx` — assert: "+" button is present in the rendered sidebar; clicking it fires `onNewDocument` callback exactly once

**Checkpoint**: US4 is independently testable. Users can create documents directly from the sidebar.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, accessibility, and visual refinements.

- [X] T022 Ensure `src/renderer/src/components/Sidebar/Sidebar.module.css` list container has `overflow-y: auto` and a fixed or `flex: 1` height so the sidebar scrolls correctly for large document collections without pushing the toggle/search out of view
- [X] T023 Handle deleted-while-active edge case in `src/renderer/src/App.jsx` — add a `useEffect` that watches `docsHook.documents`; if `activeDocumentId` is no longer present in the list, reset `activeDocumentId` to `null` and navigate back to main
- [X] T024 Add `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` to sidebar entry title and preview elements in `src/renderer/src/components/Sidebar/Sidebar.module.css` so long titles and previews truncate gracefully at any sidebar width

---

## Dependency Graph

```
T001
  └── T002, T003, T004 (parallel)
        └── T005 (registers T004's handlers)
        └── T006, T007 (parallel, depend on T002 schema being defined)
              └── T008, T009 (parallel — US1 component scaffold)
                    └── T010 (App.jsx integration — needs T008 + T007)
                          └── T011, T012 (parallel — US1 tests)
                          └── T013 → T014 (US2 inside same component as US1)
                                └── T015 (US2 tests)
                                └── T016 (US3 hook — needs T007)
                                      └── T017 (App.jsx PanelGroup — needs T016 + T010)
                                            └── T018 (US3 tests)
                                            └── T019 → T020 (US4 button + App.jsx wiring)
                                                  └── T021 (US4 tests)
                                                  └── T022, T023, T024 (parallel polish)
```

---

## Parallel Execution Examples

### Phase 2 — run in parallel (all different files)

```
Stream A: T002 (store/index.js)
Stream B: T003 (ipc/documents.js)
Stream C: T004 (ipc/ui.js)
Stream D: T006 (preload/index.js)   — can start after T002 defines the shape
Stream E: T007 (services/api.js)    — can start after T002 defines the shape
```

### Phase 3 — US1 (after Phase 2 complete)

```
Stream A: T008 (Sidebar/index.jsx)
Stream B: T009 (Sidebar/Sidebar.module.css)
→ T010 (App.jsx integration, after both complete)
→ T011, T012 in parallel (test files)
```

### Phase 5 + Phase 6 (after US2 complete)

```
Stream A: T016 (useSidebar.js hook)
Stream B: — (T017 depends on T016)
→ T017 (App.jsx PanelGroup)
→ T018 in parallel, T019 in parallel
```

---

## Implementation Strategy

| Stage | Scope | Delivers |
|---|---|---|
| MVP (Phase 1–3) | T001–T012 + T008a | Sidebar visible in document views; lists all docs sorted by modified date with previews; active highlight; empty state; opens documents on click |
| Increment 2 (Phase 4) | T013–T015 | Real-time search/filter in the sidebar |
| Increment 3 (Phase 5) | T016–T018 | Toggle + resize + full persistence |
| Increment 4 (Phase 6) | T019–T021 | New Document button in sidebar |
| Polish | T022–T024 | Scroll, edge cases, text truncation |

**Suggested MVP**: Complete through Phase 3 (T001–T012 + T008a) to deliver a fully functional, correctly-sorted sidebar before adding search, toggle persistence, and new-document creation.

---

## Task Summary

| Phase | Story | Tasks | Parallelizable |
|---|---|---|---|
| 1 — Setup | — | T001 | — |
| 2 — Foundational | — | T002–T007 | T002, T003, T004, T006, T007 |
| 3 — US1 (P1) | Browse & Open | T008, T008a, T009–T012 | T008a, T009, T011, T012 |
| 4 — US2 (P2) | Search/Filter | T013–T015 | T015 |
| 5 — US3 (P3) | Toggle + Resize | T016–T018 | T018 |
| 6 — US4 (P4) | New Document | T019–T021, T020b | T021 |
| Final — Polish | — | T022–T024 | T022, T023, T024 |

**Total tasks**: 26  
**Parallelizable tasks**: 15 of 26  
**Tasks per user story**: US1: 6 (incl. T008a, T020b) · US2: 3 · US3: 3 · US4: 3  
