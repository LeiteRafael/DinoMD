# Feature Specification: DinoMD — Create & Edit Markdown Files

**Feature Branch**: `002-create-edit-md`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Create and edit .md files — users can create new markdown documents from scratch and edit existing ones directly in the app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a New Markdown Document (Priority: P1)

A user wants to start a brand-new `.md` file from within DinoMD. They trigger the "New document" action, give the file a name, and are taken into an editor where they can type Markdown freely. Upon saving, the file is written to disk and the new document card appears on the main page.

**Why this priority**: Creating new content is the entry point to the editing workflow. Without it, users cannot produce any documents inside the app — they would rely entirely on importing externally-created files.

**Independent Test**: Can be fully tested by creating a new document, typing a few lines, saving it, and verifying the file exists on disk and the card appears on the main page — delivering a working create flow end-to-end.

**Acceptance Scenarios**:

1. **Given** the main page is open, **When** the user triggers the "New document" action, **Then** an empty editor opens immediately with a placeholder title ("Untitled"), ready to receive input.
2. **Given** the editor is open with an untitled document, **When** the user triggers Save for the first time, **Then** the application opens a native Save dialog so the user can choose a file name and location before writing to disk.
3. **Given** the user types content in the editor and confirms a file name via the Save dialog, **When** the save operation completes, **Then** the file is persisted on disk with the chosen name and the document card appears on the main page.
4. **Given** the user has chosen a file name via the Save dialog that already exists on disk, **When** the OS dialog confirms the overwrite or a conflict is detected, **Then** the application warns about the conflict and asks for confirmation or a different name before overwriting.
5. **Given** the user triggers the Save dialog and cancels it without choosing a path, **When** the cancellation is confirmed, **Then** no file is created on disk and the editor remains open with its in-memory content intact.

---

### User Story 2 - Edit an Existing Markdown Document (Priority: P2)

A user selects an existing document from the main page and switches from read-only view to edit mode. They modify the text, save the changes, and the updated content is persisted to the same file on disk. The document card on the main page reflects any title change if the file name is updated.

**Why this priority**: Editing is the core writing workflow. Without it, DinoMD is read-only and cannot serve as a notes or documentation tool beyond passive viewing.

**Independent Test**: Can be fully tested by importing a document, opening it, making a visible change, saving, and re-opening to confirm the change persisted.

**Acceptance Scenarios**:

1. **Given** a document is open in read view, **When** the user triggers the "Edit" action, **Then** the document content becomes editable in a text editor, preserving all existing text.
2. **Given** the user has made changes in the editor, **When** they trigger Save, **Then** the changes are written to the original file on disk and the editor reflects the saved state.
3. **Given** the user has made unsaved changes and attempts to leave the editor (back to main page or open another document), **When** the navigation is triggered, **Then** the application warns about unsaved changes and offers the choice to save, discard, or cancel the navigation.
4. **Given** the user discards changes via the confirmation dialog, **When** the dialog is confirmed, **Then** the document reverts to its last saved state and the navigation proceeds.
5. **Given** the file on disk was modified externally while the user had it open, **When** the user attempts to save, **Then** the application notifies the user of the conflict and asks whether to overwrite or reload.

---

### User Story 3 - Delete a Document (Priority: P3)

A user decides to remove a document they no longer need. They trigger the delete action on a document card or from within the document view. After a confirmation step, the file is moved to the OS trash and the card disappears from the main page.

**Why this priority**: Deletion completes the document lifecycle. It is lower priority than create and edit because users can still manage documents externally, but it significantly improves app self-sufficiency.

**Independent Test**: Can be fully tested by importing a document, deleting it via the app, and verifying the card is gone from the main page and the file has been moved to the OS trash (recoverable).

**Acceptance Scenarios**:

1. **Given** a document card is visible on the main page, **When** the user triggers the delete action, **Then** a confirmation dialog appears before any deletion occurs.
2. **Given** the confirmation dialog is shown, **When** the user confirms the deletion, **Then** the file is moved to the OS trash and the card disappears from the main page.
3. **Given** the confirmation dialog is shown, **When** the user cancels, **Then** no file is deleted and the main page remains unchanged.
4. **Given** the file has already been deleted externally (not found on disk), **When** the user attempts to open or delete it in the app, **Then** the application shows a clear message and removes the stale card from the list.

---

### Edge Cases

- What happens when the user saves a document with an empty body (zero-byte file)?
- How does the app handle a file name containing special characters or path separators?
- What if disk write fails due to permissions or a full disk during save?
- What happens if the user renames a document to a name that already exists in the list?
- How does the editor behave with very large files (>1 MB of Markdown)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create a new blank `.md` document from the main page. The editor opens immediately with an untitled in-memory buffer; the user is prompted for a file name and location via a native Save dialog only on the first explicit Save.
- **FR-002**: Users MUST be able to open any existing document in an editable mode from either the main page or the read view.
- **FR-003**: The editor MUST support free-form Markdown text entry, including line breaks, indentation, and all standard Markdown syntax characters.
- **FR-004**: Users MUST be able to save changes explicitly (via a Save action), writing the current editor content to the corresponding file on disk.
- **FR-005**: The application MUST warn users about unsaved changes before navigating away from the editor, offering save, discard, or cancel options.
- **FR-006**: Users MUST be able to delete a document, with a mandatory confirmation step before the file is removed from disk.
- **FR-007**: The application MUST prevent accidental file name conflicts by notifying the user when a chosen name duplicates an existing document name.
- **FR-008**: The application MUST display a clear error message when a save or delete operation fails, without data loss of the unsaved content.
- **FR-009**: The document list on the main page MUST update automatically (add, rename, or remove card) after any create, save, or delete action.
- **FR-010**: The application MUST support renaming a document by changing its file name, accessible from the editor or document card.

### Key Entities

- **Document**: A single `.md` file tracked by the application; has a name, file path on disk, and text content.
- **Editor Session**: A temporary working state representing the in-progress edits to a document; can be saved (persisted) or discarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new document and save their first content in under 30 seconds from the main page.
- **SC-002**: Save operations complete and reflect on disk without any user-perceived delay for documents up to 500 KB.
- **SC-003**: 100% of delete operations require an explicit confirmation step — no document is ever removed without user intent.
- **SC-004**: Users are never shown a blank or corrupted document after a successful save; the saved content always matches what was in the editor.
- **SC-005**: Navigating away from unsaved changes always triggers a warning — no edits are silently lost under any navigation path.

## Assumptions

- The file save location is the same directory from which the file was originally imported, or a default user-chosen folder for newly created documents.
- Autosave is out of scope for this feature; saving is always an explicit user action.
- Undo/redo history is managed by the editor component and resets when the document is closed.
- The application does not support multiple documents open simultaneously in the same editing session (single active editor at a time).
