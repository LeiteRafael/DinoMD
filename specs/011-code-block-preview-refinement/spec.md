# Feature Specification: Code Editor & Snapshot UX Refinement (Background + Change Indicators)

**Feature Branch**: `011-code-block-preview-refinement`  
**Created**: 2026-03-28  
**Status**: Ready for Implementation  
**Input**: User description: "Improve code block preview area background" + "Add change indicator gutter"  
**Related**: GitHub Issue #12 — "Adjust preview area background in the code editor"  
**Design Decision**: ✅ Alternative A (Theme-Aware Solid Background) — documented in `design-decision.md`

## Problem Statement

The code snapshot preview area in DinoMD uses a hard-coded dark gray background (`#1e2128`) for two surfaces:

1. **SnapshotPane `.container`** — the outer wrapper surrounding the macOS-style code snapshot card.
2. **MarkdownViewer `.snapshotModal`** — the modal overlay that displays the snapshot in the markdown preview.

This flat dark gray does not adapt to the user's active theme (light or dark mode), creating a visual disconnect with the rest of the application. In light mode the dark container feels especially jarring. In dark mode the gray is subtly different from the actual application background (`--color-bg: #1a1d23`), producing an awkward "almost but not quite matching" effect. The result is an unattractive, non-cohesive appearance that undermines the polished snapshot experience.

## Design Alternatives

✅ **DECISION MADE**: Alternative A selected (Theme-Aware Solid Background)  
See `design-decision.md` for complete trade-off analysis and rationale.

### Alternative A — Theme-Aware Solid Background ✅ SELECTED

Replace the hard-coded `#1e2128` with the existing global theme variables so both surfaces automatically follow light/dark mode:

- Light mode: use `--color-bg` (`#f8f9fa`)
- Dark mode: use `--color-bg` (`#1a1d23`)

**Pros**: Minimal CSS change; fully integrates with existing theme system; no new visual assets; consistent with project patterns.  
**Cons**: May look "flat" without card separation — mitigated by existing border/shadow from code block styling.

### Alternative B — Remove Container Background (Transparent)

*Deferred to v2+. Initially explored but not selected; available as fallback if A causes conflicts.*

### Alternative C — Subtle Gradient or Soft Vignette

*Deferred to v2+ polish phase. Rationale: adds maintenance burden and design system complexity without critical value.*

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Theme-Responsive Snapshot Background (Priority: P1)

As a user viewing or exporting a code snapshot, I want the preview area background to blend naturally with the application's current theme, so the snapshot feels like a cohesive part of the editor rather than an awkwardly colored rectangle.

**Why this priority**: This is the core visual problem. Fixing the hard-coded background to respect the active theme addresses the primary user complaint and delivers immediate visual improvement in both light and dark mode.

**Independent Test**: Can be fully tested by opening a code snapshot in both light and dark mode and verifying the surrounding area visually matches the application theme — no jarring color mismatch.

**Acceptance Scenarios**:

1. **Given** the application is in dark mode, **When** the user views a code snapshot in the SnapshotPane, **Then** the container background blends with the application's dark theme and is not a visibly different shade of gray.
2. **Given** the application is in light mode, **When** the user views a code snapshot in the SnapshotPane, **Then** the container background blends with the light theme — no dark gray rectangle appears.
3. **Given** the application is in dark mode, **When** the user opens the snapshot modal in MarkdownViewer, **Then** the modal overlay background matches the dark theme.
4. **Given** the application is in light mode, **When** the user opens the snapshot modal in MarkdownViewer, **Then** the modal overlay background matches the light theme.

---

### User Story 2 — Snapshot Card Visual Separation (Priority: P2)

As a user, I want the code snapshot card to be clearly distinguishable from its surrounding area regardless of theme, so I can always identify the boundaries of the exportable snapshot at a glance.

**Why this priority**: After the background is made theme-aware, the card may lose visual separation from its surroundings, especially when both share similar dark tones. Ensuring the card stands out is essential for usability.

**Independent Test**: Can be fully tested by viewing a code snapshot in both light and dark mode and verifying the card edges are clearly distinguishable from the background — through contrast, border, or shadow.

**Acceptance Scenarios**:

1. **Given** the SnapshotPane background now matches the theme, **When** the user views the snapshot card in dark mode, **Then** the card's edges are visually distinct from the surrounding area (via contrast, border, or shadow).
2. **Given** the SnapshotPane background matches the theme, **When** the user views the snapshot card in light mode, **Then** the card's edges are visually distinct from the surrounding area.
3. **Given** the user exports the snapshot as PNG, **When** the image is rendered, **Then** only the card content is captured — the surrounding theme background is not included in the export.

---

### User Story 4 — Text Change Indicators in Code Block Gutter (Priority: P2)

As a developer editing code, I want to see color-coded indicators in the left gutter showing which lines have been added, modified, or deleted relative to the original state, so I can quickly identify changes in my code without reading line-by-line.

**Why this priority**: This feature enhances the editing experience by providing visual feedback on code modifications. It's independent of the background refinement and adds useful functionality for developers tracking their edits.

**Independent Test**: Can be fully tested by editing code in a code block, adding new lines (target green indicator), modifying existing lines (target orange/yellow indicator), and deleting lines (target red indicator). Verify each type of change produces the correct colored marker in the gutter.

**Acceptance Scenarios**:

