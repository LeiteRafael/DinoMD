# Implementation Plan: DinoMD — Create & Edit Markdown Files

**Branch**: `002-create-edit-md` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-create-edit-md/spec.md`

## Summary

Extends DinoMD with full document authoring: users can create new `.md` documents from scratch, open any existing document in an editable mode, save changes explicitly to disk, rename documents, and delete them (via OS trash). An unsaved-changes guard prevents silent data loss. The editor is a plain `<textarea>` (zero new runtime dependencies) with a Tab-key handler; it is designed to be swapped for CodeMirror 6 when feature 003 (split-view preview) is implemented.

## Technical Context

**Language/Version**: JavaScript — Node.js 20 LTS (main process), React 18 (renderer)  
**Primary Dependencies**: Electron 30 via `electron-vite` — no new runtime dependencies for MVP; `<textarea>`-based editor requires zero new packages  
**Storage**: `electron-store` (existing) — document list with `filePath`, `name`, `orderIndex`, `importedAt`; `fs.promises` for all disk I/O (write, rename, unlink)  
**Testing**: Jest — two existing projects: `node` environment for main process, `jsdom` environment for renderer (React Testing Library)  
**Target Platform**: Desktop — Windows 10+, macOS 12+, Linux (x64/arm64) via Electron — same as feature 001  
**Project Type**: Desktop application (Electron)  
**Performance Goals**: Save completes in < 200 ms for documents up to 500 KB (SC-002 from spec)  
**Constraints**: No autosave; explicit save only; single active editor session at a time; fully offline; no network I/O  
**Scale/Scope**: Same as feature 001 — up to ~500 documents per user; single-window application

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*  
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/002-create-edit-md/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-api.md       ← IPC channel contract (main ↔ renderer)
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

Changes are **additive** on top of the feature 001 baseline. New files are marked `← NEW`; modified files are marked `← MOD`.

```text
src/
  main/
    ipc/
      documents.js         ← MOD: add create, save, rename, delete handlers
    fs/
      fileUtils.js         ← MOD: add writeFileUtf8, renameFile, watchFile, stopWatching
  preload/
    index.js               ← MOD: expose create, save, rename, delete via contextBridge
  renderer/
    src/
      components/
        MarkdownEditor/    ← NEW: <textarea>-based editor with Tab handler
          index.jsx
          MarkdownEditor.module.css
        ConfirmModal/      ← NEW: reusable confirmation dialog (unsaved changes, delete)
          index.jsx
          ConfirmModal.module.css
      pages/
        EditorPage.jsx     ← NEW: editor page (new + edit flows, save, rename, dirty guard)
        EditorPage.module.css
        ReaderPage.jsx     ← MOD: add "Edit" button to header (FR-002)
      hooks/
        useEditor.js       ← NEW: editor state — content, isDirty, save, rename, delete
      services/
        api.js             ← MOD: add create, save, rename, delete methods

tests/
  main/
    documents-edit.test.js    ← NEW: main process handlers for create/save/rename/delete
  renderer/
    MarkdownEditor.test.js    ← NEW: component — Tab key, onChange, value prop
    EditorPage.test.js        ← NEW: page — dirty guard, save flow, mode switching
    useEditor.test.js         ← NEW: hook — isDirty flag, save/discard transitions
```

**Structure Decision**: Stays within the existing single-repo `electron-vite` layout. No new top-level directories needed. All additions are inside `src/main`, `src/preload`, `src/renderer`, and `tests`.

## Complexity Tracking

> No constitution violations. Table not required.

