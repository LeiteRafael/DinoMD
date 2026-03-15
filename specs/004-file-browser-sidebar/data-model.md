# Data Model: Left-Side File Browser Sidebar

**Feature Branch**: `004-file-browser-sidebar`  
**Created**: 2026-03-14

---

## Changed Entities

### Document *(existing — extended)*

The `Document` entity already exists in `electron-store` (`dinomd-data`). This feature adds a single derived field.

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string` (UUID) | existing | Unique document identifier |
| `name` | `string` | existing | Document title (filename without `.md` extension) |
| `filePath` | `string` | existing | Absolute path to the `.md` file on disk |
| `orderIndex` | `number` | existing | Position in the document list |
| `importedAt` | `string` (ISO 8601) | existing | Timestamp when first imported |
| `mtimeMs` | `number` | existing | File modification time (ms since epoch) |
| `preview` | `string` (≤ 150 chars) | **new** | Plain-text snippet derived from file content; markdown syntax stripped |

**Validation rules for `preview`**:
- Generated in the main process on every document create, import, and save.
- Derived by: reading first 200 characters of the file, stripping markdown tokens (headings `#`, emphasis `*_`, code `` ` ``, blockquotes `>`, link syntax `[]()`, HR `---`), then trimming whitespace.
- Stored as an empty string `""` if the file is empty, unreadable, or contains only syntax tokens.
- Max length: 150 characters (truncated with `…` appended if longer).
- Back-filled to `""` for documents that pre-date this feature (migration: on first `documents:get-all` call, documents without a `preview` field return `""` without error — the field is optional in reads but always written on future mutations).

---

## New Entities

### SidebarState *(new — persisted in electron-store)*

Represents the persistent UI configuration for the sidebar panel.

| Field | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `true` | Whether the sidebar is currently visible |
| `widthPercent` | `number` (0–100) | `22` | Sidebar width as a percentage of the total app window width |

**Validation rules**:
- `widthPercent` must be clamped to the range `[15, 35]` — values outside this range are corrected to the nearest bound on read.
- `open` defaults to `true` on first launch (no stored value found).

**Storage key**: `ui.sidebar` inside the existing `dinomd-data` electron-store file.

---

## Transient (renderer-only) State

These structures live only in React component state; they are never persisted.

### SidebarSearchState

| Field | Type | Description |
|---|---|---|
| `query` | `string` | Current search input value (raw, unprocessed) |
| `filteredDocuments` | `Document[]` | Derived from `query` — subset of all documents matching title or preview |

**Derivation rule**: Case-insensitive substring match of `query` against `document.name` and `document.preview`. Updates after a 150 ms debounce from the last keystroke.

### SidebarActiveDocument

Derived from `App.jsx` state (`activeDocumentId`). Passed to the sidebar as a prop to highlight the currently open document. Not stored independently.

---

## State Transitions

```
Document lifecycle (preview field):
  importFiles()   → preview generated in main → stored with document
  create()        → preview = ""               → stored (empty, new blank doc)
  save(content)   → preview regenerated        → stored with document update

SidebarState lifecycle:
  app launch  → ui:get-sidebar-state → { open, widthPercent } (or defaults)
  user toggles → ui:set-sidebar-state({ open: !current }) → persisted
  user resizes → ui:set-sidebar-state({ widthPercent: newValue }) → persisted (debounced 300 ms)
```
