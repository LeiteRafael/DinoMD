# Feature Specification: Editor UI & Syntax Highlighting Refinements

**Feature Branch**: `006-editor-ui-refinements`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "Refinar a interface do editor e a sincronização visual do Markdown para melhorar a legibilidade e a precisão do layout."

## Clarifications

### Session 2026-03-16

- Q: What is the palette origin strategy for the syntax highlighting color palette? → A: Adapt a well-known reference palette (e.g., VS Code default dark+, GitHub light) to the defined token roles — do not design from scratch and do not use a third-party theme as-is.
- Q: Does the editor support soft line wrapping, and is gutter alignment for wrapped lines in scope? → A: Soft word wrap is enabled; gutter alignment for wrapped lines is in scope.
- Q: Is scroll rendering performance (frame rate, paint budget) in scope alongside gutter alignment correctness? → A: Visual correctness only — no explicit frame rate or paint performance target is required.
- Q: Does syntax highlighting inside fenced code blocks mean language-aware token highlighting (keywords, strings, comments per language) or only Markdown structural tokens? → A: Language-aware token highlighting inside fenced code blocks is in scope.
- Q: Must theme switching update syntax highlighting and inline code styles immediately (live), or only after a reload? → A: Live, immediate update — no editor restart or reload required.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readable Code in the Editor (Priority: P1)

A writer is composing a technical document that contains inline code snippets and fenced code blocks. Because the current syntax highlighting uses low-contrast gray tones, distinguishing keywords, strings, and plain text is difficult, especially when writing for long periods. The user expects the editor to render code with distinct, vibrant colors so they can read and edit without straining.

**Why this priority**: Editor legibility directly affects productivity and is the core interaction surface of the application. Poor contrast makes the primary writing task harder, impacting every user on every session.

**Independent Test**: Can be fully tested by opening a Markdown document with inline code and fenced code blocks in the editor and verifying that all token types (keywords, strings, operators, comments) are visually distinguishable at a glance.

**Acceptance Scenarios**:

1. **Given** the editor is open with a Markdown document containing a fenced code block, **When** the user reads the block, **Then** different token types (keywords, strings, punctuation, comments) are rendered in visually distinct colors that are easy to differentiate.
2. **Given** the editor is in light theme mode, **When** code tokens are displayed, **Then** all token colors have sufficient contrast against the light background.
3. **Given** the editor is in dark theme mode, **When** code tokens are displayed, **Then** all token colors have sufficient contrast against the dark background.
5. **Given** the user switches from light to dark theme (or vice versa), **When** the theme change is applied, **Then** all syntax highlighting colors and inline code styles update immediately with no reload required.

---

### User Story 2 - Correct Gutter Alignment While Scrolling (Priority: P2)

A developer is editing a long Markdown document and relies on line numbers in the gutter to track position and navigate. As they scroll through the file or change the font size in settings, the line numbers drift out of alignment with their corresponding text lines, making the gutter unreliable and visually confusing.

**Why this priority**: Correct gutter alignment is a baseline expectation of any code or text editor. Drift undermines trust in the tool and causes confusion when line numbers no longer match the text they reference.

**Independent Test**: Can be fully tested by opening a document with at least 50 lines, scrolling from top to bottom at various speeds, and confirming that each line number remains perfectly vertically aligned with its text row throughout the scroll interaction.

**Acceptance Scenarios**:

1. **Given** an open document with more than 50 lines, **When** the user scrolls from the top to the bottom of the document, **Then** every line number in the gutter remains vertically aligned with the first line of its corresponding text row at all scroll positions.
2. **Given** the user changes the editor font size to the smallest or largest available setting, **When** the document is displayed, **Then** line numbers remain perfectly aligned with their text rows with no visible offset.
3. **Given** a document that contains wrapped long lines (soft word wrap is enabled), **When** the text wraps to a second visual row, **Then** the line number appears aligned to the first visual row of that logical line and does not jump or overlap adjacent numbers.
4. **Given** the user rapidly scrolls through a long document, **When** scrolling stops, **Then** there is no residual misalignment between gutter numbers and text rows.

---

### User Story 3 - Correct Inline Code Rendering in Preview (Priority: P3)

A user is reading a Markdown preview panel that contains inline code references (e.g., `variable_name` or `--flag`). Currently, the inline code style causes these elements to be rendered as block-level elements that span the full width of the container, breaking the reading flow of the surrounding sentence. The user expects inline code to flow naturally within surrounding prose, taking only as much space as the code text requires.

**Why this priority**: Preview fidelity is important for trust — if the preview doesn't match expected Markdown rendering behavior, users cannot reliably verify their output. However, this is a visual correction without direct productivity impact, ranking below legibility and reliability concerns.

**Independent Test**: Can be fully tested by rendering a Markdown sentence such as "Use the `--verbose` flag to see details" in the preview panel and verifying that the inline code does not create a line break and the background highlight hugs the code text width.

**Acceptance Scenarios**:

1. **Given** the preview panel is showing a paragraph that contains inline code (backtick-delimited text), **When** the paragraph is rendered, **Then** the inline code appears on the same line as the surrounding text with no forced line break before or after it.
2. **Given** an inline code span is rendered in the preview, **When** the user inspects its background highlight, **Then** the highlight area covers only the width of the code text and does not extend to the full container width.
3. **Given** a sentence with multiple inline code spans on the same line, **When** the preview renders it, **Then** all inline code spans flow within the text without creating extra blank lines or block-level separation.
4. **Given** the preview is displayed in both light and dark themes, **When** inline code is rendered, **Then** the background color and text color maintain sufficient contrast for readability in both themes.

