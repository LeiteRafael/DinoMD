# Implementation Plan: DinoMD — Left-Side File Browser Sidebar

**Branch**: `004-file-browser-sidebar` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-file-browser-sidebar/spec.md`

## Summary

A Bear MD-inspired left-side navigation sidebar is added to DinoMD's existing Electron + React desktop app. The sidebar shows a scrollable, searchable list of all user documents (title + plain-text preview), sorted by most recently modified, highlights the active document, supports a New Document shortcut, and can be toggled and resized — with both state values persisted across restarts via `electron-store`. The feature extends the existing `documents` store schema with a new `preview` field (generated in the main process on every write), adds two new IPC channels (`ui:get-sidebar-state`, `ui:set-sidebar-state`), and introduces a `Sidebar` component + `useSidebar` hook in the renderer. `react-resizable-panels` (already a production dependency from spec 003) handles the resizable panel layout.

## Technical Context

**Language/Version**: JavaScript — Node.js 20 LTS (main process), React 18 (renderer)  
**Primary Dependencies**: Electron 34 via `electron-vite`; `react-resizable-panels` v2 (sidebar + main split); `electron-store` v8 (preview field + UI state persistence); `react` 18 + CSS Modules (sidebar component)  
**Storage**: `electron-store` key `ui.sidebar { open, widthPercent }` + new `preview` field on existing `Document` schema  
**Testing**: Jest 29 — `jsdom` env for renderer (React Testing Library), `node` env for main-process handlers  
**Target Platform**: Desktop — Windows 10+, macOS 12+, Linux (x64/arm64) via Electron  
**Project Type**: Desktop application (Electron)  
**Performance Goals**: Sidebar renders in < 1 s for up to 200 documents; search updates within 200 ms of keystroke; toggle opens/closes in < 150 ms  
**Constraints**: Sidebar only visible when `view !== 'main'` (avoids duplicate list on MainPage); no new npm packages required; backwards-compatible store schema change  
**Scale/Scope**: Single user, single active document at a time; collections up to 500 documents

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*  
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/004-file-browser-sidebar/
├── plan.md              ← This file
├── spec.md              ← Feature specification
├── research.md          ← Phase 0 output (all decisions resolved)
├── data-model.md        ← Phase 1 output (Document.preview + SidebarState entities)
├── quickstart.md        ← Phase 1 output (implementation guide + file map)
├── contracts/
│   └── ipc-api.md       ← 2 new channels + 3 extended channels
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

Changes layered on top of the spec 001–003 structure:

```text
src/
  main/
    ipc/
      documents.js          ← MODIFY: add generatePreview(); call in import/create/save handlers
      ui.js                 ← NEW: registers ui:get-sidebar-state + ui:set-sidebar-state
    store/
      index.js              ← MODIFY: add ui.sidebar schema + getSidebarState/setSidebarState helpers
  preload/
    index.js                ← MODIFY: add window.api.ui = { getSidebarState, setSidebarState }
  renderer/
    src/
      App.jsx               ← MODIFY: wrap document views in PanelGroup; mount <Sidebar>
      components/
        Sidebar/
          index.jsx         ← NEW: sidebar component (search, list, new-doc button, toggle)
          Sidebar.module.css← NEW: sidebar styles
      hooks/
        useSidebar.js       ← NEW: loads/persists sidebar state via api.ui IPC
      services/
        api.js              ← MODIFY: add api.ui.getSidebarState / api.ui.setSidebarState

tests/
  main/
    ui-state.test.js        ← NEW: ui:get/set-sidebar-state handler tests
  renderer/
    Sidebar.test.jsx        ← NEW: renders list, search filter, active highlight, new-doc button
    useSidebar.test.js      ← NEW: initial load, toggle, resize, IPC call verification
```

**Structure Decision**: Single-repo `electron-vite` layout (same as specs 001–003). All new renderer code under `src/renderer/src/`. One new main-process file (`ipc/ui.js`). No new npm packages.

## Phase 0: Research Summary

All technical unknowns resolved in [research.md](./research.md). Key decisions:

| # | Decision | Outcome |
|---|---|---|
| 1 | Preview snippet generation | Main process; regex strip; cached in store on every write |
| 2 | Resize implementation | `react-resizable-panels` (existing dep); `PanelGroup` horizontal layout |
| 3 | Sidebar state persistence | New `ui.sidebar` key in existing `dinomd-data` electron-store |
| 4 | App.jsx layout change | Sidebar shown only for `view !== 'main'`; flex row via `PanelGroup` |
| 5 | Live list sync | Reuse existing `useDocuments` hook lifted to App.jsx scope |
| 6 | Search implementation | Client-side `Array.filter` on in-memory documents; 150 ms debounce |

## Phase 1: Design Summary

### Data Model Changes

See [data-model.md](./data-model.md) for full entity definitions.

- **`Document`** (existing): add `preview: string` field — generated in main, stored in electron-store.
- **`SidebarState`** (new): `{ open: boolean, widthPercent: number }` at store key `ui.sidebar`.
- **`SidebarSearchState`** (transient renderer state): `{ query, filteredDocuments }` — never persisted.

### IPC Contracts

See [contracts/ipc-api.md](./contracts/ipc-api.md) for full payload/response schemas.

**New channels**:
- `ui:get-sidebar-state` → returns `{ open, widthPercent }` with defaults
- `ui:set-sidebar-state` → accepts partial `{ open?, widthPercent? }`, returns `{ success }`

**Modified channels** (response shape unchanged — internal implementation only):
- `documents:get-all` response now includes `preview` on each document
- `documents:import-files`, `documents:create`, `documents:save` — now write `preview` to store

### Component Hierarchy

```
App
└── PanelGroup [horizontal]          ← only when view !== 'main'
    ├── Panel [sidebar, 22% default]
    │   └── Sidebar
    │       ├── [toggle button]
    │       ├── [search input]
    │       ├── [new-doc button]
    │       └── [document entries list]  ← sorted by mtimeMs desc
    │           └── SidebarDocumentEntry × N
    ├── PanelResizeHandle
    └── Panel [main content]
        └── EditorPage | ReaderPage | SplitViewPage
```

The `Sidebar` component is self-contained — it receives `documents`, `activeDocumentId`, `onOpenDocument`, `onNewDocument`, and `onToggle` as props. The document list is sorted by `mtimeMs` descending before being passed to `<Sidebar>`. Search state lives inside `Sidebar` (local `useState`). The `useSidebar` hook manages only IPC-persisted state (open/width) and is consumed in `App.jsx`.

### Re-check: Constitution Check Post-Design

Still no `constitution.md` — no gates to re-evaluate. ✅

## Complexity Tracking

> No constitution violations. Table not required.
