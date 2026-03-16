# Quickstart: Verifying Editor UI & Syntax Highlighting Refinements

**Feature**: 006-editor-ui-refinements  
**Date**: 2026-03-16

This guide describes how to manually verify each acceptance criterion after implementation without any automated tooling.

---

## Prerequisites

```bash
cd /path/to/DinoMD
npm install
npm run dev          # starts Electron app
# OR
npm run dev:web      # starts web preview at http://localhost:5174
```

---

## Fix 1 — Inline Code in Preview (FR-001, FR-002, SC-001, SC-006)

**Test document** — create or open a `.md` file with this content:

```md
Use the `--verbose` flag to enable verbose output.
Run `npm install` first, then use `npm run dev` to start the server.
You can combine `--watch` and `--port 3000` in the same command.
```

**Expected result**:
- Each backtick span renders on the same line as the surrounding text — no blank lines or full-width highlights between words.
- The highlight background covers only the width of the code text.
- Try the same in both light and dark OS theme; background/text contrast must be readable in both.

**Failure signs** (the pre-fix behaviour):
- Line breaks appear before or after each inline code span.
- The background highlight stretches to the full container width.

---

## Fix 2 — Gutter Alignment (FR-003, FR-004, FR-005, SC-002, SC-003)

**Test document** — open or create any `.md` file with 100+ lines.

**Scroll test**:
1. Open the editor pane.
2. Scroll slowly from line 1 to the bottom. Line numbers must stay flush with the first visual row of their text at every scroll position.
3. Scroll quickly (mousewheel sprint). After stopping, numbers must still be aligned — no residual offset.

**Font size test** (if UI exposes a font-size control):
1. Set font to smallest available. Confirm alignment.
2. Set font to largest available. Confirm alignment.
3. All three steps must show zero visible offset.

**Wrap test**:
1. Resize the editor panel to a narrow width so long lines wrap.
2. A wrapped logical line shows its number once, aligned to the first visual row. The second visual row has no number beside it.

---

## Fix 3 — Syntax Highlighting in the Editor (FR-006, FR-007, FR-009, SC-004, SC-005)

**Test document** — open or create a `.md` file with this content:

````md
```js
// This is a comment
const greeting = "Hello, world!";
let count = 42;
if (count > 0) {
  return greeting;
}
```
````

**Expected result in the editor** (not the preview):
- `// This is a comment` — rendered in a muted green (distinct from code text).
- `"Hello, world!"` — rendered in an orange/warm tone.
- `42` — rendered in a light green/teal tone.
- `const`, `let`, `if`, `return` — rendered in a vivid blue.
- Braces, parentheses, `;` — rendered in a neutral/lighter tone distinct from keywords.
- All colors are **different from each other** and from plain prose text.

**Light/Dark switch test**:
- Switch OS to the other theme variant.
- ALL token colors update immediately (no reload). Each color maintains readability against the new background.

**Contrast check** (manual approximation):
- No token should appear "invisible" or blend into the editor background.

---

## Running the Test Suite

```bash
npm test                           # all unit tests
npm test -- --testPathPattern=markdownTokenizer   # tokenizer tests only
npm test -- --testPathPattern=MarkdownViewer      # viewer tests only
npm test -- --testPathPattern=MarkdownEditor      # editor tests only
```

All existing tests must pass. New tests covering `tokenizeCodeLine` and the inline-code guard in `MarkdownViewer` are expected to be present after implementation.
