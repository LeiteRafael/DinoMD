# Research: Left-Side File Browser Sidebar

**Feature Branch**: `004-file-browser-sidebar`  
**Created**: 2026-03-14  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Sidebar Document Preview Snippets

**Question**: How should the text preview shown per document in the sidebar be generated, and where?

**Decision**: Generate and cache a `preview` field (≤ 150 characters, markdown syntax stripped) in the main process whenever a document is created, saved, or imported. Store it in the `electron-store` schema alongside the document metadata.

**Rationale**:
- Avoids reading every file on sidebar open (O(n) file reads → latency spike with large collections).
- The main process already owns all write paths (create, save, import) — adding preview generation there is strictly additive with no new IPC round-trips.
- A plain-text snippet is safe to serialize and fast to render.

**Alternatives considered**:
- Read content on demand in the renderer: simpler initially but causes noticeable lag for 20+ documents; doesn't scale.
- Derive preview in renderer from a bulk content fetch: requires a new expensive IPC batch call; rejected.

**Markdown stripping approach**: Simple regex pass in the main process — remove leading `#`, `*`, `_`, `` ` ``, `>`, `-`, `[`, `]`, `(`, `)` characters and collapse whitespace. No markdown parser required at this stage.

---

## Decision 2: Sidebar Resize Implementation

**Question**: How to implement resizable sidebar width with persisted state?

**Decision**: Use the existing `react-resizable-panels` (`^2.1.9`, already in `package.json`) — wrap the app layout in `<PanelGroup direction="horizontal">` with a `<Panel>` for the sidebar and a `<Panel>` for the main content, separated by a `<PanelResizeHandle>`.

**Rationale**:
- `react-resizable-panels` is already a production dependency; adding it to the sidebar incurs zero new bundle cost.
- The library handles keyboard-accessible resize natively (ARIA-compliant drag handle).
- Panel size values (0–100 in percent) can be stored directly in `electron-store` for persistence.
- The same mechanism was used in spec 003 (Split-View Preview) so patterns are proven.

**Alternatives considered**:
- Custom CSS `resize` property: not cross-browser consistent in Electron, doesn't support programmatic control.
- Custom `onMouseDown` drag handler: reinvents the wheel; rejected in favour of the existing package.

**Min/max bounds**: `minSize={15}` (~200 px at 1280 px window) and `maxSize={35}` (~450 px) on the sidebar panel.

---

## Decision 3: Sidebar State Persistence (open/closed + width)

**Question**: Where and how to persist sidebar UI state across restarts?

**Decision**: Add a `ui` key to the existing `electron-store` configuration (same `dinomd-data` store), storing `{ sidebar: { open: bool, widthPercent: number } }`. Expose via two new IPC channels: `ui:get-sidebar-state` and `ui:set-sidebar-state`.

**Rationale**:
- `electron-store` is already the app's persistence layer; extending it with a `ui` section is consistent with the existing architecture.
- Two dedicated IPC channels mirror the pattern used for documents and keep the preload bridge minimal.
- Persisting `widthPercent` (a `0–100` float from `react-resizable-panels`) is simpler than converting to pixels.

**Alternatives considered**:
- Separate `electron-store` file (e.g., `dinomd-ui`): unnecessary fragmentation for a small config payload.
- `localStorage` in the renderer: works for web mode but unavailable in Electron's secure context without additional flags; rejected.

---

## Decision 4: App Layout Restructuring

**Question**: The current `App.jsx` renders full-screen pages (`MainPage`, `EditorPage`, `ReaderPage`, `SplitViewPage`). How do we add a persistent sidebar without breaking existing navigation?

**Decision**: The sidebar is shown only while a document view (Editor, Reader, Split) is active. On `MainPage` the sidebar is hidden — it would be redundant since the main page already is a document list. The App layout uses a flex row: `[sidebar] [main-content]`. The sidebar is mounted whenever `view !== 'main'`.

**Rationale**:
- `MainPage` already shows a full document list with import, delete, and reorder — a sidebar on top of it creates a confusing duplicate list.
- A simple CSS `display: flex` wrapper in `App.jsx` is the least-invasive change to the existing routing model.
- Keeps backwards compatibility — switching to `'main'` collapses the sidebar automatically.

**Alternatives considered**:
- Always show sidebar (including on MainPage): causes UX duplication and layout confusion; rejected.
- Refactor App to React Router: overkill for this single page; rejected.

---

## Decision 5: Real-Time Document List Sync

**Question**: How will the sidebar keep its list in sync when documents are added, deleted, or renamed?

**Decision**: The sidebar reuses the existing `useDocuments` hook (already used by `MainPage`). The hook is lifted to `App.jsx` scope (it's already there via `docsHook`) and passed as props to both `MainPage` and the sidebar. When any mutation occurs (create, delete, rename), callers invoke `docsHook.refreshDocuments()` — the sidebar re-renders automatically.

**Rationale**:
- `useDocuments` already manages loading/error state and a `refreshDocuments` callback.
- No new polling or event-bus logic required.
- Consistent with how `EditorPage` and `SplitViewPage` already trigger refreshes on back-navigation.

---

## Decision 6: Sidebar Search (client-side vs server-side)

**Question**: Should search/filter happen in the renderer or via an IPC query to the main process?

**Decision**: Client-side filter in the renderer only. The sidebar receives the full `documents` array (already in memory) and applies a case-insensitive substring match against `name` and `preview` fields on each keystroke, debounced at 150 ms.

**Rationale**:
- The full document list is already loaded in renderer memory — a second IPC round-trip is unnecessary overhead.
- For collections up to 500 documents the JS `Array.filter` is imperceptibly fast (<1 ms).
- A 150 ms debounce satisfies SC-003 (< 200 ms) and prevents excessive re-renders.

**Alternatives considered**:
- IPC search query to main process: useful for full-text content search but that is out of scope for this spec; rejected.
