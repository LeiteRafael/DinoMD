# Implementation Plan: Code Editor & Snapshot UX Refinement (Background + Change Indicators)

**Branch**: `011-code-block-preview-refinement` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-code-block-preview-refinement/spec.md`

## Summary

Two-part UX refinement for DinoMD's code editor: (1) replace hard-coded `#1e2128` background in SnapshotPane and MarkdownViewer with theme-aware CSS variables so snapshot containers adapt to light/dark mode, and (2) add a color-coded change indicator gutter to the MarkdownEditor showing added (green), modified (orange), and deleted (red) lines computed via a Myers diff algorithm comparing current code to a baseline. Theme-responsive backgrounds (US1, US2) and the diff algorithm (`diffUtils.js`) are already implemented. Remaining work: `useChangeIndicators` hook, inline indicator rendering in MarkdownEditor gutter, CSS indicator classes, `savedContent` prop threading from EditorPage, and test file fixes.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX
**Primary Dependencies**:
- `react`, `react-dom` 18.3 — component rendering (existing)
- CSS Modules — scoped styling for all components (existing project convention)
- `markdownTokenizer.js` — existing tokenizer for syntax highlighting
- Zero new npm dependencies required

**Storage**: N/A — all state is transient React state in the renderer; baseline stored in hook state
**Testing**: Vitest 3.x (unit + integration, jsdom environment), Playwright (E2E against web-mode build)
**Target Platform**: Electron desktop (Chromium renderer); web build must not break
**Project Type**: Desktop app (Electron + Vite + React)
**Performance Goals**: Diff computation ≤50ms for 500-line blocks; indicator rendering at 60fps scroll; theme switch <300ms
**Constraints**: Zero new npm dependencies; no inline comments (`eslint-rules/no-comments.js`); dependency direction: pages → components → hooks → services → utils
**Scale/Scope**: 1 new file, 3 modified files, 3 test files to fix; feature is entirely renderer-side (no IPC changes)

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates derived from conventions established in specs 001–010 and project skills (javascript-development-standards, jest-testing-standards).*

| Gate | Status | Notes |
|------|--------|-------|
| Architecture gates | ✅ PASS | New hook follows existing `hooks/` pattern; indicators rendered inline within MarkdownEditor gutter (no new component files) |
| Dependency gates | ✅ PASS | Zero new npm dependencies; Myers diff algorithm implemented inline in `diffUtils.js` |
| Scope gates | ✅ PASS | Changes limited to MarkdownEditor component + CSS, EditorPage (prop threading), and a new hook; SnapshotPane/MarkdownViewer CSS already done |
| Test gates | ✅ PASS | diffUtils has 12 passing unit tests; hook and component tests to be created/fixed |
| IPC gates | ✅ PASS | Zero new IPC channels; feature is entirely renderer-side |
| Comment gates | ✅ PASS | No inline comments; code communicates intent through naming and structure |
| Dependency direction | ✅ PASS | EditorPage (page) → MarkdownEditor (component) → useChangeIndicators (hook) → diffUtils (util) |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-code-block-preview-refinement/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entities, state flow
├── quickstart.md        ← manual verification guide
├── tasks.md             ← implementation tasks
├── design-decision.md   ← Alternative A rationale
└── checklists/          ← quality checklists
```

### Source Code — files created / modified

```text
# ── Existing (already implemented) ────────────────────────────────────────────
src/renderer/src/utils/diffUtils.js                            ← DONE: Myers diff algorithm (computeLineDiff)
src/renderer/src/components/SnapshotPane/SnapshotPane.module.css  ← DONE: transparent background, box-shadow
src/renderer/src/components/MarkdownViewer/MarkdownViewer.module.css ← DONE: var(--color-surface) background
src/renderer/src/components/PreviewPane/PreviewPane.module.css    ← DONE: var(--color-surface) background

# ── New hook ──────────────────────────────────────────────────────────────────
src/renderer/src/hooks/useChangeIndicators.js                  ← NEW: baseline state, diff computation, reset/save

# ── Modified components ───────────────────────────────────────────────────────
src/renderer/src/pages/EditorPage.jsx                          ← MODIFIED: pass savedContent prop to MarkdownEditor
src/renderer/src/components/MarkdownEditor/index.jsx           ← MODIFIED: integrate hook + render indicators in gutter
src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css ← MODIFIED: indicator CSS classes + color variables

# ── Tests to fix/create ───────────────────────────────────────────────────────
tests/unit/renderer/use-change-indicators.unit.test.js             ← FIX: convert jest.mock → vi.mock (vitest)
tests/unit/renderer/change-indicator.unit.test.js                  ← FIX: update imports for actual inline rendering
tests/integration/renderer/markdown-editor-change-indicators.integration.test.js ← FIX: convert to vitest patterns
```

**Structure Decision**: Single-project Electron app. New files follow existing conventions — hooks in `src/renderer/src/hooks/`, component modifications in existing MarkdownEditor directory. No new component directories needed; indicators render inline within the MarkdownEditor gutter as `<span>` elements inside each `.lineNumber` div.

---

## Complexity Tracking

No constitution violations to justify. All changes follow established patterns.
