# Feature Specification: Enhanced Markdown Editor (Code Editor Experience)

**Feature Branch**: `005-enhanced-md-editor`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Evoluir o componente de edição de texto do DinoMD para um editor de código funcional, proporcionando uma experiência de escrita similar ao VS Code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Markdown with Line Numbers (Priority: P1)

A writer opens a Markdown document in DinoMD and sees a gutter on the left side of the editor displaying line numbers, which stay in sync as the writer scrolls through the document. This gives the writer a spatial reference and makes navigating long files intuitive, just like a code editor.

**Why this priority**: Line numbers are the most foundational chrome of any code-style editor. They deliver immediate visual improvement and are a prerequisite for the active line indicator. Without this, the editor feels like a plain textarea.

**Independent Test**: Can be fully tested by opening any Markdown file and verifying that numbered lines appear on the left and that scrolling keeps numbers aligned with their corresponding text rows.

**Acceptance Scenarios**:

1. **Given** a Markdown file is open in the editor, **When** the editor renders, **Then** a gutter column is visible on the left showing sequential line numbers starting from 1.
2. **Given** the editor displays line numbers, **When** the writer scrolls down, **Then** each line number remains horizontally aligned with its corresponding text line throughout the scroll.
3. **Given** the editor is open, **When** the writer types new content that adds lines, **Then** line numbers update immediately to reflect the new line count.
4. **Given** a document with over 1000 lines, **When** the writer scrolls rapidly through the entire file, **Then** line numbers remain synchronized without visible lag or misalignment.

---

### User Story 2 - Write with Real-Time Syntax Highlighting (Priority: P1)

A writer types Markdown content and sees headings, bold text, links, and code blocks rendered in distinct colors as they type, without any delay. This makes the document structure immediately visible and reduces cognitive load when composing complex documents.

**Why this priority**: Syntax highlighting is the defining characteristic difference between a plain text area and a code editor. It directly supports the stated goal of a "VS Code-like experience" and is independently valuable without any other feature.

**Independent Test**: Can be fully tested by opening a file containing headings, bold text, links, and code blocks and confirming each element has a visually distinct color applied in real time while typing.

**Acceptance Scenarios**:

1. **Given** the editor is open, **When** the writer types `# Heading`, **Then** the heading text is rendered in a visually distinct color or weight that clearly differs from body text.
2. **Given** the editor is open, **When** the writer types `**bold**`, **Then** the text between the double asterisks is highlighted to indicate bold formatting.
3. **Given** the editor is open, **When** the writer types `[label](url)`, **Then** the link syntax (brackets and parentheses) is highlighted to visually distinguish it from plain text.
4. **Given** the editor is open, **When** the writer types a fenced code block using triple backticks, **Then** the block content and fences are highlighted in a visually distinct style.
5. **Given** the writer is actively typing, **When** each keystroke is entered, **Then** syntax highlighting updates within the visible area without any perceivable typing delay.

---

### User Story 3 - Identify Active Line While Writing (Priority: P2)

A writer positions their cursor on a specific line, and that entire line is subtly highlighted with a background color distinct from the rest of the document. This helps the writer maintain focus on their current position, especially in dense documents.

**Why this priority**: The active line indicator is a common productivity feature that reduces the visual effort of tracking the cursor. It depends on line representation already working (P1) and enhances the experience without being critical to core editing.

**Independent Test**: Can be fully tested by clicking on different lines and verifying that the background highlight moves to follow the cursor on each click or keystroke.

**Acceptance Scenarios**:

1. **Given** the editor is open with content, **When** the writer clicks on a line, **Then** that line receives a distinct, subtle background highlight.
2. **Given** a line is highlighted as the active line, **When** the writer presses the arrow keys to move to another line, **Then** the highlight moves to the new cursor line.
3. **Given** the writer is on the active line, **When** the writer scrolls the view without moving the cursor, **Then** the active line highlight remains visible if the cursor line is in view, and disappears cleanly if it scrolls out of view.

---

### User Story 4 - Write Structured Content with Auto-Indentation (Priority: P2)

A writer is composing a nested list or indented block. After pressing Enter, the new line automatically starts at the same indentation level as the previous line. This removes the need to manually re-apply indentation and keeps structured content consistent.

**Why this priority**: Auto-indentation is a productivity enhancement for structured Markdown. It reduces repetitive keystrokes but does not block the core editing experience if absent.

**Independent Test**: Can be fully tested by typing an indented line, pressing Enter, and verifying the new line starts at the same indentation level as the previous line.

**Acceptance Scenarios**:

1. **Given** the writer is on a line that begins with leading spaces or a tab, **When** the writer presses Enter, **Then** the new line is created with the same number of leading whitespace characters as the previous line.
2. **Given** the writer is on a line with no indentation, **When** the writer presses Enter, **Then** the new line is created without any leading whitespace (standard behavior preserved).
3. **Given** the writer has auto-indented to a deep level, **When** the writer presses Backspace at the start of the new empty indented line, **Then** one indentation level is removed, not one character at a time.

