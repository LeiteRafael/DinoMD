# Data Model: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

---

## Overview

This feature introduces **no new persisted entities**. The `DocumentStore` schema defined in spec 001 is unchanged. All state introduced by this feature is **transient** — scoped to the current editor session and discarded on navigation.

---

## Transient State

### ViewModeState

Held in `useState` inside `SplitViewPage`. Controls which panes are visible.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `viewMode` | `"split" \| "editor" \| "preview"` | `"split"` | Which combination of panes is currently visible. |
| `setViewMode` | `function` | — | Setter dispatched by `ViewModeToggle`. |

**Rules**:
- `"split"`: both editor pane and preview pane are visible, separated by the resizable divider.
- `"editor"`: only the editor pane is visible; the preview pane is hidden (display: none or unmounted).
- `"preview"`: only the preview pane is visible; the editor pane is hidden.
- Switching mode never discards `editorContent` — the content state is preserved regardless of visible panes.
- Default is always `"split"` on every entry into `SplitViewPage`.

---

### EditorContentState

Held in `useState` inside `SplitViewPage` (or lifted to the `EditorPane` component from spec 002, passed up via `onChange`).

| Field | Type | Description |
|-------|------|-------------|
| `editorContent` | `string` | The current raw Markdown text in the editor pane. |
| `debouncedContent` | `string` | A 300 ms debounced copy of `editorContent`, passed to `PreviewPane` |

**Rules**:
- `editorContent` updates on every keystroke.
- `debouncedContent` updates at most once every 300 ms after the user stops typing.
- The preview always renders `debouncedContent`, never `editorContent` directly — ensures rendering is not triggered on every character.

---

### PaneSizeState

Managed internally by `react-resizable-panels` via `defaultSize` prop on each `<Panel>`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `editorPanelSize` | `number` (percentage) | `50` | Width of the editor pane as a percentage of total width. |
| `previewPanelSize` | `number` (percentage) | `50` | Width of the preview pane as a percentage of total width. |

**Rules**:
- Both panels have a `minSize` of `20` (20% width) to ensure both remain operable.
- User can drag the `<PanelResizeHandle />` to any ratio within the min/max constraints.
- Pane size is not persisted — resets to 50/50 on every mount of `SplitViewPage`.

---

### SyncScrollState

Managed internally by the `useSyncScroll` hook.

| Field | Type | Description |
|-------|------|-------------|
| `editorScrollRef` | `React.RefObject<HTMLElement>` | Ref attached to the editor pane scroll container. |
| `previewScrollRef` | `React.RefObject<HTMLElement>` | Ref attached to the preview pane scroll container. |
| `isSyncingRef` | `React.RefObject<boolean>` | Guard flag to prevent scroll feedback loops. |
| `syncEnabled` | `boolean` | When `true`, scrolling either pane drives the other. Default: `true`. |

**Scroll-ratio formula**:

```
scrollRatio = scrollTop / (scrollHeight - clientHeight)
targetScrollTop = scrollRatio × (targetScrollHeight - targetClientHeight)
```

---

## No Changes to Persisted Schema

The `DocumentStore` JSON schema (from spec 001) is unmodified:

```json
{
  "documents": [
    {
      "id": "string (UUID v4)",
      "name": "string",
      "filePath": "string (absolute path)",
      "orderIndex": "number",
      "importedAt": "string (ISO 8601)"
    }
  ]
}
```

Schema version remains `1`. No `electron-store` migration needed.
