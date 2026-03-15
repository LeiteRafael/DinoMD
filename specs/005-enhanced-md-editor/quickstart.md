# Quickstart: Enhanced Markdown Editor — Implementation Guide

**Branch**: `005-enhanced-md-editor` | **Date**: 2026-03-15

---

## What changes

This feature replaces the plain `<textarea>` in `MarkdownEditor` with a textarea-over-pre layout that adds a line-number gutter, real-time syntax highlighting, an active line indicator, and auto-indentation. No IPC changes. No new dependencies. No main-process modifications.

---

## File Map

### New files

| File | Purpose |
|------|---------|
| `src/renderer/src/utils/markdownTokenizer.js` | Pure function: `tokenize(text, activeLine) → html string`. Regex-based, no deps. |
| `tests/renderer/markdownTokenizer.test.js` | Unit tests for the tokenizer (headings, bold, links, code blocks, active line, XSS escaping, empty input). |

### Modified files

| File | Change |
|------|--------|
| `src/renderer/src/components/MarkdownEditor/index.jsx` | Replace `<textarea>` with gutter + overlay layout. Add `activeLine`, `scrollTop` state. Handle `Enter` for auto-indent. |
| `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css` | New layout: gutter column + editor container + backdrop pre + transparent textarea. |
| `tests/renderer/MarkdownEditor.test.js` | Add tests for auto-indent on Enter, active line, gutter rendering;  update existing tests to reflect new DOM structure (textarea is still `role="textbox"`). |

---

## Implementation Order

Implement in this order so each step is independently buildable and testable:

### Step 1 — Tokenizer utility

Create `src/renderer/src/utils/markdownTokenizer.js`.

```
tokenize(text, activeLine)
  1. Split text by '\n' → lines[]
  2. Track inCodeBlock boolean
  3. For each line[i]:
     a. HTML-escape the line  (& → &amp;  < → &lt;  > → &gt;)
     b. Determine line type:
        - If line matches /^```/ → toggle inCodeBlock; type = 'code-fence'
        - Else if inCodeBlock → type = 'code-block'
        - Else if /^(#{1,6}) / → type = 'h{n}' (count #s)
        - Else → type = 'plain', apply inline token replacements:
            bold: /\*\*(.+?)\*\*/g  →  <span class="token-bold">**$1**</span>
            link: /\[([^\]]+)\]\([^)]+\)/g  →  <span class="token-link">full match</span>
     c. Wrap whole line:
        - If type !== 'plain' → <span class="token-{type}">escaped line</span>
        - Else → inline-replaced line
     d. If i + 1 === activeLine → wrap with <span class="token-active-line">...</span>
  4. Join lines with '\n'
  5. Append trailing '\n' to prevent pre shrinkage on last empty line
```

Write `tests/renderer/markdownTokenizer.test.js` covering:
- `# h1` → contains `token-h1`
- `## h2` → contains `token-h2`
- `**bold**` → contains `token-bold`
- `[label](url)` → contains `token-link`
- Code fence open/close → lines inside contain `token-code-block`
- Active line n → line n contains `token-active-line`
- Input with `<script>` → output HTML-escaped
- Empty string → returns `'\n'` without error

---

### Step 2 — MarkdownEditor component layout

Replace `MarkdownEditor/index.jsx`.

Component state:
```js
const [activeLine, setActiveLine] = useState(1)
const [scrollTop, setScrollTop] = useState(0)
const debouncedValue = useDebounce(value, 150)
```

Important: import `useDebounce` from `'../../hooks/useDebounce'`.

Computed values:
```js
const lineCount = useMemo(() => value.split('\n').length, [value])
const highlightedHtml = useMemo(
  () => tokenize(debouncedValue, activeLine),
  [debouncedValue, activeLine]
)
```

Active line handler (attach to `onSelect`, `onKeyUp`, `onClick`):
```js
function updateActiveLine(e) {
  const pos = e.target.selectionStart
  const line = value.slice(0, pos).split('\n').length
  setActiveLine(line)
}
```

