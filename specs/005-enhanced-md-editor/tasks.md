# Tasks: Enhanced Markdown Editor (Code Editor Experience)

**Input**: Design documents from `/specs/005-enhanced-md-editor/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US5)
- No Story label = Setup or Foundational phase task

---

## Phase 1: Setup

**Purpose**: Create the one new source file this feature introduces so subsequent tasks have a target path.

- [X] T001 Create stub `src/renderer/src/utils/markdownTokenizer.js` exporting an empty `tokenize` function

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The tokenizer utility and the component layout skeleton are prerequisites that ALL user story phases depend on. Neither the gutter (US1), the syntax highlight layer (US2), the active line (US3), nor the debounce wiring (US5) can be built until both are in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Implement `tokenize(text, activeLine)` in `src/renderer/src/utils/markdownTokenizer.js`: split text into lines, HTML-escape each line (`&`, `<`, `>`), classify headings (`/^(#{1,6}) /`), bold (`/\*\*(.+?)\*\*/g`), links (`/\[([^\]]+)\]\([^)]+\)/g`), fenced code blocks (stateful toggle on ` ``` ` lines), wrap each classified segment in `<span class="token-{type}">`, inject `<span class="token-active-line">` around the line at 1-based index `activeLine`, join with `\n`
- [X] T003 [P] Write `tests/renderer/markdownTokenizer.test.js`: test `# H1` → output contains `token-h1`; `## H2` → `token-h2`; `**bold**` → `token-bold`; `[label](url)` → `token-link`; code fence open/content/close → `token-code-fence`/`token-code-block`; active line 2 on 3-line input → line 2 contains `token-active-line`; input containing `<script>` → output has `&lt;script&gt;` (no raw `<`); empty string → returns `'\n'` without error
- [X] T004 Restructure `src/renderer/src/components/MarkdownEditor/index.jsx`: replace root `<textarea>` with a `<div className={styles.wrapper}>` containing a gutter `<div>` (empty for now) and an `editorContainer` `<div>` holding the `<textarea>`; add `const [activeLine, setActiveLine] = useState(1)` and `const [scrollTop, setScrollTop] = useState(0)` state declarations; keep all existing props interface unchanged (`value`, `onChange`, `placeholder`, `textareaRef`, `onScroll`)
- [X] T005 [P] Replace `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css` with full layout: `.wrapper` (`display:flex; flex-direction:row; height:100%; width:100%; overflow:hidden`); `.gutter` (`width:3rem; min-width:3rem; overflow:hidden; background:var(--color-bg-alt); text-align:right; padding-top:1.5rem; flex-shrink:0; user-select:none`); `.gutterInner` (`will-change:transform`); `.lineNumber` and `.activeLineNumber` (same `height`, `padding-right:0.75rem`, `font-size:0.8rem`, monospace font — `.activeLineNumber` uses `var(--color-text)`, `.lineNumber` uses `var(--color-text-muted)`); `.editorContainer` (`position:relative; flex:1; overflow:hidden`); `.highlight` (`position:absolute; top:0; left:0; right:0; bottom:0; margin:0; padding:1.5rem; white-space:pre-wrap; word-wrap:break-word; pointer-events:none; overflow:hidden; font-family/size/line-height identical to textarea`); `.textarea` (`position:relative; z-index:1; width:100%; height:100%; resize:none; background:transparent; color:transparent; caret-color:var(--color-text); border:none; outline:none; font:inherit; padding:1.5rem; box-sizing:border-box; tab-size:2`); token classes: `.token-h1` through `.token-h6` (distinct color + font-weight per level), `.token-bold` (distinct color), `.token-link` (distinct color), `.token-code-fence` and `.token-code-block` (distinct background/color), `.token-active-line` (`display:block; width:100%; background:var(--color-active-line, rgba(255,255,255,0.05))`)

**Checkpoint**: Tokenizer is tested and working. Component renders with new DOM structure (gutter placeholder + editorContainer + textarea). Existing `npm test` must still pass.

---

## Phase 3: User Story 1 — Edit Markdown with Line Numbers (Priority: P1) 🎯 MVP

**Goal**: A visible, synchronized line-number gutter appears to the left of the text area. Line numbers update instantly as content changes. The gutter scrolls in sync with the text.

**Independent Test**: Open any Markdown file → numbered gutter column is visible → scroll to bottom → all line numbers stay aligned with their text rows → type content that adds lines → line count updates immediately.

- [X] T006 [US1] Implement gutter rendering in `src/renderer/src/components/MarkdownEditor/index.jsx`: add `const lineCount = useMemo(() => value.split('\n').length, [value])`; populate the gutter with `Array.from({ length: lineCount }, (_, i) => <div key={i} className={i + 1 === activeLine ? styles.activeLineNumber : styles.lineNumber}>{i + 1}</div>)` inside a `<div className={styles.gutterInner} style={{ transform: \`translateY(-${scrollTop}px)\` }}>` inside the `.gutter` div; update `handleScroll` to call `setScrollTop(e.target.scrollTop)` before forwarding to the `onScroll` prop
- [X] T007 [P] [US1] Add gutter tests to `tests/renderer/MarkdownEditor.test.js`: gutter `aria-hidden` container div is present in DOM; rendering `value="line1\nline2\nline3"` produces exactly 3 line-number divs with text content `1`, `2`, `3`; rendering a single-line value produces exactly 1 line-number div

**Checkpoint**: User Story 1 is fully functional and independently testable. Line numbers appear, update, and track scroll.

---

## Phase 4: User Story 2 — Write with Real-Time Syntax Highlighting (Priority: P1)

**Goal**: As the writer types Markdown, headings, bold text, links, and code blocks are rendered in distinct colors in real time via the `<pre>` syntax backdrop.

**Independent Test**: Open a file containing `# H1`, `**bold**`, `[link](url)`, and ` ``` ` fences → each element shows a distinct color without any typing delay → type new `## H2` → heading color appears immediately.

- [X] T008 [US2] Add syntax backdrop to `src/renderer/src/components/MarkdownEditor/index.jsx`: import `tokenize` from `../../../utils/markdownTokenizer`; add `const highlightedHtml = useMemo(() => tokenize(value, activeLine), [value, activeLine])`; insert `<pre className={styles.highlight} aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />` as the first child of `.editorContainer` (before the textarea)
- [X] T009 [P] [US2] Add syntax backdrop test to `tests/renderer/MarkdownEditor.test.js`: a `<pre>` element with `aria-hidden="true"` is present in the DOM; rendering `value="# Title"` results in the pre's innerHTML containing the string `token-h1`

**Checkpoint**: User Story 2 is fully functional. All four Markdown element categories render with distinct colors.

---

## Phase 5: User Story 5 — Performance on Large Files (Priority: P1)

**Goal**: On 1000+ line documents, typing remains instant because the tokenizer runs against a 150 ms debounced copy of the value, not the live value.

**Independent Test**: Open a 1000-line Markdown file → type rapidly → no perceptible keystroke lag → syntax colors update ~150 ms after typing stops → line count and caret move instantly.

- [X] T010 [US5] Add debounce to tokenizer input in `src/renderer/src/components/MarkdownEditor/index.jsx`: import `useDebounce` from `../../hooks/useDebounce`; add `const debouncedValue = useDebounce(value, 150)`; change `highlightedHtml` memo dependency from `value` to `debouncedValue` — so the memo becomes `useMemo(() => tokenize(debouncedValue, activeLine), [debouncedValue, activeLine])`; keep `lineCount` depending on `value` (not debounced) so line count stays instant
- [X] T011 [P] [US5] Verify `will-change: transform` is present on `.gutterInner` in `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css` (added in T005); add inline comment `/* GPU-composited scroll sync */` adjacent to the declaration

**Checkpoint**: User Story 5 verified. Tokenizer runs on debounced input; gutter and active-line state remain instant.

---

## Phase 6: User Story 3 — Active Line Indicator (Priority: P2)

**Goal**: The line where the cursor sits is subtly highlighted. The highlight follows the cursor on every click, arrow key, or typing action.

**Independent Test**: Open any file → click on line 5 → line 5 has a distinct background highlight in both the pre layer and the gutter → press ↓ → highlight moves to line 6.

- [X] T012 [US3] Wire `updateActiveLine` in `src/renderer/src/components/MarkdownEditor/index.jsx`: add `function updateActiveLine(e) { const line = value.slice(0, e.target.selectionStart).split('\n').length; setActiveLine(line) }`; add `onSelect={updateActiveLine}`, `onKeyUp={updateActiveLine}`, `onClick={updateActiveLine}` to the `<textarea>` element (existing `onKeyDown` is unchanged)
- [X] T013 [P] [US3] Add active line tests to `tests/renderer/MarkdownEditor.test.js`: simulate `onSelect` event with `selectionStart` placing cursor on line 2 of a 3-line value → the second line-number div has `styles.activeLineNumber` class; simulate cursor on line 1 → first line-number div has active class and second does not

**Checkpoint**: User Story 3 independently testable. Active line highlight moves with cursor.

---

## Phase 7: User Story 4 — Auto-Indentation on Enter (Priority: P2)

**Goal**: Pressing Enter on an indented line starts the new line at the same indentation level, preserving leading whitespace automatically.

**Independent Test**: Type `  - item` (2-space indent), press Enter → new line starts with `  ` (same 2 spaces); type `no-indent`, press Enter → new line has no leading whitespace; Tab key behavior is unchanged.

- [X] T014 [US4] Add `Enter` branch to `handleKeyDown` in `src/renderer/src/components/MarkdownEditor/index.jsx`: at the top of `handleKeyDown` before the Tab block, add `if (e.key === 'Enter') { e.preventDefault(); const { selectionStart, selectionEnd, value: val } = e.target; const lineStart = val.lastIndexOf('\n', selectionStart - 1) + 1; const indent = val.slice(lineStart, selectionStart).match(/^(\s*)/)[1]; const next = val.slice(0, selectionStart) + '\n' + indent + val.slice(selectionEnd); onChange(next); requestAnimationFrame(() => { e.target.selectionStart = selectionStart + 1 + indent.length; e.target.selectionEnd = selectionStart + 1 + indent.length; }); return }`
- [X] T015 [P] [US4] Add auto-indent tests to `tests/renderer/MarkdownEditor.test.js`: `Enter` on value `'  indented'` with cursor at end → `onChange` called with `'  indented\n  '`; `Enter` on value `'plain'` with cursor at end → `onChange` called with `'plain\n'`; existing Tab tests must still pass

**Checkpoint**: User Story 4 independently testable. Auto-indent works on Enter; Tab behaviour unchanged.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Confirm no regressions, validate the component is a transparent drop-in replacement, and finalise the deliverable.

- [X] T016 Run `npm test` from repository root and confirm all pre-existing `MarkdownEditor.test.js` tests (Tab inserts spaces, onChange, aria-label, spellCheck) still pass — fix any DOM-query mismatches caused by the new wrapper structure in `tests/renderer/MarkdownEditor.test.js`
- [X] T017 [P] Verify `package.json` has no new entries in `dependencies` or `devDependencies` (quickstart.md acceptance gate: no new npm packages)
- [X] T018 [P] Confirm the `MarkdownEditor` props interface `{ value, onChange, placeholder, textareaRef, onScroll }` is unchanged by grepping usages in `src/renderer/src/` — no call site should need updating

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user story phases**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs editorContainer layout from T004, which is delivered with US1)
- **US5 (Phase 5)**: Depends on US2 (wraps the tokenizer call added in T008 with debounce)
- **US3 (Phase 6)**: Depends on US5 (needs `activeLine` state introduced in T004, advanced highlight wiring from T012)
- **US4 (Phase 7)**: Depends on Foundational only — `handleKeyDown` mod is independent of gutter/tokenizer
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (Phase 3) | Foundational | Adds gutter to layout skeleton from T004 |
| US2 (Phase 4) | Foundational + US1 layout | Adds `<pre>` to same editorContainer |
| US5 (Phase 5) | US2 | Wraps T008's tokenizer call with debounce |
| US3 (Phase 6) | Foundational | `activeLine` state from T004; highlight via tokenizer wired in US2 |
| US4 (Phase 7) | Foundational | `handleKeyDown` in same component; independent of tokenizer |

