import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
vi.mock('../../../src/renderer/src/services/api.js', () => ({
    api: {
        create: vi.fn(),
        readContent: vi.fn(),
        save: vi.fn(),
        rename: vi.fn(),
        delete: vi.fn(),
        onFileChangedExternally: vi.fn(),
        removeFileChangedListener: vi.fn(),
    },
}))
vi.mock('../../../src/renderer/src/utils/clipboardUtils.js', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve()),
    stripMarkdown: vi.fn((text) => text),
}))
import { copyToClipboard, stripMarkdown } from '../../../src/renderer/src/utils/clipboardUtils.js'
import EditorPage from '../../../src/renderer/src/pages/EditorPage.jsx'
function makeHook(overrides = {}) {
    const { session: sessionOverrides, ...hookOverrides } = overrides
    return {
        session: {
            documentId: 'doc-001',
            filePath: '/notes/my-doc.md',
            name: 'My Doc',
            content: '# Hello',
            savedContent: '# Hello',
            mtimeMs: null,
            isDraft: false,
            ...(sessionOverrides ?? {}),
        },
        isDirty: false,
        saving: false,
        error: null,
        setError: vi.fn(),
        updateContent: vi.fn(),
        save: vi.fn(() =>
            Promise.resolve({
                saved: true,
                canceled: false,
            })
        ),
        rename: vi.fn(() =>
            Promise.resolve({
                success: true,
                newFilePath: '/notes/my-doc.md',
            })
        ),
        discard: vi.fn(),
        deleteDocument: vi.fn(() =>
            Promise.resolve({
                success: true,
                canForceDelete: false,
                error: null,
            })
        ),
        reloadContent: vi.fn(() => Promise.resolve()),
        ...hookOverrides,
    }
}
describe('EditorPage rendering', () => {
    test('displays the document name from the session', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(screen.getByText('My Doc')).toBeInTheDocument()
    })
    test('shows a Save button', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.getByRole('button', {
                name: /save/i,
            })
        ).toBeInTheDocument()
    })
    test('shows a Delete button for non-draft documents', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: false,
                    },
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.getByRole('button', {
                name: /delete/i,
            })
        ).toBeInTheDocument()
    })
    test('does NOT show a Delete button for drafts', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: true,
                    },
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.queryByRole('button', {
                name: /delete document/i,
            })
        ).not.toBeInTheDocument()
    })
    test('Save button is disabled when not dirty and not a draft', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: false,
                    session: {
                        isDraft: false,
                    },
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.getByRole('button', {
                name: /save/i,
            })
        ).toBeDisabled()
    })
    test('Save button is enabled when isDirty', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: true,
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.getByRole('button', {
                name: /save/i,
            })
        ).not.toBeDisabled()
    })
    test('shows "Saving…" label while save is in progress', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    saving: true,
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
    })
    test('displays a Back button', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        expect(
            screen.getByRole('button', {
                name: /back/i,
            })
        ).toBeInTheDocument()
    })
})
describe('navigation guard (unsaved changes)', () => {
    test('calls onBack immediately when not dirty', () => {
        const onBack = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: false,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(onBack).toHaveBeenCalledTimes(1)
    })
    test('shows ConfirmModal (not onBack) when Back is clicked with unsaved changes', () => {
        const onBack = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: true,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(onBack).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {
                name: /unsaved changes/i,
            })
        ).toBeInTheDocument()
    })
    test('closes modal and calls onBack when Discard is chosen', () => {
        const onBack = vi.fn()
        const discard = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: true,
                    discard,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        fireEvent.click(
            screen.getByRole('button', {
                name: /discard/i,
            })
        )
        expect(discard).toHaveBeenCalledTimes(1)
        expect(onBack).toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    test('closes modal without calling onBack when Cancel is chosen', () => {
        const onBack = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: true,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        fireEvent.click(
            screen.getByRole('button', {
                name: /^cancel$/i,
            })
        )
        expect(onBack).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    test('saves and calls onBack when Save is chosen in the modal', async () => {
        const onBack = vi.fn()
        const save = vi.fn(() =>
            Promise.resolve({
                saved: true,
                canceled: false,
            })
        )
        render(
            <EditorPage
                editorHook={makeHook({
                    isDirty: true,
                    save,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /^save$/i,
            })
        )
        await waitFor(() => {
            expect(save).toHaveBeenCalledTimes(1)
            expect(onBack).toHaveBeenCalledTimes(1)
        })
    })
})
describe('delete flow', () => {
    test('shows ConfirmModal when Delete button is clicked', () => {
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: false,
                    },
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /delete document/i,
            })
        )
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/delete document/i)).toBeInTheDocument()
    })
    test('calls deleteDocument and onDocumentDeleted on confirmation', async () => {
        const deleteDocument = vi.fn(() =>
            Promise.resolve({
                success: true,
                canForceDelete: false,
                error: null,
            })
        )
        const onDocumentDeleted = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: false,
                    },
                    deleteDocument,
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={onDocumentDeleted}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /delete document/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /move to trash/i,
            })
        )
        await waitFor(() => {
            expect(deleteDocument).toHaveBeenCalledTimes(1)
            expect(onDocumentDeleted).toHaveBeenCalledWith('doc-001')
        })
    })
    test('closes modal without deleting when Cancel is clicked', () => {
        const deleteDocument = vi.fn()
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: false,
                    },
                    deleteDocument,
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /delete document/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /^cancel$/i,
            })
        )
        expect(deleteDocument).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    test('shows force-delete modal when trashItem fails (canForceDelete=true)', async () => {
        const deleteDocument = vi.fn(() =>
            Promise.resolve({
                success: false,
                canForceDelete: true,
                error: 'Trash unavailable',
            })
        )
        render(
            <EditorPage
                editorHook={makeHook({
                    session: {
                        isDraft: false,
                    },
                    deleteDocument,
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /delete document/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /move to trash/i,
            })
        )
        await waitFor(() => {
            expect(screen.getByText(/move to trash failed/i)).toBeInTheDocument()
        })
    })
})
describe('inline title rename', () => {
    test('clicking the title switches to an input field', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(screen.getByText('My Doc'))
        expect(
            screen.getByRole('textbox', {
                name: /document name/i,
            })
        ).toBeInTheDocument()
    })
    test('pressing Escape reverts to the original name without calling rename', () => {
        render(
            <EditorPage
                editorHook={makeHook()}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(screen.getByText('My Doc'))
        const input = screen.getByRole('textbox', {
            name: /document name/i,
        })
        fireEvent.change(input, {
            target: {
                value: 'Changed',
            },
        })
        fireEvent.keyDown(input, {
            key: 'Escape',
        })
        expect(
            screen.queryByRole('textbox', {
                name: /document name/i,
            })
        ).not.toBeInTheDocument()
        expect(screen.getByText('My Doc')).toBeInTheDocument()
    })
})
describe('dirty state indicator', () => {
    test('shows dirty dot (•) in the document title when isDirty is true', () => {
        render(
            <EditorPage
                editorHook={makeHook({ isDirty: true })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText(/My Doc.*•/)).toBeInTheDocument()
    })

    test('does not show dirty dot when isDirty is false', () => {
        render(
            <EditorPage
                editorHook={makeHook({ isDirty: false })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.queryByText(/•/)).not.toBeInTheDocument()
    })
})
describe('Ctrl+S shortcut', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('calls save when the document is on disk (filePath set, not a draft)', async () => {
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

        await waitFor(() => {
            expect(save).toHaveBeenCalledTimes(1)
        })
    })

    test('does not call save for a draft document', async () => {
        const save = vi.fn(() => Promise.resolve({ saved: true, canceled: false }))
        render(
            <EditorPage
                editorHook={makeHook({ save, session: { isDraft: true, filePath: null } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.keyDown(window, { ctrlKey: true, key: 's' })

        await new Promise((r) => setTimeout(r, 0))
        expect(save).not.toHaveBeenCalled()
    })

    test('does not call save when filePath is null', async () => {
        const save = vi.fn(() => Promise.resolve({ saved: true, canceled: false }))
        render(
            <EditorPage
                editorHook={makeHook({ save, session: { isDraft: false, filePath: null } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.keyDown(window, { ctrlKey: true, key: 's' })

        await new Promise((r) => setTimeout(r, 0))
        expect(save).not.toHaveBeenCalled()
    })
})
describe('copy actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders Copy MD and Copy Text buttons', () => {
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

    test('clicking Copy MD calls copyToClipboard with the raw Markdown content', async () => {
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '# Hello\n**world**' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(copyToClipboard).toHaveBeenCalledWith('# Hello\n**world**')
        })
    })

    test('clicking Copy MD shows a success toast', async () => {
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(screen.getByText('Copied as Markdown')).toBeInTheDocument()
        })
    })

    test('clicking Copy MD on an empty document shows an empty document notice', async () => {
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(screen.getByText('Document is empty')).toBeInTheDocument()
        })
        expect(copyToClipboard).not.toHaveBeenCalled()
    })

    test('clicking Copy Text calls copyToClipboard with the stripped content', async () => {
        stripMarkdown.mockReturnValueOnce('Hello world')
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '# Hello\n**world**' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as plain text/i }))

        await waitFor(() => {
            expect(stripMarkdown).toHaveBeenCalledWith('# Hello\n**world**')
            expect(copyToClipboard).toHaveBeenCalledWith('Hello world')
        })
    })

    test('clicking Copy Text shows a success toast', async () => {
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as plain text/i }))

        await waitFor(() => {
            expect(screen.getByText('Copied as Plain Text')).toBeInTheDocument()
        })
    })

    test('shows error toast when copyToClipboard rejects', async () => {
        copyToClipboard.mockRejectedValueOnce(new Error('Clipboard access denied'))
        render(
            <EditorPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(screen.getByText(/Could not copy/)).toBeInTheDocument()
        })
    })
})
