# Tasks: Copy Actions & Save Shortcut

**Input**: Design documents from `/specs/008-copy-save-shortcuts/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Foundational (Shared Infrastructure)

**Purpose**: Create the shared building blocks required by US2 and US3 (clipboard writes and toast notifications). US1 has no foundational dependency and may be started in parallel with this phase.

**⚠️ US2 and US3 cannot start until this phase is complete.**

- [X] T001 Create clipboard utility module `src/renderer/src/utils/clipboardUtils.js` — export `copyToClipboard(text)` (wraps `navigator.clipboard.writeText`, throws with a human-readable message on `NotAllowedError`) and `stripMarkdown(text)` (comprehensive regex chain: remove heading markers, fenced code blocks, bold/italic/underline tokens, links → label only, images removed entirely, blockquotes, horizontal rules, inline code backticks, unordered/ordered list markers; collapse extra blank lines)
- [X] T002 [P] Create toast state hook `src/renderer/src/hooks/useToast.js` — export `useToast()` returning `{ toast, showToast, dismissToast }` where `showToast({ message, type })` sets the active toast and auto-dismisses it after 2500 ms via a `setTimeout` ref
- [X] T003 [P] Create toast component `src/renderer/src/components/Toast/index.jsx` — renders a fixed-position notification div (bottom-right) showing `toast.message` when `toast` is truthy; accepts `toast` and `onDismiss` props; includes `aria-live="polite"` for accessibility
- [X] T004 [P] Create toast styles `src/renderer/src/components/Toast/Toast.module.css` — fixed position bottom-right, min-width 220 px, distinct background colours for `type: 'success'` (neutral/accent), `type: 'error'` (red/destructive), `type: 'info'` (neutral); subtle slide-in animation

**Checkpoint**: Clipboard utility and Toast component ready — US2/US3 implementation can begin

---

## Phase 2: User Story 1 — Save Document with Keyboard Shortcut (Priority: P1) 🎯 MVP

**Goal**: Ctrl+S saves a document opened from disk immediately, without dialog; a visible dirty-state dot appears in the title while there are unsaved changes and disappears after a successful save.

**Independent Test**: Open any imported document, edit it (dot appears), press Ctrl+S (dot disappears), close and reopen — changes must persist. Press Ctrl+S on a new draft — nothing happens.

- [X] T005 [P] [US1] Add Ctrl+S shortcut and dirty-state indicator to `src/renderer/src/pages/EditorPage.jsx` — (1) inside the existing `useEffect` that handles keyboard events (or create one), add `e.ctrlKey && e.key === 's'` branch: call `handleSave()` only when `!session.isDraft && session.filePath`; call `e.preventDefault()` to suppress browser/OS save dialogs; (2) in the document title render, conditionally prepend a `<span className={styles.dirtyDot}>•</span>` element when `isDirty` is true; add `.dirtyDot` CSS class to `src/renderer/src/pages/EditorPage.module.css` (colour: `var(--color-accent)` or similar muted colour; margin-right 4 px)
- [X] T006 [P] [US1] Add Ctrl+S shortcut and dirty-state indicator to `src/renderer/src/pages/SplitViewPage.jsx` — (1) extend the existing `handleKeyDown` `useEffect` (currently handles `Ctrl+\`) by adding an `else if (e.ctrlKey && e.key === 's')` branch: `e.preventDefault()`, call `handleSave()` when `!session.isDraft && session.filePath`; (2) in the page header, conditionally render a dirty-state dot identical to EditorPage; add `.dirtyDot` to `src/renderer/src/pages/SplitViewPage.module.css`

**Checkpoint**: User Story 1 fully functional. Ctrl+S saves, dirty indicator tracks unsaved state. Can be demonstrated independently.

---

## Phase 3: User Story 2 — Copy Document Content as Markdown (Priority: P2)

**Goal**: A clearly visible "Copy as MD" button in the editor interface copies the raw Markdown source to the clipboard and shows a toast. Empty documents show an informative notice instead.

**Independent Test**: Open a document with `**bold**` and `# heading`, click "Copy as MD", paste into a text field — raw Markdown syntax is present and byte-for-byte identical to the file contents.

- [X] T007 [US2] Integrate `useToast` and `<Toast>` into `src/renderer/src/pages/EditorPage.jsx` and add "Copy as MD" button — (1) `import { useToast } from '../hooks/useToast.js'`; `import Toast from '../components/Toast/index.jsx'`; `import { copyToClipboard } from '../utils/clipboardUtils.js'`; (2) call `const { toast, showToast } = useToast()` inside the component; (3) implement `async function handleCopyAsMarkdown()`: if `session.content.trim() === ''`, call `showToast({ message: 'Document is empty', type: 'info' })`; else call `await copyToClipboard(session.content)` inside try/catch — on success `showToast({ message: 'Copied as Markdown', type: 'success' })`, on error `showToast({ message: \`Could not copy: \${err.message}\`, type: 'error' })`; (4) add a "Copy as MD" button element in the editor header/toolbar wired to `handleCopyAsMarkdown`; (5) render `<Toast toast={toast} onDismiss={dismissToast} />` at the bottom of the component return
- [X] T008 [P] [US2] Integrate `useToast` and `<Toast>` into `src/renderer/src/pages/SplitViewPage.jsx` and add "Copy as MD" button — same integration pattern as T007 applied to SplitViewPage: import hooks/utilities, implement `handleCopyAsMarkdown`, add button to page header/toolbar, render `<Toast>`

