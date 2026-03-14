# Research: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

All NEEDS CLARIFICATION items from the Technical Context are resolved below.

---

## Decision 1: Resizable Pane Divider Library

**Question**: Should the resizable divider be built from scratch or use an existing library?

**Decision**: Use `react-resizable-panels` v2.

**Rationale**:
- Maintained by Bryan Vaughn (React core team contributor); stable and widely adopted.
- Zero-config keyboard accessibility (ARIA `separator` + arrow key resize) out of the box — important for desktop apps.
- Works with both CSS modules and inline styles; integrates cleanly with the existing CSS-module pattern in DinoMD.
- v2 API is declarative: `<PanelGroup direction="horizontal">`, `<Panel>`, `<PanelResizeHandle />` — minimal code surface.
- Bundle size: ~8 KB gzipped — negligible for an Electron app.

**Alternatives considered**:
- **`react-split`**: Simpler API but uses direct DOM manipulation; less accessible and not React-idiomatic.
- **Custom drag-with-mouse implementation**: Would require ~100 lines of pointer event handling, accessibility wiring, and edge-case handling (min/max sizes) — not justified.
- **`allotment`**: Good alternative, but v1 only; less active maintenance vs. `react-resizable-panels`.

---

## Decision 2: Live Preview Debounce Strategy

**Question**: How should the live preview be updated without causing performance issues on every keystroke?

**Decision**: Use a custom `useDebounce` hook with a 300 ms delay, backed by `React.useDeferredValue` for large documents.

**Rationale**:
- A 300 ms debounce matches the SC-001 requirement (≤1 s from last keystroke) while avoiding rendering on every character for fast typists.
- `useDeferredValue` (React 18) marks the deferred value as lower priority in the scheduler, so the editor textarea remains responsive even if `MarkdownViewer` rendering takes longer for large documents.
- For documents under ~100 KB (typical Markdown files), the debounce alone is sufficient; `useDeferredValue` acts as a safety net for the edge case of very large files (>500 KB, flagged in spec).
- Implementation: `EditorPane` controls `editorContent` state; the debounced copy is passed to `PreviewPane`.

**Alternatives considered**:
- **Web Worker for parsing**: Offloads `react-markdown` parsing to a background thread. Overkill for typical Markdown files; adds serialization complexity and a significant architecture change not justified for ≤1 MB files.
- **`requestIdleCallback` batching**: Less predictable timing than a fixed debounce; harder to test.
- **500 ms debounce**: Meets the 1 s spec requirement but makes fast typing feel laggy. 300 ms is the industry standard (VS Code, Typora).

---

## Decision 3: Synchronized Scrolling Implementation

**Question**: What is the best approach to synchronize scroll positions between the editor and preview panes?

**Decision**: Proportional scroll-ratio synchronization via `onScroll` handlers with a `isSyncingRef` guard.

**Rationale**:
- Proportional ratio (`scrollTop / (scrollHeight - clientHeight)`) is the simplest and most reliable approach for text-based documents since the editor and preview have different line heights by definition (raw text vs. rendered HTML with headings, paragraphs, images).
- Source-map synchronization (matching each editor line to its rendered DOM node) is used by editors like VS Code for precision, but requires crawling the preview DOM after every render — significantly more complex and fragile for a 1.0 feature.
- The `isSyncingRef` guard (set to `true` before programmatically scrolling the other pane, reset in the next `requestAnimationFrame`) prevents the scroll event triggered by the programmatic scroll from re-triggering the handler in the other direction (infinite loop).
- Spec SC-002 requires ±5% alignment — proportional ratio achieves this for uniform content; acceptable for the scope.

**Alternatives considered**:
- **Source-map / line-based synchronization**: Precise alignment per heading/paragraph, but requires post-render DOM querying and careful invalidation on every re-render. Deferred to a future enhancement.
- **CSS `scroll-snap` + shared state**: Not applicable — the two containers have different content and heights, so snapping points do not correspond.

---

## Decision 4: View Mode State Management

**Question**: Where should the split/editor-only/preview-only view mode state live, and does it need to be persisted?

**Decision**: Local `useState` in `SplitViewPage`, scoped to the current session. Not persisted.

**Rationale**:
- Spec assumption explicitly states: "The default pane split is 50/50; the user can drag the divider to adjust the ratio, but the preference is not persisted across sessions."
- Session-only state avoids adding a new `electron-store` key, keeping the storage schema unchanged.
- If persistence is added in a future spec, it can be lifted to a context or stored via `electron-store` without architectural changes (the hook interface stays the same).
- View mode is not needed outside `SplitViewPage`, so a global state manager (context, Zustand, etc.) is unnecessary.

**Alternatives considered**:
- **React Context**: Overkill for a single-page-scoped state with no cross-tree consumers.
- **Persisting via `electron-store`**: Valid for a future enhancement; out of scope per spec assumptions.

---

## Decision 5: Editor Component Source

**Question**: Does spec 003 need its own editor component or does it reuse the one from spec 002?

**Decision**: Reuse the `EditorPane` component delivered by spec 002. Spec 003 is implemented after spec 002 is merged.

**Rationale**:
- Spec 003 explicitly lists spec 002 as a prerequisite (Dependencies section).
- Duplicating the editor textarea would create two sources of truth for save/discard logic, unsaved-change detection, and keyboard shortcut handling — all owned by spec 002.
- `EditorPane` from spec 002 will expose a controlled interface: `value`, `onChange`, `onSave`, `onDiscard` — spec 003 wires these into `SplitViewPage` state.

**Alternatives considered**:
- **Re-implement a minimal textarea in spec 003**: Creates duplication and divergence with spec 002 save logic. Rejected.
- **Implement both specs together**: Would bloat this plan; the specs are independently shippable slices per the spec design.

---

## Summary Table

| # | Question | Decision |
|---|----------|----------|
| 1 | Resizable divider | `react-resizable-panels` v2 |
| 2 | Live preview update | `useDebounce` 300 ms + `useDeferredValue` |
| 3 | Synchronized scrolling | Proportional ratio + `isSyncingRef` guard |
| 4 | View mode persistence | Session-only `useState` — not persisted |
| 5 | Editor component | Reuse `EditorPane` from spec 002 |
