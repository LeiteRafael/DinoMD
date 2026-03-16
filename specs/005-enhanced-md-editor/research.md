# Research: Enhanced Markdown Editor (Code Editor Experience)

**Branch**: `005-enhanced-md-editor` | **Date**: 2026-03-15
**Status**: Complete — all unknowns resolved

---

## Decision 1: Rendering Architecture

**Decision**: Textarea-over-pre (transparent textarea layered on top of a syntax-highlighted `<pre>`)

**Rationale**: The standard `<textarea>` cannot display colored text — only the platform-native black/white rendering. The accepted solution without an external editor library is to overlay a transparent `<textarea>` on top of a `<pre>` element that mirrors the content with HTML `<span>` tokens. The user types into the textarea (which receives all native input, IME, and clipboard events), while the pre renders the colors they appear to see. The technique is used by CodeFlask, Prism's "live editor", and many in-browser playground tools.

**Why not contenteditable**: React's synthetic event system and controlled components conflict with `contenteditable`'s mutation-based DOM model. Cursor management, undo/redo, and IME support all require non-trivial workarounds. Ruled out.

**Why not a virtualized line list**: Virtualization (rendering only visible rows) adds significant complexity for a feature that already mandates no new dependencies. A `<textarea>` + `<pre>` pair handles large files natively via the browser's own rendering pipeline. Performance is addressed via debounced syntax token updates instead (see Decision 4). Ruled out for this iteration.

**Alternatives considered**: CodeMirror 6 (rejected — new dependency, contradicts "same tech" constraint), Monaco Editor (rejected — same reason, also very heavy for Electron).

---

## Decision 2: Syntax Tokenizer

**Decision**: Lightweight custom regex tokenizer in `src/renderer/src/utils/markdownTokenizer.js` — no new dependencies

**Rationale**: The spec covers exactly 4 token types: headings (H1–H6), bold, inline links, fenced code blocks. A regex-based two-pass tokenizer (line classification → inline span wrapping) covers all four reliably under ~100 lines of code. The project already ships `shiki` and `rehype-pretty-code` but those are async, AST-based tools designed for the read-only viewer, not for synchronous per-keystroke editor highlighting.

**Token type coverage**:
- **Headings**: line starts with `/^(#{1,6}) /` → classify whole line as `token-h{n}`
- **Bold**: `/\*\*(.+?)\*\*/g` or `/__(.+?)__/g` inline spans → `token-bold`
- **Links**: `/\[([^\]]+)\]\([^)]+\)/g` → wrap full `[label](url)` in `token-link`
- **Code fence**: stateful multi-line — lines between ` ``` ` markers → `token-code-block`; the fence markers themselves get `token-code-fence`

**XSS note**: The tokenizer escapes `<`, `>`, `&` before wrapping spans, so `dangerouslySetInnerHTML` on the pre element is safe.

**Alternatives considered**: `marked` for tokenization (rejected — async, heavyweight), `prismjs` (rejected — new dependency, over-engineered for 4 token types).

---

## Decision 3: Gutter Implementation

**Decision**: A non-scrollable left `<div>` (overflow hidden) whose inner line-number list is offset via `transform: translateY(-${scrollTop}px)` synchronized from the textarea's `onScroll` event

**Rationale**: If the gutter has its own scroll container, scroll sync requires manually setting `scrollTop` on every scroll event, which can cause flicker.  Using a CSS transform instead of actual scrolling moves the list position without triggering layout, giving smoother gutter tracking.

**Line count source**: `value.split('\n').length` — derived directly from the controlled textarea value with no debounce (instant response).

**Alternatives considered**: Absolutely positioned gutter that scrolls with the main container (requires identical scroll context — not achievable with the textarea model); floated gutter (layout complexity).

---

## Decision 4: Performance Strategy (1000+ lines)

**Decision**: Debounce only the syntax token HTML computation; all other state (line count, active line, gutter scroll) updates synchronously on every event

**Rationale**: The bottleneck at 1000+ lines is not the textarea render (native) but the tokenizer running on every keystroke producing a large HTML string. Applying the existing `useDebounce` hook (already in the project at `src/renderer/src/hooks/useDebounce.js`) with a 150 ms window to the tokenizer input means:
- The textarea value and native cursor rendering are always immediate (no lag)
- The syntax highlight layer catches up 150 ms later (invisible during normal typing)
- The gutter line count and active line indicator are instant (they derive from value.split('\n').length and selectionStart, not from the tokenizer)

**Debounce timing**: 150 ms — below the human perception threshold for "lag" in UI feedback (~200 ms), but enough to skip redundant tokenizer runs during rapid typing.

**Active line derive**: `value.slice(0, selectionStart).split('\n').length` on `onSelect` + `onKeyUp` + `onClick`. These are cheap string operations.

**Alternatives considered**: `useDeferredValue` (React 18) — defers the tokenizer update automatically. Rejected in favour of explicit debounce to match the existing project pattern (`useDebounce` is already tested and in use) and to ensure identical Web and Electron behaviour.

---

## Decision 5: Active Line Highlight

**Decision**: The active line highlight is rendered inline in the tokenizer output — the current line's content is wrapped in `<span class="token-active-line">` which gets a full-width background. Since the tokenizer already produces the highlighted line, adding the active line class per line is zero additional complexity.

**Note**: The active line class is applied to the *pre* layer, not a separate DOM element. This keeps the DOM minimal and avoids positioning math. The active line span uses `display: block; width: 100%` to fill the full editor width.

**Debounce exception**: The active line class is injected at render time using the unDebounced `activeLine` value against the debounced tokenized lines array. This means the active line highlight moves instantly on cursor navigation, while the token colors update at 150 ms cadence.

---

## Decision 6: Auto-Indentation

**Decision**: Intercept `Enter` in the existing `handleKeyDown` function in `MarkdownEditor/index.jsx`. Extract leading whitespace from the current line and insert it after the newline character.

**Algorithm**:
1. On `keydown` where `e.key === 'Enter'`: `preventDefault()`
2. Find the current line by slicing `value` at `selectionStart` and looking backwards for the last `\n`
3. Extract leading whitespace: `/^(\s*)/` match on current line content
4. Call `onChange(value.slice(0, selectionStart) + '\n' + leading + value.slice(selectionEnd))`
5. Restore cursor to `selectionStart + 1 + leading.length` via `requestAnimationFrame`

**Edge**: Backspace at start of indented empty line removes one level (2 spaces or 1 tab). This is also handled in `handleKeyDown` by checking if `selectionStart === selectionEnd` and the `leading.length` characters before cursor are all whitespace, then deleting them as a group.

---

## Phase 0 Summary

| # | Question | Resolution |
|---|----------|-----------|
| 1 | How to render syntax-colored text without a library? | Textarea-over-pre overlay |
| 2 | Which tokenizer approach? | Custom regex, ~100 LOC, no new deps |
| 3 | How to keep gutter in sync without flicker? | CSS `translateY` driven by `scrollTop` |
| 4 | How to maintain performance at 1000+ lines? | Debounce tokenizer input 150 ms via existing `useDebounce` |
| 5 | How to render active line highlight? | Inline in tokenizer output as `display:block` span on active line index |
| 6 | How to implement auto-indentation? | Intercept `Enter` in existing `handleKeyDown`; preserve leading whitespace |

All NEEDS CLARIFICATION items resolved. No new npm dependencies required.
