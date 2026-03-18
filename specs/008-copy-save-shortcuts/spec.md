# Feature Specification: Copy Actions & Save Shortcut

**Feature Branch**: `008-copy-save-shortcuts`  
**Created**: 2026-03-17  
**Status**: Clarified  
**Input**: User description: "copia para md, copia para formato texto, ctrl para salvar o editor de texto"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save Document with Keyboard Shortcut (Priority: P1)

A user is writing or editing a Markdown document in the DinoMD text editor. Without lifting their hands from the keyboard, they press Ctrl+S to immediately save their current work to disk. The document title shows a dirty-state indicator while there are unsaved changes, giving the user a clear signal before saving.

**Why this priority**: Saving is the most critical editor action. Users expect this muscle memory shortcut in any text editor. Without it, accidental data loss is a constant risk, reducing trust in the application.

**Independent Test**: Open a document from disk in the editor, make a change (observe the dirty indicator appears), press Ctrl+S (observe the dirty indicator disappears), close and reopen — the change must persist.

**Acceptance Scenarios**:

1. **Given** a document opened from disk is in the editor with unsaved changes, **When** the user presses Ctrl+S, **Then** the document is saved to disk immediately without any dialog or confirmation.
2. **Given** a document opened from disk has no unsaved changes, **When** the user presses Ctrl+S, **Then** the action completes silently without error.
3. **Given** the editor is focused, **When** Ctrl+S is pressed, **Then** the shortcut does not trigger any browser or OS-level save dialog.
4. **Given** a document opened from disk is edited, **When** changes are present, **Then** a dirty-state indicator (e.g., a dot or asterisk) appears in the document title or tab.
5. **Given** a dirty document is saved via Ctrl+S, **When** the save completes successfully, **Then** the dirty-state indicator disappears.
6. **Given** a new document that has never been saved to disk is open, **When** the user presses Ctrl+S, **Then** no save action occurs (new/unsaved document save is out of scope for this feature).

---

### User Story 2 - Copy Document Content as Markdown (Priority: P2)

A user has written content in DinoMD and wants to copy the raw Markdown text to paste it into another tool (a chat app, a code review, another editor, a Git commit message, etc.). They trigger a "Copy as Markdown" action and the full raw Markdown source is placed in their clipboard.

**Why this priority**: Sharing Markdown source is a primary use case for Markdown editors. This enables interoperability with other tools and workflows, saving users from manually selecting all text and copying.

**Independent Test**: Open a document with Markdown formatting, activate "Copy as Markdown", paste into any plain text field — the output must contain the raw Markdown syntax (e.g., `**bold**`, `# Heading`).

**Acceptance Scenarios**:

1. **Given** a document is open with Markdown content, **When** the user triggers "Copy as Markdown", **Then** the full raw Markdown source of the document is copied to the system clipboard and a toast notification (e.g., "Copied as Markdown") is shown briefly.
2. **Given** the clipboard contains the copied Markdown, **When** pasted into a plain text editor, **Then** all Markdown syntax characters (`#`, `*`, `_`, `[`, etc.) are preserved exactly.
3. **Given** the document is empty, **When** the user triggers "Copy as Markdown", **Then** the clipboard is set to an empty string and a brief feedback message indicating the document is empty is shown.

---

### User Story 3 - Copy Document Content as Plain Text (Priority: P3)

A user wants to copy the readable content of their Markdown document — without any Markdown syntax — to paste it into a context where formatting marks would be unwanted (an email body, a notes app, a form field). They trigger a "Copy as Plain Text" action and receive clean, readable text in their clipboard.

**Why this priority**: Plain text output targets a different sharing context than raw Markdown. It improves usability when the destination does not render Markdown and the user doesn't want `**asterisks**` appearing in their content.

**Independent Test**: Create a document with headings, bold, italic, and links, trigger "Copy as Plain Text", paste into a plain text field — no Markdown syntax characters should appear.

**Acceptance Scenarios**:

1. **Given** a document with Markdown formatting is open, **When** the user triggers "Copy as Plain Text", **Then** the plain readable text (with Markdown syntax stripped) is copied to the system clipboard and a toast notification (e.g., "Copied as Plain Text") is shown briefly.
2. **Given** the copied plain text is pasted into a plain text field, **Then** heading symbols (`#`), asterisks, underscores, brackets, and other Markdown tokens are absent.
3. **Given** the document contains links (e.g., `[label](url)`), **When** copied as plain text, **Then** only the label text appears, not the URL or brackets.
4. **Given** the document is empty, **When** the user triggers "Copy as Plain Text", **Then** the clipboard is set to an empty string and a brief feedback message indicating the document is empty is shown.

