vi.mock('../../src/renderer/src/services/api.js', () => ({
    api: {
        create: vi.fn(),
        readContent: vi.fn(),
        save: vi.fn(),
        rename: vi.fn(),
        delete: vi.fn(),
        onFileChangedExternally: vi.fn(),
        removeFileChangedListener: vi.fn(),
        folder: {
            readDir: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
            openPicker: vi.fn(),
        },
        ui: {
            getSidebarState: vi.fn(),
            setSidebarState: vi.fn(),
        },
    },
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { copyToClipboard, stripMarkdown } from '../../src/renderer/src/utils/clipboardUtils.js'
import EditorPage from '../../src/renderer/src/pages/EditorPage.jsx'

function makeHook(overrides = {}) {
    return {
        session: {
            documentId: 'doc-copy-01',
            filePath: '/notes/copy.md',
            name: 'Copy Test',
            content: '# Copy Test\n\nSome content here.',
            savedContent: '# Copy Test\n\nSome content here.',
            mtimeMs: 1000,
            isDraft: false,
        },
        isDirty: false,
        saving: false,
        error: null,
        setError: vi.fn(),
        updateContent: vi.fn(),
        save: vi.fn(() => Promise.resolve({ saved: true, canceled: false })),
        rename: vi.fn(),
        discard: vi.fn(),
        deleteDocument: vi.fn(),
        reloadContent: vi.fn(),
        ...overrides,
    }
}

describe('clipboard utilities integration', () => {
    beforeEach(() => {
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        })
    })

    test('copyToClipboard writes the provided text to navigator.clipboard', async () => {
        await copyToClipboard('# Hello')

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Hello')
    })

    test('stripMarkdown removes heading markers from content', () => {
        const result = stripMarkdown('# Title\n\nParagraph text.')

        expect(result).not.toContain('#')
        expect(result).toContain('Title')
    })
})

describe('EditorPage Ctrl+S save integration', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    test('calls hook.save when Ctrl+S is pressed on a persisted non-draft document', async () => {
        const save = vi.fn(() => Promise.resolve({ saved: true, canceled: false }))

        render(
            <EditorPage
                editorHook={makeHook({ save })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.keyDown(window, { ctrlKey: true, key: 's' })

        await waitFor(() => expect(save).toHaveBeenCalled())
    })

    test('renders Copy MD and Copy Text action buttons', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByRole('button', { name: /copy as markdown/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /copy as plain text/i })).toBeInTheDocument()
    })
})
