# Implementation Plan: Copy Actions & Save Shortcut

**Branch**: `008-copy-save-shortcuts` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)

## Summary

Add three editor productivity actions to DinoMD: (1) Ctrl+S keyboard shortcut to save a document already opened from disk, with a dirty-state indicator in the document title; (2) "Copy as Markdown" button that places the raw Markdown source in the clipboard with a toast confirmation; (3) "Copy as Plain Text" button that places fully stripped plain text in the clipboard with a toast confirmation. Both copy actions work in Electron and web modes and show an error toast if clipboard permission is denied. No new npm dependencies.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX  
**Primary Dependencies**: Electron 34, electron-vite, React 18, CSS Modules  
**Storage**: No new store fields required  
**Testing**: Jest 29 + @testing-library/react 16 (tests not in scope for this feature)  
**Target Platform**: Electron desktop + web browser (both must work)  
**Performance Goals**: Ctrl+S save response ≤ 500 ms; clipboard write ≤ 1 s; toast appears within 1 rendering frame  
**Constraints**: No new npm dependencies; clipboard writes use `navigator.clipboard.writeText()` (works in both Electron renderer and HTTPS/localhost web contexts); dirty-state tracks `isDirty` already computed in `useEditor.js`  
**Scale/Scope**: 4 files created, 6 files modified; zero new packages

---

## Key Design Decisions

### 1. Ctrl+S — where to wire the shortcut
`EditorPage.jsx` and `SplitViewPage.jsx` both manage their own `keydown` listeners. Ctrl+S is added to each page's existing `useEffect` keyboard handler (SplitViewPage already handles Ctrl+\). This avoids creating a global capture that would interfere with system shortcuts.

### 2. Ctrl+S scope
Only applies when `session.filePath` is set and `!session.isDraft` (document opened from disk). New/draft documents are unaffected — consistent with spec decision Q1.

### 3. Dirty-state indicator
`useEditor.js` already computes `isDirty = session.content !== session.savedContent`. The indicator (a `•` dot before the document title) is rendered in the EditorPage header and SplitViewPage header using a conditional CSS class, updated each render — no new state needed.

### 4. Toast component
A self-contained `<Toast>` component positioned at the bottom-right. State is managed by a `useToast` hook returning `{ toast, showToast }`. `showToast({ message, type })` sets the toast; it auto-dismisses after 2.5 s. Used by both EditorPage and SplitViewPage for copy action feedback.

### 5. Clipboard utility
A pure module `clipboardUtils.js` with:
- `copyToClipboard(text)` — wraps `navigator.clipboard.writeText(text)`, throws meaningful error on permission denial
- `stripMarkdown(text)` — comprehensive regex chain: removes headings (`#`), fences (` ``` `), bold/italic (`**`, `*`, `_`, `__`), links → label only, images removed, blockquotes, horizontal rules, inline code, list markers; collapses extra whitespace
`generatePreview()` in `documents.js` is kept as-is (it is a preview truncation utility, not a full strip).

### 6. Copy button placement
Both "Copy as MD" and "Copy as Text" buttons are added to the existing editor toolbar area in `EditorPane` component props, passed down from the parent page. This keeps layout concerns in the page components and keeps `EditorPane` presentational.

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates: N/A.*

| Gate | Status | Notes |
|------|--------|-------|
| Architecture gates | N/A | No constitution file |
| Dependency gates | ✅ PASS | Zero new runtime npm dependencies |
| Scope gates | ✅ PASS | 4 new files, 6 modified; no new IPC channels needed |
| Test gates | ✅ PASS | Tests not in scope; existing infrastructure unchanged |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-copy-save-shortcuts/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── checklists/
│   └── requirements.md
```

### Source Code — files touched by this feature

```text
src/renderer/src/
├── utils/
│   └── clipboardUtils.js               ← NEW: copyToClipboard(), stripMarkdown()
├── hooks/
│   └── useToast.js                     ← NEW: showToast()/dismiss toast state
├── components/
│   ├── Toast/
│   │   ├── index.jsx                   ← NEW: Toast notification component
│   │   └── Toast.module.css            ← NEW: toast styles (position, animation)
│   └── EditorPane/
│       └── index.jsx                   ← ADD: accept onCopyMd/onCopyText/copyButtons props
├── pages/
│   ├── EditorPage.jsx                  ← ADD: Ctrl+S handler, dirty indicator, copy buttons, toast
│   ├── EditorPage.module.css           ← ADD: dirty dot style, copy button styles
│   ├── SplitViewPage.jsx               ← ADD: Ctrl+S to keydown handler, dirty indicator, copy buttons, toast
│   └── SplitViewPage.module.css        ← ADD: dirty dot style, copy button styles
```

**Structure Decision**: All changes within the existing `src/renderer/src/` tree. No new directories at repository root. No new IPC channels — clipboard is written directly from the renderer process using `navigator.clipboard.writeText()`, which is available in both Electron's renderer and web browser contexts.
