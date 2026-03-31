# Research: Code Editor & Snapshot UX Refinement

**Feature**: 011-code-block-preview-refinement
**Date**: 2026-03-28

---

## R-001: Diff Algorithm for Line-Level Change Detection

**Decision**: Myers diff algorithm (graph-search based, k-diagonal representation)

**Rationale**: Myers produces minimal edit scripts with only insert/delete/equal operations. Consecutive delete+insert pairs are merged into 'modified' when `isRelatedContent()` confirms the lines share content (substring containment or significant length difference with ratio ≤0.8). This cleanly distinguishes true modifications (`line2` → `modified2`) from unrelated substitutions (`line4` → `line5`).

**Alternatives considered**:
- LCS-based diff with isSimilar heuristic — failed to reliably distinguish modified from added lines across all edge cases
- Levenshtein edit-distance matrix — treats all substitutions uniformly; cannot differentiate related vs unrelated replacements
- External diff libraries (diff, jsdiff) — rejected per zero-dependency constraint

**Status**: ✅ Implemented in `src/renderer/src/utils/diffUtils.js` — 12/12 unit tests passing

---

## R-002: Theme-Aware Background Strategy

**Decision**: Replace hard-coded `#1e2128` with CSS variable `var(--color-surface)` for containers and `transparent` where the parent theme background should show through

**Rationale**: The project already has a global theme system with `--color-bg`, `--color-surface`, and `--color-border` variables that toggle between light and dark values. Using these variables ensures automatic theme adaptation with zero JavaScript logic.

**Alternatives considered**:
- Transparent background (Alternative B) — explored but creates insufficient visual separation without additional borders
- Gradient/vignette (Alternative C) — adds design system complexity without value

**Status**: ✅ Implemented — SnapshotPane uses `transparent` + `box-shadow`, MarkdownViewer/PreviewPane use `var(--color-surface)`

---

## R-003: Change Indicator Rendering Strategy

**Decision**: Render indicators as small colored marks (CSS pseudo-elements or spans) within the existing MarkdownEditor gutter, positioned absolutely per line

**Rationale**: The MarkdownEditor already has a gutter (`.gutter` class, 3rem wide) with line numbers rendered as divs. Change indicators can be added as additional elements within each line number div, or as overlay elements positioned using the same `lineHeightPx` calculation. This avoids restructuring the gutter and keeps indicators scroll-synced via the existing `translateY(-${scrollTop}px)` transform.

**Alternatives considered**:
- Separate indicator column outside gutter — adds layout complexity, breaks existing flex layout
- Colored line number text instead of dots — conflicts with active-line highlighting, less visually distinct
- Background color strips on entire gutter row — visually heavy, conflicts with active-line highlight

---

## R-004: Baseline State Management

**Decision**: Store baseline in `useChangeIndicators` hook state, initialized from `session.savedContent` and reset on save/discard

**Rationale**: The `useEditor` hook already tracks `session.content` (current) and `session.savedContent` (last saved). The change indicator hook can receive `savedContent` as the baseline source and `content` as the current source, computing diffs reactively. The hook resets its internal changeMap when baseline changes (save/discard).

**Alternatives considered**:
- Store baseline in useEditor — adds responsibility to an already complex hook
- Store baseline in component state — violates hooks pattern; less reusable
- Use ref instead of state for baseline — prevents reactive re-computation on save/discard

---

## R-005: Indicator Color Values

**Decision**: Use CSS custom properties for indicator colors with fixed values that pass WCAG contrast requirements in both themes

**Rationale**: Fixed color values (`#2da44e` green, `#d29922` orange, `#da3633` red) provide ≥3:1 contrast against both light (`--color-bg-alt`) and dark gutter backgrounds. Using CSS variables allows future theme-specific overrides without code changes.

**Alternatives considered**:
- Theme-specific color maps in JavaScript — adds runtime complexity for minimal benefit
- Opacity-based indicators — insufficient contrast in light mode

---

## R-006: Broken Test Files Recovery

**Decision**: Fix 3 existing test files that use Jest patterns instead of Vitest

**Rationale**: Three test files were created by an earlier agent using `jest.mock` instead of Vitest's `vi.mock`, and import nonexistent components. These files cause test suite failures at the file level even though the 399 actual test cases all pass. Fixing them is prerequisite to adding new change indicator tests.

**Files to fix**:
- `tests/unit/renderer/use-change-indicators.unit.test.js` — convert `jest.mock` → `vi.mock`
- `tests/unit/renderer/change-indicator.unit.test.js` — update imports to match actual component structure
- `tests/integration/renderer/markdown-editor-change-indicators.integration.test.js` — convert to vitest patterns

**Alternatives considered**:
- Delete and rewrite from scratch — preserves useful test case descriptions that can guide implementation
- Ignore broken files — leaves test suite in unclean state
