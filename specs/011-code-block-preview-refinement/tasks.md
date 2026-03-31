---
description: "Actionable task list for Code Editor & Snapshot UX Refinement (spec 011)"
design_decision: "Alternative A (theme-aware solid background) — finalized per design-decision.md"
baseline_behavior: "Initializes from session.savedContent on file load; resets after save/discard"
---

# Tasks: Code Editor & Snapshot UX Refinement (Background + Change Indicators)

**Input**: Design documents from `/specs/011-code-block-preview-refinement/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅
**Status**: Ready for implementation
**Branch**: `011-code-block-preview-refinement`

**Total Tasks**: 17 tasks across 3 user stories
**Task Breakdown**:
- Setup: 3 tasks (fix broken test files)
- User Story 1 (P1, Theme-Responsive Background): 2 verification tasks — already implemented
- User Story 2 (P2, Visual Separation): 2 verification tasks — already implemented
- User Story 4 (P2, Change Indicators): 7 implementation tasks — remaining work
- Polish: 3 tasks

---

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **TaskID**: Sequential identifier (T001, T002, etc.)
- **[P]**: Optional marker for parallelizable tasks (different files, no inter-dependencies)
- **[Story]**: User story label (US1, US2, US4) for story-specific tasks
- **Description**: Clear action with exact file path(s)

---

## Phase 1: Setup

**Purpose**: Fix broken test files from a prior agent that used Jest patterns instead of Vitest

- [X] T001 Fix broken test file `tests/unit/renderer/use-change-indicators.unit.test.js`: convert `jest.mock` → `vi.mock`, `jest.fn` → `vi.fn`, `jest.clearAllMocks` → `vi.clearAllMocks`; update import path to match actual hook location at `src/renderer/src/hooks/useChangeIndicators.js`
- [X] T002 [P] Fix broken test file `tests/unit/renderer/change-indicator.unit.test.js`: rewrite to test indicator rendering inline within MarkdownEditor gutter (no separate `ChangeIndicator.jsx` component file); convert any Jest patterns to Vitest (`vi.mock`, `vi.fn`)
- [X] T003 [P] Fix broken test file `tests/integration/renderer/markdown-editor-change-indicators.integration.test.js`: convert `jest.mock` → `vi.mock`, `jest.fn` → `vi.fn`; update mock for `useChangeIndicators` hook to use Vitest patterns

**Checkpoint**: All existing test files compile and test suite runs cleanly

---

## Phase 2: Foundational (Blocking Prerequisites)

No foundational tasks required. The project structure, CSS Modules, and theme variables are already in place. `diffUtils.js` (Myers diff algorithm) is already implemented with 12 passing unit tests.

**Checkpoint**: Proceed directly to User Story phases

---

## Phase 3: User Story 1 — Theme-Responsive Snapshot Background (Priority: P1) 🎯

**Goal**: Snapshot container and modal overlay backgrounds adapt to active theme instead of hard-coded `#1e2128`.

**Current Status**: ✅ Already implemented — SnapshotPane uses `transparent` + `box-shadow`, MarkdownViewer/PreviewPane use `var(--color-surface)`.

**Independent Test**: Open snapshot in both light/dark mode → background matches theme, no jarring color mismatch.

### Implementation for User Story 1

- [X] T004 [P] [US1] Verify no remaining hard-coded `#1e2128` background references by searching codebase: `grep -r "#1e2128" src/`; confirm SnapshotPane `.container` uses `transparent` in `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` and MarkdownViewer `.snapshotModal` uses `var(--color-surface)` in `src/renderer/src/components/MarkdownViewer/MarkdownViewer.module.css`
- [ ] T005 [US1] Manual verification: open snapshot in dark mode and light mode, switch themes, confirm background updates within 300ms with no flash of old color per quickstart.md Test 1

**Checkpoint**: US1 complete — theme-responsive backgrounds confirmed

---

## Phase 4: User Story 2 — Snapshot Card Visual Separation (Priority: P2)

**Goal**: Snapshot card edges clearly distinguishable from surrounding container in both themes via contrast/border/shadow.

**Current Status**: ✅ Already implemented — `box-shadow: 0 2px 24px rgba(0,0,0,0.25)` on `.windowChrome`.

**Independent Test**: View snapshot card in both themes → card edges visible; export PNG → only card content captured.

### Implementation for User Story 2

- [X] T006 [P] [US2] Verify `.windowChrome` has visible `box-shadow` or border in `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css`; visually confirm card edges in both light and dark mode
- [ ] T007 [US2] Test PNG export: export snapshot, verify captured image contains only card content without surrounding container background

**Checkpoint**: US2 complete — card visual separation confirmed, export unaffected

---

## Phase 5: User Story 4 — Text Change Indicators in Code Block Gutter (Priority: P2)

**Goal**: Display color-coded indicators in the MarkdownEditor gutter — green (added), orange (modified), red (deleted) — computed by comparing current code to a baseline using the existing Myers diff algorithm.

**Current Status**: `diffUtils.js` complete (12/12 tests passing). Hook, component integration, and CSS remain.

**Independent Test**:
1. Add new line → green indicator in gutter
2. Modify existing line → orange indicator in gutter
3. Delete line → red indicator at deletion position
4. Save → all indicators clear (baseline resets)
5. Hover indicator → tooltip shows change type
6. Indicators visible in both light/dark mode

### Implementation for User Story 4

