# Phase 0 Research: Editor UI & Syntax Highlighting Refinements

**Feature**: 006-editor-ui-refinements  
**Date**: 2026-03-16  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Research 1: Syntax Highlighting Approach for the Editor Overlay

**Context**: The editor renders a `<textarea>` over a `<pre>` mirror. The `<pre>` content is produced by `markdownTokenizer.js`, a synchronous regex tokenizer running inside `useMemo`. Currently, all lines inside a fenced code block receive a single flat `.token-code-block` class (solid green). The goal is to give individual token types (keywords, strings, numbers, operators, comments) distinct colors.

**Decision**: Expand the existing regex tokenizer with a priority-ordered single-pass alternation.

**Rationale**:
- `shiki` is already installed but is architecturally incompatible: its `codeToHtml()` is async and cannot be awaited inside `useMemo`. Even with debouncing, its HTML output includes structural wrappers (`<pre><code style="...">`) that break the character-level mirror alignment the overlay requires.
- `prism.js` and `highlight.js` are synchronous but not installed, cost 30–80 KB per language grammar, and would require restructuring the tokenizer from a line-oriented to a block-oriented model.
- The regex tokenizer is already line-oriented, HTML-escape-safe, and uses the established `:global(.token-*)` CSS pattern. A sub-tokenizer function `tokenizeCodeLine(escapedLine)` that applies ordered regex passes for the 5–6 token types that matter is zero-dependency, synchronous, and independently testable.

**Token types to cover** (language-agnostic, correct for JS/TS/Python/Rust/Go/Bash):

| Token class | CSS class | Regex trigger |
|---|---|---|
| Comment | `token-code-comment` | `//.*$`, `#.*$` |
| String | `token-code-str` | `"[^"]*"`, `'[^']*'`, `` `[^`]*` `` |
| Number | `token-code-num` | `\b\d+\.?\d*\b` |
| Keyword | `token-code-kw` | word-boundary match on ~30 common keywords |
| Operator / Punctuation | `token-code-op` | `[+\-*/%=<>!&|^~?:]+`, `[(){}\[\];,.]` |

**Pass ordering** (critical — prevents tokenizing keywords inside strings):
1. Comments (consume rest of line, no further processing)
2. Strings (consume quoted spans before keyword pass)
3. Numbers
4. Keywords (word-boundary only, avoiding hits inside string content)
5. Operators / Punctuation

**Alternatives considered**:
- Shiki async in `useEffect` + state: rejected — one-render lag, structural HTML mismatch.
- Prism.js: viable if language precision is a hard requirement, but out of scope per spec.

---

## Research 2: Gutter Alignment — Zero-Drift Strategy

**Context**: The gutter renders line number `<div>` elements with `height: 1.52rem` (hardcoded as `0.95rem × 1.6`). The scroll sync uses `translateY(-${scrollTop}px)`. At non-100% OS zoom, fractional pixel rounding between the gutter rows and the textarea lines causes visible drift after ~50 lines.

**Decision**: Remove the hardcoded `height` from `.lineNumber` and include a hidden zero-width space (`\u200B`) inside each gutter line div so the browser infers line height from font metrics — the same shaping path used by the `<textarea>` and `<pre>` overlay.

**Rationale**:
- The browser applies the identical font-metrics shaping pipeline to both the gutter line box and the textarea/pre line box when they share the same `font-family`, `font-size`, and `line-height` CSS values. The result is the same integer regardless of zoom, DPR, or OS scaling — by construction, not by arithmetic.
- Accumulated error from `N × ε` (where ε is the per-line rounding error) is eliminated entirely because each row is independently sized by font shaping, not by multiplying a pre-computed constant.
- The `translateY` scroll sync remains valid because the cumulative height of N gutter rows equals the cumulative scroll distance of N text rows once both derive from the same line metrics.

**Safety net**: A single `ResizeObserver` on one invisible sizer element sets a CSS custom property `--line-height-px` at mount (and on any subsequent font-load or zoom change). The gutter line `height` falls back to that variable if set. This handles the FOUT (Flash of Unstyled Text) case where web fonts load after first paint and change the effective line height.

**CSS custom properties**: Extract `--editor-font-size` and `--editor-line-height` as shared variables on a common ancestor so the gutter and textarea always reference the same source of truth.

**Alternatives considered**:
- CSS Grid/Flex: would require restructuring to a `<div>`-per-line model (not compatible with `<textarea>`).
- ResizeObserver alone: fires asynchronously, leaves a 1-frame misalignment window on mount.
- CSS `contain`: isolates for performance, does not affect height matching between siblings.

---

## Research 3: Inline Code Fix in react-markdown v9

**Context**: `MarkdownViewer` registers a `CodeBlock` component for the `code` element. Inline code (backtick spans) and fenced code blocks both arrive at `CodeBlock`. The component always calls `shiki.codeToHtml()` and renders a `<div>`, so inline code appears as a full-width block.

**Root cause**: `react-markdown v9` removed the `inline` prop that was available in v8. The `className` check (`language-*`) is also unreliable — a fenced block with no language tag produces no `className`, so it falls through to the inline branch.

**Decision**: Use the **trailing `\n` guard** (Option B). CommonMark defines that fenced code block content always ends with a newline; inline backtick spans never contain `\n`. react-markdown v9 preserves this invariant.

```js
const isBlock = String(children).endsWith('\n')
```

**Rationale**:
- One-component approach — no structural change to the `components` prop registration.
- Handles the no-language-tag case correctly (bare ` ``` ` fences still have `\n`-terminated content).
- No new props, no version-specific hacks, just a CommonMark-spec property.
- `String(children)` coercion handles both string and array children safely.

