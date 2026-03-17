# Feature Specification: File Tree Sidebar

**Feature Branch**: `007-file-tree-sidebar`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "Implementar uma barra de navegação lateral (Sidebar) no DinoMD, semelhante ao explorador de arquivos do VS Code, para exibir e gerenciar a estrutura de diretórios e arquivos de Markdown."

## Clarifications

### Session 2026-03-16

- Q: How should the file tree sidebar coexist with the existing document-list sidebar (feature 004)? → A: The file tree **replaces** the existing document-list sidebar entirely — only one sidebar panel exists in the application.
- Q: What happens when the user clicks a file in the tree while the current file has unsaved edits? → A: Auto-save the current file silently before loading the new one — no prompt shown.
- Q: Is implementing the "Open Folder" entrypoint (selecting a root directory) in scope for this feature? → A: Yes — the "Open Folder" action is in scope and must be delivered as part of this feature.
- Q: In what order should items be displayed within each folder in the tree? → A: Folders first, then files — each group sorted alphabetically (A → Z), case-insensitive.
- Q: Should dot-files, dot-folders, and known system directories (e.g. `node_modules`, `.git`) appear in the tree? → A: No — they are hidden by default and never shown in the tree.

---

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Open a Folder to Populate the Tree (Priority: P1)

The user launches DinoMD and wants to choose a folder from their computer to browse. They trigger an "Open Folder" action and select a directory; the sidebar then populates with that folder's contents.

**Why this priority**: Without a way to select a root folder, the tree cannot display anything. This is the prerequisite entry-point for the entire feature.

**Independent Test**: Launch the app with no folder open, click "Open Folder", select a directory, and verify the sidebar immediately shows that directory's contents.

**Acceptance Scenarios**:

1. **Given** no folder is currently open, **When** the sidebar is shown, **Then** it displays an invitation message and an "Open Folder" button.
2. **Given** the user clicks "Open Folder", **When** the native folder-picker dialog opens and the user selects a directory, **Then** the sidebar populates with the selected folder's tree.
3. **Given** a folder is already open, **When** the user triggers "Open Folder" again and selects a different directory, **Then** the sidebar reloads with the new folder's tree and any previously expanded state is reset.
4. **Given** the user opens the folder-picker but cancels without selecting, **When** the dialog closes, **Then** the sidebar remains unchanged.

---

### User Story 1 - Browse Directory Tree (Priority: P1)

The user opens a folder on their computer and wants to see its full directory structure in the sidebar — all subfolders and markdown files — arranged as a collapsible tree, so they can understand what is available without opening files one by one.

**Why this priority**: This is the foundational capability of the feature. Without the hierarchical tree view, no other story is possible. It is also the first thing a user interacts with when they open a folder.

**Independent Test**: Open the app with a folder that has nested subdirectories containing markdown files. Verify the sidebar displays the full tree with correct parent-child relationships and indentation before any interactions occur.

**Acceptance Scenarios**:

1. **Given** the user has opened a folder containing subdirectories and markdown files, **When** the sidebar is displayed, **Then** folders and files appear in a tree structure that mirrors the actual filesystem hierarchy.
2. **Given** the tree is displayed, **When** the user looks at any nested item, **Then** it is visually indented relative to its parent to represent its depth level.
3. **Given** the folder contains both files and subdirectories, **When** the tree renders, **Then** folders and files are visually distinct through different icons.
4. **Given** the folder is empty, **When** the sidebar renders, **Then** a friendly message informs the user the folder contains no files.
5. **Given** a folder contains a mix of subfolders and files, **When** the tree renders its children, **Then** all subfolders appear first sorted alphabetically (case-insensitive), followed by all files sorted alphabetically (case-insensitive).
6. **Given** a folder contains dot-files (e.g. `.gitignore`) or known system directories (e.g. `node_modules`, `.git`), **When** the tree renders, **Then** those entries are not shown.

---

### User Story 2 - Expand and Collapse Folders (Priority: P1)