- [X] T008 [US4] Create `src/renderer/src/hooks/useChangeIndicators.js` custom hook:
  - Hook signature: `useChangeIndicators(currentContent, savedContent)`
  - Store `baseline` in state, initialized from `savedContent` on first render
  - Update baseline when `savedContent` changes (save/discard resets baseline)
  - Compute `changeMap` via `computeLineDiff(baseline.split('\n'), currentContent.split('\n'))` using `useMemo`
  - Derive `isDirty` from `changeMap.size > 0`
  - Return `{ changeMap, isDirty }`
  - Follow dependency direction: hook → util (`diffUtils.js`)

- [X] T009 [P] [US4] Add indicator CSS classes to `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css`:
  - Add CSS variables on `.gutter`: `--color-indicator-added: #2da44e`, `--color-indicator-modified: #d29922`, `--color-indicator-deleted: #da3633`
  - Add `.changeIndicator` base class: `width: 3px; height: 100%; position: absolute; left: 0; top: 0;` (vertical bar style)
  - Add `.indicatorAdded { background: var(--color-indicator-added) }`, `.indicatorModified { background: var(--color-indicator-modified) }`, `.indicatorDeleted { background: var(--color-indicator-deleted) }`
  - Ensure `.lineNumber` has `position: relative` to anchor absolutely-positioned indicators
  - Ensure ≥3:1 contrast against `var(--color-bg-alt)` gutter background in both themes

- [X] T010 [US4] Pass `savedContent` prop from EditorPage to MarkdownEditor: in `src/renderer/src/pages/EditorPage.jsx`, add `savedContent={session.savedContent}` to `<MarkdownEditor>` JSX; in `src/renderer/src/components/MarkdownEditor/index.jsx`, destructure new `savedContent` prop

- [X] T011 [US4] Integrate `useChangeIndicators` hook into `src/renderer/src/components/MarkdownEditor/index.jsx`:
  - Import and call `useChangeIndicators(localValue, savedContent)` to get `{ changeMap }`
  - In the gutter render loop (`gutterLines` useMemo), for each line number check `changeMap.has(i + 1)`
  - If present, render a `<span>` with the appropriate indicator CSS class (`styles.changeIndicator` + variant) inside the `.lineNumber` div, positioned absolutely at left edge
  - Add `title` attribute with change type label (e.g., "Added line", "Modified line", "Deleted line") for tooltip on hover per US4 Scenario 6
  - Add `aria-label` with change type for accessibility
  - Indicators scroll in sync via existing `translateY(-${scrollTop}px)` transform on `.gutterInner`
  - Ensure existing line numbers and `.gutterActiveLine` highlight remain unaffected

- [X] T012 [P] [US4] Update `tests/unit/renderer/use-change-indicators.unit.test.js` to match actual hook implementation: verify hook returns empty changeMap when content matches savedContent, returns populated changeMap when content differs, and updates baseline when savedContent changes

- [X] T013 [P] [US4] Update `tests/unit/renderer/change-indicator.unit.test.js` to test indicator rendering within MarkdownEditor gutter: render MarkdownEditor with a mocked `useChangeIndicators` returning a populated changeMap, verify indicator `<span>` elements appear with correct CSS classes, title attributes, and aria-labels

- [X] T014 [US4] Update `tests/integration/renderer/markdown-editor-change-indicators.integration.test.js` to test full workflow: render MarkdownEditor with initial value and savedContent, simulate typing to change content, verify indicator elements appear; simulate savedContent update (save), verify indicators clear

**Checkpoint**: US4 complete — change indicators visible in gutter, theme-aware, scroll-synced, accessible, tooltips on hover, tested

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression testing and final validation

- [X] T015 [P] Run full test suite `npx vitest run` — all tests pass including new/fixed change indicator tests
- [ ] T016 [P] Verify snapshot PNG export still works correctly with indicators present (indicators should not appear in exported image since they are in the MarkdownEditor gutter, not in SnapshotPane)
- [ ] T017 Run quickstart.md manual verification: execute all 3 test scenarios (theme background, card separation, change indicators including hover tooltip)

**Checkpoint**: All features verified, no regressions, ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — fix broken test files first
- **US1 (Phase 3)**: Verification only — already implemented, can run after Setup
- **US2 (Phase 4)**: Verification only — already implemented, can run in parallel with US1
- **US4 (Phase 5)**: Depends on Setup completion (clean test files); independent of US1/US2
- **Polish (Phase 6)**: Depends on all previous phases

### User Story 4 Internal Dependencies

```
T008 (hook) ──────────────────────┐
T009 (CSS) ─── parallel ──────────┤
T010 (prop threading) ────────────┼──► T011 (integration into MarkdownEditor)
                                  │
T012 (hook tests) ── parallel ────┤
T013 (component tests) ── parallel┤
                                  └──► T014 (integration test, depends on T011)
```

### Parallel Opportunities

**Within Setup**: T001 sequential (hook test depends on hook), T002 and T003 parallel (different files)

**Within US4**:
- T008 (hook), T009 (CSS), T010 (prop threading) can all run in parallel — different files
- T011 depends on T008 + T009 + T010 — integrates all three
- T012, T013 can run in parallel after T011 — different test files
- T014 depends on T011 — needs working integration to test

**Across Stories**: US1 verification (T004-T005) and US2 verification (T006-T007) can run fully in parallel with US4

---

## Implementation Strategy

### MVP First (US1 + US2 Verification)

1. Fix broken test files (T001-T003)
2. Verify US1 + US2 are complete (T004-T007) — parallel
3. **VALIDATE**: Theme backgrounds and card separation confirmed

### Core Feature (US4 Change Indicators)

4. Create hook + CSS + prop threading in parallel (T008, T009, T010)
5. Integrate into MarkdownEditor (T011)
6. Fix/update tests (T012, T013, T014)
7. **VALIDATE**: Change indicators working end-to-end

### Final

8. Full regression + manual verification (T015, T016, T017)
