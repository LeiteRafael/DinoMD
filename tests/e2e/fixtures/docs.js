export const traceabilityIndex = {
    '001': {
        spec: 'DinoMD Markdown Reader',
        file: '001-import-view.e2e.js',
        fixtures: ['headingsDoc', 'codeBlocksDoc', 'listsDoc'],
    },
    '002': { spec: 'Create & Edit', file: '002-create-edit.e2e.js', fixtures: ['editContentDoc'] },
    '003': {
        spec: 'Split View Preview',
        file: '003-split-view.e2e.js',
        fixtures: ['splitViewDoc'],
    },
    '004': {
        spec: 'File Browser Sidebar',
        file: '004-file-browser.e2e.js',
        fixtures: ['fileBrowserDoc'],
    },
    '005': {
        spec: 'Enhanced Markdown Editor',
        file: '005-enhanced-editor.e2e.js',
        fixtures: ['editorDoc'],
    },
    '006': {
        spec: 'Editor UI Refinements',
        file: '006-ui-refinements.e2e.js',
        fixtures: ['splitViewDoc'],
    },
    '007': { spec: 'File Tree Sidebar', file: '007-file-tree.e2e.js', fixtures: [] },
    '008': { spec: 'Copy & Save Shortcuts', file: '008-copy-save.e2e.js', fixtures: ['copyDoc'] },
    '010': {
        spec: 'Code Snapshot Export',
        file: '010-code-snapshot.e2e.js',
        fixtures: ['codeSnapshotDoc'],
    },
}

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

export const codeSnapshotDoc = {
    id: 'fixture-010',
    name: 'example.js',
    filePath: null,
    orderIndex: 9,
    status: 'available',
    content: 'const greet = (name) => `Hello, ${name}!`\n\nexport default greet\n',
}
