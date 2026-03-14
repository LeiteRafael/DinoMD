# Data Model: DinoMD — Markdown Reader Application

**Branch**: `001-dinomd-markdown-reader` | **Date**: 2026-03-10  
**Plan**: [plan.md](./plan.md)

---

## Entities

### Document

Represents a single imported Markdown file. Stored in the `electron-store` JSON database as an entry in the `documents` array.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID v4) | Yes | Stable unique identifier. Never changes, even if file is renamed or moved. |
| `name` | `string` | Yes | Display name shown on the document card. Defaults to the filename without extension. |
| `filePath` | `string` | Yes | Absolute path to the `.md` file on the local filesystem at import time. |
| `orderIndex` | `number` | Yes | Zero-based integer defining the display order on the main page. Must be unique per document. |
| `importedAt` | `string` (ISO 8601) | Yes | Timestamp of when the document was imported. |
| `status` | `"available" \| "missing"` | Yes | `"available"` when the file exists at `filePath`; `"missing"` when it cannot be accessed. Computed at load time, not persisted. |

**Validation rules**:
- `id` is generated at import time and never modified.
- `name` must be a non-empty string; max 255 characters.
- `filePath` must be an absolute path string ending in `.md` (case-insensitive).
- `orderIndex` must be a non-negative integer; values are contiguous (0, 1, 2, …) and are rewritten on every reorder operation.
- `importedAt` is set once at import and never modified.

**State transitions**:

```
[Not imported] ──import──▶ available
    available  ──file deleted/moved──▶ missing
      missing  ──file restored + reload──▶ available
    available  ──remove──▶ [deleted from store]
      missing  ──remove──▶ [deleted from store]
```

---

### DocumentStore (persisted shape)

The complete JSON object written by `electron-store` to `[userData]/config.json`.

```json
{
  "documents": [
    {
      "id": "a1b2c3d4-...",
      "name": "Getting Started",
      "filePath": "/home/user/notes/getting-started.md",
      "orderIndex": 0,
      "importedAt": "2026-03-10T14:30:00.000Z"
    },
    {
      "id": "e5f6g7h8-...",
      "name": "Architecture Notes",
      "filePath": "/home/user/notes/architecture.md",
      "orderIndex": 1,
      "importedAt": "2026-03-10T14:31:00.000Z"
    }
  ]
}
```

**Schema version**: `1`  
`electron-store` migration hook upgrades shape on schema version bump.

---

### DocumentCard (UI representation)

A derived, read-only view model used by the renderer to render document cards on the main page. Never persisted.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | From `Document.id` |
| `name` | `string` | From `Document.name` |
| `orderIndex` | `number` | From `Document.orderIndex` |
| `status` | `"available" \| "missing"` | Computed at app load |

---

### MarkdownContent (transient)

A transient in-memory value loaded when a document is opened. Never persisted.

| Field | Type | Description |
|-------|------|-------------|
| `documentId` | `string` | ID of the document being read |
| `rawMarkdown` | `string` | Raw file content as a UTF-8 string |
| `loadedAt` | `number` | `Date.now()` timestamp for performance measurement |

---

## Relationships

```
DocumentStore
  └── documents: Document[]   (ordered by orderIndex ASC)
              │
              ├── rendered as ──▶ DocumentCard[]  (main page UI, sorted by orderIndex)
              │
              └── opened as ──▶ MarkdownContent  (reading view, one at a time)
```

---

## Reorder Operation

When the user drops a card at a new position, the application:

1. Computes the new ordering using `arrayMove(documents, oldIndex, newIndex)` from `@dnd-kit/sortable`.
2. Reassigns `orderIndex` values as contiguous integers (0, 1, 2, …) based on the new array position.
3. Persists the updated `documents` array to `electron-store` via IPC.

This is a **full rewrite** of `orderIndex` values — no gaps, no floats.

---

## Duplicate Detection

Before inserting a new Document, the store checks whether any existing document has the same `filePath`. If a match is found, the import is rejected and the application notifies the user that the file is already in the library.
