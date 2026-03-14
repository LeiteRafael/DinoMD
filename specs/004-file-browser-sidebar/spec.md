# Feature Specification: Left-Side File Browser Sidebar

**Feature Branch**: `004-file-browser-sidebar`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "um visualizador de arquivos ao lado esquerdo parecido com o BEAR MD"

## Overview

A persistent sidebar panel displayed on the left side of the application that lists the user's markdown documents. Inspired by Bear MD's navigation panel, the sidebar provides a fast, visual way to browse and switch between files without leaving the editing or reading context.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Open Files from Sidebar (Priority: P1)

The user has several markdown documents saved in the application. They want to navigate between them quickly using the left sidebar instead of going back to the main document list page.

**Why this priority**: This is the core value of the feature. Without the ability to list and open files, the sidebar serves no purpose. All other stories build on this.

**Independent Test**: Can be tested by opening the app with at least two documents, confirming the sidebar shows all documents, and clicking one to open it in the main content area.

**Acceptance Scenarios**:

1. **Given** the app is open with documents, **When** the sidebar is visible, **Then** each document appears as a row showing its title and a short content preview.
2. **Given** the sidebar is visible, **When** the user clicks a document row, **Then** the document opens in the main area (editor, reader, or split view depending on the current mode).
3. **Given** the sidebar is visible, **When** the user is already viewing a document, **Then** that document's row is visually highlighted/selected in the sidebar.
4. **Given** no documents exist, **When** the sidebar is visible, **Then** it shows a friendly empty state message inviting the user to create a document.

---

### User Story 2 - Search/Filter Documents in Sidebar (Priority: P2)

The user has many documents and wants to quickly narrow down the sidebar list by typing part of a document title or content.

**Why this priority**: With a growing document collection, filtering is critical for productivity. A plain list becomes unwieldy beyond ~20 documents.

**Independent Test**: Can be tested independently by entering text in the sidebar search field and verifying the list filters in real time.

**Acceptance Scenarios**:

1. **Given** the sidebar is visible with multiple documents, **When** the user types in the search field, **Then** the list updates in real time to show only documents whose title or preview text matches the query.
2. **Given** a search query is active, **When** the user clears the search field, **Then** the full document list is restored.
3. **Given** a search query matches no documents, **When** the list updates, **Then** a "no results" message is displayed.

---

### User Story 3 - Toggle Sidebar Visibility (Priority: P3)

The user wants to maximize editing space by hiding the sidebar, or bring it back when needed.

**Why this priority**: Sidebar visibility control is a standard productivity affordance, especially important for users working on smaller screens or preferring a distraction-free workspace.

**Independent Test**: Can be tested by clicking the toggle control and verifying the sidebar shows or hides without disrupting the current document view.

**Acceptance Scenarios**:

1. **Given** the sidebar is visible, **When** the user clicks the toggle button (or uses a keyboard shortcut), **Then** the sidebar collapses and the main content area expands to fill the space.
2. **Given** the sidebar is collapsed, **When** the user clicks the toggle button, **Then** the sidebar reappears at its previous width.
3. **Given** the user toggles the sidebar, **When** they close and reopen the app, **Then** the sidebar remains in the same open/closed state as when they left.

---

### User Story 4 - Create a New Document from the Sidebar (Priority: P4)

The user wants to start writing a new document without navigating away from their current document.

**Why this priority**: Bear MD prominently features a "new note" action in the sidebar. This reduces friction when capturing ideas or starting related content.

**Independent Test**: Can be tested by clicking the "New Document" button in the sidebar and verifying a new blank document opens for editing while the sidebar updates to include it.

**Acceptance Scenarios**:

1. **Given** the sidebar is visible, **When** the user clicks the "New Document" (+) button, **Then** a new blank document is created and immediately opened in the editor.
2. **Given** a new document was just created, **When** the sidebar list updates, **Then** the new document appears at the top of the list and is shown as selected.

---

### Edge Cases

- What happens when a document is deleted while it is selected in the sidebar? The sidebar should deselect it and display the empty state or auto-select the nearest remaining document.
- What happens when a document's title changes while it is displayed in the sidebar? The sidebar entry should update in real time without a manual refresh.
- What happens if the user has a very large collection (e.g., 500+ documents)? The sidebar must scroll smoothly without noticeable lag.
- What happens when the sidebar is resized to a very narrow width? Text should truncate gracefully with ellipsis, keeping document entries legible.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sidebar MUST display a scrollable list of all user documents, ordered by most recently modified first.
- **FR-002**: Each sidebar entry MUST show the document title and a short preview of its content (first 1–2 lines of readable text, markdown syntax stripped).
- **FR-003**: The sidebar MUST visually highlight the currently active/open document.
- **FR-004**: Clicking a sidebar entry MUST open that document in the current viewing mode without changing the page layout.
- **FR-005**: The sidebar MUST include a text search field that filters the document list in real time as the user types.
- **FR-006**: The sidebar MUST include a "New Document" action that creates and immediately opens a blank document.
- **FR-007**: The sidebar MUST be toggleable (show/hide) via a visible control element.
- **FR-008**: The sidebar open/closed state MUST persist across application restarts.
- **FR-009**: The sidebar MUST update its document list automatically when documents are added, renamed, or deleted.
- **FR-010**: When the document list is empty (no documents and no active search), the sidebar MUST display an empty state prompt.
- **FR-011**: When a search query returns no results, the sidebar MUST display a "no results" message.
- **FR-012**: The sidebar width MUST be user-resizable via drag, within defined minimum and maximum bounds.
- **FR-013**: The sidebar width MUST persist across application restarts.

### Key Entities

- **Document Entry**: A sidebar row representing a single document; carries title, content preview snippet, last-modified timestamp, and active/selected state.
- **Sidebar State**: Persisted configuration covering the open/closed toggle and current width value.
- **Search Query**: A transient user-entered string used to filter the visible document entries in real time.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate and open any document from the sidebar in under 5 seconds when browsing a list of up to 50 documents.
- **SC-002**: The sidebar document list renders fully within 1 second of the application loading, for collections of up to 200 documents.
- **SC-003**: Typing in the sidebar search field produces filtered results within 200 milliseconds of each keystroke.
- **SC-004**: The sidebar toggle opens or closes within 150 milliseconds of activation with no visible disruption to the main content area.
- **SC-005**: User-configured sidebar state (open/closed, width) is restored on every application startup with 100% consistency.
- **SC-006**: At least 90% of users in usability testing can use the sidebar to locate and switch documents on their first attempt without instruction.

---

## Assumptions

- Documents are already stored and managed by the existing document system (features 001–003); the sidebar reads from the same data source.
- Only one document is active at a time; "active document" means the one currently open in the main content area.
- The sidebar is always anchored to the left edge and is not detachable or floatable.
- Document content previews are derived from raw markdown text (first ~200 characters of raw content), with markdown syntax tokens stripped, and truncated to 150 visible characters for readability.
- The sidebar is present in all views where a document can be edited or read (Editor Page, Split View Page, Reader Page).
- Reasonable default bounds: minimum sidebar width ~200px, maximum ~400px.
