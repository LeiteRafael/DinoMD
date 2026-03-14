# Tasks: DinoMD — Markdown Reader Application

**Input**: Design documents from `/specs/001-dinomd-markdown-reader/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ipc-api.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- File paths follow the `electron-vite` structure from plan.md

---

## Phase 1: Setup (Project Scaffolding)

**Purpose**: Bootstrap the Electron + React project with all tooling in place, ready to receive feature code.

- [X] T001 Scaffold project with electron-vite: `npm create @quick-start/electron@latest . -- --template react`, producing `package.json`, `electron-vite.config.js`, and the `src/main`, `src/preload`, `src/renderer` directory skeleton
- [X] T002 Install all feature dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `react-markdown`, `remark-gfm`, `rehype-pretty-code`, `shiki`, `rehype-slug`, `remark-frontmatter`, `electron-store`, `uuid`
- [X] T003 [P] Configure Jest with two projects in `jest.config.js`: `{ displayName: 'main', testEnvironment: 'node', testMatch: ['**/tests/main/**/*.test.js'] }` and `{ displayName: 'renderer', testEnvironment: 'jsdom', testMatch: ['**/tests/renderer/**/*.test.js'] }`; install `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- [X] T004 [P] Create Docker dev environment: `docker/Dockerfile` (FROM node:20-alpine, WORKDIR /app, COPY package*.json, RUN npm ci) and `docker/docker-compose.yml` (service with volume mount of `src/` and `tests/`, command: `npm test`)
- [X] T005 [P] Configure ESLint for the project: `.eslintrc.cjs` with `eslint:recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, targeting all `src/**/*.{js,jsx}` and `tests/**/*.js`

**Checkpoint**: `npm run dev` opens a blank Electron window; `npm test` runs (0 tests, 0 failures).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story depends on. No US work begins until this phase is complete.

**⚠️ CRITICAL**: All tasks in this phase must complete before Phases 3–5 can start.

- [X] T006 Create `electron-store` schema and accessor functions in `src/main/store/index.js`: export `getDocuments()`, `setDocuments(docs)`, `findDocumentById(id)`, `findDocumentByPath(filePath)`; schema version 1 with `documents` array matching the `Document` entity from data-model.md
- [X] T007 [P] Create file system utilities in `src/main/fs/fileUtils.js`: export `readFileAsUtf8(filePath)` (returns `Promise<string>`), `fileExists(filePath)` (returns `Promise<boolean>`)
- [X] T008 [P] Create manual Electron IPC mock in `tests/__mocks__/electron.js`: stubs `app.getPath`, `dialog.showOpenDialog`, `ipcMain.handle`; export a `mockIpcMain` helper that maps channel names to handler functions for testing
- [X] T009 Create preload script in `src/preload/index.js`: expose `window.api.documents.{ importFiles, getAll, reorder, readContent, remove }` via `contextBridge.exposeInMainWorld`, each mapped to the corresponding `ipcRenderer.invoke('documents:<channel>', ...)` call per `contracts/ipc-api.md`
- [X] T010 Create Electron main process entry in `src/main/index.js`: configure `BrowserWindow` with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, load the renderer URL (dev: Vite server; prod: `index.html`), register the preload script
- [X] T011 [P] Create React app entry in `src/renderer/index.html` and `src/renderer/src/main.jsx`: `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`; create root `App.jsx` with placeholder routing state (`view: 'main' | 'reader'`)
- [X] T012 [P] Create IPC service bridge in `src/renderer/src/services/api.js`: thin wrapper that calls `window.api.documents.*` and re-exports each method (`importFiles`, `getAll`, `reorder`, `readContent`, `remove`) so tests can mock a single module
- [X] T013 [P] Create `ErrorBoundary` component in `src/renderer/src/components/ErrorBoundary/index.jsx`: class component that catches render errors and displays a fallback message instead of crashing the whole app

**Checkpoint**: App launches with a blank white window; preload API is available as `window.api` in the browser console; `npm test` passes 0 tests with no infrastructure errors.

---

## Phase 3: User Story 1 — Import and View Documents (Priority: P1) 🎯 MVP

**Goal**: Users can import `.md` files and see them as cards on the main page. Clicking a card opens its content.

**Independent Test**: Import one `.md` file → card appears on main page with file name → clicking card shows raw (or basic) content. Delivers a fully usable MVP.

### Implementation

- [X] T014 [P] [US1] Implement `documents:import-files` IPC handler in `src/main/ipc/documents.js`: call `dialog.showOpenDialog` filtered to `{ filters: [{ name: 'Markdown', extensions: ['md'] }], properties: ['openFile', 'multiSelections'] }`, validate each selected file, assign UUID, check for duplicates via `findDocumentByPath`, append to store via `setDocuments`, return the contract response shape from `contracts/ipc-api.md`
- [X] T015 [P] [US1] Implement `documents:get-all` IPC handler in `src/main/ipc/documents.js`: load all documents from store, run `fileExists` for each to compute `status: "available" | "missing"`, return sorted by `orderIndex` ascending per contract
- [X] T016 [P] [US1] Implement `documents:remove` IPC handler in `src/main/ipc/documents.js`: remove the document with the given `id` from the store, rewrite contiguous `orderIndex` values on the remaining documents, return `{ success, error }`
- [X] T017 [US1] Implement `DocumentCard` component in `src/renderer/src/components/DocumentCard/index.jsx`: accepts `{ id, name, status, onClick }` props; renders document name, a "missing" badge when `status === 'missing'`, and calls `onClick` on click; style with CSS module `DocumentCard.module.css`
- [X] T018 [US1] Implement `useDocuments` hook in `src/renderer/src/hooks/useDocuments.js`: calls `api.getAll()` on mount, exposes `{ documents, loading, error, importFiles, removeDocument, reorderDocuments }`; on `importFiles` call `api.importFiles()` then refresh list; on `removeDocument` call `api.remove(id)` then refresh
- [X] T019 [US1] Implement `MainPage` in `src/renderer/src/pages/MainPage.jsx`: uses `useDocuments`; renders an import button (calls `importFiles`), empty-state illustration when no documents, and a flat grid of `DocumentCard`s; calls `onOpenDocument(id)` prop when a card is clicked
- [X] T020 [US1] Wire all IPC handlers into the main process in `src/main/index.js`: import `src/main/ipc/documents.js` and call `registerDocumentHandlers(ipcMain)` after `app.whenReady()`

### Unit Tests

- [X] T021 [P] [US1] Unit test `documents:import-files` and `documents:get-all` handlers in `tests/main/documents.test.js`: mock `dialog`, `fs/fileUtils`, and `store`; assert correct `imported`/`skipped` response shapes, duplicate detection, and `status` computation
- [X] T022 [P] [US1] Unit test `DocumentCard` in `tests/renderer/DocumentCard.test.js`: render with `available` and `missing` status; assert name renders, missing badge appears, `onClick` fires on click
- [X] T023 [P] [US1] Unit test `useDocuments` hook in `tests/renderer/useDocuments.test.js`: mock `src/renderer/src/services/api.js`; assert documents load on mount, `importFiles` triggers a refresh, error state sets correctly

**Checkpoint**: Full US1 end-to-end: import file → card appears → click opens a view. All US1 unit tests pass.

---

## Phase 4: User Story 2 — Reorder Documents via Drag-and-Drop (Priority: P2)

**Goal**: Users drag document cards on the main page to reorder them; the new order is persisted and survives an app restart.

**Independent Test**: Import 2+ documents → drag one card to a new position → restart the app → cards appear in the new order.

### Implementation

- [X] T024 [US2] Implement `DocumentList` sortable wrapper in `src/renderer/src/components/DocumentList/index.jsx`: wrap cards in `<DndContext onDragEnd={handleDragEnd}>` and `<SortableContext items={ids} strategy={verticalListSortingStrategy}>`; inside `handleDragEnd`, compute new order with `arrayMove`, call `useDocuments.reorderDocuments(newIds)` which calls `api.reorder({ orderedIds })`; each `DocumentCard` uses the `useSortable` hook for drag handle and transform styles
- [X] T025 [US2] Implement `documents:reorder` IPC handler in `src/main/ipc/documents.js`: validate that `orderedIds` contains exactly all known document IDs; rewrite `orderIndex` values contiguously based on position in `orderedIds`; persist via `setDocuments`; return `{ success, error }`
- [X] T026 [US2] Integrate `DocumentList` into `src/renderer/src/pages/MainPage.jsx`: replace the flat card grid with `<DocumentList documents={documents} onOpen={onOpenDocument} />`; confirm reorder triggers IPC persist

### Unit Tests

- [X] T027 [P] [US2] Unit test `documents:reorder` handler in `tests/main/documents.test.js`: assert `orderIndex` values are rewritten correctly; assert error returned for mismatched ID lists
- [X] T028 [P] [US2] Unit test `DocumentList` in `tests/renderer/DocumentList.test.js`: mock `@dnd-kit` drag events; assert that `reorderDocuments` is called with the correct new order after a simulated drag-end event

**Checkpoint**: Drag-and-drop works; reorder call fires; after simulated restart (re-calling `getAll`) documents come back in the new order. All US2 tests pass.

---

## Phase 5: User Story 3 — Read Rendered Markdown with Syntax Highlighting (Priority: P3)

**Goal**: Clicking a document card opens a full reading view rendering all GFM Markdown with shiki-powered syntax highlighting.

**Independent Test**: Open a `.md` file containing H1–H6 headings, lists, a ` ```python ``` ` code block, and an image. All elements render visually correctly with syntax colour highlighting. Back navigation returns to the main page intact.

### Implementation

- [X] T029 [P] [US3] Implement `documents:read-content` IPC handler in `src/main/ipc/documents.js`: resolve `filePath` from store by `id`, call `readFileAsUtf8(filePath)`, return `{ success: true, content }` or `{ success: false, content: null, error }` on failure
- [X] T030 [US3] Implement `useMarkdown` hook in `src/renderer/src/hooks/useMarkdown.js`: accepts `documentId`; calls `api.readContent({ id })` on mount/id change; exposes `{ rawMarkdown, loading, error }`
- [X] T031 [US3] Implement `MarkdownViewer` component in `src/renderer/src/components/MarkdownViewer/index.jsx`: renders `<ReactMarkdown>` with plugins `[remarkGfm, remarkFrontmatter]` and rehype plugins `[rehypeSlug, rehypePrettyCode]`; configure `rehypePrettyCode` with a shiki `github-dark` theme; wrap in a `<article>` with `MarkdownViewer.module.css` for typography (font size, line height, max-width, heading hierarchy)
- [X] T032 [US3] Implement `ReaderPage` in `src/renderer/src/pages/ReaderPage.jsx`: accepts `{ documentId, documentName, onBack }` props; uses `useMarkdown(documentId)` for content; renders a toolbar with document name and a back button calling `onBack`; renders `<MarkdownViewer rawMarkdown={rawMarkdown}>` or a loading/error state; wraps everything in `<ErrorBoundary>`
- [X] T033 [US3] Implement navigation between `MainPage` and `ReaderPage` in `src/renderer/src/App.jsx`: when `view === 'reader'`, render `<ReaderPage documentId={activeId} documentName={activeName} onBack={() => setView('main')} />`; when `view === 'main'`, render `<MainPage onOpenDocument={(id, name) => { setActiveId(id); setActiveName(name); setView('reader'); }} />`

### Unit Tests

- [X] T034 [P] [US3] Unit test `documents:read-content` handler in `tests/main/documents.test.js`: mock `readFileAsUtf8`; assert content returned for valid ID; assert `success: false` when file is missing
- [X] T035 [P] [US3] Unit test `MarkdownViewer` in `tests/renderer/MarkdownViewer.test.js`: render with a Markdown string containing an H1, a paragraph, an unordered list, and a fenced `js` code block; assert the rendered output contains `<h1>`, `<ul>`, `<li>`, and a `<code>` element with the `data-language="js"` attribute set by `rehype-pretty-code`

**Checkpoint**: Full US3 end-to-end: click card → reading view opens → rich Markdown renders with syntax highlighting → back button returns to intact main page. All US3 tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, accessibility, and visual completeness across all stories.

- [X] T036 [P] Apply global mosaic-style reading layout CSS in `src/renderer/src/styles/global.css`: set base font family (system-ui or Inter), line-height 1.6, color scheme (light/dark via `prefers-color-scheme`), and a maximum content width for the reader; import in `src/renderer/src/main.jsx`
- [X] T037 [P] Harden `DocumentCard` missing-file UX in `src/renderer/src/components/DocumentCard/index.jsx`: visually dim missing cards, show a tooltip "File not found", disable the click handler (prevent opening a missing document until re-imported)
- [X] T038 [P] Implement duplicate import feedback in `src/renderer/src/pages/MainPage.jsx`: when `importFiles` returns `skipped` entries, display a non-blocking notification listing the skipped filenames and their reasons (`duplicate`, `invalid-type`, `unreadable`)
- [X] T039 [P] Implement empty-state illustration component in `src/renderer/src/components/EmptyState/index.jsx`: render a dino mascot SVG and "Drop your first .md file here" call-to-action; use in `MainPage` when `documents.length === 0`
- [X] T040 Run quickstart.md validation: follow all 4 steps in `quickstart.md` (import file, view card, open reading view, reorder + restart), confirm all acceptance criteria from spec.md pass end-to-end

**Checkpoint**: All 40 tasks complete. App passes quickstart validation. All unit tests green.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └──▶ Phase 2 (Foundational)  ← BLOCKS all user story phases
          ├──▶ Phase 3 (US1 — MVP) ← Start here after Foundational
          │       └──▶ Phase 4 (US2)
          │               └──▶ Phase 5 (US3)
          └──▶ Phase 6 (Polish) ← After all US phases
```

