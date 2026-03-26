# Tasks: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export`  
**Input**: Design documents from `/specs/010-code-snapshot-export/`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data model**: [data-model.md](./data-model.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) — setup and foundational phases have no story label
- **[X]**: Completed | **[ ]**: Pending

---

## Phase 1: Setup

**Purpose**: Install the one new dependency and confirm dev environment is ready.

- [X] T001 Add `html2canvas` to `dependencies` in `package.json` and run `npm install`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities and hooks that ALL user stories depend on. Must be complete before Phase 3.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `src/renderer/src/utils/languageFromExtension.js` — pure function `languageFromExtension(filename)` returning a capitalized language label from a static extension map (`.js`→`JavaScript`, `.jsx`→`JSX`, `.ts`→`TypeScript`, `.tsx`→`TSX`, `.py`→`Python`, `.sh`→`Bash`, `.md`→`Markdown`, `.json`→`JSON`, `.css`→`CSS`, `.html`→`HTML`, `.yml`/`.yaml`→`YAML`, `.rb`→`Ruby`, `.go`→`Go`, `.rs`→`Rust`, `.java`→`Java`, `.c`/`.cpp`→`C/C++`, `.php`→`PHP`); returns `''` for unknown extensions or no filename
- [X] T003 [P] Create `src/renderer/src/hooks/useSnapshotMode.js` — exports `useSnapshotMode(documentId)` returning `{ mode, setMode }` where `mode` is `'code'|'snapshot'`, default `'code'`, with a `useEffect` that resets `mode` to `'code'` whenever `documentId` changes
- [X] T004 [P] Create `src/renderer/src/components/CodePanel/index.jsx` as a pass-through scaffold: accepts `{ value, onChange, onSave, onDiscard, containerRef, onScroll, documentId, documentName, filePath }` and renders only `<EditorPane>` for now (wired properly in T011)
- [X] T005 [P] Create `src/renderer/src/components/CodePanel/CodePanel.module.css` with base layout (full height, flex column, position relative, overflow hidden)
- [X] T006 Modify `src/renderer/src/pages/SplitViewPage.jsx` — replace the `<EditorPane>` import and usage with `<CodePanel>`, forwarding all existing props plus `documentId={session.documentId}` and `documentName={session.name}` and `filePath={session.filePath}`

**Checkpoint**: App still runs with no visible change — CodePanel is a transparent pass-through.

---

## Phase 3: User Story 1 — Toggle Snapshot View (Priority: P1) 🎯 MVP

**Goal**: Code/Snapshot toggle in the panel sub-header switches between plain textarea and a styled macOS window-chrome view with One Monokai theme. Default mode is Code. Mode resets on file switch. Title bar shows filename or language label.

**Independent Test**: Open any file in split-view → click "Snapshot" → macOS chrome appears with traffic-light dots, One Monokai background, filename in title bar → click "Code" → plain textarea restored → switch file → panel resets to Code mode automatically.

- [X] T007 [P] [US1] Create `src/renderer/src/components/CodePanelHeader/index.jsx` — renders a sub-header bar with two toggle buttons ("Code" | "Snapshot"), `aria-pressed` on active, `role="group"` wrapping the toggle, calls `onModeChange(mode)` on click; renders "Export PNG" button and inline error only when `mode === 'snapshot'` (wired to `onExport`, `exporting`, `error` props)
- [X] T008 [P] [US1] Create `src/renderer/src/components/CodePanelHeader/CodePanelHeader.module.css` — sub-header layout, toggle button active/inactive states using `var(--color-accent)` for active, `var(--color-border)` / `var(--color-surface)` for structure; export button and error message styles; `aria-live="polite"` region for error
- [X] T009 [P] [US1] Create `src/renderer/src/components/SnapshotPane/index.jsx` — `forwardRef` component; renders macOS window chrome: outer container, inner `windowChrome` with `aria-label="Code snapshot"`, title bar row with three traffic-light dots (`aria-label` close/minimize/maximize) on the left and centered muted `titleLabel` span (shows `title` prop when non-empty, hidden when empty); inner `<pre><code>` area; when `content` is empty or whitespace renders `// No code to display` as plain text, otherwise renders tokenized HTML via `dangerouslySetInnerHTML` using `tokenizeSnapshotLine` + `escapeHtml`
- [X] T010 [P] [US1] Create `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` — One Monokai base theme: container background `#1e2128`, windowChrome background `#282c34`, border-radius 8px, overflow hidden; title bar height 36px, relative position; traffic-light dots 12px circles (Close `#ff5f57`, Minimize `#ffbd2e`, Maximize `#28c840`); titleLabel absolutely centered, muted `#5c6370`, monospace font, truncated; code area background `#282c34`, color `#abb2bf`, monospace 13px, line-height 1.6, padding 20px 24px, `overflow-x: auto`, `overflow-y: visible`, `white-space: pre`; snap-token color rules: keyword `#c678dd`, string `#98c379`, number `#d19a66`, comment `#5c6370 italic`, punctuation `#abb2bf`
- [X] T011 [US1] Update `src/renderer/src/components/CodePanel/index.jsx` — integrate `useSnapshotMode(documentId)` and `useRef` for `snapshotFrameRef`; render `<CodePanelHeader mode={mode} onModeChange={setMode} />` above the content area; conditionally render `<SnapshotPane ref={snapshotFrameRef} content={value} title={documentName ?? ''} />` when `mode === 'snapshot'` or `<EditorPane ...>` when `mode === 'code'`; export hook wired in T017
- [X] T012 [P] [US1] Write `tests/renderer/useSnapshotMode.test.js` — default mode is `'code'`; `setMode` changes mode to `'snapshot'`; mode resets to `'code'` when `documentId` prop changes; mode stays at current value when same `documentId` is re-provided
- [X] T013 [P] [US1] Write `tests/renderer/SnapshotPane.test.jsx` — `aria-label="Code snapshot"` present; three traffic-light dots with correct `aria-label`; `title` prop shown in title bar when non-empty; title bar empty when `title` is empty string; `// No code to display` for empty content; `// No code to display` for whitespace-only content; code text present for non-empty content

