# Implementation Plan: Editor UI & Syntax Highlighting Refinements

**Branch**: `006-editor-ui-refinements` | **Date**: 2026-03-16 | **Spec**: [spec.md](./spec.md)

## Summary

Three isolated visual correctness fixes for the DinoMD editor:

1. **Inline code preview** — `MarkdownViewer/CodeBlock` routes all `<code>` elements (including inline) through a block `<div>` renderer. Fix: guard with trailing-`\n` test to distinguish block vs inline code; render inline code as a native `<code>` element.
2. **Gutter drift** — `MarkdownEditor` line number divs use a hardcoded `height: 1.52rem` that accumulates fractional pixel error at non-100% OS zoom. Fix: remove hardcoded height, let the browser infer line height from shared font metrics, with a `ResizeObserver` sizer for font-load safety.
3. **Syntax highlighting** — `markdownTokenizer.js` renders all code-block lines as a single flat green span. Fix: add a `tokenizeCodeLine` sub-tokenizer with priority-ordered regex passes for comments, strings, numbers, keywords, and operators; add a dual-theme color palette as CSS custom properties.

No new npm dependencies. No new IPC channels. No persistent data changes.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX  
**Primary Dependencies**: Electron 34, electron-vite, React 18, react-markdown 9, shiki 1.24 (already used in MarkdownViewer), CSS Modules  
**Storage**: N/A — no data persistence changes  
**Testing**: Jest 29 + @testing-library/react 16 + @testing-library/jest-dom  
**Target Platform**: Electron desktop (Linux/macOS/Windows) + web preview via Vite  
**Performance Goals**: Visual correctness only; no frame-rate target (per clarification Q3); tokenizer must remain synchronous (runs in `useMemo`)  
**Constraints**: No new npm dependencies; tokenizer must stay synchronous; theme switching must be live (CSS custom properties, no JS reload)  
**Scale/Scope**: 3 files changed (markdownTokenizer.js, MarkdownEditor.module.css, MarkdownViewer/index.jsx) + 1 file extended (global.css)

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates: N/A.*

| Gate | Status | Notes |
|---|---|---|
| Architecture gates | N/A | No constitution file |
| Dependency gates | ✅ PASS | Zero new runtime dependencies |
| Scope gates | ✅ PASS | All changes are isolated to presentation layer |
| Test gates | ✅ PASS | Existing test infra covers all modified files |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-editor-ui-refinements/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← CSS token contract
├── quickstart.md        ← manual verification guide
├── checklists/
│   └── requirements.md
└── contracts/           ← N/A (no external interfaces)
```

### Source Code — files touched by this feature

```text
src/renderer/src/
├── styles/
│   └── global.css                          ← add --syn-* CSS custom properties (light + dark)
├── utils/
│   └── markdownTokenizer.js                ← add tokenizeCodeLine(); update code-block branch
├── components/
│   ├── MarkdownEditor/
│   │   └── MarkdownEditor.module.css       ← add :global(.token-code-*) rules; remove hardcoded height; add ResizeObserver hook usage
│   └── MarkdownViewer/
│       └── index.jsx                       ← add inline/block guard in CodeBlock

