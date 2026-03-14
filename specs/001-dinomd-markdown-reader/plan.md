# Implementation Plan: DinoMD — Markdown Reader Application

**Branch**: `001-dinomd-markdown-reader` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-dinomd-markdown-reader/spec.md`

## Summary

DinoMD is a desktop Markdown reader app built with Electron, React, and Node.js. Users import `.md` files, view them as draggable cards on a flat main page, and read each document in a rich reading view with full GFM rendering and syntax highlighting. Document order persists locally between sessions via `electron-store`.

## Technical Context

**Language/Version**: JavaScript — Node.js 20 LTS (main process), React 18 (renderer)  
**Primary Dependencies**: Electron 30 via `electron-vite`, `@dnd-kit/core` + `@dnd-kit/sortable`, `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki`, `electron-store`  
**Storage**: `electron-store` — atomic JSON file written to `app.getPath('userData')`; holds the document list (name, path, order index, import date)  
**Testing**: Jest — two projects: `jsdom` environment for renderer (React Testing Library), `node` environment for main process; Electron IPC mocked via `__mocks__/electron.js`  
**Target Platform**: Desktop — Windows 10+, macOS 12+, Linux (x64/arm64) via Electron  
**Project Type**: Desktop application (Electron)  
**Performance Goals**: Render a 500-line `.md` document in under 1 second from click to visible content  
**Constraints**: Fully offline; no cloud sync; flat document structure (no nested collections); single-user  
**Scale/Scope**: Up to ~500 imported documents per user; single-window application

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*  
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/001-dinomd-markdown-reader/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-api.md       ← IPC channel contract (main ↔ renderer)
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
  main/                    ← Electron main process (Node.js "backend")
    index.js               ← App entry, BrowserWindow creation
    ipc/                   ← ipcMain.handle() registrations
      documents.js         ← Handlers: open-dialog, read-file, save-store
    store/
      index.js             ← electron-store schema + accessor functions
    fs/
      fileUtils.js         ← File system helpers (open dialog, fs.readFile)
  preload/
    index.js               ← contextBridge.exposeInMainWorld('api', {...})
  renderer/                ← React application (Chromium renderer context)
    index.html
    src/
      main.jsx             ← React entry point (ReactDOM.createRoot)
      components/
        DocumentCard/      ← Single document card (name, status, click handler)
        DocumentList/      ← Sortable list wrapper (@dnd-kit DndContext + SortableContext)
        MarkdownViewer/    ← Reading view (ReactMarkdown + rehype pipeline)
        ErrorBoundary/     ← Catches render errors gracefully
      pages/
        MainPage.jsx       ← Document overview with drag-and-drop
        ReaderPage.jsx     ← Full-screen reading view
      hooks/
        useDocuments.js    ← Document list state + IPC calls
        useMarkdown.js     ← Async markdown parsing state
      services/
        api.js             ← Thin wrapper over window.api (IPC bridge)
      styles/              ← CSS modules / global styles

tests/
  __mocks__/
    electron.js            ← Manual Electron IPC mock
  main/                    ← Tests for main process (Jest node environment)
  renderer/                ← Tests for React components (Jest jsdom environment)

docker/
  Dockerfile               ← Node 20 image for headless CI tests
  docker-compose.yml       ← Dev container with src/ volume mounts

electron-vite.config.js
jest.config.js             ← Two Jest projects: { main: node }, { renderer: jsdom }
package.json
```

**Structure Decision**: Single-repo using `electron-vite`'s canonical `src/main` + `src/preload` + `src/renderer` layout. No monorepo needed for a single desktop application.

## Complexity Tracking

> No constitution violations. Table not required.
