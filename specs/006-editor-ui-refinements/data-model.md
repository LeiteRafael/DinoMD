# Data Model: Editor UI & Syntax Highlighting Refinements

**Feature**: 006-editor-ui-refinements  
**Date**: 2026-03-16

## Overview

This feature has no persistent data entities. All changes are confined to:
- **Presentation layer**: CSS custom properties (color palette tokens), CSS class rules
- **Rendering logic**: stateless transformation functions (tokenizer) and component render guards
- No new state shapes, no new storage keys, no new IPC channels

## CSS Token Contract (Presentation Model)

The following CSS custom properties are the "data model" of this feature — they define the named interface between the color palette and the token rendering. All token spans and inline code styles reference these variables.

### Syntax Highlighting Tokens (new)

Defined on `:root` (light) and overridden in `@media (prefers-color-scheme: dark)` in `global.css`:

| Property | Role | Light value | Dark value |
|---|---|---|---|
| `--syn-kw` | Keyword | `#cf222e` | `#569cd6` |
| `--syn-str` | String literal | `#0a3069` | `#ce9178` |
| `--syn-num` | Number literal | `#0550ae` | `#b5cea8` |
| `--syn-comment` | Comment | `#6e7781` | `#6a9955` |
| `--syn-op` | Operator / Punctuation | `#24292f` | `#d4d4d4` |
| `--syn-code-base` | Default code text | `#24292f` | `#d4d4d4` |

### Editor Layout Tokens (updated)

These already exist on the editor but will be promoted to a shared ancestor to eliminate hardcoded values in the tokenizer and CSS:

| Property | Role | Value |
|---|---|---|
| `--editor-font-size` | Base font size for editor | `0.95rem` |
| `--editor-line-height` | Line height multiplier for editor | `1.6` |

## Token Spans (Renderer Output Model)

The tokenizer produces HTML strings with these span classes. They are stateless, computed on every `useMemo` call.

| Span class | Produced by | Displayed as |
|---|---|---|
| `token-h1` … `token-h6` | `classifyLine` heading branch | Heading colors (existing) |
| `token-bold` | `applyInlineTokens` | Bold color (existing) |
| `token-link` | `applyInlineTokens` | Link color (existing) |
| `token-code-fence` | `classifyLine` fence branch | Fence delimiter color (existing) |
| `token-code-block` | `classifyLine` code-block branch | Code text base (existing, unchanged wrapper) |
| `token-code-comment` | `tokenizeCodeLine` (new) | `--syn-comment` |
| `token-code-str` | `tokenizeCodeLine` (new) | `--syn-str` |
| `token-code-num` | `tokenizeCodeLine` (new) | `--syn-num` |
| `token-code-kw` | `tokenizeCodeLine` (new) | `--syn-kw` |
| `token-code-op` | `tokenizeCodeLine` (new) | `--syn-op` |

## State Transitions (None)

No new state machines or transition rules. The `isInCodeBlock` boolean in the tokenizer already tracks fence open/close state; no change to that logic.