1. **Given** a code block with existing content, **When** the user adds a new line, **Then** a green colored indicator appears in the left gutter next to that line number.
2. **Given** a code block with existing content, **When** the user modifies an existing line, **Then** an orange/yellow colored indicator appears in the left gutter next to that line number.
3. **Given** a code block with existing content, **When** the user deletes a line, **Then** a red colored indicator appears in the gutter at the position where the deletion occurred (or next to the adjacent line).
4. **Given** the user has made changes to multiple lines in a code block, **When** they view the code, **Then** all changes are simultaneously visible with their corresponding color indicators.
5. **Given** the user saves the code block or exits edit mode, **When** they return to edit mode or reload, **Then** the change indicators reset (baseline resets to the saved/current state).
6. **Given** the user hovers over or focuses on a change indicator, **When** the indicator is interacted with, **Then** a tooltip or visual emphasis appears showing the type of change (e.g., "Added line", "Modified line", "Deleted line").

---

### Edge Cases

- What happens if the user has a custom theme or overrides CSS variables? → The snapshot background should derive from the global theme variables, so any valid theme override is automatically respected.
- What happens if the snapshot card background and theme background are very similar in luminance? → The card must always have a visible boundary (border or shadow) to maintain visual separation.
- What happens during the theme transition animation (if any)? → The snapshot background should transition smoothly alongside other themed elements, with no flash of the old hard-coded color.
- What happens to existing exported PNG images? → No impact; export captures only the card content, not the container background.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SnapshotPane `.container` background MUST adapt to the active application theme (light or dark mode) instead of using a hard-coded color value.
- **FR-002**: The MarkdownViewer `.snapshotModal` overlay background MUST adapt to the active application theme instead of using a hard-coded color value.
- **FR-003**: The snapshot card (`.windowChrome` and `.codeArea`) MUST remain visually distinguishable from the surrounding container in both light and dark mode — through sufficient contrast, a border, a shadow, or a combination.
- **FR-004**: When the user switches between light and dark mode, the snapshot container and modal overlay backgrounds MUST update to reflect the new theme without requiring a page reload or component remount.
- **FR-005**: The background styling MUST use the existing global theme CSS variables (`--color-bg`, `--color-surface`, `--color-border`) rather than introducing new hard-coded color values.
- **FR-006**: The PNG export MUST NOT be affected by this change — the exported image MUST continue to capture only the snapshot card content, not the surrounding container background.
- **FR-007**: The visual change MUST apply consistently to both the standalone SnapshotPane view and the MarkdownViewer snapshot modal overlay.
- **FR-008**: A change indicator gutter MUST display in the left margin of code blocks showing the status of each line: green for added lines, orange/yellow for modified lines, red for deleted lines.
- **FR-009**: Change indicators MUST be computed by comparing the current code state to a baseline (original/saved state) — baseline initializes when the file is first loaded (from `session.savedContent`) and resets after save or discard operations.
- **FR-010**: Change indicators MUST be theme-aware and remain visible in both light and dark mode with sufficient contrast against the gutter background.
- **FR-011**: Change indicators MUST not interfere with the existing code block marker (`</>` labels) positioning or functionality.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In both light and dark mode, the snapshot container background is visually indistinguishable from or harmonious with the application's themed surfaces — no hard-coded off-theme colors are visible.
- **SC-002**: 100% of snapshot views (SnapshotPane and MarkdownViewer modal) reflect the active theme without any hard-coded background color overrides.
- **SC-003**: The snapshot card edges are clearly distinguishable from the surrounding area in both light and dark mode, as verified by visual inspection.
- **SC-004**: Theme switching updates the snapshot background in under 300 milliseconds with no visible flash of the old color.
- **SC-005**: PNG export output remains identical in content and quality before and after this change — no regression in export functionality.
- **SC-006**: Added lines display a green change indicator dot/mark in the gutter; modified lines display orange/yellow; deleted lines display red — verified by adding, editing, and deleting lines in a code block.
- **SC-007**: Change indicators are visible and distinguishable in both light and dark mode with sufficient contrast.
- **SC-008**: Saving or resetting the code block clears and resets the change indicators to reflect the new baseline.

## Assumptions

- The application already supports light and dark mode with global CSS variables (`--color-bg`, `--color-surface`, `--color-border`) that are reliably toggled.
- The snapshot card's internal colors (`.windowChrome` background `#282c34`, One Monokai palette) are intentionally fixed and not part of this change — only the surrounding container/overlay is in scope.
- The PNG export captures only the `.windowChrome` / `.codeArea` content and is not affected by changes to the `.container` or `.snapshotModal` backgrounds.
- The choice among the three design alternatives (A, B, or C) will be finalized during clarification or planning — this spec defines requirements that apply regardless of which alternative is chosen.
- The code change diff algorithm (added/modified/deleted detection) will be implemented using an inline line-by-line comparison utility (no external npm dependencies) that compares current state to a stored baseline.
- Change indicators baseline initializes on file load (capturing `session.savedContent` at first render) and resets after document save or discard operations.
- Zero inline comments in implementation per project constitution (`eslint-rules/no-comments.js`); function naming and structure communicate intent.

## Out of Scope (v1)

- Changing the snapshot card's internal One Monokai color palette
- Adding user-configurable background options or settings
- Modifying the traffic-light dots appearance or behavior
- Adding animation effects beyond basic theme transition
- Changing the snapshot card's font, padding, or layout
- Customizable change indicator colors or styles (fixed green/orange/red for consistency)
- Display of diff hunks or detailed change history (indicators show change type labels only, no hover popups with diff content or inline diffs)
- Integration with version control systems (Git) — change detection is editor-session based only
