# Feature Specification: Code Snapshot Export (Carbon-style PNG View)

**Feature Branch**: `010-code-snapshot-export`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: User description: "Code Snapshot Export (Carbon-style PNG View)"

## Clarifications

### Session 2026-03-21

- Q: What happens to ViewMode when the user switches to a different file — does it persist or reset? → A: Reset to Code mode on every file switch
- Q: What should happen if PNG export fails (e.g., blank capture, write error)? → A: Show a brief inline error message in the panel header (e.g., "Export failed. Try again.")
- Q: What pixel density should the exported PNG use? → A: 2x (high-DPI) for sharp output on modern screens and in documentation
- Q: Should the Snapshot title bar always display a label, and if so what? → A: Always show filename; fall back to the inferred language label if no filename is available

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Snapshot View (Priority: P1)

As a developer viewing a README in the split-view panel, I want to switch the code panel between a plain view and a styled snapshot view, so I can see my code in a visually polished format without leaving the app.

**Why this priority**: The toggle is the entry point to all snapshot functionality. Without it, no other scenario is reachable. Delivering just the toggle with a styled view (no export) already provides visible value to the user.

**Independent Test**: Can be fully tested by opening a file with code, clicking the "Snapshot" toggle button, and verifying the styled window chrome and One Monokai theme appear. The "Code" toggle restores the plain view. No export functionality is needed to validate this story.

**Acceptance Scenarios**:

1. **Given** a file is open in split-view with code visible, **When** the user clicks the "Snapshot" toggle button, **Then** the code panel renders a macOS-style window frame with traffic-light dots and One Monokai syntax highlighting.
2. **Given** the panel is in Snapshot mode, **When** the user clicks the "Code" toggle button, **Then** the code panel returns to the plain, unstyled view.
3. **Given** the app is opened on any file, **When** the split-view is first loaded, **Then** the default active mode is "Code" (plain view).
5. **Given** a file named `server.js` is open in Snapshot mode, **When** the user views the title bar, **Then** the title bar displays `server.js` centered and muted.
5. **Given** a file with no name (untitled buffer) is open in Snapshot mode, **When** the user views the title bar, **Then** the title bar displays the inferred language label (e.g., `JavaScript`) centered and muted; if the language cannot be inferred, the title bar is empty.

---

### User Story 2 - Export Snapshot as PNG (Priority: P2)

As a developer, I want to export the current Snapshot view as a PNG image, so I can share a polished code snippet on social media, in documentation, or in a pull request comment.

**Why this priority**: Export is the primary output value of this feature. It depends on P1 (Snapshot view must exist first), making it naturally second priority.

**Independent Test**: Can be fully tested by activating Snapshot mode, clicking "Export PNG", and verifying a PNG file is downloaded that contains only the styled window frame and code — with no surrounding app UI visible.

**Acceptance Scenarios**:

1. **Given** the panel is in Snapshot mode, **When** the user clicks the "Export PNG" button, **Then** a PNG file is downloaded to the user's system.
2. **Given** a file named `server.js` is open, **When** the user exports the snapshot, **Then** the downloaded file is named `snapshot-server.js.png`.
3. **Given** no filename is available (e.g., untitled buffer), **When** the user exports, **Then** the file is named `snapshot.png`.
4. **Given** the panel is in "Code" (plain) mode, **When** the user looks at the panel header, **Then** the "Export PNG" button is not visible.
5. **Given** the snapshot is exported, **When** the PNG is opened, **Then** the image contains only the styled window frame and code content, with no surrounding application chrome or UI.
6. **Given** the export operation fails, **When** the user clicks "Export PNG", **Then** a brief inline error message appears in the panel header (e.g., "Export failed. Try again.") and no file is downloaded.

---

### User Story 3 - Syntax Highlighting in Snapshot (Priority: P3)

As a developer, I want the code in the Snapshot view to have accurate syntax highlighting using the One Monokai theme, so the exported image looks professional and semantically colored.

**Why this priority**: Enhances the visual quality of the snapshot. The feature is usable without it (P1 and P2 still deliver value), but correct coloring is important for the polished output.

**Independent Test**: Can be fully tested by opening files of different languages (e.g., `.js`, `.py`, `.ts`), switching to Snapshot mode, and verifying that keywords, strings, functions, comments, and numbers each render in their designated One Monokai color.

**Acceptance Scenarios**:

1. **Given** a JavaScript file is open in Snapshot mode, **When** the code contains keywords, strings, and function names, **Then** each token type is rendered in its correct One Monokai color.
2. **Given** a file with a known extension (e.g., `.py`, `.ts`, `.sh`), **When** Snapshot mode is activated, **Then** syntax highlighting is applied using the language inferred from the file extension.
3. **Given** a file with an unknown or missing extension, **When** Snapshot mode is activated, **Then** the code renders without syntax coloring but with correct typography and theme background.

---

### Edge Cases

