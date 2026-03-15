# Implementation Plan: Enhanced Markdown Editor (Code Editor Experience)

**Branch**: `005-enhanced-md-editor` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-enhanced-md-editor/spec.md`

## Summary

The plain `<textarea>` in `MarkdownEditor` is replaced with a **textarea-over-pre overlay** layout. A `<pre>` element positioned behind the transparent textarea renders syntax-highlighted Markdown (headings H1–H6, bold, inline links, fenced code blocks) using a custom regex tokenizer with no new dependencies. A line-number gutter column sits to the left and stays synchronized via CSS `translateY`. The cursor line is highlighted via an `active-line` span class injected at render time. Auto-indentation preserves leading whitespace on Enter. The tokenizer runs against a 150 ms debounced copy of the content (using the existing `useDebounce` hook) to ensure imperceptible typing lag on 1000+ line files.

## Technical Context

**Language/Version**: JavaScript — React 18 (renderer process only)
**Primary Dependencies**: React 18, CSS Modules — same as existing project; `useDebounce` hook (already in project at `src/renderer/src/hooks/useDebounce.js`)
**Storage**: N/A — no persisted state changes; this feature is entirely transient renderer state
**Testing**: Jest 29 + jsdom + React Testing Library (same as existing renderer tests)
**Target Platform**: Electron 34 desktop (Windows/macOS/Linux) + `dev:web` browser mode (same as existing)
**Project Type**: Desktop application (Electron + React)
**Performance Goals**: Typing and scroll must feel instant at 1000+ lines; syntax highlight update lag ≤ 150 ms; gutter sync visually seamless during rapid scroll
**Constraints**: No new npm packages; no IPC changes; no main-process changes; backwards-compatible drop-in replacement for `MarkdownEditor` component (same props interface)
**Scale/Scope**: Single user; documents up to ~5000 lines in practice

## Constitution Check

*No `constitution.md` exists for this project — no gates to evaluate.*
*When a constitution is added, re-run `/speckit.plan` to validate against it.*

> **Gate status**: ✅ No violations — proceed.

## Project Structure

### Documentation (this feature)

```text
specs/005-enhanced-md-editor/
├── plan.md              ← This file
├── spec.md              ← Feature specification
├── research.md          ← Phase 0 output (all 6 decisions resolved)
├── data-model.md        ← Phase 1 output (EditorState, TokenizedContent, SyntaxToken)
├── quickstart.md        ← Phase 1 output (implementation guide, file map, step-by-step)
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — not created by /speckit.plan)
```

> No `contracts/ipc-api.md` — this feature introduces no new IPC channels and modifies no existing channel payloads. All changes are confined to the renderer process.

### Source Code (repository root)

```text
src/
  renderer/
    src/
      components/
        MarkdownEditor/
          index.jsx               ← REPLACE: add gutter + overlay layout, activeLine/scrollTop state,
          │                                  Enter auto-indent, debounced tokenizer call
          MarkdownEditor.module.css ← REPLACE: wrapper/gutter/editorContainer/highlight/textarea layout
                                               + token span classes
      utils/
        markdownTokenizer.js      ← NEW: tokenize(text, activeLine) → HTML string
                                         (heading/bold/link/code-block regex; XSS-escaped; no deps)

tests/
  renderer/
    MarkdownEditor.test.js        ← MODIFY: add Enter auto-indent tests, gutter presence test;
    │                                       existing tests unchanged (textarea role still valid)
    markdownTokenizer.test.js     ← NEW: unit tests for all token types, active line, XSS safety,
                                          empty input, mixed content
```

**Structure Decision**: Single-repo `electron-vite` layout (same as specs 001–004). All changes are confined to `src/renderer/src/` and `tests/renderer/`. No new directories. No new npm packages.

## Phase 0: Research Summary

All technical unknowns resolved in [research.md](./research.md). Key decisions:

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Rendering architecture | Textarea-over-pre overlay (no external editor library) |
| 2 | Syntax tokenizer | Custom regex, ~100 LOC, no new deps; escapes HTML before injecting spans |
| 3 | Gutter scroll sync | CSS `translateY(-${scrollTop}px)` on gutter inner list; `overflow: hidden` on gutter container |
| 4 | Performance at 1000+ lines | Debounce tokenizer input 150 ms via existing `useDebounce`; line count and active line remain instant |
| 5 | Active line highlight | Injected inline in tokenizer output as `display: block` span on the active line index |
| 6 | Auto-indentation | Intercept `Enter` in existing `handleKeyDown`; extract `/^(\s*)/` from current line; insert after `\n` |

## Phase 1: Design Summary

### Data Model Changes

See [data-model.md](./data-model.md) for full entity definitions.

- **`EditorState`** (transient): two new local state fields — `activeLine: number`, `scrollTop: number`
- **`TokenizedContent`** (transient computed): `{ html: string }` produced by tokenizer, consumed by `<pre dangerouslySetInnerHTML>`
- **`SyntaxToken`** (logical): token types `h1–h6`, `bold`, `link`, `code-fence`, `code-block`, `plain`
- **No persistent data model changes** — no electron-store schema changes, no IPC payload changes

### No IPC Contracts

This feature is confined to the renderer. No new channels. No modified channel schemas.

### Component Layout

```
MarkdownEditor (root div — flex row)
├── GutterColumn (div.gutter, overflow hidden)
│   └── GutterInner (div — translateY(-scrollTop)) 
│       └── [LineNumber div × lineCount]  ← active line gets .activeLineNumber class
└── EditorContainer (div — flex:1, position relative)
    ├── SyntaxBackdrop (pre, absolute, pointer-events:none, aria-hidden)
    │   └── [span.token-* + span.token-active-line per line]
    └── EditableTextarea (textarea, position relative, z-index 1, transparent bg, transparent color, caret visible)
```

Props interface **unchanged**: `{ value, onChange, placeholder, textareaRef, onScroll }` — drop-in replacement.

### Re-check: Constitution Check Post-Design

Still no `constitution.md` — no gates to re-evaluate. ✅

## Complexity Tracking

> No constitution violations. Table not required.