### Parallel Opportunities Within Each Phase

- **Foundational**: T003 (tests) runs in parallel with T002 (implementation) — different files; T005 (CSS) runs in parallel with T004 (component) — different files
- **US1**: T007 (tests) in parallel with T006 (implementation) — different files
- **US2**: T009 (tests) in parallel with T008 (implementation) — different files
- **US5**: T011 (CSS) in parallel with T010 (component) — different files
- **US3**: T013 (tests) in parallel with T012 (implementation) — different files
- **US4**: T015 (tests) in parallel with T014 (implementation) — different files
- **Polish**: T017 and T018 run in parallel with each other (read-only checks) — after T016

### Parallel Example: Foundational Phase

```
# Two developers or two agent tasks running simultaneously:
Task A: T002 — Implement tokenize() in src/renderer/src/utils/markdownTokenizer.js
Task B: T003 — Write tests/renderer/markdownTokenizer.test.js

# Simultaneously:
Task C: T004 — Restructure MarkdownEditor/index.jsx layout skeleton
Task D: T005 — Write full MarkdownEditor.module.css

# (T004 and T005 can start as soon as T001 is done, independently of T002/T003)
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — line numbers + highlighting)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational — T002, T003, T004, T005
3. Complete Phase 3: US1 — T006, T007
4. Complete Phase 4: US2 — T008, T009
5. **STOP and VALIDATE**: `npm test`, open a Markdown file, confirm gutter + colors visible
6. Ship/demo — writer already has a VS Code-like editor with line numbers and syntax colors

### Full Incremental Delivery

1. Setup + Foundational → Skeleton ready
2. + US1 → Line numbers ✓ (demo)
3. + US2 → Syntax highlighting ✓ (demo)
4. + US5 → Performance hardened ✓
5. + US3 → Active line ✓ (demo)
6. + US4 → Auto-indent ✓ (demo)
7. Polish → Clean, no regressions → Ship

---

## Summary

| Phase | Tasks | Story | Files Changed |
|-------|-------|-------|---------------|
| 1 Setup | T001 | — | `markdownTokenizer.js` (stub) |
| 2 Foundational | T002–T005 | — | `markdownTokenizer.js`, `markdownTokenizer.test.js`, `MarkdownEditor/index.jsx`, `MarkdownEditor.module.css` |
| 3 US1 Line Numbers | T006–T007 | US1 | `MarkdownEditor/index.jsx`, `MarkdownEditor.test.js` |
| 4 US2 Syntax Highlight | T008–T009 | US2 | `MarkdownEditor/index.jsx`, `MarkdownEditor.test.js` |
| 5 US5 Performance | T010–T011 | US5 | `MarkdownEditor/index.jsx`, `MarkdownEditor.module.css` |
| 6 US3 Active Line | T012–T013 | US3 | `MarkdownEditor/index.jsx`, `MarkdownEditor.test.js` |
| 7 US4 Auto-Indent | T014–T015 | US4 | `MarkdownEditor/index.jsx`, `MarkdownEditor.test.js` |
| 8 Polish | T016–T018 | — | verification only |

**Total**: 18 tasks across 8 phases
**New npm packages**: 0
**New IPC channels**: 0
**Files created**: 2 (`markdownTokenizer.js`, `markdownTokenizer.test.js`)
**Files modified**: 3 (`MarkdownEditor/index.jsx`, `MarkdownEditor.module.css`, `MarkdownEditor.test.js`)
