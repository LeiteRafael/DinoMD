# Feature Specification: DinoMD — Markdown Reader Application

**Feature Branch**: `001-dinomd-markdown-reader`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Crie um aplicativo leitor de Markdown chamado DinoMD. O aplicativo permite que os usuários importem e visualizem arquivos .md em uma interface limpa. Os usuários podem reorganizar a ordem desses documentos arrastando e soltando-os na página principal. A estrutura de pastas é plana: os documentos nunca são aninhados dentro de outras pastas. Quando um documento é selecionado, o conteúdo Markdown é renderizado em uma interface de visualização bonita, em formato de mosaico, que prioriza a legibilidade e o realce de sintaxe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import and View Documents (Priority: P1)

A user opens DinoMD for the first time and wants to add their Markdown notes to the app. They import one or more `.md` files from their local file system. The files appear on the main page as individual document cards in a flat list. The user can then click a document card to open and read its full content.

**Why this priority**: Without the ability to import and view documents, no other feature delivers value. This is the fundamental entry point of the application.

**Independent Test**: Can be fully tested by importing a `.md` file and verifying it appears on the main page and its content is accessible — this alone delivers a functional, usable MVP.

**Acceptance Scenarios**:

1. **Given** the application is open and no documents have been imported, **When** the user triggers the import action and selects one `.md` file from their device, **Then** the document appears as a card on the main page displaying the file name.
2. **Given** the main page has at least one document card, **When** the user clicks on a document card, **Then** the rendered view of that document opens.
3. **Given** the user attempts to import a non-`.md` file, **When** the selection is confirmed, **Then** the application rejects the file and displays a clear error message indicating only `.md` files are supported.
4. **Given** the user imports multiple `.md` files at once, **When** the import is complete, **Then** all imported documents appear as individual cards on the main page.

---

### User Story 2 - Reorder Documents via Drag-and-Drop (Priority: P2)

A user has several documents on the main page and wants to arrange them in a specific order — for example, by priority or topic. They drag document cards and drop them in a new position. The new order is preserved the next time they open the application.

**Why this priority**: Organising documents is the primary productivity feature of DinoMD beyond reading. It allows users to maintain a personally meaningful document structure.

**Independent Test**: Can be fully tested by importing at least two documents, dragging one to a new position, and verifying the order persists after restarting the application.

**Acceptance Scenarios**:

1. **Given** the main page has two or more document cards, **When** the user drags a card and drops it in a different position, **Then** the card settles in the new position and all other cards shift accordingly.
2. **Given** the user has reordered documents, **When** the application is closed and reopened, **Then** documents appear in the last saved order.
3. **Given** the user begins dragging a card, **When** they drag it over other cards, **Then** a visual indicator (e.g., highlighted drop zone or placeholder) shows where the card will land.
4. **Given** the user drops a card back in its original position, **When** the drop is complete, **Then** the order remains unchanged and no unintended side effects occur.

---

### User Story 3 - Read Rendered Markdown with Syntax Highlighting (Priority: P3)

A user selects a document containing rich Markdown content — headings, lists, links, images, and code blocks in various languages. The content opens in a mosaic-style reading view that renders all Markdown elements beautifully, with code blocks highlighted by programming language and a layout optimised for comfortable reading.

**Why this priority**: The reading experience is DinoMD's core value proposition. Without quality rendering, users would prefer any plain text editor. This story completes the product's identity as a polished reader.

**Independent Test**: Can be fully tested by opening a document with headings, lists, images, and multi-language code blocks, then verifying each element renders correctly with syntax highlighting and readable typography.

**Acceptance Scenarios**:

