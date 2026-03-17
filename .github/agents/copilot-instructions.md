# DinoMD Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies
- JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite`, `react-resizable-panels` v2 (resizable divider), `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki` (preview rendering, reused from spec 001), `electron-store` (no new schema changes) (003-split-view-preview)
- No new storage entities — view mode state is session-only (transient `useState`); existing `electron-store` schema from spec 001 is unchanged (003-split-view-preview)
- JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite` — no new runtime dependencies for MVP; `<textarea>`-based editor requires zero new packages (002-create-edit-md)
- `electron-store` (existing) — document list with `filePath`, `name`, `orderIndex`, `importedAt`; `fs.promises` for all disk I/O (write, rename, unlink) (002-create-edit-md)
- JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 34 via `electron-vite`; `react-resizable-panels` v2 (sidebar + main split); `electron-store` v8 (preview field + UI state persistence); `react` 18 + CSS Modules (sidebar component) (004-file-browser-sidebar)
- `electron-store` key `ui.sidebar { open, widthPercent }` + new `preview` field on existing `Document` schema (004-file-browser-sidebar)
- JavaScript — React 18 (renderer process only) + React 18, CSS Modules — same as existing project; `useDebounce` hook (already in project at `src/renderer/src/hooks/useDebounce.js`) (005-enhanced-md-editor)
- N/A — no persisted state changes; this feature is entirely transient renderer state (005-enhanced-md-editor)
- JavaScript (ES2022), React 18.3, JSX + Electron 34, electron-vite, React 18, react-markdown 9, shiki 1.24 (already used in MarkdownViewer), CSS Modules (006-editor-ui-refinements)
- N/A — no data persistence changes (006-editor-ui-refinements)
- JavaScript (ES2022), React 18.3, JSX + Electron 34, electron-vite, React 18, react-resizable-panels, CSS Modules (007-file-tree-sidebar)
- `electron-store` — extend `ui.sidebar` schema with `rootFolderPath: string | null` (007-file-tree-sidebar)

- JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite`, `@dnd-kit/core` + `@dnd-kit/sortable`, `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki`, `electron-store` (001-dinomd-markdown-reader)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

JavaScript — Node.js 20 LTS (main process), React 18 (renderer): Follow standard conventions
- Do not add comments explaining what code does — rename or refactor instead
- Do not add comments about argument types, return types, or side effects — these should be clear from the code itself

## Recent Changes
- 007-file-tree-sidebar: Added JavaScript (ES2022), React 18.3, JSX + Electron 34, electron-vite, React 18, react-resizable-panels, CSS Modules
- 006-editor-ui-refinements: Added JavaScript (ES2022), React 18.3, JSX + Electron 34, electron-vite, React 18, react-markdown 9, shiki 1.24 (already used in MarkdownViewer), CSS Modules
- 005-enhanced-md-editor: Added JavaScript — React 18 (renderer process only) + React 18, CSS Modules — same as existing project; `useDebounce` hook (already in project at `src/renderer/src/hooks/useDebounce.js`)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
