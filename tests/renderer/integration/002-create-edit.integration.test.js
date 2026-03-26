vi.mock('../../../src/renderer/src/services/api.js', () => ({
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
vi.mock('../../../src/renderer/src/utils/clipboardUtils.js', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve()),
    stripMarkdown: vi.fn((text) => text),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useEffect } from 'react'
import { api } from '../../../src/renderer/src/services/api.js'
import EditorPage from '../../../src/renderer/src/pages/EditorPage.jsx'
import useEditor from '../../../src/renderer/src/hooks/useEditor.js'

const existingDoc = {
    id: 'doc-edit-01',
    name: 'My Note',
    filePath: '/notes/my-note.md',
    mtimeMs: null,
}

function EditorIntegration({ doc }) {
    const hook = useEditor()
    useEffect(() => {
        hook.openExisting(doc)
    }, [])
    return (
        <EditorPage
            editorHook={hook}
            onBack={vi.fn()}
            onDocumentSaved={vi.fn()}
            onDocumentDeleted={vi.fn()}
        />
    )
}

describe('EditorPage + useEditor integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.readContent.mockResolvedValue({ success: true, content: '# Hello World' })
        api.save.mockResolvedValue({
            success: true,
            saved: true,
            canceled: false,
            filePath: '/notes/my-note.md',
            name: 'My Note',
            mtimeMs: 1000,
            error: null,
        })
        api.onFileChangedExternally.mockImplementation(() => {})
        api.removeFileChangedListener.mockImplementation(() => {})
    })

    test('loads document content via useEditor hook into textarea', async () => {
        render(<EditorIntegration doc={existingDoc} />)

        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: /markdown editor/i })).toHaveValue(
                '# Hello World'
            )
        )
    })

    test('calls api.save when Save button is clicked after editing content', async () => {
        render(<EditorIntegration doc={existingDoc} />)
        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: /markdown editor/i })).toHaveValue(
                '# Hello World'
            )
        )

        fireEvent.change(screen.getByRole('textbox', { name: /markdown editor/i }), {
            target: { value: '# Hello World\n\nEdited.' },
        })
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /save document/i })).not.toBeDisabled()
        )

        fireEvent.click(screen.getByRole('button', { name: /save document/i }))

        await waitFor(() => expect(api.save).toHaveBeenCalled())
    })

    test('calls api.save when Ctrl+S is pressed on a persisted document', async () => {
        render(<EditorIntegration doc={existingDoc} />)
        await waitFor(() => screen.getByRole('textbox', { name: /markdown editor/i }))

        fireEvent.keyDown(window, { ctrlKey: true, key: 's' })

        await waitFor(() => expect(api.save).toHaveBeenCalled())
    })
})
