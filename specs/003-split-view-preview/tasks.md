# Tasks: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

> **Prerequisite**: Spec 002 (`002-create-edit-md`) must be merged. This feature creates `EditorPane` (a thin wrapper around spec 002's `MarkdownEditor`) in Phase 1 and reuses the spec 002 save/discard flow (`useEditor` hook + `ConfirmModal`).

---

## Phase 1 — Setup

> Install the one new dependency and prepare the navigation entry point.

- [X] T001 Install `react-resizable-panels` v2 and add it to `package.json` as a production dependency
- [X] T002 Add a `SplitViewPage` route/entry point in `src/renderer/src/App.jsx` so the page can be navigated to from the editor
- [X] T002a [US1] Create `EditorPane` component in `src/renderer/src/components/EditorPane/index.jsx` — thin controlled wrapper around the existing `MarkdownEditor` component; accepts `value`, `onChange`, `onSave`, `onDiscard` props and forwards them; add `src/renderer/src/components/EditorPane/EditorPane.module.css` with a full-height scrollable container style (this is the component reused by `SplitViewPage`)

---

## Phase 2 — Foundational

> Shared building blocks required by all three user stories. Must be complete before Phase 3.

- [X] T003 [P] Create `useDebounce` hook in `src/renderer/src/hooks/useDebounce.js` — accepts `(value, delay)`, returns the debounced value using `useEffect` + `setTimeout` cleanup
- [X] T004 [P] Create `PreviewPane` component in `src/renderer/src/components/PreviewPane/index.jsx` — accepts `content` (string) prop and renders it using the existing `MarkdownViewer` component; add `src/renderer/src/components/PreviewPane/PreviewPane.module.css` with a scrollable container style

---

## Phase 3 — User Story 1: Open Editor in Split-View Mode (P1)

**Story goal**: Activate a two-pane layout from the editor — editor left, live-rendered preview right. Preview updates within 1 second of typing.

**Independent test**: Open any document, click Split View, type `# Hello` in the editor, verify the heading renders in the preview within 1 second.

- [X] T005 [P] [US1] Create `SplitDivider` component in `src/renderer/src/components/SplitDivider/index.jsx` — thin wrapper around `react-resizable-panels` `<PanelGroup direction="horizontal">`, `<Panel>` (×2), and `<PanelResizeHandle />`; enforce `minSize={20}` on each panel; add `src/renderer/src/components/SplitDivider/SplitDivider.module.css`
- [X] T006 [P] [US1] Create `useSplitView` hook in `src/renderer/src/hooks/useSplitView.js` — manages `viewMode` state (`"split" | "editor" | "preview"`), defaults to `"split"`, exposes `viewMode` and `setViewMode`
- [X] T007 [US1] Create `SplitViewPage.jsx` in `src/renderer/src/pages/SplitViewPage.jsx` — composes `EditorPane` (left panel), `SplitDivider`, and `PreviewPane` (right panel); wires `useDebounce(editorContent, 300)` and passes debounced value to `PreviewPane`; integrates `useSplitView` for mode state
- [X] T008 [US1] Add `src/renderer/src/pages/SplitViewPage.module.css` — full-height flex container, no overflow on the outer wrapper, panels fill available height
- [X] T009 [US1] Add a Split View toolbar button in the editor view (from spec 002) that navigates to / activates `SplitViewPage` with the current document loaded
- [X] T010 [US1] Write `tests/renderer/SplitViewPage.test.jsx` — render `SplitViewPage` with a stub document, assert both editor and preview panes are present in the DOM, assert preview displays debounced content after simulated typing

---

## Phase 4 — User Story 2: Synchronized Scrolling (P2)

**Story goal**: Scrolling either pane drives the other proportionally so the visible section always matches across panes.

**Independent test**: Open a 200-line document in split-view, scroll the editor to 50% — verify the preview scrolls to approximately 50% of its height.

- [X] T011 [US2] Create `useSyncScroll` hook in `src/renderer/src/hooks/useSyncScroll.js` — accepts `{ enabled }`, returns `{ editorScrollRef, previewScrollRef }`; on `scroll` in either container, computes `ratio = scrollTop / (scrollHeight - clientHeight)` and applies it to the other container; uses `isSyncingRef` boolean guard to prevent feedback loops; disables all listeners when `enabled` is `false`
- [X] T012 [US2] Wire `useSyncScroll` into `SplitViewPage.jsx` — attach `editorScrollRef` and `previewScrollRef` to the editor and preview scroll containers respectively; pass `syncEnabled` state to hook
- [X] T013 [P] [US2] Add a Sync Scroll toggle button to the `SplitViewPage` toolbar — controls `syncEnabled` boolean state; displays active/inactive visual state
- [X] T014 [US2] Write `tests/renderer/useSyncScroll.test.js` — unit-test the scroll ratio formula, verify `isSyncingRef` prevents re-entrant scroll calls, verify listeners are detached when `enabled` is `false`

---

## Phase 5 — User Story 3: Toggle Individual Panes (P3)

**Story goal**: Collapse the preview to full-editor mode, collapse the editor to full-preview mode, and restore split-view — without any content loss.

**Independent test**: In split-view, click Editor Only — preview pane disappears and editor fills full width; click Split View — both panes reappear with content intact.

- [X] T015 [US3] Create `ViewModeToggle` component in `src/renderer/src/components/ViewModeToggle/index.jsx` — renders three toggle buttons (Split / Editor Only / Preview Only); accepts `viewMode` and `onModeChange` props; marks the active mode visually; add `src/renderer/src/components/ViewModeToggle/ViewModeToggle.module.css`
- [X] T016 [US3] Wire `ViewModeToggle` into `SplitViewPage.jsx` — connect `viewMode` and `setViewMode` from `useSplitView`; conditionally render editor panel, preview panel, or both based on `viewMode`; ensure `EditorPane` is never unmounted (use CSS hide, not conditional render) so editor content is never discarded on mode switch
- [X] T017 [US3] Add CSS rules to `SplitViewPage.module.css` and panel components for `editor`/`preview`-only modes — hidden pane uses `display: none` on the panel wrapper while the visible pane expands to 100% width
- [X] T018 [US3] Extend `tests/renderer/SplitViewPage.test.jsx` — test that clicking Editor Only hides the preview pane, clicking Preview Only hides the editor pane, and that toggling back to Split restores both; verify editor content string is unchanged across all mode switches

---

## Phase 6 — Polish & Cross-Cutting Concerns

- [X] T019 [P] Write `tests/renderer/useDebounce.test.js` — assert debounced value does not update before delay expires, and does update after delay using Jest fake timers
- [X] T020 [P] Add keyboard shortcut for split-view toggle (`Ctrl+\` / `Cmd+\`) — register a `keydown` listener in `SplitViewPage` that cycles `viewMode` between `"split"`, `"editor"`, and `"preview"`
- [X] T021 Verify `minSize={20}` enforcement on `SplitDivider` panels — manual test: drag divider to extreme; confirm neither pane collapses below 20% width
- [X] T022 Add empty-document placeholder to `PreviewPane` — when `content` is an empty string, display a subtle "Nothing to preview yet" message instead of a blank pane
- [X] T023 [US1] Wire spec 002 save/discard flow into `SplitViewPage.jsx` — import and invoke `useEditor` hook (from spec 002) to manage `isDirty` state; ensure the back-navigation action in the toolbar checks `isDirty` and triggers the same `ConfirmModal` dialog used in `EditorPage`; extend `tests/renderer/SplitViewPage.test.jsx` to assert the unsaved-change warning modal appears when navigating away with unsaved content (covers FR-009 and US1 acceptance scenario 5)
- [X] T024 [P] Apply minimum-width guard to `SplitViewPage.module.css` — set `min-width: 900px` on the outer split-view container, or add a responsive rule that falls back to editor-only mode below 900 px; add an assertion in `tests/renderer/SplitViewPage.test.jsx` that the outer container carries the correct CSS class (covers SC-005 and the narrow-screen edge case from spec.md)

---

## Dependencies

```
Phase 1 (Setup)
  └─▶ Phase 2 (Foundational: useDebounce, PreviewPane)
        └─▶ Phase 3 (US1: SplitViewPage core — depends on PreviewPane + useDebounce)
              └─▶ Phase 4 (US2: useSyncScroll — wired into SplitViewPage)
              └─▶ Phase 5 (US3: ViewModeToggle — wired into SplitViewPage)
                    └─▶ Phase 6 (Polish)
```

Phase 4 and Phase 5 are independent of each other and can be developed in parallel once Phase 3 is merged.

---

## Parallel Execution

**Within Phase 2** (T003, T004): Both hooks/components touch separate files — develop simultaneously.

**Within Phase 3** (T005, T006): `SplitDivider` and `useSplitView` are independent files — develop simultaneously. T007 (`SplitViewPage`) depends on both and must come after.

**Within Phase 4** (T013): Sync scroll toggle button (T013) can be built alongside the hook (T011); wiring (T012) comes last.

**Phases 4 and 5**: Fully parallel once Phase 3 is complete — no shared files until T016 wires both into `SplitViewPage`.

**Within Phase 6** (T019, T020): Independent files, fully parallel.

---

## Implementation Strategy

**MVP (Phase 1–3)**: Install dependency → shared hooks/components → compose `SplitViewPage` with live preview. This alone satisfies the P1 user story and all of SC-001.

**Increment 2 (Phase 4)**: Add synchronized scrolling. Satisfies P2 user story and SC-002.

**Increment 3 (Phase 5)**: Add pane toggles. Satisfies P3 user story and SC-003/SC-004.

**Polish (Phase 6)**: Tests, keyboard shortcut, edge-case hardening.

---

## Format Validation

All tasks: ✅ checkbox — ✅ Task ID — ✅ `[P]` marker where applicable — ✅ `[USn]` label in story phases — ✅ file path in description.  
Total tasks: **25** across 6 phases.

| Phase | Story | Task count |
|-------|-------|-----------|
| 1 — Setup | — | 3 |
| 2 — Foundational | — | 2 |
| 3 — US1 Split-View Core | P1 | 6 |
| 4 — US2 Sync Scroll | P2 | 4 |
| 5 — US3 Pane Toggles | P3 | 4 |
| 6 — Polish | — | 6 |
| **Total** | | **25** |