- What happens when the code panel contains a very long line? → Long lines must not cause the window frame to overflow; horizontal scrolling is applied inside the snapshot view, and the image is clipped at the window boundary on export.
- What happens when the code block is empty? → The window chrome renders with a centered placeholder: `// No code to display`.
- What happens when no filename is known? → The export falls back to `snapshot.png`.
- What happens when the language cannot be determined from the file extension? → Syntax highlighting is skipped; typography and theme background still apply.
- What happens when the user resizes the panel while in Snapshot mode? → The snapshot view reflows to fit the available panel width without breaking the window frame layout.
- What happens when the user opens a different file while in Snapshot mode? → The panel resets to Code (plain) mode; each file always opens in Code mode regardless of the previous mode.
- What happens if the PNG export fails? → A brief inline error message is displayed in the panel header (e.g., "Export failed. Try again."); no file is written or downloaded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The split-view code panel header MUST include a two-option toggle with labels "Code" and "Snapshot", with only one option active at a time.
- **FR-002**: The default active mode on load MUST be "Code" (plain, unstyled view).
- **FR-003**: In Snapshot mode, the code panel MUST render a macOS-style window frame containing: three circular traffic-light dots (Close #FF5F57, Minimize #FFBD2E, Maximize #28C840) in the top-left, and a dark title bar background (#282c34).
- **FR-004**: The title bar in Snapshot mode MUST display the filename centered and muted; if no filename is available, it MUST fall back to the inferred language label (e.g., `JavaScript`); if neither is available, the title bar area is left empty.
- **FR-005**: In Snapshot mode, the code content area MUST apply the One Monokai color palette: background #282c34, foreground #abb2bf, keywords #c678dd, strings #98c379, functions #61afef, numbers/constants #d19a66, comments #5c6370 italic, types/classes #e5c07b, punctuation #abb2bf.
- **FR-006**: The code content area in Snapshot mode MUST use a monospace font at 13–14px size, line-height 1.6, and internal padding of 20px vertical / 24px horizontal.
- **FR-007**: In Snapshot mode, long lines MUST trigger horizontal scrolling within the styled window; the window frame MUST NOT expand beyond its container.
- **FR-008**: When the code block is empty in Snapshot mode, the window chrome MUST render with the placeholder text `// No code to display`.
- **FR-009**: Syntax highlighting language MUST be inferred from the file extension using the same logic already in use for the split-view plain code panel.
- **FR-010**: An "Export PNG" button MUST be displayed in the panel header only when Snapshot mode is active; it MUST NOT be visible in Code mode.
- **FR-011**: Clicking "Export PNG" MUST capture the styled window frame and code area as a PNG image and trigger a file download, excluding any surrounding application UI.
- **FR-012**: The exported PNG filename MUST follow the pattern `snapshot-<filename>.<ext>.png`; when no filename is available, it MUST fall back to `snapshot.png`.
- **FR-013**: When the user opens or switches to a different file, the code panel view mode MUST reset to "Code" (plain) — Snapshot mode is NOT persisted across file switches.
- **FR-014**: If the PNG export fails for any reason, the system MUST display a brief inline error message in the panel header; the error MUST NOT crash the panel or leave it in a broken state.
- **FR-015**: The exported PNG MUST be captured at 2x pixel density (high-DPI) to ensure the image appears sharp on modern screens and in documentation.

### Key Entities

- **ViewMode**: Represents the current display state of the code panel — either `code` (plain) or `snapshot` (styled). Determines visibility of the Export PNG button. Resets to `code` on every file switch; not persisted across files.
- **SnapshotFrame**: The visual window-chrome container rendered in Snapshot mode, including the title bar, traffic-light dots, filename label (with language fallback), and inner code area.
- **CodeSnapshot**: The content captured for PNG export — composed of the SnapshotFrame and its highlighted code content, bounded to the panel width.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between Code and Snapshot modes with a perceived response time under 500 milliseconds.
- **SC-002**: The exported PNG file contains only the styled window frame and code content at 2x pixel density — no application UI elements appear in the exported image in 100% of export attempts.
- **SC-003**: The exported PNG filename follows the defined naming convention (`snapshot-<filename>.<ext>.png` or `snapshot.png`) in 100% of cases.
- **SC-004**: Syntax highlighting correctly categorizes and colors token types (keywords, strings, functions, comments, numbers) for all file extensions supported by the existing highlighting logic.
- **SC-005**: Empty code blocks always render the `// No code to display` placeholder in Snapshot mode — never a blank or broken frame.
- **SC-006**: The "Export PNG" button is absent in Code mode and present in Snapshot mode in 100% of observed states, across all supported file types.

## Assumptions

- The existing split-view panel already has a header bar where the toggle and export button can be placed without requiring a major layout restructure.
- The existing syntax highlighting logic (used in the plain code panel) exposes the language token or file-extension mapping that Snapshot mode can reuse.
- PNG export is performed entirely on the client side — the image is generated from the visible snapshot frame without any server involvement.
- The feature targets the Electron desktop build; web build behavior is considered out of scope for v1 but should not be broken by the changes.
- One Monokai color values specified in the feature description are the exact design reference — no color variation or theming toggle is needed for v1.

## Out of Scope (v1)

- Custom theme selection (One Monokai only)
- Editing code inside the Snapshot view
- Shadow or glow effects around the window frame
- Padding or background customization controls
- Web/browser build support for PNG export
