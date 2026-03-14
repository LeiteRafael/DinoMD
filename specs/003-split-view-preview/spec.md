# Feature Specification: DinoMD — Split-View Live Preview Editor

**Feature Branch**: `003-split-view-preview`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Split-view live preview editor — show two panes side by side: a text editor on the left and a real-time rendered Markdown preview on the right"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Editor in Split-View Mode (Priority: P1)

A user is editing a Markdown document and wants to see how the rendered output looks while they type. They activate the split-view mode, and the screen divides into two panes: a text editor on the left and a live-rendered preview on the right. As the user types in the editor, the preview updates automatically without any manual refresh.

**Why this priority**: The split-view with real-time preview is the defining feature of this specification. Without it, there is nothing else to build. Delivering a working two-pane view with live rendering is the MVP.

**Independent Test**: Can be fully tested by opening a document in split-view, typing a heading and a code block, and verifying both render correctly in the preview pane within one second of typing — end-to-end value delivery.

**Acceptance Scenarios**:

1. **Given** a document is open in the editor, **When** the user activates split-view mode, **Then** the screen divides horizontally into two equal-width panes: editor (left) and preview (right).
2. **Given** split-view is active, **When** the user types or modifies text in the editor pane, **Then** the preview pane updates to reflect the changes within one second, without requiring any manual action.
3. **Given** split-view is active, **When** the user adds a fenced code block with a language annotation, **Then** the preview renders it with proper syntax highlighting.
4. **Given** split-view is active and the document contains headings, lists, links, and images, **When** the view loads, **Then** all elements render correctly in the preview pane.
5. **Given** split-view is active, **When** the user navigates away (back to main page), **Then** any unsaved changes trigger the same warning defined in the Create & Edit feature (spec 002).

---

### User Story 2 - Synchronized Scrolling Between Panes (Priority: P2)

A user is working on a long document in split-view. As they scroll down the editor, the preview pane scrolls to the corresponding position automatically, so they always see the rendered output that matches the text they are currently editing.

**Why this priority**: Synchronized scrolling removes the friction of manually navigating the preview to match the editing position on long documents. Without it, split-view becomes inconvenient for anything longer than a screen.

**Independent Test**: Can be fully tested by opening a document longer than two screen heights in split-view, scrolling the editor halfway down, and verifying the preview pane shows the corresponding section.

**Acceptance Scenarios**:

1. **Given** split-view is active with a document longer than one screen height, **When** the user scrolls in the editor pane, **Then** the preview pane scrolls proportionally to display the matching content section.
2. **Given** split-view is active, **When** the user scrolls in the preview pane, **Then** the editor pane scrolls proportionally to keep the source in sync.
3. **Given** the user is at the top of the editor, **When** they scroll to the very bottom, **Then** the preview also reaches its bottom without misalignment.
4. **Given** synchronized scrolling is active, **When** new content is added that changes the document length, **Then** scroll positions adjust gracefully without snapping or jumping to unexpected positions.

---

### User Story 3 - Toggle Individual Panes (Priority: P3)

A user sometimes wants to focus on just writing (editor only) or just reading the rendered output (preview only), without leaving the split-view workflow entirely. They can toggle either pane to expand the other to full width, and switch back to split-view at any time.

**Why this priority**: Focus modes improve the editing experience for different tasks (drafting vs. proofreading) without requiring the user to change screens. It is an enhancement rather than a core requirement.

**Independent Test**: Can be fully tested by toggling to editor-only, verifying the preview is hidden and the editor occupies full width, then toggling back to split-view and confirming both panes reappear with content intact.

**Acceptance Scenarios**:

1. **Given** split-view is active, **When** the user triggers "editor only" mode, **Then** the preview pane hides and the editor expands to full width.
2. **Given** split-view is active, **When** the user triggers "preview only" mode, **Then** the editor pane hides and the preview expands to full width.
3. **Given** the user is in editor-only or preview-only mode, **When** they trigger "split view" again, **Then** both panes reappear and content in each is exactly as it was before toggling.
4. **Given** the user has unsaved content in the editor, **When** they switch between view modes, **Then** no content is lost and the editor state is fully preserved.

---

### Edge Cases

- What happens when the document is empty and split-view is activated? (Preview shows a blank/placeholder state)
- How does the preview handle a Markdown syntax error or unclosed element?
- What happens on very narrow screen widths where two equal panes become unusable?
- How does the preview behave with images that reference local file paths? (Must render consistently with the read view)
- What if the preview rendering for a very large document (>500 KB) causes noticeable lag? Is there a debounce or throttle on live updates?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to enter split-view mode from the editor view with a single action (button or keyboard shortcut).
- **FR-002**: The split-view layout MUST display the editor pane on the left and the rendered preview pane on the right, side by side.
- **FR-003**: The preview pane MUST update automatically as the user types in the editor pane, with a maximum visible delay of 1 second.
- **FR-004**: The preview MUST render the same Markdown elements as the existing read view (headings, lists, links, images, tables, code blocks with syntax highlighting).
- **FR-005**: Synchronized scrolling MUST keep the editor and preview panes aligned so the visible section of one matches the visible section of the other.
- **FR-006**: Users MUST be able to scroll either pane independently when synchronized scrolling is deliberately disabled (optional toggle).
- **FR-007**: Users MUST be able to toggle to editor-only or preview-only mode from split-view, and return to split-view without losing content.
- **FR-008**: The split-view MUST be accessible from a document already open in the regular editor (spec 002) without requiring the document to be re-opened.
- **FR-009**: All save, discard, and unsaved-change behaviors defined in the Create & Edit feature (spec 002) MUST apply equally when the user is in split-view mode.
- **FR-010**: The divider between the two panes MUST be resizable by the user so they can adjust the width ratio to their preference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The preview pane reflects any typed change within 1 second of the user stopping input — measurable by timing from last keystroke to preview update.
- **SC-002**: Synchronized scrolling keeps both panes aligned within ±5% of relative scroll position for documents up to 1,000 lines.
- **SC-003**: Users can enter and exit split-view mode in a single interaction (one click or one keyboard shortcut) from any editing context.
- **SC-004**: No content is ever lost when switching between split-view, editor-only, and preview-only modes — verified by comparing editor content before and after each toggle.
- **SC-005**: The split-view remains usable (both panes visible and operable) on screen widths of 900 px and above.

## Assumptions

- Split-view is only available when a document is open in editing mode; it is not a standalone view.
- The preview rendering engine is the same one used in the existing read view to ensure visual consistency.
- Synchronized scrolling is enabled by default and can be toggled off; the preference persists for the current session only.
- The default pane split is 50/50; the user can drag the divider to adjust the ratio, but the preference is not persisted across sessions unless explicitly supported.
- This feature depends on spec 002 (Create & Edit Markdown Files) being implemented first.

## Dependencies

- **Spec 002 — Create & Edit Markdown Files**: The editor component and the save/discard workflow are prerequisites for this feature.
