# Quickstart: Left-Side File Browser Sidebar

**Feature Branch**: `004-file-browser-sidebar`  
**Created**: 2026-03-14

This guide explains the key files, patterns, and wiring points an implementer needs to touch to build this feature from scratch.

---

## Architecture in one sentence

The sidebar is a new `Sidebar` React component mounted in `App.jsx` alongside existing page views; it is driven by the shared `useDocuments` hook and a new `useSidebar` hook; its persisted state is managed by two new IPC channels (`ui:get-sidebar-state`, `ui:set-sidebar-state`) backed by `electron-store`.

---

## File map

### Main process — 3 files to change

| File | What changes |
|---|---|
| `src/main/store/index.js` | Add `ui.sidebar` schema + `getUiSidebarState()` / `setUiSidebarState()` helpers |
| `src/main/ipc/documents.js` | Add `generatePreview(content)` helper; call it in `handleImportFiles`, `handleCreate`, `handleSave` |
| `src/main/ipc/ui.js` | **New file** — registers `ui:get-sidebar-state` + `ui:set-sidebar-state` handlers |

### Preload — 1 file to change

| File | What changes |
|---|---|
| `src/preload/index.js` | Add `window.api.ui = { getSidebarState, setSidebarState }` |

### Renderer — new files + 2 changed

| File | Status | Purpose |
|---|---|---|
| `src/renderer/src/components/Sidebar/index.jsx` | **New** | Main sidebar component — search bar, doc list, new-doc button, toggle |
| `src/renderer/src/components/Sidebar/Sidebar.module.css` | **New** | Sidebar styles |
| `src/renderer/src/hooks/useSidebar.js` | **New** | Loads + persists sidebar state (open/width) via IPC; exposes toggle, resize handlers |
| `src/renderer/src/services/api.js` | Change | Add `api.ui.getSidebarState()` and `api.ui.setSidebarState()` |
| `src/renderer/src/App.jsx` | Change | Mount `<Sidebar>` inside a `<PanelGroup>` alongside existing page rendering |

### Tests — 3 new test files

| File | What it covers |
|---|---|
| `tests/main/ui-state.test.js` | `ui:get-sidebar-state` defaults + persistence; `ui:set-sidebar-state` validation + clamp |
| `tests/renderer/Sidebar.test.jsx` | Renders doc list, highlights active doc, filters on search, new-doc button call |
| `tests/renderer/useSidebar.test.js` | Hook loads initial state; toggle and resize call `setSidebarState`; defaults applied |

---

## How the data flows

```
electron-store (dinomd-data)
  └── ui.sidebar { open, widthPercent }
        ↑ write: ui:set-sidebar-state (from useSidebar)
        ↓ read:  ui:get-sidebar-state (on App mount)

  └── documents[].preview
        ↑ written on: import / create / save (main process)
        ↓ read via:   documents:get-all (useDocuments → Sidebar)
```

---

## Key implementation notes

### 1. Preview generation (main process)

Add `generatePreview(content)` to `src/main/ipc/documents.js`:

```js
function generatePreview(content = '') {
  return content
    .slice(0, 200)
    .replace(/#{1,6}\s*/g, '')        // headings
    .replace(/[*_`>~]/g, '')          // inline emphasis, code, blockquote
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links / images → alt text
    .replace(/^[-–—]{3,}$/gm, '')     // horizonal rules
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
    + (content.trim().length > 150 ? '…' : '')
}
```

Call this after writing the file and before `updateDocument(id, patch)` in the three write handlers.

### 2. Store schema addition (`src/main/store/index.js`)

Add to the `schema` object:

```js
ui: {
  type: 'object',
  default: {},
  properties: {
    sidebar: {
      type: 'object',
      default: { open: true, widthPercent: 22 },
      properties: {
        open:         { type: 'boolean', default: true },
        widthPercent: { type: 'number',  default: 22 }
      }
    }
  }
}
```

### 3. App.jsx layout change

Replace the current full-screen page render with a flex row wrapper when `view !== 'main'`:

```jsx
// Pseudo-code — exact integration depends on current JSX structure
if (view !== 'main') {
  return (
    <PanelGroup direction="horizontal">
      {sidebarOpen && (
        <>
          <Panel defaultSize={sidebarWidthPercent} minSize={15} maxSize={35}>
            <Sidebar
              documents={docsHook.documents}
              activeDocumentId={activeDocumentId}
              onOpenDocument={handleOpenDocument}    // or handleEditDocument
              onNewDocument={handleNewDocument}
              onToggle={handleSidebarToggle}
            />
          </Panel>
          <PanelResizeHandle />
        </>
      )}
      <Panel>
        {/* existing view rendering: EditorPage, ReaderPage, SplitViewPage */}
      </Panel>
    </PanelGroup>
  )
}
```

### 4. useSidebar hook shape

```js
// src/renderer/src/hooks/useSidebar.js
export default function useSidebar() {
  const [open, setOpen] = useState(true)
  const [widthPercent, setWidthPercent] = useState(22)

  // Load on mount
  useEffect(() => { /* api.ui.getSidebarState() → setOpen + setWidthPercent */ }, [])

  const toggle  = () => { const next = !open; setOpen(next); api.ui.setSidebarState({ open: next }) }
  const resize  = useCallback(debounce((pct) => { setWidthPercent(pct); api.ui.setSidebarState({ widthPercent: pct }) }, 300), [])

  return { open, widthPercent, toggle, resize }
}
```

---

## Running the app locally

```bash
npm run dev          # Electron dev mode (hot-reload renderer)
npm run dev:web      # Web mode (no IPC — sidebar state won't persist between refreshes)
npm test             # All Jest tests
```

## Running only sidebar-related tests

```bash
npx jest --testPathPattern="ui-state|Sidebar|useSidebar"
```