The user sees the file tree and wants to expand a folder to inspect its contents or collapse it to reduce clutter in the sidebar panel.

**Why this priority**: The expand/collapse interaction is the core navigation mechanic. Without it, large folder structures are unusable. It is equally critical to Story 1 in forming an MVP navigation experience.

**Independent Test**: Start with a collapsed folder in the sidebar. Click it to expand and verify children appear. Click it again to verify children disappear. Each action is independently verifiable.

**Acceptance Scenarios**:

1. **Given** a folder is collapsed, **When** the user clicks on the folder, **Then** its immediate children (files and subfolders) become visible below it.
2. **Given** a folder is expanded, **When** the user clicks on the folder again, **Then** its children are hidden and the folder returns to a collapsed state.
3. **Given** a folder is collapsed, **When** the user looks at its icon, **Then** the icon visually indicates a "closed" state (e.g., right-pointing arrow or closed folder icon).
4. **Given** a folder is expanded, **When** the user looks at its icon, **Then** the icon visually indicates an "open" state (e.g., downward-pointing arrow or open folder icon).
5. **Given** a deeply nested folder is collapsed, **When** the user expands it, **Then** only its direct children become visible, without revealing deeper descendants automatically.

---

### User Story 3 - Open a File from the Tree (Priority: P2)

The user navigates the file tree, finds a markdown file, and clicks on it to open and view its content in the main editor area of DinoMD.

**Why this priority**: Selecting a file to open is the primary end-goal action of the sidebar. Without it, the tree is a read-only decoration. It depends on stories 1 and 2 being usable first, hence P2.

**Independent Test**: Click a markdown file in the tree and verify its content appears in the main editor area. The selected file should also be visually highlighted in the tree so the user knows what is currently open.

**Acceptance Scenarios**:

1. **Given** the file tree is visible, **When** the user clicks on a markdown file, **Then** the file's content is loaded into the main editor area.
2. **Given** the user has opened a file via the tree, **When** the sidebar is still visible, **Then** that file's row is visually highlighted to indicate it is the currently active file.
3. **Given** a different file is already open with unsaved edits, **When** the user clicks another file in the tree, **Then** the current file is auto-saved silently, the new file loads, and the active highlight moves to the newly selected file.
4. **Given** the user clicks a file type not supported by the application, **When** the click is registered, **Then** the application displays a clear message indicating the file type is not supported.

---

### User Story 4 - Visual File Type Icons (Priority: P3)

The user scans the file tree and can instantly distinguish file types thanks to icons rendered next to each item — a dedicated markdown icon for `.md` files, a generic file icon for others, and distinct open/closed icons for folders.

**Why this priority**: Icons improve scannability significantly but do not block core usage. The tree is functional without them; icons are a quality-of-life improvement.

**Independent Test**: View a folder containing mixed file types (.md, .txt, others) in the tree. Verify each file type renders with a visually distinct icon that is consistent across all instances of that type.

**Acceptance Scenarios**:

1. **Given** the tree is visible, **When** the user looks at any `.md` file, **Then** it displays a Markdown-specific icon (distinct from generic files).
2. **Given** the tree is visible, **When** the user looks at a folder in its collapsed state, **Then** it shows a "closed folder" icon.
3. **Given** the tree is visible, **When** the user looks at a folder in its expanded state, **Then** it shows an "open folder" icon.
4. **Given** the tree is visible, **When** the user looks at a non-markdown file, **Then** it shows a generic file icon.

---

### Edge Cases