---

### User Story 5 - Edit Large Markdown Files Without Performance Degradation (Priority: P1)

A writer opens a Markdown file with over 1000 lines and edits it, scrolls, and navigates freely. All editor features — line numbers, syntax highlighting, active line, and auto-indentation — continue to respond instantly without freezing, stuttering, or visible input lag.

**Why this priority**: Performance is a cross-cutting non-functional requirement that affects all other features. All visual and behavioral enhancements are worthless if the editor becomes sluggish on real-world documents. Treating it as P1 ensures it is not deferred.

**Independent Test**: Can be fully tested by opening a generated 1000+ line Markdown file and measuring responsiveness during typing, scrolling, and cursor navigation with all features active.

**Acceptance Scenarios**:

1. **Given** a Markdown file with 1000 or more lines is open, **When** the writer types continuously, **Then** each keystroke is reflected on screen without any perceptible lag.
2. **Given** a large file is open with all editor features enabled, **When** the writer scrolls from the top to the bottom and back, **Then** scrolling is fluid with no visible frame drops or re-rendering artifacts.
3. **Given** a large file is open, **When** the writer navigates by clicking on arbitrary positions throughout the document, **Then** the active line indicator and line numbers update instantly on each click.

---

### Edge Cases

- What happens when the document is empty (zero lines)?
- What happens when a single line is extremely long (e.g., 5000 characters with no line breaks)?
- How does the editor handle mixed indentation (tabs and spaces on different lines)?
- What happens if the writer pastes a large block of formatted Markdown text at once?
- How does the active line highlight behave when the editor loses focus?
- What happens to line numbers when lines are deleted in bulk (e.g., select-all and delete)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The editor MUST display a fixed-width gutter column on the left side showing sequential line numbers starting from 1.
- **FR-002**: The gutter line numbers MUST remain vertically aligned with their corresponding text lines at all times, including during scrolling.
- **FR-003**: The gutter MUST update line numbers immediately when lines are added or removed.
- **FR-004**: The editor MUST apply distinct visual styles to the following Markdown syntax elements in real time: headings (H1–H6), bold text, inline links, and fenced code blocks.
- **FR-005**: Syntax highlighting MUST update within the currently visible view on every keystroke without perceptible delay.
- **FR-006**: The editor MUST apply a distinct background color to the full line where the cursor is currently positioned.
- **FR-007**: The active line highlight MUST follow the cursor as the writer navigates with keyboard or pointing device.
- **FR-008**: When the writer presses Enter on a line that begins with leading whitespace, the new line MUST automatically start with the same leading whitespace as the previous line.
- **FR-009**: The editor MUST remain responsive (no perceptible input lag) when editing Markdown files containing 1000 or more lines, with all features active simultaneously.
- **FR-010**: The editor MUST scroll the gutter and text content synchronously; they MUST NOT scroll independently of each other.

### Key Entities

- **Document**: A Markdown text file loaded in the editor, characterized by its content (raw text), total line count, and current cursor position.
- **Line**: A single row of text within the document, identified by its 1-based sequential number, its content, its indentation level, and whether it contains active cursor focus.
- **Syntax Token**: A classified segment of text within a line (e.g., heading, bold, link, code block) that carries a visual style category for rendering.
- **Editor State**: The runtime representation of the visible portion of the document, including scroll position, active line index, and rendered token ranges.

## Assumptions

- The editor component is a custom-built text editing area within DinoMD (not a third-party embedded editor), meaning these features will be implemented at the component level.
- Markdown syntax highlighting covers the four explicitly requested element types (headings, bold, links, code blocks); additional Markdown elements (e.g., italic, blockquote, horizontal rule) are out of scope for this iteration.
- "Fluent performance" at 1000+ lines means no user-perceptible lag during typing, scrolling, and navigation; specific frame-rate or millisecond thresholds are not mandated.
- Auto-indentation applies to leading whitespace preservation only; smart list continuation (e.g., auto-inserting `- ` for list items) is out of scope for this iteration.
- The active line highlight applies to the full line width in the text area and the corresponding line number in the gutter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Writers can visually identify the line number of their cursor position at all times without counting lines manually.
- **SC-002**: All four Markdown syntax categories (headings, bold, links, fenced code blocks) are visually distinguishable from plain body text after a writer types them.
- **SC-003**: A writer pressing Enter on an indented line starts the new line at the correct indentation level 100% of the time without manual correction.
- **SC-004**: On a 1000-line Markdown file, the time between a writer's keystroke and its appearance on screen is imperceptible (no visible delay) during normal editing and scrolling sessions.
- **SC-005**: All editor chrome elements (line numbers, active line highlight, syntax colors) remain visually consistent and artifact-free throughout a continuous 60-second scrolling session on a 1000-line file.
- **SC-006**: A writer unfamiliar with code editors can locate their active line visually within 2 seconds of placing their cursor, without any additional instructions.