**Checkpoint**: US1 fully functional and independently testable. Export PNG button not yet wired.

---

## Phase 4: User Story 2 — Export Snapshot as PNG (Priority: P2)

**Goal**: "Export PNG" button visible only in Snapshot mode captures the styled frame at 2× pixel density and downloads a correctly named PNG. Export failure shows an inline error message.

**Independent Test**: Switch to Snapshot mode → "Export PNG" button is visible → click it → a file named `snapshot-<filename>.png` is downloaded → switch to Code mode → button disappears → trigger a forced export failure → inline error message appears.

- [X] T014 [P] [US2] Create `src/renderer/src/utils/snapshotExport.js` — `captureElement(element, scale = 2)`: calls `html2canvas(element, { scale, useCORS: false, logging: false, backgroundColor: null })`, returns a PNG `Blob` via `canvas.toBlob`; rejects with `'Failed to generate image blob'` when `toBlob` returns null; `downloadBlob(blob, filename)`: creates a temporary `<a>` with `URL.createObjectURL`, triggers `.click()`, revokes URL; both exported as named exports
- [X] T015 [P] [US2] Create `src/renderer/src/hooks/useSnapshotExport.js` — exports `useSnapshotExport(snapshotFrameRef, name)` returning `{ exportPng, exporting, error }`; `exportPng` is a `useCallback` that guards on `ref.current`, sets `exporting: true`, calls `captureElement`, calls `downloadBlob` with `buildFilename(name)`; `buildFilename`: returns `snapshot.png` when name is empty/whitespace, otherwise `snapshot-<trimmed name>.png`; catches errors into `error` state; always sets `exporting: false` in `finally`
- [X] T016 [US2] `src/renderer/src/components/CodePanelHeader/index.jsx` already renders Export PNG button and error in snapshot mode — no additional changes needed (implemented together with T007)
- [X] T017 [US2] Update `src/renderer/src/components/CodePanel/index.jsx` — instantiate `useSnapshotExport(snapshotFrameRef, documentName ?? '')` and pass `{ onExport: exportPng, exporting, error }` to `<CodePanelHeader>`; depends on T011 (ref must exist first)
- [X] T018 [P] [US2] Write `tests/renderer/snapshotExport.test.js` — `captureElement` calls `html2canvas` with `scale: 2` by default; passes custom scale; rejects when `toBlob` returns null; `downloadBlob` creates anchor, sets `download` attribute, triggers click, revokes URL
- [X] T019 [P] [US2] Write `tests/renderer/CodePanelHeader.test.jsx` — Code/Snapshot toggle buttons render; `aria-pressed` correct per mode; `onModeChange` called with correct id; Export PNG button absent in code mode; Export PNG button present in snapshot mode; button disabled when `exporting: true`; button shows "Exporting…" when exporting; inline error message shown when `error` is set; no error when `error` is null; `onExport` called on button click
- [X] T020 [P] [US2] Write `tests/renderer/useSnapshotExport.test.js` — `snapshot-server.js.png` for `server.js`; `snapshot.png` for empty name; `snapshot.png` for whitespace-only name; `exporting` true during capture, false after; `error` set on capture failure; `captureElement` not called when `ref.current` is null

**Checkpoint**: US2 fully functional. PNG export works end-to-end with correct filename, 2× density, and error feedback.

---

