# Implementation Plan: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/010-code-snapshot-export/spec.md`

## Summary

Adds a "Snapshot" visual mode to the split-view code panel inspired by carbon.now.sh. A Code/Snapshot toggle in the code panel sub-header switches between the existing plain textarea view and a styled macOS-window-chrome frame applying the One Monokai theme via CSS. The One Monokai token styles are applied by remapping the output of the existing `tokenizeCodeLine` utility to new CSS classes. Language is inferred from the file extension via a new lightweight lookup table. An "Export PNG" button (visible only in Snapshot mode) captures the styled frame at 2× pixel density using `html2canvas` and triggers a file download. On capture failure, an inline error message appears using the existing `useToast` pattern. Snapshot mode is transient renderer state that resets to Code mode on every file switch.

## Technical Context

**Language/Version**: JavaScript — Node.js 20 LTS (main process), React 18 (renderer)  
**Primary Dependencies**: Electron 34 via `electron-vite`, React 18, existing `shiki`/`rehype-pretty-code` (unchanged), existing `markdownTokenizer.js` (reused for token logic), `html2canvas` v1.4 (new — client-side DOM-to-PNG)  
**Storage**: No new storage — snapshot mode is transient `useState`; no IPC, no `electron-store` changes  
**Testing**: Vitest + jsdom + React Testing Library (renderer unit/integration); Playwright (E2E)  
**Target Platform**: Desktop — Electron 34; web build unaffected  
**Project Type**: Desktop application (Electron + React)  
**Performance Goals**: Mode toggle responds in <500 ms; PNG export completes within 3 s for typical code blocks up to 300 lines  
**Constraints**: No new IPC channels; no new `electron-store` schema; html2canvas added at minimal bundle size impact; token colorization reuses existing `tokenizeCodeLine` logic  
**Scale/Scope**: Single active document; single code panel per split-view session

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*  
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/010-code-snapshot-export/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-api.md       ← No new IPC channels; documents renderer-only boundary
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

New files and modifications layered on top of the spec 003–009 structure:

```text
src/
  renderer/
    src/
      components/
        CodePanel/                    ← NEW: orchestrates Code/Snapshot mode for the left pane
          index.jsx
          CodePanel.module.css
        CodePanelHeader/              ← NEW: Code/Snapshot toggle + Export PNG button
          index.jsx
          CodePanelHeader.module.css
        SnapshotPane/                 ← NEW: macOS chrome frame + One Monokai code view
          index.jsx
          SnapshotPane.module.css
      hooks/
        useSnapshotMode.js            ← NEW: 'code'|'snapshot' state; resets on file switch
        useSnapshotExport.js          ← NEW: html2canvas capture + download orchestration
      utils/
        snapshotExport.js             ← NEW: pure export helpers (captureElement, downloadBlob)
        languageFromExtension.js      ← NEW: filename → language label lookup table

tests/
  renderer/
    CodePanel.test.jsx                ← NEW: toggle renders EditorPane vs SnapshotPane
    CodePanelHeader.test.jsx          ← NEW: Export PNG visibility per mode
    SnapshotPane.test.jsx             ← NEW: chrome render, empty placeholder, title bar
    useSnapshotMode.test.js           ← NEW: default mode, reset on documentId change
    useSnapshotExport.test.js         ← NEW: success path, failure inline error
    snapshotExport.test.js            ← NEW: captureElement + downloadBlob unit tests
    languageFromExtension.test.js     ← NEW: known extensions, unknown extension, no filename
  e2e/
    010-code-snapshot.e2e.js          ← NEW: toggle E2E, export E2E

src/renderer/src/pages/
  SplitViewPage.jsx                   ← MODIFIED: swaps <EditorPane> for <CodePanel>
```

**Structure Decision**: Single-repo, same `electron-vite` layout as specs 001–009. All new code lives in `src/renderer/src/`. No main-process changes. `html2canvas` added to `dependencies` in `package.json`.

## Complexity Tracking

> No constitution violations. Table not required.