tests/renderer/
├── markdownTokenizer.test.js               ← extend with tokenizeCodeLine cases
├── MarkdownViewer.test.js                  ← add inline code guard test
└── MarkdownEditor.test.js                  ← add/verify gutter alignment rendering test
```

**Structure Decision**: Single-project layout. All changes are within the existing `src/renderer/src/` tree. No new files, no new directories, no new packages.

---

## Implementation Slices

Each slice is independently deliverable and testable.

### Slice A — Inline Code Preview Fix (P3 — lowest risk, smallest change)

**Scope**: `MarkdownViewer/index.jsx`

**Change**: In `CodeBlock`, add the guard:
```js
const code = String(children)
const isBlock = code.endsWith('\n')
if (!isBlock) {
  return <code className={className}>{children}</code>
}
```
- Remove the trailing `\n` from `code` before passing to shiki (already done via `.replace(/\n$/, '')`).
- Inline `<code>` elements are then styled by the existing `.article code:not(pre code)` rule in `MarkdownViewer.module.css` (no CSS change needed for basic correctness).

**Tests**:
- Render a paragraph with inline code → assert no block-level wrapper rendered.
- Render a fenced code block → assert shiki `codeToHtml` is called.
- Render a fenced code block with no language tag → assert it is treated as block (not inline) and shiki is called with `'text'`.

---

### Slice B — Gutter Alignment Fix (P2)

**Scope**: `MarkdownEditor/index.jsx` + `MarkdownEditor.module.css`

**Changes**:

1. **CSS**: Remove `height: 1.52rem` from `.lineNumber`. Add `font-size` and `line-height` matching the editor. Add a hidden zero-width space sizer pattern:
   ```css
   .lineNumber {
     /* No height — inferred from font metrics */
     font-size: var(--editor-font-size, 0.95rem);
     line-height: var(--editor-line-height, 1.6);
     font-family: 'Fira Mono', 'Cascadia Code', 'Consolas', monospace;
     padding-right: 0.75rem;
     color: var(--color-text-muted);
     display: block;
     white-space: pre;
   }
   ```

2. **CSS custom properties**: Promote `--editor-font-size: 0.95rem` and `--editor-line-height: 1.6` onto `.wrapper` (or `:root`) so textarea, pre, and gutter all reference the same source.

3. **JSX**: Add a hidden `<span aria-hidden="true">{'\u200B'}</span>` inside each gutter line div so the block establishes a line box from font metrics (empty divs collapse to 0 in some browsers).

4. **ResizeObserver safety net** (optional hardening): Add a `useEffect` that observes a single hidden sizer `<span>` and sets `--lh-px` on the wrapper when line height changes (e.g. after web font loads). The `.lineNumber` can use `height: var(--lh-px)` as a fallback override if the variable is set.

5. **Remove the JS constant** `LINE_HEIGHT_REM` from `index.jsx` — replace uses in `activeLineTop` and `gutterActiveLine` with a `useEffect`/`useState` that reads the actual line height from the DOM sizer.

**Tests**:
- Render with 5 lines and assert no `height` inline style on gutter divs.
- Assert gutter line count equals document line count.
- Snapshot test for gutter structure to catch regressions.

---

### Slice C — Syntax Highlighting Palette + Tokenizer (P1)

**Scope**: `global.css` + `markdownTokenizer.js` + `MarkdownEditor.module.css`

**Step C1 — CSS custom properties** in `global.css`:
```css
:root {
  /* Syntax highlighting palette — light (GitHub Light inspired) */
  --syn-kw:      #cf222e;
  --syn-str:     #0a3069;
  --syn-num:     #0550ae;
  --syn-comment: #6e7781;
  --syn-op:      #24292f;
  --syn-code-base: #24292f;
}
@media (prefers-color-scheme: dark) {
  :root {
    /* Syntax highlighting palette — dark (VS Code Default Dark+ inspired) */
    --syn-kw:      #569cd6;
    --syn-str:     #ce9178;
    --syn-num:     #b5cea8;
    --syn-comment: #6a9955;
    --syn-op:      #d4d4d4;
    --syn-code-base: #d4d4d4;
  }
}
```

**Step C2 — CSS token rules** in `MarkdownEditor.module.css` (alongside existing `:global(.token-*)` rules):
```css
:global(.token-code-comment) { color: var(--syn-comment); font-style: italic; }
:global(.token-code-str)     { color: var(--syn-str); }
:global(.token-code-num)     { color: var(--syn-num); }
:global(.token-code-kw)      { color: var(--syn-kw); font-weight: 600; }
:global(.token-code-op)      { color: var(--syn-op); }
```

Update existing `.token-code-block` and `.token-code-fence` to use `var(--syn-code-base)` instead of hardcoded `#98c379`.

**Step C3 — tokenizeCodeLine** in `markdownTokenizer.js`:

Priority-ordered single-pass regex replacer. Applied only to lines classified as `code-block` (inside a fenced block). The key ordering rule: comments and strings must be replaced before keywords and operators to prevent over-tokenizing quoted content.

```js
const CODE_TOKENS = [
  [/\/\/.*$|#.*$/,              'token-code-comment'],       // single-line comments
  [/"[^"]*"|'[^']*'|`[^`]*`/g, 'token-code-str'],           // strings
  [/\b\d+\.?\d*\b/g,            'token-code-num'],           // numbers
  [/\b(if|else|for|while|return|function|const|let|var|class|def|import|export|from|in|of|do|switch|case|break|continue|try|catch|finally|new|typeof|void|async|await|static|public|private|protected|true|false|null|undefined)\b/g, 'token-code-kw'],
  [/[+\-*/%=<>!&|^~?:]+|[(){}\[\];,.]/g, 'token-code-op'],
]

function tokenizeCodeLine(escapedLine) {
  // runs replacements in order; safe because HTML is already escaped
  return CODE_TOKENS.reduce(
    (line, [pattern, cls]) =>
      line.replace(pattern, (match) => `<span class="${cls}">${match}</span>`),
    escapedLine
  )
}
```

In `classifyLine`, update the `isInCodeBlock` branch:
```js
if (isInCodeBlock) return { type: 'code-block', content: tokenizeCodeLine(escapedLine) }
```

**Tests**:
- `tokenizeCodeLine('// this is a comment')` → contains `token-code-comment` span.
- `tokenizeCodeLine('"hello"')` → contains `token-code-str` span.
- `tokenizeCodeLine('42')` → contains `token-code-num` span.
- `tokenizeCodeLine('const x = 1;')` → `const` in `token-code-kw`, `=` and `;` in `token-code-op`.
- `tokenizeCodeLine('const greeting = "hello"')` → `hello` inside string span does NOT contain a keyword span.
- Empty line → returns empty string (no error).

---

## Delivery Order

1. **Slice A** (inline code fix) — smallest, zero risk, unblocks SC-001/SC-006 verification.
2. **Slice C** (syntax highlighting) — highest user-visible impact (P1), self-contained.
3. **Slice B** (gutter fix) — correctness improvement, requires the most careful DOM testing.

Each slice has its own commit. Each commit must pass `npm test` and `npm run lint` before merging.
