# Implementation Plan: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-code-snapshot-export/spec.md`

## Summary

Add a Code/Snapshot toggle to the split-view code panel header. In Snapshot mode, the panel replaces the plain `EditorPane` with a macOS-style window chrome (`SnapshotPane`) themed with One Monokai colors and syntax-tokenized code. An "Export PNG" button (visible only in Snapshot mode) captures the styled frame at 2× pixel density via `html2canvas` and triggers a file download named `snapshot-<filename>.png`. Mode resets to Code on every file switch. All logic is pure renderer-side — no IPC changes.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX  
**Primary Dependencies**:
- `html2canvas` 1.4 — DOM-to-canvas capture at configurable scale (already in `dependencies`)
- `react`, `react-dom` 18.3 — component rendering (existing)
- CSS Modules — scoped styling for all new components (existing project convention)
- `markdownTokenizer.js` — existing tokenizer extended with `tokenizeSnapshotLine` exporting `snap-token-*` class names

**Storage**: N/A — no persistence; all state is transient React state in the renderer  
**Testing**: Vitest 3.x (unit + hook tests, jsdom), Playwright (E2E against web-mode build on port 5174)  
**Target Platform**: Electron desktop (Chromium renderer). Web build must not break but PNG export is out-of-scope for web in v1.  
**Project Type**: Desktop app (Electron + Vite + React)  
**Performance Goals**: Mode toggle perceived response < 500 ms (SC-001); export capture < 3 s on typical document  
**Constraints**: PNG export is fully client-side — no main process involvement. `html2canvas` called with `scale: 2`, `useCORS: false`, `logging: false`. Snapshot mode is never persisted across file switches.  
**Scale/Scope**: 6 new files, 3 modified files, 5 new test files, 1 E2E test file

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates derived from conventions established in specs 001–009.*

| Gate | Status | Notes |
|------|--------|-------|
| Architecture gates | ✅ PASS | New components follow existing CodePanel → EditorPane pattern; no new layers |
| Dependency gates | ✅ PASS | `html2canvas` already added to `dependencies` in Phase 1 (T001 complete) |
| Scope gates | ✅ PASS | Only `SplitViewPage.jsx`, `CodePanel/index.jsx`, and `markdownTokenizer.js` touched in `src/`; all other changes are new files |
| Test gates | ✅ PASS | Every new hook and utility has a corresponding unit test file |
| IPC gates | ✅ PASS | Zero new IPC channels; feature is entirely renderer-side |

Post-design re-check: ✅ All gates pass. `contracts/ipc-api.md` confirms no IPC changes.

---

## Project Structure

### Documentation (this feature)

```text
specs/010-code-snapshot-export/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions (R-001 – R-005)
├── data-model.md        ← entities, state flow diagram
├── quickstart.md        ← manual verification guide
├── tasks.md             ← implementation tasks (T001 – T029)
└── contracts/
    └── ipc-api.md       ← confirms zero new IPC channels
```

### Source Code — files created / modified / deleted

```text
# ── New dependency ────────────────────────────────────────────────────────────
package.json                                          ← MODIFIED: html2canvas added to dependencies

# ── New utilities ─────────────────────────────────────────────────────────────
src/renderer/src/utils/languageFromExtension.js       ← NEW: pure fn, extension → capitalized label
src/renderer/src/utils/snapshotExport.js              ← NEW: captureElement() + downloadBlob()

# ── New hooks ─────────────────────────────────────────────────────────────────
src/renderer/src/hooks/useSnapshotMode.js             ← NEW: mode state + reset on documentId change
src/renderer/src/hooks/useSnapshotExport.js           ← NEW: exportPng, exporting, error state

# ── New components ────────────────────────────────────────────────────────────
src/renderer/src/components/CodePanel/index.jsx            ← MODIFIED: wires snapshot mode (T011/T017)
src/renderer/src/components/CodePanel/CodePanel.module.css ← NEW: flex column layout
src/renderer/src/components/CodePanelHeader/index.jsx            ← NEW: toggle + Export PNG button
src/renderer/src/components/CodePanelHeader/CodePanelHeader.module.css ← NEW: header styles
src/renderer/src/components/SnapshotPane/index.jsx            ← NEW: macOS chrome + tokenized code
src/renderer/src/components/SnapshotPane/SnapshotPane.module.css ← NEW: One Monokai theme + chrome layout

# ── Modified source ────────────────────────────────────────────────────────────
src/renderer/src/utils/markdownTokenizer.js           ← MODIFIED: added tokenizeSnapshotLine()
src/renderer/src/pages/SplitViewPage.jsx              ← MODIFIED: EditorPane → CodePanel

# ── New unit tests ─────────────────────────────────────────────────────────────
tests/renderer/languageFromExtension.test.js          ← NEW: 14 cases
tests/renderer/useSnapshotMode.test.js                ← NEW: 4 cases (default, toggle, reset, stable id)
tests/renderer/useSnapshotExport.test.js              ← NEW: 6 cases (filename convention, state, error, null-ref)
tests/renderer/snapshotExport.test.js                 ← NEW: 4 cases (scale, blob, anchor click)
tests/renderer/SnapshotPane.test.jsx                  ← NEW: 10 cases (chrome, dots, title, placeholder)
tests/renderer/CodePanelHeader.test.jsx               ← NEW: 10 cases (toggle, Export PNG visibility/state/error)
tests/renderer/markdownTokenizer.test.js              ← MODIFIED: added tokenizeSnapshotLine cases

# ── New E2E tests ──────────────────────────────────────────────────────────────
tests/e2e/010-code-snapshot.e2e.js                    ← NEW: 4 scenarios (toggle, export visible, code resets, file switch)
tests/e2e/fixtures/docs.js                            ← MODIFIED: added codeSnapshotDoc fixture
```

