# Tasks: DinoMD — Create & Edit Markdown Files

**Input**: Design documents from `/specs/002-create-edit-md/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-api.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the existing main-process plumbing (store + file utilities) that all three user stories will call. No new UI, no IPC registration yet.

- [X] T001 Extend Document schema with optional `mtimeMs`, add `updateDocument(id, patch)` and `removeDocumentById(id)` helpers in `src/main/store/index.js`
- [X] T002 [P] Add `writeFileUtf8(filePath, content)` and `renameFile(oldPath, newPath)` (with EXDEV fallback + pre-flight existence check) to `src/main/fs/fileUtils.js`
- [X] T003 [P] Add `watchFile(filePath, onChange)` and `stopWatching()` (fs.watch + 200 ms debounce) to `src/main/fs/fileUtils.js`

**Checkpoint**: Store helpers and file utilities are testable in isolation — `updateDocument`, `removeDocumentById`, `writeFileUtf8`, `renameFile`, `watchFile` all have clear contracts.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: IPC handler registration, preload surface, and renderer API service — the full main↔renderer channel layer that every user story depends on.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

- [X] T004 Export `setMainWindow(win)` from `src/main/ipc/documents.js` and call it in `src/main/index.js` after `BrowserWindow` creation (required for push events)
- [X] T005 Add `documents:create` and `documents:save` IPC handlers (including `dialog.showSaveDialog` for drafts and store-entry creation/update) in `src/main/ipc/documents.js`
- [X] T006 Add `documents:rename` IPC handler (pre-flight existence check, `renameFile`, store update) in `src/main/ipc/documents.js`
- [X] T007 Add `documents:delete` IPC handler (`shell.trashItem` primary, `unlink` fallback, `removeDocumentById`) in `src/main/ipc/documents.js`
- [X] T008 [P] Expose `create`, `save`, `rename`, `delete` invoke wrappers and `onFileChangedExternally` / `removeFileChangedListener` event helpers in `src/preload/index.js`
- [X] T009 [P] Add `create`, `save`, `rename`, `delete`, `onFileChangedExternally`, `removeFileChangedListener` to `src/renderer/src/services/api.js`
- [X] T010 [P] Create `ConfirmModal` component (title, message, primary/secondary/cancel buttons, `role="dialog"`) in `src/renderer/src/components/ConfirmModal/index.jsx` and `ConfirmModal.module.css`

**Checkpoint**: Foundation ready — all IPC channels registered, preload updated, api.js updated, ConfirmModal available. User story UI work can now begin.

---

## Phase 3: User Story 1 — Create a New Markdown Document (Priority: P1) 🎯 MVP

**Goal**: A user triggers "New document", types Markdown content in an editor, saves the file — it appears on the main page as a new card.

**Independent Test**: Click "New document" on MainPage → type a few lines → Save → confirm the file exists on disk and the card appears on MainPage. No pre-existing documents required.

- [X] T011 [P] [US1] Create `MarkdownEditor` component (controlled `<textarea>`, Tab inserts two spaces, `spellCheck={false}`, `aria-label`) in `src/renderer/src/components/MarkdownEditor/index.jsx` and `MarkdownEditor.module.css`
- [X] T012 [P] [US1] Implement `useEditor` hook with `openNew`, `updateContent`, and `save` (draft path: sets `documentId`, `filePath`, `savedContent`, clears `isDraft`) in `src/renderer/src/hooks/useEditor.js`
- [X] T013 [US1] Create `EditorPage` with header (document name, Save button), `MarkdownEditor`, loading/error states, and `onBack` prop in `src/renderer/src/pages/EditorPage.jsx` and `EditorPage.module.css`
- [X] T014 [US1] Add "New document" button to `MainPage` header, invoke `onNewDocument` callback prop in `src/renderer/src/pages/MainPage.jsx`
- [X] T015 [US1] Wire `EditorPage` into `App.jsx`: add `currentView` state, render `EditorPage` when `view === 'editor'`, handle `onNewDocument` (calls `useEditor.openNew`) and `onDocumentCreated` (refreshes document list via `useDocuments`) in `src/renderer/src/App.jsx`

**Checkpoint**: User Story 1 fully functional — new documents can be created, typed, saved to disk, and the card appears on MainPage without any existing documents.

---

## Phase 4: User Story 2 — Edit an Existing Markdown Document (Priority: P2)

**Goal**: A user opens any existing document from the main page, modifies the content in the editor, saves changes — the file on disk is updated. Navigating away with unsaved changes shows a warning.

**Independent Test**: Import a document → open it (card click) → modify text → Save → close and reopen → verify the change persisted. Then: modify without saving → click Back → confirm the unsaved-changes modal appears.

- [X] T016 [US2] Extend `useEditor` hook with `openExisting(doc)` (reads `documents:read-content`, seeds `savedContent` + `mtimeMs`), `isDirty` derivation (`content !== savedContent`), `rename(newName)`, and `discard()` in `src/renderer/src/hooks/useEditor.js`
- [X] T017 [US2] Add edit mode to `EditorPage`: populate editor with existing content when opened via `openExisting`, wire Save to `useEditor.save` (existing-document path, no dialog) in `src/renderer/src/pages/EditorPage.jsx`
- [X] T018 [US2] Implement unsaved-changes guard in `EditorPage` using deferred-action thunk + `ConfirmModal` (Save / Discard / Cancel): wrap `onBack` in `requestNavigation` in `src/renderer/src/pages/EditorPage.jsx`
- [X] T019 [US2] Add inline editable title in `EditorPage` header — on blur/Enter calls `useEditor.rename(newName)`; show validation error if rename fails in `src/renderer/src/pages/EditorPage.jsx`
- [X] T020 [US2] Subscribe to `api.onFileChangedExternally` in `EditorPage` `useEffect`; show dismissible "File changed on disk — Reload or Keep editing?" banner; Reload calls `api.readContent` and resets session in `src/renderer/src/pages/EditorPage.jsx`
- [X] T021 [US2] Wire "open document for editing" flow in `App.jsx`: pass `onEditDocument(doc)` to `MainPage`/`DocumentList`/`DocumentCard`, call `useEditor.openExisting(doc)`, navigate to `EditorPage`; add `mainWindow.on('close')` + `app:confirm-close` IPC guard in `src/renderer/src/App.jsx` and `src/main/index.js`
- [X] T021b [US2] Add an "Edit" button to `ReaderPage` header that calls `onEditDocument(doc)` prop — covers FR-002 ("editable from the read view") in `src/renderer/src/pages/ReaderPage.jsx` and `ReaderPage.module.css`

**Checkpoint**: User Story 2 fully functional — existing documents can be opened, edited, saved, renamed, and the dirty guard prevents silent data loss on any navigation path.

---

## Phase 5: User Story 3 — Delete a Document (Priority: P3)

**Goal**: A user deletes a document from the main page or from within the editor — after a mandatory confirmation step, the file is moved to the OS trash and the card disappears.

**Independent Test**: Import a document → trigger delete (from card or editor) → confirm → verify the card is gone from MainPage and the file is in the OS trash.

- [X] T022 [US3] Add delete action to `DocumentCard` (trigger button or context menu) that calls `onDelete(doc.id)` prop in `src/renderer/src/components/DocumentCard/index.jsx` and `DocumentCard.module.css`
- [X] T023 [US3] Handle `onDeleteDocument(id)` in `MainPage`: show `ConfirmModal`, on confirm call `api.delete({ id })`, on success call `onDocumentDeleted(id)` prop in `src/renderer/src/pages/MainPage.jsx`
- [X] T024 [US3] Extend `useEditor` hook with `deleteDocument()` (calls `api.delete`) in `src/renderer/src/hooks/useEditor.js`
- [X] T025 [US3] Add delete button to `EditorPage` header; show `ConfirmModal`, on confirm call `useEditor.deleteDocument()`, on success call `onDocumentDeleted(id)` and navigate back in `src/renderer/src/pages/EditorPage.jsx`
- [X] T026 [US3] Handle `onDocumentDeleted(id)` in `App.jsx`: remove the card from the local document list and navigate back to MainPage if `EditorPage` is showing the deleted document in `src/renderer/src/App.jsx`

**Checkpoint**: User Story 3 fully functional — documents can be deleted from both MainPage and EditorPage, always with confirmation, always recoverable from OS trash.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error states, edge cases, and final wiring that span multiple user stories.

- [X] T027 [P] Show a dismissible error banner in `EditorPage` when save, rename, or delete fails (non-blocking — preserves in-memory content) in `src/renderer/src/pages/EditorPage.jsx`
- [X] T028 [P] Handle stale document in `DocumentCard`: if `status === 'missing'`, show a warning indicator and disable the edit action; clicking delete on a missing doc still works (store cleanup) in `src/renderer/src/components/DocumentCard/index.jsx`
- [X] T029 Handle zero-byte save edge case (empty content): allow it (valid Markdown file), do not block save in `src/main/ipc/documents.js`
- [X] T030 Run all manual smoke tests from `specs/002-create-edit-md/quickstart.md` (Steps 1–7): create, edit, unsaved-changes guard, delete, rename, rename conflict, external change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T002 and T003 are in the same file but touch different exported functions; can be done sequentially by one developer or assigned together.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. T005–T007 are sequential edits to `documents.js`; T008, T009, T010 can run in parallel once T004 is done.
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion. Can proceed in priority order or in parallel (if staffed).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 — implement first, stop and validate at Phase 3 checkpoint.
- **US2 (P2)**: Extends `useEditor` and `EditorPage` built in US1. Depends on Phase 3 being complete. Independent of US3.
- **US3 (P3)**: Depends on `ConfirmModal` (Phase 2) and `DocumentCard` (existing). Independent of US2 — can be developed in parallel with US2 by a second developer after Phase 3 is done.

### Within Each User Story

- Hook (`useEditor`) before page (`EditorPage`) — page imports the hook
- Component (`MarkdownEditor`) and hook can be developed in parallel [P] since they are different files
- Page before App wiring — App imports the page
- Each story's page tasks (T017–T020 for US2) are sequential edits to the same file (`EditorPage.jsx`)

### Parallel Opportunities

- **Phase 1**: T002 and T003 can be split (same file, different functions) or done together
- **Phase 2**: T008 (preload), T009 (api.js), T010 (ConfirmModal) all run in parallel after T004
- **Phase 3**: T011 (MarkdownEditor) and T012 (useEditor) are [P] — different files
- **Phase 5 + Phase 2 overlap**: Once Phase 3 is done, US2 and US3 can be developed in parallel by separate developers

---

## Parallel Example: Phase 2

```
After T004 is done:
  [P] T008 — Update src/preload/index.js
  [P] T009 — Update src/renderer/src/services/api.js
  [P] T010 — Create src/renderer/src/components/ConfirmModal/
Then sequentially:
  T005 → T006 → T007 (all in src/main/ipc/documents.js)
```

## Parallel Example: User Story 1

```
After Phase 2 is done:
  [P] T011 — Create src/renderer/src/components/MarkdownEditor/
  [P] T012 — Create src/renderer/src/hooks/useEditor.js (openNew + save)
Then sequentially:
  T013 (EditorPage) → T014 (MainPage button) → T015 (App.jsx wiring)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T010)
3. Complete Phase 3: User Story 1 (T011–T015)
4. **STOP and VALIDATE**: Create a new document end-to-end
5. Ship MVP — editing the main page is already a meaningful improvement

### Incremental Delivery

1. Setup + Foundational → IPC layer ready
2. US1 → new documents can be created (MVP)
3. US2 → existing documents can be edited
4. US3 → documents can be deleted
5. Polish → error states and edge cases

### Parallel Team Strategy

With two developers after Phase 2:
- **Developer A**: US1 (T011–T015) → then US2 (T016–T021)
- **Developer B**: Can start US3 (T022–T026) once Phase 3 checkpoint is reached (DocumentCard and App.jsx patterns are established)