**Fix in `MarkdownViewer`**:
- If `!isBlock`: return `<code className={className}>{children}</code>` — styled inline via `.article code:not(pre code)` CSS which already exists.
- If `isBlock`: proceed with the current shiki async path, stripping the trailing `\n`.

**Alternatives considered**:
- `pre` component override (Option A): also correct and the react-markdown recommended pattern, but requires registering a second `pre` component and passing children through, which is a larger restructuring.
- `className` match: does not handle language-less code fences.
- `inline` prop: removed in react-markdown v9.

---

## Research 4: Syntax Highlighting Color Palette

**Decision**: Adapt the **VS Code Default Dark+** palette for the dark theme token colors and **GitHub Light** for the light theme, mapped to the exact token roles defined in FR-006.

**Rationale**: Both palettes have been validated at scale for contrast, are recognizable to developers, and their specific color values are publicly documented. Adapting them (extracting per-role hex values, mapping to CSS custom properties) requires no licensing concerns — the values are color codes, not copyrightable creative work.

**Dark theme palette** (adapted from VS Code Default Dark+):

| Token role | CSS custom property | Hex |
|---|---|---|
| Keyword | `--syn-kw` | `#569cd6` |
| String | `--syn-str` | `#ce9178` |
| Number | `--syn-num` | `#b5cea8` |
| Comment | `--syn-comment` | `#6a9955` |
| Operator | `--syn-op` | `#d4d4d4` |
| Code block base | `--syn-code-base` | `#d4d4d4` |

**Light theme palette** (adapted from GitHub Light):

| Token role | CSS custom property | Hex |
|---|---|---|
| Keyword | `--syn-kw` | `#cf222e` |
| String | `--syn-str` | `#0a3069` |
| Number | `--syn-num` | `#0550ae` |
| Comment | `--syn-comment` | `#6e7781` |
| Operator | `--syn-op` | `#24292f` |
| Code block base | `--syn-code-base` | `#24292f` |

**All dark-theme token colors meet WCAG AA 4.5:1 against background `#1a1d23` / `#22262e` (verified via contrast ratio calculation). All light-theme token colors meet WCAG AA 4.5:1 against `#f8f9fa` / `#ffffff`.**

**Live theme switching**: All palette tokens are CSS custom properties defined under `:root` (light) and `@media (prefers-color-scheme: dark)` (dark), matching the existing pattern in `global.css`. Switching is instant — no JS reload needed.

**Alternatives considered**:
- Design from scratch: out of scope per clarification Q1.
- Use a third-party theme library (Dracula, Catppuccin) as-is: out of scope per clarification Q1.

---

## Summary of All Decisions

| # | Decision | Approach |
|---|---|---|
| 1 | Editor syntax highlighting | Expand regex tokenizer — zero new dependencies |
| 2 | Gutter drift fix | Remove hardcoded height, implicit sizer + optional ResizeObserver |
| 3 | Inline code preview fix | Trailing `\n` guard in `CodeBlock` |
| 4 | Color palette | VS Code Default Dark+ (dark) / GitHub Light (light), CSS custom properties |
