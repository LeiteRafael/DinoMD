# Data Model: Code Editor & Snapshot UX Refinement

**Feature**: 011-code-block-preview-refinement
**Date**: 2026-03-28

---

## Entities

### 1. ChangeMap

**Purpose**: Maps line numbers to their change status relative to a baseline

| Field | Type | Description |
|-------|------|-------------|
| key | `number` (1-indexed line number) | Line position in the current document |
| value | `'added' \| 'modified' \| 'deleted'` | Change type for that line |

**Storage**: `Map<number, string>` — transient React state, never persisted
**Lifecycle**: Created by `computeLineDiff()`, consumed by gutter rendering, cleared on save/discard

---

### 2. Baseline State (in useChangeIndicators hook)

**Purpose**: Stores the reference content for diff computation

| Field | Type | Description |
|-------|------|-------------|
| baseline | `string` | Full text content at last save/load point |
| changeMap | `Map<number, string>` | Current computed diff result |

**Initialization**: Set from `session.savedContent` when hook first receives content
**Reset triggers**: Save operation (baseline = current content), Discard operation (baseline unchanged, content reverts)

---

### 3. Editor Session (existing — useEditor hook)

**Purpose**: Tracks the current editing session state (already exists, not modified)

| Field | Type | Relevance to this feature |
|-------|------|---------------------------|
| content | `string` | Current text — used as "current" input to diff |
| savedContent | `string` | Last saved text — used as "baseline" input to diff |

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        useEditor (existing)                        │
│                                                                     │
│  session.savedContent ──────────┐                                   │
│  session.content ───────────────┼──► provided as props              │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    useChangeIndicators (new)                        │
│                                                                     │
│  Input:  savedContent (baseline source)                             │
│          content (current code)                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  On content change:                                       │       │
│  │    baselineLines = baseline.split('\n')                   │       │
│  │    currentLines  = content.split('\n')                    │       │
│  │    changeMap = computeLineDiff(baselineLines, currentLines)│       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                     │
│  On save:   baseline ← content, changeMap ← empty                  │
│  On discard: (content reverts to savedContent via useEditor)        │
│              baseline unchanged → changeMap recomputes to empty     │
│                                                                     │
│  Output: { changeMap, isDirty }                                     │
│                                                                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MarkdownEditor (modified)                         │
│                                                                     │
│  Gutter render loop:                                                │
│    for each lineNumber (1..lineCount):                              │
│      if changeMap.has(lineNumber):                                  │
│        render indicator mark with color for changeMap.get(line)     │
│      render line number                                             │
│                                                                     │
│  Indicator colors (CSS variables):                                  │
│    --color-indicator-added:    #2da44e (green)                      │
│    --color-indicator-modified: #d29922 (orange)                     │
│    --color-indicator-deleted:  #da3633 (red)                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Diff Algorithm (existing — diffUtils.js)

**Input**: `baselineLines: string[]`, `currentLines: string[]`
**Output**: `Map<lineNumber, 'added' | 'modified' | 'deleted'>`

### Internal Functions

| Function | Purpose |
|----------|---------|
| `findShortestEdit(baseline, current)` | Myers k-diagonal graph search returning trace array |
| `backtrackEditScript(trace, baseline, current)` | Walks trace backwards producing ordered insert/delete operations |
| `isRelatedContent(oldLine, newLine)` | Checks substring containment or length ratio ≤0.8 to distinguish modifications from additions |
| `buildChangeMap(operations, baseline, current)` | Merges consecutive delete+insert into 'modified' when content is related |
| `computeLineDiff(baselineLines, currentLines)` | Public API composing above functions |

### Change Classification Rules

| Operation Pattern | `isRelatedContent` | Result |
|-------------------|--------------------|--------|
| insert only | N/A | `'added'` |
| delete only | N/A | `'deleted'` |
| delete + insert (consecutive) | `true` | `'modified'` |
| delete + insert (consecutive) | `false` | `'added'` (the inserted line) |

---

## CSS Variable Dependencies

| Variable | Source | Used by |
|----------|--------|---------|
| `--color-bg` | `global.css` | Theme background |
| `--color-surface` | `global.css` | SnapshotPane, MarkdownViewer backgrounds (done) |
| `--color-bg-alt` | `global.css` | Gutter background |
| `--color-indicator-added` | `MarkdownEditor.module.css` (new) | Green indicator |
| `--color-indicator-modified` | `MarkdownEditor.module.css` (new) | Orange indicator |
| `--color-indicator-deleted` | `MarkdownEditor.module.css` (new) | Red indicator |
