# Quickstart: Code Editor & Snapshot UX Refinement

**Feature**: 011-code-block-preview-refinement
**Date**: 2026-03-28

---

## Manual Verification Guide

### Prerequisites

1. Start the Electron dev server: `npm run dev`
2. Open DinoMD in the Electron window

---

### Test 1: Theme-Responsive Snapshot Background (US1) — ✅ Already Done

1. Open a markdown file containing a code block
2. Switch to Snapshot view
3. **Dark mode**: Container background should match the application dark theme (`#1a1d23`) — no jarring gray rectangle
4. **Light mode**: Toggle to light mode → container background matches light theme (`#f8f9fa`) — no dark gray visible
5. Theme switch should update within 300ms with no color flash

### Test 2: Snapshot Card Visual Separation (US2) — ✅ Already Done

1. In Snapshot view, verify the code card edges are clearly visible via `box-shadow`
2. Export PNG → only card content captured, no surrounding background

### Test 3: Change Indicators in Code Block Gutter (US4) — To Implement

1. Open a markdown file and start editing in the code editor
2. **Add a new line**: Type a new line of text → a green dot/mark should appear in the left gutter next to that line number
3. **Modify an existing line**: Change text on an existing line → an orange dot/mark should appear next to that line number
4. **Delete a line**: Remove a line → a red indicator should appear at the deletion position
5. **Multiple changes**: Make several adds/edits/deletes → all indicators visible simultaneously with correct colors
6. **Scroll sync**: Scroll the editor → indicators stay aligned with their corresponding line numbers
7. **Hover tooltip**: Hover over a change indicator → a tooltip or visual label shows the change type (e.g., "Added line", "Modified line", "Deleted line")
8. **Save**: Save the file → all indicators clear (baseline resets to new content)
9. **Discard**: Make changes then discard → code reverts, indicators clear
10. **Theme switch**: Toggle light/dark mode → indicator colors remain visible with sufficient contrast in both themes
11. **Existing features intact**: Line numbers, active-line highlight, and code block borders (`</>` labels) remain unaffected

---

## Running Tests

```bash
# Unit tests (includes diffUtils tests)
npx vitest run

# E2E tests
npx playwright test
```

## Key Files to Inspect

| File | Purpose |
|------|---------|
| `src/renderer/src/utils/diffUtils.js` | Myers diff algorithm |
| `src/renderer/src/hooks/useChangeIndicators.js` | Baseline + diff state management |
| `src/renderer/src/components/MarkdownEditor/index.jsx` | Gutter integration |
| `src/renderer/src/components/MarkdownEditor/MarkdownEditor.module.css` | Indicator styling |