---

### Edge Cases

- What happens when the document cannot be saved (e.g., file permissions error)? The user must receive a visible error notification.
- What happens if the clipboard API is unavailable or blocked? The copy action must fail gracefully with a visible error message (applies to both Electron and web modes).
- What happens in web mode when the browser denies clipboard permission? The application must show a clear error message explaining the permission issue.
- What happens when the document contains only whitespace? Copy actions should treat it as effectively empty and provide feedback.
- What happens when Ctrl+S is pressed while a save is already in progress? The second trigger should be ignored or queued without duplicating writes.
- What happens when Ctrl+S is pressed on a new document that was never saved to disk? The action is silently ignored — Save As and new file creation are out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to save a document that was opened from disk by pressing Ctrl+S while the editor is focused. Ctrl+S has no effect on new documents that have never been saved to disk.
- **FR-002**: The Ctrl+S shortcut MUST save the document to disk without displaying a file dialog or requiring additional confirmation.
- **FR-003**: The application MUST provide a "Copy as Markdown" action that places the full raw Markdown source of the open document into the system clipboard.
- **FR-004**: The application MUST provide a "Copy as Plain Text" action that places the document's readable content — with all Markdown syntax removed — into the system clipboard.
- **FR-005**: Both copy actions MUST be accessible from the editor interface (e.g., toolbar button, context menu, or dedicated action area).
- **FR-006**: When a copy action succeeds on a non-empty document, the system MUST show a brief non-intrusive toast notification (e.g., "Copied as Markdown" or "Copied as Plain Text").
- **FR-007**: When a copy action is triggered on an empty document, the system MUST show a brief non-intrusive message indicating the document is empty.
- **FR-008**: When the Ctrl+S save fails due to a system error, the application MUST display a clear error message describing what went wrong.
- **FR-009**: The "Copy as Plain Text" transformation MUST strip all common Markdown syntax tokens including headings, bold, italic, links, images, code fences, blockquotes, and lists — leaving only readable natural language.
- **FR-010**: Both copy actions MUST function in Electron (desktop) mode and in web browser mode. In web mode, if the browser denies clipboard permission, a clear error message MUST be shown.
- **FR-011**: The editor MUST display a dirty-state indicator (e.g., a dot or asterisk in the document title or tab) when a document opened from disk has unsaved changes. The indicator MUST disappear after a successful save.

### Assumptions

- The Ctrl+S shortcut applies when the text editor pane is focused; it does not conflict with OS-level or browser-level save dialogs.
- Ctrl+S only applies to documents that were opened from disk (have a known file path). New documents without a file path are unaffected — Save As / new file creation is out of scope for this feature.
- Both copy actions operate on the entire document content. There is no partial/selection-based copy in this feature scope.
- The copy actions are triggered via UI controls (buttons/menu items); keyboard shortcuts for copy actions may be added in a future iteration.
- Markdown-to-plain-text conversion follows common stripping rules; rendering fidelity (e.g., preserving list structure as indented text) is a nice-to-have, not required.
- The application runs in both Electron (desktop) and web browser modes. All three actions (Ctrl+S, Copy as Markdown, Copy as Plain Text) are expected to work in both environments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can save a document via Ctrl+S in under 500 milliseconds from keypress to completion under normal conditions.
- **SC-002**: 100% of Markdown syntax tokens (headings, bold, italic, links, code, blockquotes) are removed from plain text copy output.
- **SC-003**: The raw Markdown content copied via "Copy as Markdown" is byte-for-byte identical to the document as stored on disk.
- **SC-004**: All three actions (Ctrl+S, Copy as Markdown, Copy as Plain Text) are discoverable by a new user without reading documentation — visible controls exist in the editor UI.
- **SC-005**: Save failures display an error notification within 2 seconds of the failure occurring.
- **SC-006**: Copy actions provide user feedback (success toast or empty-document notice) within 1 second of the action being triggered.
- **SC-007**: The dirty-state indicator appears immediately (within one rendering frame) after the user makes the first edit to a document opened from disk.
- **SC-008**: The dirty-state indicator disappears immediately after a successful Ctrl+S save.
- **SC-009**: Both copy actions work in web browser mode; clipboard permission denial results in a visible error message rather than a silent failure.