## Phase 5: User Story 3 — Syntax Highlighting in Snapshot (Priority: P3)

**Goal**: Code content inside the snapshot frame is tokenised with One Monokai CSS colors: keywords purple, strings green, numbers orange, comments grey italic, punctuation muted. Language is inferred from file extension for the title bar. Same token regex applied regardless of language.

**Independent Test**: Open a `.js` file in Snapshot mode → inspect DOM spans for `snap-token-keyword` (color `#c678dd`), `snap-token-string` (`#98c379`), `snap-token-number` (`#d19a66`), `snap-token-comment` (`#5c6370` italic), `snap-token-punctuation` (`#abb2bf`). Open a file with an unknown extension → no token spans but theme background/font still present.

- [X] T021 [P] [US3] Add `export const tokenizeSnapshotLine` to `src/renderer/src/utils/markdownTokenizer.js` — shares the same `CODE_TOKEN_RE` regex as `tokenizeCodeLine` but maps captures to `snap-token-string`, `snap-token-comment`, `snap-token-number`, `snap-token-keyword`, `snap-token-punctuation` class names; also export `escapeHtml` so `SnapshotPane` can escape content before tokenizing
- [X] T022 [P] [US3] One Monokai token color rules already added to `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` as part of T010 — no additional changes needed
- [X] T023 [P] [US3] `overflow-x: auto; white-space: pre; overflow-y: visible` already in code area in `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` as part of T010 — no additional changes needed
- [X] T024 [US3] `src/renderer/src/components/SnapshotPane/index.jsx` already calls `tokenizeSnapshotLine(escapeHtml(line))` per line and renders via `dangerouslySetInnerHTML` as part of T009 — no additional changes needed
- [X] T025 [P] [US3] Write `tests/renderer/languageFromExtension.test.js` — `.js`→`JavaScript`; `.ts`→`TypeScript`; `.jsx`→`JSX`; `.tsx`→`TSX`; `.py`→`Python`; `.md`→`Markdown`; `.html`→`HTML`; `.css`→`CSS`; `.json`→`JSON`; unknown extension returns `''`; no extension returns `''`; null returns `''`; empty string returns `''`; multiple dots handled correctly
- [X] T026 [P] [US3] Update `tests/renderer/markdownTokenizer.test.js` — add cases for `tokenizeSnapshotLine`: keyword → `snap-token-keyword` span; string → `snap-token-string` span; number → `snap-token-number` span; comment → `snap-token-comment` span; operator/punctuation → `snap-token-punctuation` span; no `token-code-*` classes produced; empty string → empty string

**Checkpoint**: All three user stories independently functional and tested. App is feature-complete once T011/T017 land.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage and final validation.

- [X] T027 [P] Write `tests/e2e/010-code-snapshot.e2e.js` — scenario 1: Snapshot toggle reveals `aria-label="Code snapshot"` chrome; scenario 2: Export PNG button visible in Snapshot mode; scenario 3: switching back to Code mode hides Export PNG button; scenario 4: opening a different file resets panel to Code mode (snapshot chrome gone)
- [X] T028 Run `npm run test:all` and confirm all tests pass (unit 387+, E2E green after T011/T017 land); run `npm run lint` and confirm zero warnings
- [ ] T029 Run the manual verification checklist from `specs/010-code-snapshot-export/quickstart.md` against the running dev build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — complete ✅
- **Phase 2 (Foundational)**: Depends on Phase 1 — complete ✅
- **Phase 3 (US1)**: T007–T010, T012–T013 complete ✅ — **T011 pending ❌**
- **Phase 4 (US2)**: T014–T016, T018–T020 complete ✅ — **T017 pending ❌** (depends on T011)
- **Phase 5 (US3)**: Complete ✅
- **Phase 6 (Polish)**: T027 complete ✅ — T028/T029 blocked on T011 + T017

### Remaining Work (2 tasks)

```
T011 — CodePanel/index.jsx: wire useSnapshotMode + CodePanelHeader + SnapshotPane
  ↓ (same file, sequential)
T017 — CodePanel/index.jsx: wire useSnapshotExport, pass to CodePanelHeader
  ↓
T028 — npm run test:all green
T029 — manual verification checklist
```

### Parallel Execution Reference (for remaining work)

```
T011 → T017 → T028 → T029
(sequential; all touch CodePanel/index.jsx or depend on it)
```

---

## Implementation Strategy

**MVP**: T011 + T017 together in one edit to `CodePanel/index.jsx` is the only remaining implementation work. All utilities, hooks, components, CSS, and tests are already in place.

**After T011/T017**: `npm run test:all` should be green end-to-end. The E2E suite (`tests/e2e/010-code-snapshot.e2e.js`) is already written and will pass once the CodePanel is wired.

---
