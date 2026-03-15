# Data Model: Enhanced Markdown Editor (Code Editor Experience)

**Branch**: `005-enhanced-md-editor` | **Date**: 2026-03-15

> This feature is purely client-side (renderer process). No IPC schema changes, no electron-store changes, no main-process entities are modified.

---

## Entities

### EditorState (transient React state — never persisted)

Holds the runtime state of the enhanced editor component. Lives inside `MarkdownEditor` as local `useState`.

| Field | Type | Description |
|-------|------|-------------|
| `activeLine` | `number` | 1-based index of the line where the cursor currently resides. Derived from `value.slice(0, selectionStart).split('\n').length`. Updated on `onSelect`, `onKeyUp`, `onClick`. |
| `scrollTop` | `number` | Current vertical scroll offset of the textarea in pixels. Drives the gutter's `translateY` offset. |

### TokenizedContent (transient computed value — never persisted)

The output of the tokenizer. Produced by `markdownTokenizer.tokenize(text, activeLine)`. Passed to the `<pre>` element via `dangerouslySetInnerHTML`.

| Field | Type | Description |
|-------|------|-------------|
| `html` | `string` | A string of escaped HTML where Markdown tokens are wrapped in `<span class="token-{type}">` elements. The active line is wrapped in `<span class="token-active-line">`. Safe for `dangerouslySetInnerHTML` (input is HTML-escaped before token spans are injected). |

### SyntaxToken (logical concept — not a stored object)

Represents a classified text segment within a single document line. Used as a conceptual unit in the tokenizer logic.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | One of: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `bold`, `link`, `code-fence`, `code-block`, `plain` |
| `raw` | `string` | The original unescaped text of the token. |

---

## No Schema Changes

The following project-level schemas are **unchanged**:

- `Document` (electron-store): no new fields
- `electron-store` `ui` key: unchanged  
- IPC channel payloads: no new or modified channels

---

## Token Type to CSS Class Mapping

| Token Type | CSS Class | Visual Role |
|------------|-----------|-------------|
| `h1`–`h6` | `.token-h1`–`.token-h6` | Full-line heading color + weight |
| `bold` | `.token-bold` | Inline bold highlight |
| `link` | `.token-link` | Full link syntax highlight (`[text](url)`) |
| `code-fence` | `.token-code-fence` | The ` ``` ` fence line itself |
| `code-block` | `.token-code-block` | Lines inside a fenced code block |
| `active-line` | `.token-active-line` | Full-width background on cursor's line |
| `plain` | _(no class, raw text node)_ | Unstyled body text |

---

## State Transitions

```
User Keystroke
    │
    ├─► textarea.value changes (immediate) ──► onChange(newValue) ──► parent re-render
    │        │
    │        ├─► activeLine recomputed from selectionStart (immediate)
    │        ├─► lineCount recomputed from value.split('\n').length (immediate)  
    │        └─► scrollTop unchanged (scroll not triggered by typing)
    │
    └─► useDebounce(value, 150ms) settles ──► tokenize(debouncedValue, activeLine)
             │
             └─► highlightedHtml string updated ──► <pre> re-renders with new token spans

User Scroll
    │
    ├─► onScroll(e) fires ──► setScrollTop(e.target.scrollTop)
    └─► gutter translateY(-scrollTop) updates (immediate, CSS transform)
```
