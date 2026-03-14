# DinoMD Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-10

## Active Technologies
- JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite`, `react-resizable-panels` v2 (resizable divider), `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki` (preview rendering, reused from spec 001), `electron-store` (no new schema changes) (003-split-view-preview)
- No new storage entities — view mode state is session-only (transient `useState`); existing `electron-store` schema from spec 001 is unchanged (003-split-view-preview)

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

## Recent Changes
- 003-split-view-preview: Added JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite`, `react-resizable-panels` v2 (resizable divider), `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki` (preview rendering, reused from spec 001), `electron-store` (no new schema changes)

- 001-dinomd-markdown-reader: Added JavaScript — Node.js 20 LTS (main process), React 18 (renderer) + Electron 30 via `electron-vite`, `@dnd-kit/core` + `@dnd-kit/sortable`, `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki`, `electron-store`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