---

### Edge Cases

- What happens when a fenced code block contains a language identifier that has no defined syntax-highlighting support — the block MUST fall back to a plain readable style (addressed in FR-006).
- How does gutter alignment behave when the editor window is resized mid-session?
- What happens if a user pastes a very long inline code span (over 100 characters) — does it wrap without breaking the inline display model?
- How does the inline code preview style interact with other inline Markdown elements (bold, italic, links) that appear on the same line?
- What happens when the document is displayed at very small or very large zoom levels — does gutter alignment remain stable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The preview renderer MUST display backtick-delimited inline code as an inline element that flows within surrounding prose text without forcing line breaks.
- **FR-002**: The preview renderer MUST apply a background highlight to inline code that covers only the width of the contained text, not the full container width.
- **FR-003**: The editor MUST maintain pixel-perfect vertical alignment between each line number in the gutter and the first visual row of its corresponding text line at all scroll positions. This requirement applies with soft word wrap enabled; for wrapped logical lines, the line number aligns to the first visual row only.
- **FR-004**: Gutter alignment MUST remain stable when the user resizes the editor window or changes the editor font size.
- **FR-005**: Gutter alignment MUST remain visually correct throughout continuous scrolling and after scrolling stops, with no residual offset. No explicit frame rate or paint performance target applies; this is a visual correctness requirement only.
- **FR-006**: The editor MUST apply language-aware syntax highlighting inside fenced code blocks, coloring token types (keywords, strings, comments, punctuation, operators, numbers) using a defined color palette that provides visually distinct colors across token types. When the fenced code block has no language identifier or an unrecognized one, the block content MUST fall back to a plain, consistently readable style without broken or missing colors.
- **FR-007**: The syntax highlighting color palette MUST include separate, verified color sets for light and dark editor themes. Switching between themes MUST update all syntax highlighting and inline code styles immediately without requiring an editor restart or page reload.
- **FR-008**: All syntax highlighting token colors and inline code styles MUST maintain a minimum contrast ratio against their respective backgrounds to ensure legibility.
- **FR-009**: Structural Markdown elements in the editor (headings, bold, italic, list markers, blockquote markers) MUST be styled with colors that visually distinguish them from plain body text.
- **FR-010**: Inline code background and text color in the preview MUST maintain readable contrast in both light and dark themes.
- **FR-011**: Theme palette tokens MUST be defined as named variables (e.g., CSS custom properties) so that flipping the theme atomically reassigns all token colors site-wide without per-component overrides.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the preview panel, a sentence containing three or more inline code spans is rendered with all spans on the same visual line as surrounding text — no full-width block behavior — verified across at least five representative document samples.
- **SC-002**: When scrolling continuously from line 1 to the last line of a 200-line document, all line numbers remain aligned with their text rows with zero visible offset, confirmed by visual inspection at the top, middle, and bottom scroll positions. No frame rate or throughput target applies; only alignment correctness is evaluated.
- **SC-003**: After changing the editor font size from the smallest to the largest available setting, gutter alignment is preserved with no measurable offset, verified for at least three distinct font size steps.
- **SC-004**: A reviewer examining a Markdown document with a fenced code block can correctly identify at least four distinct token types (e.g., keyword, string, comment, punctuation) by color alone — without additional labels — in both light and dark themes.
- **SC-005**: All defined syntax highlighting token colors and inline code styles achieve a contrast ratio of at least 4.5:1 against their respective backgrounds in both light and dark themes, as measured by a contrast-checking tool.
- **SC-006**: Inline code elements in the preview panel do not expand beyond the bounding width of their text content at any of the standard viewport sizes (narrow, medium, wide), verified by visual inspection or automated snapshot comparison.

## Assumptions

- The editor already has theming support (light/dark); the new syntax highlighting palette will integrate with the existing theme mechanism without requiring a new theming system. Theme switching must be live (no reload), which requires palette tokens to be expressed as named variables (e.g., CSS custom properties).
- Line numbers (gutter) are already a rendered feature; this work is a correctness fix for alignment drift, not an introduction of a new gutter feature.
- Soft word wrap is enabled in the editor. Gutter alignment for wrapped lines (line number aligned to the first visual row of a logical line) is explicitly in scope.
- "Sufficient contrast" and "minimum contrast ratio" are defined as meeting WCAG AA standard (4.5:1 for normal text) as the measurable default threshold.
- The inline code rendering problem is a CSS-level issue in the preview panel; the Markdown parser already correctly identifies inline code spans.
- The syntax highlighting color palette will be built by adapting a well-known reference palette (e.g., VS Code Default Dark+, GitHub Light) to the finite set of named token roles defined in FR-006 (keyword, string, comment, number, operator, punctuation, structural element). It will not be designed from scratch and will not require per-language color overrides.
- Language-aware token highlighting inside fenced code blocks is in scope. The set of supported languages is not exhaustively enumerated in this spec; unrecognized language identifiers fall back to a plain readable style per FR-006.
- No additional accessibility requirements beyond contrast ratios are in scope; this assumption will be revisited if compliance requirements are introduced.