**Structure Decision**: Single-project layout. All renderer code lives under `src/renderer/src/`. New components follow the existing one-directory-per-component + CSS Module convention. Hooks and utils follow the existing flat-file convention under `hooks/` and `utils/`. No new directories at the repo root.

---

## Implementation Status

> Completed 2026-03-25 · commit `d88a617`

| Phase | Task | Status |
|-------|------|--------|
| Setup | T001 — add html2canvas to package.json | ✅ Done |
| Foundational | T002 — languageFromExtension.js | ✅ Done |
| Foundational | T003 — useSnapshotMode.js | ✅ Done |
| Foundational | T004 — CodePanel scaffold | ✅ Done |
| Foundational | T005 — CodePanel.module.css | ✅ Done |
| Foundational | T006 — SplitViewPage uses CodePanel | ✅ Done |
| US1 | T007 — CodePanelHeader/index.jsx | ✅ Done |
| US1 | T008 — CodePanelHeader.module.css | ✅ Done |
| US1 | T009 — SnapshotPane/index.jsx | ✅ Done |
| US1 | T010 — SnapshotPane.module.css | ✅ Done |
| US1 | T011 — CodePanel wiring (mode + snapshot pane) | ✅ Done |
| US1 | T012 — useSnapshotMode.test.js | ✅ Done |
| US1 | T013 — SnapshotPane.test.jsx | ✅ Done |
| US2 | T014 — snapshotExport.js | ✅ Done |
| US2 | T015 — useSnapshotExport.js (+ buildFilename fix) | ✅ Done |
| US2 | T016 — CodePanelHeader wired with export | ✅ Done |
| US2 | T017 — CodePanel wiring (export hook) | ✅ Done |
| US2 | T018 — snapshotExport.test.js | ✅ Done |
| US2 | T019 — CodePanelHeader.test.jsx | ✅ Done |
| US2 | T020 — useSnapshotExport.test.js | ✅ Done |
| US3 | T021 — tokenizeSnapshotLine in markdownTokenizer.js | ✅ Done |
| US3 | T022 — snap-token CSS rules | ✅ Done |
| US3 | T023 — overflow-x CSS | ✅ Done |
| US3 | T024 — SnapshotPane renders tokenized lines | ✅ Done |
| US3 | T025 — languageFromExtension.test.js | ✅ Done |
| US3 | T026 — markdownTokenizer.test.js (snapshot cases) | ✅ Done |
| Polish | T027 — E2E test | ✅ Done |
| Polish | T028 — npm run test:all green | ✅ Done · 387/387 unit tests passing |
| Polish | T029 — manual verification checklist | ⏳ Pending |

**Feature-complete**: All 28 implementation tasks done. Only T029 (manual verification against running build) remains.

---

## Key Design Decisions

### html2canvas over alternatives (R-001)
`html2canvas` v1.4 with `scale: 2` is the only actively maintained DOM-to-PNG library that handles CSS `clip`, `border-radius`, and `overflow: hidden` correctly in Electron's Chromium renderer. Alternatives (`dom-to-image`, Electron's `capturePage`, Puppeteer) were rejected — see [research.md](./research.md#r-001).

### Tokenizer reuse over Shiki (R-002)
`tokenizeSnapshotLine` is a thin wrapper over the existing `tokenizeCodeLine` regex, remapping class names from `token-code-*` to `snap-token-*`. Shiki (already a project dependency for the preview pane) was rejected due to async WASM initialisation latency on every mode switch.

### Static extension map for language labels (R-003)
`languageFromExtension(filename)` returns capitalized labels (`JavaScript`, `Python`, `TypeScript`, etc.) from a 20-entry static lookup. Returns `''` for unknown extensions — SnapshotPane renders an empty title bar in that case.

### documentId-based mode reset (R-004)
`useSnapshotMode(documentId)` resets to `'code'` via `useEffect([documentId])`. This is reliable because `session.documentId` changes on every file switch and is already available in `SplitViewPage` → `CodePanel` props.

### 2× capture scale (R-005)
`html2canvas` `scale` is a direct multiplier independent of `window.devicePixelRatio`. `scale: 2` always produces a 2× canvas regardless of the display's physical DPI.
