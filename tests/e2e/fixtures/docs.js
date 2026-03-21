/** Traceability Index
 *
 * Spec 001 — DinoMD Markdown Reader     →  tests/e2e/001-import-view.e2e.js       (headingsDoc, codeBlocksDoc, listsDoc)
 * Spec 002 — Create & Edit              →  tests/e2e/002-create-edit.e2e.js        (editContentDoc)
 * Spec 003 — Split View Preview         →  tests/e2e/003-split-view.e2e.js         (splitViewDoc)
 * Spec 004 — File Browser Sidebar       →  tests/e2e/004-file-browser.e2e.js       (fileBrowserDoc)
 * Spec 005 — Enhanced Markdown Editor   →  tests/e2e/005-enhanced-editor.e2e.js    (editorDoc)
 * Spec 006 — Editor UI Refinements      →  tests/e2e/006-ui-refinements.e2e.js     (splitViewDoc)
 * Spec 007 — File Tree Sidebar          →  tests/e2e/007-file-tree.e2e.js          (no fixture — uses window.showDirectoryPicker stub)
 * Spec 008 — Copy & Save Shortcuts      →  tests/e2e/008-copy-save.e2e.js          (copyDoc)
 */

export const headingsDoc = {
    id: 'fixture-001',
    name: 'headings-doc.md',
    filePath: null,
    orderIndex: 0,
    status: 'available',
    content: '# Heading One\n\n## Heading Two\n\nSome paragraph text.\n',
}

export const codeBlocksDoc = {
    id: 'fixture-002',
    name: 'code-blocks.md',
    filePath: null,
    orderIndex: 1,
    status: 'available',
    content: '# Code Examples\n\n```js\nconsole.log("hello")\n```\n',
}

export const listsDoc = {
    id: 'fixture-003',
    name: 'lists-doc.md',
    filePath: null,
    orderIndex: 2,
    status: 'available',
    content: '# Shopping List\n\n- Apples\n- Bananas\n- Oranges\n',
}

export const editContentDoc = {
    id: 'fixture-004',
    name: 'edit-content.md',
    filePath: null,
    orderIndex: 3,
    status: 'available',
    content: '# Edit Me\n\nThis document is for editing tests.\n',
}

export const splitViewDoc = {
    id: 'fixture-005',
    name: 'split-view.md',
    filePath: null,
    orderIndex: 4,
    status: 'available',
    content: '# Split View Test\n\nParagraph for split view testing.\n',
}

export const fileBrowserDoc = {
    id: 'fixture-006',
    name: 'file-browser.md',
    filePath: null,
    orderIndex: 5,
    status: 'available',
    content: '# File Browser\n\nDocument for file browser tests.\n',
}

export const editorDoc = {
    id: 'fixture-007',
    name: 'enhanced-editor.md',
    filePath: null,
    orderIndex: 6,
    status: 'available',
    content: '# Enhanced Editor\n\nDocument for enhanced editor tests.\n',
}

export const copyDoc = {
    id: 'fixture-008',
    name: 'copy-save.md',
    filePath: null,
    orderIndex: 7,
    status: 'available',
    content: '# Copy & Save Test\n\nDocument for clipboard and save shortcut tests.\n',
}