**Checkpoint**: User Story 2 fully functional. "Copy as MD" button visible, copies correctly, shows toast on all outcomes. Works independently of US3.

---

## Phase 4: User Story 3 — Copy Document Content as Plain Text (Priority: P3)

**Goal**: A "Copy as Text" button copies the document with all Markdown syntax stripped, leaving only readable natural language. Links appear as label text only. Empty documents show the same informative notice as Copy as MD.

**Independent Test**: Create a document with `# Heading`, `**bold**`, `_italic_`, `[label](http://example.com)`, click "Copy as Text", paste into a text field — none of `#`, `*`, `_`, `[`, `]`, `(`, `)` characters appear; "label" text is present; "http://example.com" is absent.

- [X] T009 [US3] Add "Copy as Plain Text" button to `src/renderer/src/pages/EditorPage.jsx` — (1) `import { stripMarkdown } from '../utils/clipboardUtils.js'` (already imported in T007); (2) implement `async function handleCopyAsPlainText()`: if `session.content.trim() === ''`, `showToast({ message: 'Document is empty', type: 'info' })`; else `const plain = stripMarkdown(session.content)` then `await copyToClipboard(plain)` inside try/catch — on success `showToast({ message: 'Copied as Plain Text', type: 'success' })`, on error `showToast({ message: \`Could not copy: \${err.message}\`, type: 'error' })`; (3) add "Copy as Text" button in the editor header/toolbar aligned with the "Copy as MD" button from T007
- [X] T010 [P] [US3] Add "Copy as Plain Text" button to `src/renderer/src/pages/SplitViewPage.jsx` — same pattern as T009: import `stripMarkdown`, implement `handleCopyAsPlainText`, add "Copy as Text" button next to the "Copy as MD" button added in T008

**Checkpoint**: All three user stories fully functional and independently testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency, edge-case review, and final cleanup.

- [X] T011 Review and polish button and indicator styles across `src/renderer/src/pages/EditorPage.module.css` and `src/renderer/src/pages/SplitViewPage.module.css` — ensure "Copy as MD" and "Copy as Text" buttons use consistent sizing, spacing, and colour tokens; ensure dirty dot size/colour is visually consistent between EditorPage and SplitViewPage; verify Toast animation renders correctly in both Electron and web modes (run `npm run dev` and `npm run dev:web` or equivalent)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately (T001–T004)
- **US1 (Phase 2)**: No foundational dependency — T005 and T006 can begin in parallel with Phase 1
- **US2 (Phase 3)**: Requires ALL of Phase 1 complete (needs `copyToClipboard`, `useToast`, `Toast`)
- **US3 (Phase 4)**: Requires T007 (EditorPage) complete before T009; T008 (SplitViewPage) complete before T010; also needs `stripMarkdown` from T001
- **Polish (Phase 5)**: Requires all desired user story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on US2 or US3
- **US2 (P2)**: Depends on Phase 1 (Foundational). Independent of US1 and US3.
- **US3 (P3)**: Depends on Phase 1 (Foundational) and on T007/T008 (Toast already integrated in EditorPage/SplitViewPage). Independent of US1.

### Parallel Opportunities

- T002, T003, T004 are parallel with each other and with T001 (all different files)
- T005 and T006 are parallel with each other (EditorPage vs SplitViewPage) and can run concurrently with Phase 1
- T007 and T008 are parallel with each other (different files)
- T009 and T010 are parallel with each other (different files)

---

## Parallel Execution Example: Full Feature (2 developers)

```text
Developer A                          Developer B
─────────────────────────────────    ─────────────────────────────────
T001 clipboardUtils.js               T002 useToast.js
     │                               T003 Toast/index.jsx
     │                               T004 Toast.module.css
T005 EditorPage US1 (parallel →)     T006 SplitViewPage US1
T007 EditorPage US2                  T008 SplitViewPage US2
T009 EditorPage US3                  T010 SplitViewPage US3
T011 Polish (both review together)
```

---

## Implementation Strategy

1. **Start with US1 (MVP)** — delivers immediate value (Ctrl+S save). T005 + T006 have no foundational dependencies; just modify two existing page files. Can be shipped alone.
2. **Foundational in parallel with US1** — while US1 is being worked on, build the Toast/clipboard infrastructure.
3. **Then US2** — adds Copy as Markdown. Delivers clipboard sharing for raw Markdown users.
4. **Then US3** — adds Copy as Plain Text. Rounds out the copy feature set with the `stripMarkdown` function.

**Suggested MVP scope**: Phase 2 (US1 only) — deliver Ctrl+S and the dirty indicator as the first shippable increment.

---

## Task Summary

| Phase | Tasks | Files Changed | Parallelizable |
|---|---|---|---|
| Foundational | T001–T004 | 4 new files | T002, T003, T004 parallel |
| US1 (P1) | T005–T006 | 2 pages + 2 CSS | T005 ‖ T006 |
| US2 (P2) | T007–T008 | 2 pages (modified) | T007 ‖ T008 |
| US3 (P3) | T009–T010 | 2 pages (modified) | T009 ‖ T010 |
| Polish | T011 | 2 CSS files | — |
| **Total** | **11 tasks** | **4 new + 6 modified** | |
