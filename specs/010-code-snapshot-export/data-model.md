# Data Model: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-21

## Overview

This feature introduces no new persistent data entities (no IPC, no `electron-store` schema changes). All state is transient renderer state managed by React hooks. The entities below represent the logical data shapes that flow through the new components and hooks.

---

## Entities

### 1. SnapshotViewMode

**What it represents**: The current display state of the split-view code panel. Determines what the code panel renders and which UI controls are visible.

**Type**: `'code' | 'snapshot'`

**Source**: `useSnapshotMode(documentId)` — local `useState`, no persistence  
**Lifetime**: Scoped to the active renderer session for the current document. Resets to `'code'` whenever `documentId` changes.

**Default**: `'code'`

| Value | Panel renders | Export PNG visible |
|-------|--------------|-------------------|
| `'code'` | `EditorPane` (plain textarea) | No |
| `'snapshot'` | `SnapshotPane` (styled window chrome) | Yes |

**State transitions**:
```
'code' ──[toggle click]──→ 'snapshot'
'snapshot' ──[toggle click]──→ 'code'
'code' or 'snapshot' ──[documentId changes]──→ 'code'  (reset)
```

---

### 2. SnapshotExportState

**What it represents**: The ephemeral status of a PNG export operation.

**Type**: object produced by `useSnapshotExport`

| Field | Type | Description |
|-------|------|-------------|
| `exporting` | `boolean` | `true` while html2canvas capture + download is in progress |
| `error` | `string \| null` | Error message if last export failed; `null` otherwise |

**Produced by**: `useSnapshotExport(snapshotFrameRef, filename)`  
**Consumed by**: `CodePanelHeader` (disables Export button during `exporting`; shows inline error when `error` is set)  
**Lifetime**: Scoped to the current `CodePanel` mount; cleared when mode changes or document switches

---

### 3. SnapshotTitleLabel

**What it represents**: The text label displayed centered and muted in the snapshot window chrome title bar.

**Derivation** (in priority order):
1. `session.name` → the filename (e.g., `server.js`)
2. `languageFromExtension(session.name)` → the inferred language label (e.g., `javascript`) — used when `session.name` is empty or unavailable
3. `''` (empty) → title bar renders nothing

**Type**: `string`  
**Computed**: Pure function — no state, no side effects

---

### 4. TokenizedCodeLine

**What it represents**: A single line of the raw markdown/code content after tokenization, as an HTML string with `snap-token-*` spans applied.

**Type**: `string` (HTML)  
**Produced by**: thin wrapper around `tokenizeCodeLine(escapedLine)` with class name substitution  
**Consumed by**: `SnapshotPane` — rendered via `dangerouslySetInnerHTML` inside `<pre><code>` (same pattern as the existing `MarkdownEditor` tokenized view)

**Token class names** (One Monokai mapping):
| Class | Color | Style |
|-------|-------|-------|
| `snap-token-keyword` | `#c678dd` | — |
| `snap-token-string` | `#98c379` | — |
| `snap-token-number` | `#d19a66` | — |
| `snap-token-comment` | `#5c6370` | italic |
| `snap-token-punctuation` | `#abb2bf` | — |

---

## Non-entities (explicitly excluded)

| Concept | Why excluded |
|---------|--------------|
| User-chosen theme | Out of scope v1 — One Monokai only |
| Persisted view mode per file | Out of scope v1 — mode always resets to Code on switch |
| Export history / file registry | Out of scope — PNG is written directly to disk via browser download |
| Language-aware token grammar | Out of scope — same token regex applied regardless of language |

---

## State & data flow diagram

```
SplitViewPage
  └─ CodePanel
       ├─ useSnapshotMode(session.documentId)  →  { mode, setMode }
       ├─ useSnapshotExport(ref, session.name) →  { exportPng, exporting, error }
       │
       ├─ CodePanelHeader
       │    props: mode, onModeChange, onExport, exporting, error
       │    renders: Code/Snapshot toggle + Export PNG button (only in snapshot)
       │             + inline error message (when error is set)
       │
       ├─ [mode === 'code'] EditorPane
       │    (existing component, unchanged)
       │
       └─ [mode === 'snapshot'] SnapshotPane
            props: content, title (SnapshotTitleLabel)
            renders: macOS chrome frame
                       traffic-light dots
                       title bar with SnapshotTitleLabel
                       <pre><code> with TokenizedCodeLines
            ref: snapshotFrameRef (forwarded to useSnapshotExport)
```
