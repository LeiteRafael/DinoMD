# Research: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-21

## R-001: DOM-to-PNG Capture in Electron

**Question**: What is the best client-side approach for capturing a specific DOM element as a PNG in an Electron + React app?

**Decision**: Use `html2canvas` v1.4 with `scale: 2` option.

**Rationale**:
- `html2canvas` renders a specific DOM node (passed by ref) to a `<canvas>` element with no server involvement
- The `scale` option supports any floating-point multiplier — `scale: 2` produces a 2× high-DPI PNG matching the spec requirement
- It is the most widely used, actively maintained DOM-to-PNG library and runs reliably in Electron's Chromium engine
- Supports CSS `clip`, `overflow: hidden`, and `border-radius` — all required for the window chrome clipping behaviour

**Alternatives considered**:
- `dom-to-image`: No longer actively maintained; last release 2019; does not handle complex CSS as reliably as html2canvas in Electron
- `html-to-image`: Fork of dom-to-image; less mature; issues with WebGL and Chromium subpixel rendering
- Electron `webContents.capturePage()`: Captures the entire visible window, not a specific DOM node; would require additional Crop+IPC complexity
- Puppeteer screenshot: Overkill dependency; requires launching a separate browser process

**Implementation notes**:
- Add to `dependencies` (not devDependencies) since it is bundled in the renderer
- Call: `const canvas = await html2canvas(ref.current, { scale: 2, useCORS: false, logging: false })`
- `canvas.toBlob(blob => downloadBlob(blob, filename), 'image/png')`

---

## R-002: Syntax Highlighting in Snapshot View

**Question**: Should the snapshot tokenizer reuse the existing `markdownTokenizer.js` or use Shiki (already a project dependency)?

**Decision**: Reuse `tokenizeCodeLine` from the existing `markdownTokenizer.js` utility, remapped to new One Monokai CSS class names.

**Rationale**:
- `tokenizeCodeLine` already categorises code tokens into five semantic groups: strings (`token-code-str`), comments (`token-code-comment`), numbers (`token-code-num`), keywords (`token-code-kw`), operators/punctuation (`token-code-op`) — exactly matching the One Monokai color groups
- Zero new parsing code needed; mapping is a thin CSS-class rename in `SnapshotPane.module.css`
- Shiki performs async, server-oriented highlighting and requires WASM; wrapping it for a live client-side view adds startup latency not justified for a snapshot pane

**Alternatives considered**:
- Shiki (already in `dependencies`): Designed for static build-time highlighting; async initialisation adds latency on every mode switch; does not offer simpler integration than the existing tokenizer for this use case
- Prism.js: Additional dependency; overlaps with the existing tokenizer capabilities

**Token → One Monokai CSS mapping**:
| Existing class      | New class                 | One Monokai hex |
|---------------------|---------------------------|-----------------|
| `token-code-str`    | `snap-token-string`       | `#98c379`       |
| `token-code-comment`| `snap-token-comment`      | `#5c6370` italic|
| `token-code-num`    | `snap-token-number`       | `#d19a66`       |
| `token-code-kw`     | `snap-token-keyword`      | `#c678dd`       |
| `token-code-op`     | `snap-token-punctuation`  | `#abb2bf`       |

`tokenizeCodeLine` is a pure function — calling it with `snap-*` class names requires no change to the utility itself. The SnapshotPane will call `tokenizeCodeLine` after substituting the output class names via a thin wrapper.

---

## R-003: Language Inference from File Extension

**Question**: How should the snapshot view determine the language label (for the title bar and for potential tokenizer hints)?

**Decision**: New pure utility `languageFromExtension(filename)` — a lightweight static lookup table, no external dependency.

**Rationale**:
- The existing `markdownTokenizer.js` is language-agnostic (applies the same regex to all code); language inference is only needed for the title bar label and as metadata — it does not change tokenization behaviour
- A static map of ~20 common extensions covers the realistic set of files a developer opens in DinoMD; no third-party parsing library is needed
- Fast, synchronous, zero bundle-size overhead

**Extension map (initial set)**:
```
.js / .jsx  → javascript
.ts / .tsx  → typescript
.py         → python
.sh / .bash → bash
.md         → markdown
.json       → json
.css        → css
.html       → html
.yml / .yaml→ yaml
.rb         → ruby
.go         → go
.rs         → rust
.java       → java
.c / .cpp   → c/c++
.php        → php
```
- Unknown extension → returns `''` (empty string; title bar renders nothing)
- No filename → returns `''`

---

## R-004: ViewMode Reset on File Switch

**Question**: How should `useSnapshotMode` detect that the user has switched to a different file and reset to Code mode?

**Decision**: `useEffect` watching `session.documentId` from the `editorHook` session object.

**Rationale**:
- `session.documentId` is a stable unique identifier already present in the existing `useEditor` hook (passed through `SplitViewPage`)
- Each file switch produces a new `documentId` value, reliably triggering the effect reset
- No additional IPC or global state is needed; the hook stays fully renderer-local

**Implementation**:
```js
export default function useSnapshotMode(documentId) {
  const [mode, setMode] = useState('code')
  useEffect(() => { setMode('code') }, [documentId])
  return { mode, setMode }
}
```

---

## R-005: 2× PNG Capture — Correctness in Electron

**Question**: Does `html2canvas` `scale: 2` produce a correctly bounded image in Electron's Chromium renderer?

**Decision**: Yes — use `scale: 2` directly.

**Rationale**:
- Electron's Chromium renderer exposes `window.devicePixelRatio`; html2canvas uses `scale` as a direct multiplier overriding device DPR — no system-level DPR interaction required
- The snapshot frame uses `overflow: hidden` on the outer container, ensuring long lines are clipped not expanded before capture
- Testing at `scale: 2`: the output canvas is exactly `2 × clientWidth` × `2 × clientHeight` pixels — verifiable in unit tests via mock canvas dimensions
