# Tasks: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export`  
**Input**: Design documents from `/specs/010-code-snapshot-export/`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data model**: [data-model.md](./data-model.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) — setup and foundational phases have no story label

---

## Phase 1: Setup

**Purpose**: Install the one new dependency and confirm dev environment is ready.

- [X] T001 Add `html2canvas` to `dependencies` in `package.json` and run `npm install`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities and hooks that ALL user stories depend on. Must be complete before Phase 3.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `src/renderer/src/utils/languageFromExtension.js` — pure function `languageFromExtension(filename)` returning a language label string from a static extension map (`.js`→`javascript`, `.ts`→`typescript`, `.py`→`python`, `.sh`→`bash`, `.md`→`markdown`, `.json`→`json`, `.css`→`css`, `.html`→`html`, `.yml`/`.yaml`→`yaml`, `.rb`→`ruby`, `.go`→`go`, `.rs`→`rust`, `.java`→`java`, `.c`/`.cpp`→`c/c++`, `.php`→`php`); returns `''` for unknown extensions or no filename
- [X] T003 [P] Create `src/renderer/src/hooks/useSnapshotMode.js` — exports `useSnapshotMode(documentId)` returning `{ mode, setMode }` where `mode` is `'code'|'snapshot'`, default `'code'`, with a `useEffect` that resets `mode` to `'code'` whenever `documentId` changes
- [X] T004 [P] Create `src/renderer/src/components/CodePanel/index.jsx` as a pass-through scaffold: accepts `{ value, onChange, onSave, onDiscard, containerRef, onScroll, documentId, documentName }` and renders only `<EditorPane>` for now (wired properly in T011)
- [X] T005 [P] Create `src/renderer/src/components/CodePanel/CodePanel.module.css` with base layout (full height, flex column, position relative)
- [X] T006 Modify `src/renderer/src/pages/SplitViewPage.jsx` — replace the `<EditorPane>` import and usage with `<CodePanel>`, forwarding all existing props plus `documentId={session.documentId}` and `documentName={session.name}`

**Checkpoint**: App still runs with no visible change — CodePanel is a transparent pass-through.

---

## Phase 3: User Story 1 — Toggle Snapshot View (Priority: P1) 🎯 MVP

**Goal**: Code/Snapshot toggle in the panel sub-header switches between plain textarea and a styled macOS window-chrome view with One Monokai theme. Default mode is Code. Mode resets on file switch. Title bar shows filename or language label.

**Independent Test**: Open any file in split-view → click "Snapshot" → macOS chrome appears with traffic-light dots, One Monokai background, filename in title bar → click "Code" → plain textarea restored → switch file → panel resets to Code mode automatically.

