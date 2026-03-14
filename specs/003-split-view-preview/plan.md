# Implementation Plan: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-split-view-preview/spec.md`

## Summary

Split-view mode renders two side-by-side panes inside the existing Electron + React app: a plain-text editor (left) and a live Markdown preview (right). The preview reuses the existing `MarkdownViewer` component and re-renders with a 300 ms debounce on every keystroke. Panes are separated by a draggable resizer provided by `react-resizable-panels`. Synchronized scrolling is implemented via `onScroll` handlers that translate proportional scroll position. View mode (split / editor-only / preview-only) is transient renderer state — no IPC or persistence needed. This feature layered on top of spec 002 (Create & Edit Markdown Files) which provides the editor component, save/discard flow, and IPC channels for reading and writing document content.

## Technical Context

**Language/Version**: JavaScript — Node.js 20 LTS (main process), React 18 (renderer)  
**Primary Dependencies**: Electron 30 via `electron-vite`, `react-resizable-panels` v2 (resizable divider), `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki` (preview rendering, reused from spec 001), `electron-store` (no new schema changes)  
**Storage**: No new storage entities — view mode state is session-only (transient `useState`); existing `electron-store` schema from spec 001 is unchanged  
**Testing**: Jest — same two-project setup: `jsdom` for renderer (React Testing Library), `node` for main process; no new main-process code in this feature  
**Target Platform**: Desktop — Windows 10+, macOS 12+, Linux (x64/arm64) via Electron  
**Project Type**: Desktop application (Electron)  
**Performance Goals**: Preview pane reflects any typed change within 1 second; synchronised scrolling visually aligned within ±5% of relative scroll position for up to 1,000-line documents  
**Constraints**: Preview rendering must be visually identical to the existing `MarkdownViewer` read view; no new IPC channels required; split-view only available when a document is open  
**Scale/Scope**: Single active document at a time; no concurrent split-view sessions

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*  
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/003-split-view-preview/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (no new entities — view state only)
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-api.md       ← No new IPC channels; references spec 001 + 002 channels
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

New files and modifications layered on top of the spec 001 + spec 002 structure:

```text
src/
  renderer/
    src/
      components/
        SplitDivider/              ← Thin wrapper; delegates to react-resizable-panels
          index.jsx
          SplitDivider.module.css
        ViewModeToggle/            ← Toggle buttons: split | editor-only | preview-only
          index.jsx
          ViewModeToggle.module.css
        EditorPane/                ← Left pane: plain textarea editor (from spec 002)
          index.jsx
          EditorPane.module.css
        PreviewPane/               ← Right pane: wraps existing MarkdownViewer
          index.jsx
          PreviewPane.module.css
      pages/
        SplitViewPage.jsx          ← New top-level page/mode; composes panes + divider
        SplitViewPage.module.css
      hooks/
        useSplitView.js            ← Manages viewMode state + pane sizing
        useSyncScroll.js           ← Synchronized scrolling logic between panes
        useDebounce.js             ← Generic debounce hook (300 ms default)

tests/
  renderer/
    SplitViewPage.test.jsx         ← Renders split-view, checks both panes present
    useSyncScroll.test.js          ← Unit tests for scroll ratio calculation
    useDebounce.test.js            ← Confirms preview updates after debounce delay
```

**Structure Decision**: Single-repo, same `electron-vite` layout as spec 001. All new code lives in `src/renderer/src/`. No main-process changes required.

## Complexity Tracking

> No constitution violations. Table not required.