1. **Given** a document with headings (H1–H6), lists, bold, italic, and links, **When** the document is opened, **Then** all standard Markdown elements are rendered visually correctly.
2. **Given** a document containing a fenced code block annotated with a programming language (e.g., ```` ```python ````), **When** the document is opened, **Then** the code block displays with syntax-specific colour highlighting.
3. **Given** a document with an image reference, **When** the document is opened and the image is accessible, **Then** the image is displayed inline within the rendered content.
4. **Given** the reading view is open, **When** the user scrolls through a long document, **Then** the layout remains clean and text remains legible throughout the full document.
5. **Given** the user is in the reading view, **When** they navigate back to the main page, **Then** the main page is restored with the document list intact.

---

### Edge Cases

- What happens when a `.md` file is imported that contains no content (empty file)? The document card should appear on the main page and opening it should display an empty or placeholder state without errors.
- What happens when an imported file is later deleted or moved outside the application? The app should display the document card with a clear indication that the source file is no longer available, without crashing.
- What happens when a very large `.md` file (e.g., hundreds of pages) is imported? The application should remain responsive and render content progressively or with acceptable load time.
- What happens when the user tries to import the same file twice? The application should either prevent duplicates or alert the user that the document already exists.
- What happens when a code block has no language annotation? The block should still be displayed in a monospace style without syntax highlighting, rather than causing an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to import one or more `.md` files from their local file system into the application.
- **FR-002**: The application MUST display all imported documents as individual cards on the main page.
- **FR-003**: The main page MUST use a flat structure — documents are never grouped into sub-folders or nested collections.
- **FR-004**: Users MUST be able to reorder document cards on the main page by dragging and dropping them.
- **FR-005**: The application MUST persist document order across sessions, so the user-defined order is restored when the application is reopened.
- **FR-006**: Users MUST be able to open a document by selecting its card, which transitions to a dedicated reading view.
- **FR-007**: The reading view MUST render standard Markdown elements including headings, paragraphs, bold, italic, strikethrough, ordered and unordered lists, blockquotes, links, inline code, fenced code blocks, horizontal rules, and images.
- **FR-008**: The reading view MUST apply syntax highlighting to fenced code blocks annotated with a programming language.
- **FR-009**: The reading view layout MUST prioritise readability, with adequate font sizing, line spacing, and contrast.
- **FR-010**: Users MUST be able to navigate back to the main page from the reading view.
- **FR-011**: The application MUST display a clear, user-friendly error when an unsupported file type is imported.
- **FR-012**: The application MUST gracefully handle missing or inaccessible source files by showing an appropriate status on the document card.

### Key Entities

- **Document**: Represents an imported Markdown file. Key attributes: name, file path or stored content, position (order index), import date.
- **Document Card**: A visual representation of a Document on the main page. Displays the document name and provides drag-and-drop interaction.
- **Reading View**: The full-screen or focused view that displays a selected Document's rendered Markdown content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import a `.md` file and view it on the main page in 3 or fewer interactions.
- **SC-002**: All standard Markdown elements (headings, lists, code blocks, links, images) render correctly for 100% of well-formed `.md` files.
- **SC-003**: Syntax highlighting is applied to code blocks for at least 10 common programming languages (e.g., Python, JavaScript, TypeScript, Bash, JSON, HTML, CSS, Java, Go, Rust).
- **SC-004**: Users can reorder documents via drag-and-drop without any additional confirmation steps or manual save actions.
- **SC-005**: Document order persists after the application is fully closed and reopened, with 100% reliability.
- **SC-006**: Users can navigate from the main page to the reading view of any document in a single interaction (one click or tap).
- **SC-007**: The reading view loads and fully renders a typical `.md` document (up to 500 lines) in under 1 second from the moment of selection.

## Assumptions

- The application targets desktop users; mobile/touch support is desirable but not in scope for this feature.
- "Flat structure" means all documents reside at the root collection level with no sub-folders, not that files must be stored flat on disk.
- Document content is stored locally; no cloud sync or collaboration features are in scope.
- The app does not need to watch for external changes to imported files in real-time; reflecting changes requires re-import.
- "Mosaic-style view" refers to a clean, card-based or typographically rich reading layout, not a literal image grid.