- What happens when a folder contains hundreds of files or deeply nested subdirectories (5+ levels)?
- How does the sidebar behave when the user has not yet opened any folder (no root directory selected)?
- What happens if a file or folder is renamed or deleted on the filesystem while the sidebar is open?
- How does the tree handle folders with mixed-case file extensions (e.g., `.MD`, `.Md`)?
- Dot-files, dot-folders, and well-known system directories (`node_modules`, `.git`) are excluded from the tree — resolved by FR-017.
- What happens if the user clicks a folder that contains only other folders (no direct files)?
- How does the sidebar respond when the filesystem denies read access to a subfolder?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sidebar MUST display the contents of an opened root folder as a tree of files and directories.
- **FR-002**: The tree MUST reflect the actual hierarchy of the filesystem, with each node appearing under its correct parent.
- **FR-003**: Each level of nesting MUST be represented with progressive left indentation to visually communicate depth.
- **FR-004**: Folders MUST be clickable to toggle between expanded (children visible) and collapsed (children hidden) states.
- **FR-005**: Folders MUST display a visual indicator (icon or chevron) that reflects their current expand/collapse state.
- **FR-006**: Clicking a supported file in the tree MUST load that file's content into the main editor area.
- **FR-007**: The currently active (open) file MUST be visually highlighted in the tree.
- **FR-008**: Files in the tree MUST display icons that differentiate file types, with a distinct icon for `.md` files.
- **FR-009**: Folders in the tree MUST display different icons for open and closed states.
- **FR-010**: The sidebar MUST handle empty folders gracefully by showing an appropriate empty-state indicator.
- **FR-011**: When a file type is not supported for editing, the application MUST notify the user clearly upon click.
- **FR-012**: The file tree sidebar MUST replace the existing document-list sidebar (feature 004); both panels MUST NOT coexist simultaneously.
- **FR-013**: When the user selects a file from the tree while the currently open file has unsaved edits, the application MUST auto-save the current file silently before loading the newly selected file.
- **FR-014**: The sidebar MUST provide an "Open Folder" action that triggers a native OS folder-picker dialog, allowing the user to select a root directory to display in the tree.
- **FR-015**: When no folder has been opened yet, the sidebar MUST display an empty-state prompt with an "Open Folder" button as the primary call to action.
- **FR-016**: Within each folder, the tree MUST list subfolders before files; both groups MUST be sorted alphabetically in a case-insensitive ascending order (A → Z).
- **FR-017**: The tree MUST exclude dot-files, dot-folders, and well-known system directories (`node_modules`, `.git`, `.DS_Store`, and equivalents) from display. These entries MUST never appear in the tree.

### Key Entities

- **Root Folder**: The top-level directory opened by the user; serves as the root of the file tree. Has a path and a display name.
- **Tree Node**: Any item in the file tree — either a Folder Node or a File Node. Has a name, path, depth level, and parent reference.
- **Folder Node**: A directory entry in the tree. Has an expand/collapse state and a list of child nodes.
- **File Node**: A file entry in the tree. Has a file extension and an "active" state (selected/not selected).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a folder with at least 3 levels of nesting and correctly navigate to any file within 5 clicks.
- **SC-002**: Expanding or collapsing a folder with up to 100 direct children responds instantaneously (no visible delay perceived by the user).
- **SC-003**: The active file is always visually distinguishable from non-active files in the tree with no ambiguity.
- **SC-004**: Users can identify file types at a glance from their icons without reading file extensions, as confirmed by a hallway usability check with at least 3 users achieving 100% file-type recognition accuracy.
- **SC-005**: The correct file content loads in the editor every time a file is clicked from the tree, with no silent failures.
- **SC-006**: The sidebar is usable with folders containing up to 500 files without layout degradation or loss of information.

## Assumptions

- The file tree sidebar replaces the document-list sidebar introduced in feature 004. Feature 004's panel is superseded by this feature.
- The "Open Folder" entrypoint (native OS folder-picker dialog) is delivered as part of this feature — it is not pre-existing.
- The initial tree state on folder open shows all top-level items, with all folders collapsed by default.
- Only the immediate children of each folder are loaded/shown when a folder is expanded (lazy rendering per level is acceptable).
- The active-file highlight in the sidebar is driven by the same state that tracks which file is open in the editor — they are always in sync.
- Files with extensions other than those explicitly supported (e.g., `.md`) are shown in the tree but produce a "not supported" notice when clicked, rather than being hidden from the tree entirely.
- Expand/collapse state of folders persists for the duration of the session but does not need to be remembered across application restarts (persistence across sessions is a future enhancement).