- [ ] T007 [P] [US1] Create `src/renderer/src/components/CodePanelHeader/index.jsx` — renders a sub-header bar with two toggle buttons ("Code" | "Snapshot"), `aria-pressed` on active, calls `onModeChange(mode)` on click; Export PNG button slot reserved but empty for now
- [ ] T008 [P] [US1] Create `src/renderer/src/components/CodePanelHeader/CodePanelHeader.module.css` — sub-header layout, toggle button active/inactive states matching existing `ViewModeToggle` visual style
- [X] T009 [P] [US1] Create `src/renderer/src/components/SnapshotPane/index.jsx` — renders macOS window chrome: outer frame, title bar row with three traffic-light dots (Close #FF5F57, Minimize #FFBD2E, Maximize #28C840) on the left and centered muted label (filename → language label → empty, derived from `languageFromExtension`), inner `<pre><code>` code area; when `content` is empty renders `// No code to display` placeholder in the code area
- [X] T010 [P] [US1] Create `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` — One Monokai base theme: outer frame background `#282c34`, border-radius, title bar height and background `#282c34`, traffic-light dot sizes (12px circles), code area background `#282c34`, color `#abb2bf`, font monospace 13px, line-height 1.6, padding 20px 24px; placeholder text style muted
- [X] T011 [US1] Update `src/renderer/src/components/CodePanel/index.jsx` — integrate `useSnapshotMode(documentId)`, render `<CodePanelHeader>` with `mode` and `onModeChange`, conditionally render `<SnapshotPane content={value} title={documentName}/>` when `mode === 'snapshot'` or `<EditorPane>` when `mode === 'code'`; forward `snapshotFrameRef` to `SnapshotPane` using `useRef`
- [X] T012 [P] [US1] Write `tests/renderer/useSnapshotMode.test.js` — default mode is `'code'`; toggle to `'snapshot'` works; mode resets to `'code'` when `documentId` prop changes
- [X] T013 [P] [US1] Write `tests/renderer/SnapshotPane.test.jsx` — chrome container renders; three traffic-light dots present with correct colors; title bar shows filename prop; title bar shows language label when filename is absent and extension is known; title bar is empty when neither is available; `// No code to display` appears for empty content

**Checkpoint**: US1 fully functional and independently testable. Export PNG button not yet wired.

---

## Phase 4: User Story 2 — Export Snapshot as PNG (Priority: P2)

**Goal**: "Export PNG" button visible only in Snapshot mode captures the styled frame at 2× pixel density and downloads a correctly named PNG. Export failure shows an inline error message.

**Independent Test**: Switch to Snapshot mode → "Export PNG" button is visible → click it → a file named `snapshot-<filename>.png` is downloaded → switch to Code mode → button disappears → trigger a forced export failure → inline error message "Export failed. Try again." appears.

- [X] T014 [P] [US2] Create `src/renderer/src/utils/snapshotExport.js` with two pure functions: `captureElement(element, scale = 2)` (calls `html2canvas(element, { scale, useCORS: false, logging: false })` and returns a PNG blob) and `downloadBlob(blob, filename)` (creates a temporary `<a>` element, triggers download, then removes it)
- [X] T015 [P] [US2] Create `src/renderer/src/hooks/useSnapshotExport.js` — exports `useSnapshotExport(snapshotFrameRef, filename)` returning `{ exportPng, exporting, error }`; `exportPng` calls `captureElement` then `downloadBlob`, wraps in try/catch setting `error` on failure; filename follows `snapshot-<filename>.png` pattern, falling back to `snapshot.png`; sets `exporting: true` during capture
- [X] T016 [US2] Update `src/renderer/src/components/CodePanelHeader/index.jsx` — add "Export PNG" button rendered only when `mode === 'snapshot'`; button is disabled when `exporting` is true; renders inline error text below/beside toggle when `error` is non-null
- [X] T017 [US2] Update `src/renderer/src/components/CodePanel/index.jsx` — instantiate `useSnapshotExport(snapshotFrameRef, session.name ?? '')` and pass `{ exportPng, exporting, error }` to `CodePanelHeader`
- [X] T018 [P] [US2] Write `tests/renderer/snapshotExport.test.js` — `captureElement` is called with `scale: 2`; `downloadBlob` triggers download with correct filename; filename is `snapshot-server.js.png` for `server.js`; filename falls back to `snapshot.png` when name is empty
- [X] T019 [P] [US2] Write `tests/renderer/CodePanelHeader.test.jsx` — Export PNG button absent when `mode === 'code'`; Export PNG button present when `mode === 'snapshot'`; button disabled when `exporting` is true; inline error message renders when `error` is set; no error message when `error` is null

**Checkpoint**: US2 fully functional. PNG export works end-to-end with correct filename, 2× density, and error feedback.

---

## Phase 5: User Story 3 — Syntax Highlighting in Snapshot (Priority: P3)

**Goal**: Code content inside the snapshot frame is tokenised with One Monokai CSS colors: keywords purple, strings green, numbers orange, comments grey italic, punctuation muted. Language is inferred from file extension for the title bar (already done in T002/T009), and the same token regex is used regardless of language.

**Independent Test**: Open a `.js` file in Snapshot mode → inspect DOM spans for `snap-token-keyword` (color #c678dd), `snap-token-string` (#98c379), `snap-token-number` (#d19a66), `snap-token-comment` (#5c6370 italic), `snap-token-punctuation` (#abb2bf). Open a file with an unknown extension → no token spans but theme background/font still present.

- [X] T020 [P] [US3] Add `tokenizeSnapshotLine(line)` to `src/renderer/src/utils/markdownTokenizer.js` — same regex as `tokenizeCodeLine` but outputs `snap-token-keyword`, `snap-token-string`, `snap-token-number`, `snap-token-comment`, `snap-token-punctuation` class names instead of `token-code-*`
- [X] T021 [P] [US3] Add One Monokai token color rules to `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` — `.snap-token-keyword { color: #c678dd }`, `.snap-token-string { color: #98c379 }`, `.snap-token-number { color: #d19a66 }`, `.snap-token-comment { color: #5c6370; font-style: italic }`, `.snap-token-punctuation { color: #abb2bf }`
- [X] T022 [P] [US3] Add `overflow-x: auto; white-space: pre; overflow-y: visible` to the inner code area in `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` to handle long lines with horizontal scroll clipped at frame boundary
- [X] T023 [US3] Update `src/renderer/src/components/SnapshotPane/index.jsx` — tokenise each line of `content` using `tokenizeSnapshotLine`, render via `dangerouslySetInnerHTML` inside `<pre><code>` (same pattern as existing `MarkdownEditor`)
- [X] T024 [P] [US3] Write `tests/renderer/languageFromExtension.test.js` — `.js` returns `'javascript'`; `.py` returns `'python'`; `.tsx` returns `'typescript'`; unknown extension `.xyz` returns `''`; empty string returns `''`
- [X] T025 [P] [US3] Update `tests/renderer/markdownTokenizer.test.js` — add cases for `tokenizeSnapshotLine`: keyword produces `snap-token-keyword` span; string produces `snap-token-string` span; number produces `snap-token-number` span; comment produces `snap-token-comment` span

**Checkpoint**: All three user stories independently functional and tested. App is feature-complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, edge case hardening, lint/test pipeline green.

- [X] T026 [P] Write `tests/e2e/010-code-snapshot.e2e.js` — E2E scenario 1: open file, enter split-view, click Snapshot toggle, assert chrome visible; scenario 2: click Export PNG, assert download triggered; scenario 3: switch file, assert panel resets to Code mode
- [X] T027 [P] Update `src/renderer/src/components/CodePanelHeader/CodePanelHeader.module.css` — add `aria-live` region style for inline error message; style Export PNG button consistent with existing action buttons in the app
- [X] T028 Run `npm run test:all` and confirm all tests pass; run `npm run lint` and confirm zero warnings
- [X] T029 Run the manual verification checklist from `specs/010-code-snapshot-export/quickstart.md` against the running dev build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — delivers MVP
- **Phase 4 (US2)**: Depends on Phase 3 (Export PNG button lives in CodePanelHeader wired in US1)
- **Phase 5 (US3)**: Depends on Phase 2 (uses T020 which extends markdownTokenizer) — can overlap with Phase 4 if working in parallel
- **Phase 6 (Polish)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2 or US3
- **US2 (P2)**: After US1 (export button lives in CodePanelHeader, frame ref set up in US1)
- **US3 (P3)**: After Foundational — can be started in parallel with US2 (different files: markdownTokenizer, SnapshotPane CSS, SnapshotPane render logic)

### Within Each Phase

- Tasks marked `[P]` within the same phase can be executed concurrently
- T011 (CodePanel wiring for US1) requires T007–T010 to be complete
- T017 (CodePanel wiring for US2) requires T014–T016 to be complete
- T023 (SnapshotPane tokenisation for US3) requires T020–T022 to be complete

---

## Parallel Execution Examples

### Phase 2 — all four tasks in parallel
```
T002 languageFromExtension.js  ──┐
T003 useSnapshotMode.js         ──┤
T004 CodePanel scaffold          ──┤── ALL PARALLEL (different files)
T005 CodePanel.module.css       ──┘
                                   ↓
T006 SplitViewPage.jsx update (depends on T004)
```

### Phase 3 — components in parallel, wiring after
```
T007 CodePanelHeader/index.jsx   ──┐
T008 CodePanelHeader.module.css  ──┤
T009 SnapshotPane/index.jsx      ──┤── ALL PARALLEL (different files)
T010 SnapshotPane.module.css     ──┤
T012 useSnapshotMode.test.js     ──┤
T013 SnapshotPane.test.jsx       ──┘
                                    ↓
T011 CodePanel wiring (depends on T007–T010)
```

### Phase 4 — utils and hooks in parallel, UI after
```
T014 snapshotExport.js        ──┐
T015 useSnapshotExport.js     ──┤── PARALLEL (different files)
T018 snapshotExport.test.js   ──┤
T019 CodePanelHeader.test.jsx ──┘
                                 ↓
T016 CodePanelHeader export button (depends on T015)
T017 CodePanel wiring (depends on T016)
```

### Phase 5 — all independent
```
T020 tokenizeSnapshotLine      ──┐
T021 One Monokai token CSS     ──┤
T022 Horizontal scroll CSS     ──┤── ALL PARALLEL (different files)
T024 languageFromExtension.test──┤
T025 markdownTokenizer.test    ──┘
                                  ↓
T023 SnapshotPane tokenisation (depends on T020 + T021)
```

---

## Implementation Strategy

**MVP (minimum shippable)**: Complete Phase 1 + Phase 2 + Phase 3 only.  
This delivers the visual toggle and styled Snapshot view — the primary user value — without export functionality.

**Full feature**: Complete all phases in order.

**Suggested delivery order for a single developer**:
T001 → T002–T005 (parallel) → T006 → T007–T010 (parallel) → T011 → T012–T013 (parallel, can overlap T011) → T014–T015 (parallel) → T016 → T017 → T018–T019 (parallel) → T020–T022 (parallel) → T023 → T024–T025 (parallel) → T026–T027 (parallel) → T028 → T029

---

## Task Count Summary

| Phase | Tasks | User Story |
|-------|-------|-----------|
| Phase 1: Setup | 1 | — |
| Phase 2: Foundational | 5 | — |
| Phase 3: US1 Toggle | 7 | US1 |
| Phase 4: US2 Export | 6 | US2 |
| Phase 5: US3 Highlighting | 6 | US3 |
| Phase 6: Polish | 4 | — |
| **Total** | **29** | |

**Parallel opportunities**: 19 of 29 tasks are independently executable within their phase.  
**MVP scope**: 13 tasks (Phases 1–3) deliver a fully working toggle + styled Snapshot view.
