# Tasks: Editor UI & Syntax Highlighting Refinements

**Input**: Design documents from `/specs/006-editor-ui-refinements/`  
**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [quickstart.md](./quickstart.md)

---

## Phase 1: Setup

**Purpose**: Verify the working environment before any changes

- [X] T001 Confirm `npm test` and `npm run lint` pass on the current branch before any edits

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: CSS custom property palette shared by US1 (token colors) and US2 (layout tokens). Must exist before any token or gutter CSS references it.

**⚠️ CRITICAL**: Phases 3, 4, and 5 all consume these variables.

- [X] T002 Add `--syn-kw`, `--syn-str`, `--syn-num`, `--syn-comment`, `--syn-op`, `--syn-code-base` CSS custom properties under `:root` (light, GitHub Light values) and `@media (prefers-color-scheme: dark)` (dark, VS Code Default Dark+ values) in `src/renderer/src/styles/global.css`
- [X] T003 Add `--editor-font-size: 0.95rem` and `--editor-line-height: 1.6` CSS custom properties to the `.wrapper` rule (or `:root`) in `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css`

**Checkpoint**: `npm test` passes; open the app — colors not yet applied but variables are defined.

---

## Phase 3: User Story 1 — Readable Code in the Editor (Priority: P1) 🎯 MVP

**Goal**: Code tokens inside fenced blocks in the editor get distinct, vibrant colors driven by the new palette. Structural Markdown elements (headings, bold, link) remain distinct from code text.

**Independent Test**: Open a `.md` file with a fenced `js` block in the editor. Keywords, strings, numbers, comments, and operators must each render in visually distinct colors. Switch OS theme — colors update immediately.

### Implementation for User Story 1

- [X] T004 [P] [US1] Add `:global(.token-code-comment)`, `:global(.token-code-str)`, `:global(.token-code-num)`, `:global(.token-code-kw)`, `:global(.token-code-op)` CSS rules using `var(--syn-*)` variables in `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css`
- [X] T005 [P] [US1] Add `tokenizeCodeLine(escapedLine)` function to `src/renderer/src/utils/markdownTokenizer.js` — priority-ordered single-pass regex replacer: comments first, then strings, numbers, keywords, operators
- [X] T006 [US1] Wire `tokenizeCodeLine` into the `isInCodeBlock` branch of `classifyLine` in `src/renderer/src/utils/markdownTokenizer.js` (replace flat `code-block` content with sub-tokenized content)
- [X] T007 [US1] Update `.token-code-block` and `.token-code-fence` CSS rules to use `var(--syn-code-base)` instead of hardcoded `#98c379` in `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css`
- [X] T008 [US1] Extend `tests/renderer/markdownTokenizer.test.js` with `tokenizeCodeLine` unit cases: comment detection, string detection, number detection, keyword detection, operator detection, keyword-inside-string not double-tokenized, empty line no error

**Checkpoint**: Editor renders `// comment` in green, `"string"` in orange, `const` in blue. `npm test` passes.

---

## Phase 4: User Story 2 — Correct Gutter Alignment While Scrolling (Priority: P2)

**Goal**: Line numbers in the gutter stay vertically aligned with their text rows at all scroll positions, OS zoom levels, and font sizes. No drift after rapid scrolling.

**Independent Test**: Open a 100+ line document, scroll top-to-bottom at full speed, stop — no line number is offset from its text row. Resize the editor window; alignment holds.

### Implementation for User Story 2

- [X] T009 [US2] Remove `height: 1.52rem` from `.lineNumber` in `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css`; update font-size and line-height on `.lineNumber` to consume `var(--editor-font-size)` and `var(--editor-line-height)` (set in T003); add `display: block; white-space: pre;`
- [X] T010 [US2] Add a hidden zero-width space (`\u200B`) inside each gutter line `<div>` in `src/renderer/src/components/MarkdownEditor/index.jsx` so each row establishes a line box from font metrics (prevents empty-div height collapse)
- [X] T011 [US2] Remove the `LINE_HEIGHT_REM` JS constant from `src/renderer/src/components/MarkdownEditor/index.jsx`; replace `activeLineTop` calculation with a `useEffect` + `useState` that reads actual line height from a DOM sizer element (`getBoundingClientRect().height`)
- [X] T012 [US2] Add a single `ResizeObserver` in `src/renderer/src/components/MarkdownEditor/index.jsx` that observes the sizer element and sets a `--lh-px` CSS custom property on the wrapper whenever the line height changes (handles post-mount web-font-load FOUT)
- [X] T013 [US2] Update `tests/renderer/MarkdownEditor.test.js`: assert no inline `height` style on gutter line divs; assert gutter line count equals document line count; add a snapshot for gutter structure