Scroll handler:
```js
function handleScroll(e) {
  setScrollTop(e.target.scrollTop)
  onScroll?.(e)
}
```

Key handler (extend existing, add Enter):
```js
if (e.key === 'Enter') {
  e.preventDefault()
  const { selectionStart, selectionEnd, value: val } = e.target
  const lineStart = val.lastIndexOf('\n', selectionStart - 1) + 1
  const currentLine = val.slice(lineStart, selectionStart)
  const indent = currentLine.match(/^(\s*)/)[1]
  const next = val.slice(0, selectionStart) + '\n' + indent + val.slice(selectionEnd)
  onChange(next)
  requestAnimationFrame(() => {
    e.target.selectionStart = selectionStart + 1 + indent.length
    e.target.selectionEnd = selectionStart + 1 + indent.length
  })
}
```

JSX structure:
```jsx
<div className={styles.wrapper}>
  <div className={styles.gutter} aria-hidden="true">
    <div
      className={styles.gutterInner}
      style={{ transform: `translateY(-${scrollTop}px)` }}
    >
      {Array.from({ length: lineCount }, (_, i) => (
        <div
          key={i}
          className={i + 1 === activeLine ? styles.activeLineNumber : styles.lineNumber}
        >
          {i + 1}
        </div>
      ))}
    </div>
  </div>

  <div className={styles.editorContainer}>
    <pre
      className={styles.highlight}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
    <textarea
      ref={textareaRef}
      className={styles.textarea}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onSelect={updateActiveLine}
      onKeyUp={updateActiveLine}
      onClick={updateActiveLine}
      onScroll={handleScroll}
      spellCheck={false}
      aria-label="Markdown editor"
      placeholder={placeholder ?? 'Start typing Markdown…'}
    />
  </div>
</div>
```

---

### Step 3 — CSS layout

Replace `MarkdownEditor.module.css`.

Key rules:
- `.wrapper`: `display: flex; flex-direction: row; height: 100%; width: 100%; overflow: hidden`
- `.gutter`: `width: 3rem; min-width: 3rem; overflow: hidden; background: var(--color-bg-alt); text-align: right; padding-top: 1.5rem; flex-shrink: 0`
- `.gutterInner`: `will-change: transform` (hint for GPU-composited updates)
- `.lineNumber`: `height: <line-height>; padding-right: 0.75rem; font-size: 0.8rem; color: var(--color-text-muted); font-family: same as textarea`
- `.activeLineNumber`: same as `.lineNumber` + `color: var(--color-text)`
- `.editorContainer`: `position: relative; flex: 1; overflow: hidden`
- `.highlight`: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: 0; padding: 1.5rem; white-space: pre-wrap; word-wrap: break-word; pointer-events: none; overflow: hidden; font-family/size/line-height same as textarea`
- `.textarea`: `position: relative; z-index: 1; width: 100%; height: 100%; resize: none; background: transparent; color: transparent; caret-color: var(--color-text); border: none; outline: none; font: inherit; padding: 1.5rem; box-sizing: border-box`
- Token span classes: `.token-h1` through `.token-h6`, `.token-bold`, `.token-link`, `.token-code-fence`, `.token-code-block`, `.token-active-line`

**Critical**: `font-family`, `font-size`, `line-height`, `padding`, and `white-space` must be **identical** between `.highlight` and `.textarea` for visual alignment.

---

### Step 4 — Update tests

In `tests/renderer/MarkdownEditor.test.js`:

- `getByRole('textbox')` still works (textarea still has `role="textbox"` and `aria-label="Markdown editor"`)
- Add test: pressing Enter on `'  indented'` with cursor at end produces `'  indented\n  '`
- Add test: pressing Enter with no leading whitespace produces `'text\n'`
- Add snapshot or query test: gutter `aria-hidden` div is present when content has lines

---

## Acceptance Gate

Run before marking done:
```bash
npm test
```
All existing tests must pass. New tests must pass.

No new npm packages should appear in `package.json`.