### User Story Dependencies

| Story | Depends on | Notes |
|-------|-----------|-------|
| US1 (P1) | Phase 2 complete | No dependency on other stories |
| US2 (P2) | Phase 2 complete + US1 cards exist | Reorder operates on existing cards |
| US3 (P3) | Phase 2 complete + US1 navigation exists | Reader opened from US1 card click |

### Parallel Opportunities Per Phase

**Phase 1**: T003, T004, T005 can all run in parallel after T001 + T002.  
**Phase 2**: T007, T008, T011, T012, T013 can all run in parallel after T006 + T009 + T010.  
**Phase 3**: T014, T015, T016 (IPC handlers) can run in parallel; T021, T022, T023 (tests) can run in parallel after their implementation tasks.  
**Phase 4**: T027 and T028 can run in parallel after T024 + T025 + T026.  
**Phase 5**: T029 can run in parallel with T030; T034 and T035 can run in parallel after T031 + T032.  
**Phase 6**: T036, T037, T038, T039 can all run in parallel.

### Parallel Example: Phase 2 (once T006 + T009 + T010 are done)

```
Team member A: T007 (fileUtils.js)
Team member B: T008 (electron mock)
Team member C: T011 (React entry) → T012 (api.js) → T013 (ErrorBoundary)
```

---

## Implementation Strategy

**MVP scope**: Complete **Phases 1–3 only** (T001–T023, 23 tasks).  
This delivers a fully working app where users can import `.md` files, see document cards, and open document content — independently testable and shippable.

**Increment 2**: Add Phase 4 (T024–T028) — drag-and-drop reordering with persistence.  
**Increment 3**: Add Phase 5 (T029–T035) — rich Markdown rendering with syntax highlighting.  
**Increment 4**: Phase 6 polish (T036–T040) — visual completeness and edge case hardening.

---

## Task Count Summary

| Phase | Tasks | Parallelizable |
|-------|-------|---------------|
| Phase 1 — Setup | 5 | 3 |
| Phase 2 — Foundational | 8 | 5 |
| Phase 3 — US1 (P1 MVP) | 10 | 6 |
| Phase 4 — US2 (P2) | 5 | 2 |
| Phase 5 — US3 (P3) | 7 | 4 |
| Phase 6 — Polish | 5 | 4 |
| **Total** | **40** | **24** |