**Checkpoint**: Scroll through 200 lines — zero visible drift. `npm test` passes.

---

## Phase 5: User Story 3 — Correct Inline Code Rendering in Preview (Priority: P3)

**Goal**: Inline backtick code spans in the preview panel flow inside surrounding prose text with a tight background highlight, no full-width block rendering.

**Independent Test**: Render `"Use the \`--verbose\` flag"` in the preview — the span stays on the same line as surrounding text; background covers only the text width.

### Implementation for User Story 3

- [X] T014 [P] [US3] Add inline/block guard to `CodeBlock` in `src/renderer/src/components/MarkdownViewer/index.jsx`: `const isBlock = String(children).endsWith('\n')` — if `!isBlock`, return `<code className={className}>{children}</code>`; otherwise proceed with existing shiki path (strip trailing `\n` before passing to `codeToHtml`)
- [X] T015 [US3] Extend `tests/renderer/MarkdownViewer.test.js` with three cases: inline code renders as `<code>` (not a `<div>`); fenced code block with language invokes shiki path; fenced code block with no language tag treated as block (not inline)

**Checkpoint**: Preview renders inline code as a flowing span. `npm test` passes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, cleanup, and manual verification

- [X] T016 [P] Verify all existing tests still pass: `npm test` (no regressions across markdownTokenizer, MarkdownEditor, MarkdownViewer, EditorPage, SplitViewPage, and all other test files)
- [X] T017 [P] Run `npm run lint && npm run format:check` — fix any formatting or lint warnings introduced by the changes
- [X] T018 Run manual verification against `specs/006-editor-ui-refinements/quickstart.md` — all three fix scenarios (inline code, gutter, syntax highlighting) pass in both light and dark OS themes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 (consumes `--syn-*` variables)
- **Phase 4 (US2)**: Depends on Phase 2 (consumes `--editor-*` variables); independent of Phase 3
- **Phase 5 (US3)**: Depends on Phase 2; independent of Phases 3 and 4
- **Phase 6 (Polish)**: Depends on all story phases desired

### User Story Dependencies

- **US1 (P1)**: Requires T002 (palette variables); independent of US2 and US3
- **US2 (P2)**: Requires T003 (editor layout variables); independent of US1 and US3
- **US3 (P3)**: Requires T002 (inline code contrast uses `--syn-*`); independent of US1 and US2

### Within US1

- T004 and T005 are parallel (different files: CSS vs JS)
- T006 depends on T005 (wires the function written in T005)
- T007 depends on T004 (updates rules created in T004)
- T008 depends on T005 + T006 (tests the complete tokenizer)

### Within US2

- T009 and T010 can proceed in parallel (CSS vs JSX)
- T011 depends on T010 (reads the sizer element added in T010)
- T012 depends on T011 (observes the sizer added in T011)
- T013 depends on T009–T012 (tests the fully wired gutter)

### Within US3

- T014 and T015 can overlap; T015 should verify the guard written in T014

---

## Parallel Execution Examples

### Phase 3 (US1) — two-agent split

```
Agent A: T004 — CSS token rules in MarkdownEditor.module.css
Agent B: T005 — tokenizeCodeLine() in markdownTokenizer.js
→ Both complete → Agent A: T007 | Agent B: T006 → merge → T008
```

### Phase 4 + Phase 5 — full parallelism after foundational

```
Agent A: T009 (CSS) → T010 (JSX sizer) → T011 → T012 → T013
Agent B: T014 (MarkdownViewer guard) → T015 (tests)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 (T001–T003)
2. Complete Phase 3 (T004–T008)
3. **STOP and VALIDATE**: open editor with fenced code block — four token types visually distinct in both themes
4. Ship or demo with just syntax highlighting

### Incremental Delivery

1. Phase 1 + 2 → Palette ready
2. Phase 3 → Syntax highlighting live → validate → demo
3. Phase 4 → Gutter drift fixed → validate → demo
4. Phase 5 → Inline code preview correct → validate → demo
5. Phase 6 → Full suite green

---

## Task Count Summary

| Phase | Tasks | User Story |
|---|---|---|
| Phase 1: Setup | 1 | — |
| Phase 2: Foundational | 2 | — |
| Phase 3: US1 Syntax Highlighting | 5 | US1 (P1) |
| Phase 4: US2 Gutter Alignment | 5 | US2 (P2) |
| Phase 5: US3 Inline Code Preview | 2 | US3 (P3) |
| Phase 6: Polish | 3 | — |
| **Total** | **18** | |

**Parallel opportunities**: T004∥T005 (US1), T009∥T010 (US2), T014 (US3) ∥ any Phase 4 task, T016∥T017 (Polish)
