# IPC API Contract: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14  
**Plan**: [../plan.md](../plan.md)

---

## Overview

The split-view feature is **purely renderer-side**. It introduces no new IPC channels.

All communication with the main process uses channels already defined in prior specs:

| Channel | Defined in | Used by split-view for |
|---------|------------|----------------------|
| `documents:read-content` | Spec 001 ([ipc-api.md](../../001-dinomd-markdown-reader/contracts/ipc-api.md)) | Load document content into the editor pane on open |
| `documents:save-content` | Spec 002 | Save the current editor content to disk |
| `documents:create` | Spec 002 | Create a new document (accessible from split-view entry point) |

> **Note**: `documents:save-content` and `documents:create` are defined and contracted in spec 002. This document references them for completeness; their authoritative contract lives in `specs/002-create-edit-md/contracts/ipc-api.md`.

---

## `window.api` Surface (unchanged)

No new methods are added to the `contextBridge` surface by this feature. The existing `window.api.documents` object (defined in spec 001 preload) is used as-is.

---

## Renderer-Only Interactions

The following interactions are handled entirely within the React renderer and require no IPC:

| Interaction | Implementation |
|-------------|---------------|
| Switch view mode (split / editor-only / preview-only) | `useState` in `SplitViewPage` |
| Live preview update | `useDebounce(editorContent, 300)` → passed to `PreviewPane` |
| Resize panes | `react-resizable-panels` internal state |
| Synchronized scrolling | `useSyncScroll` hook — browser scroll events only |
| Toggle synchronized scrolling | `useState(syncEnabled)` in `useSyncScroll` |
