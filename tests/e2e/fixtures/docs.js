export const traceabilityIndex = {
    documents: {
        spec: 'Document management — listing, navigation, creation, and persistence',
        file: 'documents.e2e.js',
        fixtures: ['headingsDoc', 'fileBrowserDoc', 'copyDoc'],
    },
    editor: {
        spec: 'Editor — editing, split view, and UI modes',
        file: 'editor.e2e.js',
        fixtures: ['splitViewDoc', 'editorDoc'],
    },
    'file-tree': {
        spec: 'File tree — sidebar and folder browsing',
        file: 'file-tree.e2e.js',
        fixtures: [],
    },
    'code-snapshot': {
        spec: 'Code snapshot — snapshot mode and export',
        file: 'code-snapshot.e2e.js',
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
