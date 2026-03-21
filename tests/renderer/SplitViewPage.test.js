import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
vi.mock('react-markdown', () => ({
    default: function ReactMarkdownMock({ children }) {
        return <div data-testid="markdown-content">{children}</div>
    },
}))
vi.mock('remark-gfm', () => ({ default: () => {} }))
vi.mock('remark-frontmatter', () => ({ default: () => {} }))
vi.mock('rehype-slug', () => ({ default: () => {} }))
vi.mock('shiki', () => ({
    codeToHtml: vi.fn(() => Promise.resolve('<pre><code>code</code></pre>')),
}))
vi.mock('react-resizable-panels', () => ({
    PanelGroup: ({ children, className }) => (
        <div data-testid="panel-group" className={className}>
            {children}
        </div>
    ),
    Panel: ({ children, className }) => (
        <div data-testid="panel" className={className}>
            {children}
        </div>
    ),
    PanelResizeHandle: ({ className }) => <div data-testid="resize-handle" className={className} />,
}))
vi.mock('../../src/renderer/src/utils/clipboardUtils.js', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve()),
    stripMarkdown: vi.fn((text) => text),
}))
import { copyToClipboard, stripMarkdown } from '../../src/renderer/src/utils/clipboardUtils.js'
import SplitViewPage from '../../src/renderer/src/pages/SplitViewPage.jsx'
function makeHook(overrides = {}) {
    const { session: sessionOverrides, ...hookOverrides } = overrides
    return {
        session: {
            documentId: 'doc-001',
            filePath: '/notes/test.md',
            name: 'Test Doc',
            content: '# Hello',
            savedContent: '# Hello',
            mtimeMs: null,
            isDraft: false,
            ...(sessionOverrides ?? {}),
        },
        isDirty: false,
        saving: false,
        error: null,
        updateContent: vi.fn(),
        save: vi.fn(() =>
            Promise.resolve({
                saved: true,
                canceled: false,
            })
        ),
        discard: vi.fn(),
        ...hookOverrides,
    }
}
describe('SplitViewPage rendering', () => {
    test('renders in split mode with both panes present', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        expect(
            screen.getByRole('textbox', {
                name: /markdown editor/i,
            })
        ).toBeInTheDocument()
        expect(screen.getByTestId('panel-group')).toBeInTheDocument()
    })
    test('displays the document name in the header', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        expect(screen.getByText(/Test Doc/)).toBeInTheDocument()
    })
    test('shows "Nothing to preview yet" when content is empty', () => {
        render(
            <SplitViewPage
                editorHook={makeHook({
                    session: {
                        content: '',
                        savedContent: '',
                    },
                })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
            />
        )
        expect(screen.getByText(/Nothing to preview yet/i)).toBeInTheDocument()
    })
})
describe('ViewModeToggle', () => {
    test('clicking Editor Only hides the preview pane panel-group', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /editor only/i,
            })
        )
        expect(screen.queryByTestId('panel-group')).not.toBeInTheDocument()
        expect(
            screen.getByRole('textbox', {
                name: /markdown editor/i,
            })
        ).toBeInTheDocument()
    })
    test('clicking Preview Only hides the editor textarea (via display:none)', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /preview only/i,
            })
        )
        const textarea = screen.getByRole('textbox', {
            name: /markdown editor/i,
            hidden: true,
        })
        expect(textarea.closest('[style]')).toHaveStyle({
            display: 'none',
        })
    })
    test('toggling back to Split restores both panes', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /editor only/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /^split$/i,
            })
        )
        expect(screen.getByTestId('panel-group')).toBeInTheDocument()
        expect(
            screen.getByRole('textbox', {
                name: /markdown editor/i,
            })
        ).toBeInTheDocument()
    })
    test('editor content is unchanged across all mode switches', () => {
        const hook = makeHook({
            session: {
                content: '# My Content',
                savedContent: '# My Content',
            },
        })
        render(<SplitViewPage editorHook={hook} onBack={vi.fn()} onDocumentSaved={vi.fn()} />)
        fireEvent.click(
            screen.getByRole('button', {
                name: /editor only/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /preview only/i,
            })
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /^split$/i,
            })
        )
        expect(
            screen.getByRole('textbox', {
                name: /markdown editor/i,
            })
        ).toHaveValue('# My Content')
    })
})
describe('Navigation guard', () => {
    test('shows unsaved changes modal when navigating back with dirty content', () => {
        const onBack = vi.fn()
        render(
            <SplitViewPage
                editorHook={makeHook({
                    isDirty: true,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(
            screen.getByRole('heading', {
                name: /Unsaved changes/i,
            })
        ).toBeInTheDocument()
        expect(onBack).not.toHaveBeenCalled()
    })
    test('calls onBack directly when content is not dirty', () => {
        const onBack = vi.fn()
        render(
            <SplitViewPage
                editorHook={makeHook({
                    isDirty: false,
                })}
                onBack={onBack}
                onDocumentSaved={vi.fn()}
            />
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: /back/i,
            })
        )
        expect(onBack).toHaveBeenCalledTimes(1)
    })
})
describe('Sync Scroll toggle', () => {
    test('renders the sync scroll button', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        expect(screen.getByTitle(/synchronized scrolling/i)).toBeInTheDocument()
    })
    test('sync button toggles aria-pressed state', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        const btn = screen.getByTitle(/synchronized scrolling/i)
        expect(btn).toHaveAttribute('aria-pressed', 'true')
        fireEvent.click(btn)
        expect(btn).toHaveAttribute('aria-pressed', 'false')
    })
})
describe('Layout', () => {
    test('outer container has the minWidth CSS class applied', () => {
        const { container } = render(
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )
        const outerDiv = container.firstChild
        expect(outerDiv.className).toContain('minWidth')
    })
})
describe('Ctrl+S shortcut', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('calls save when the document is on disk (filePath set, not a draft)', async () => {
        const save = vi.fn(() => Promise.resolve({ saved: true, canceled: false }))
        render(
            <SplitViewPage
                editorHook={makeHook({ save })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
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
            <SplitViewPage
                editorHook={makeHook({ save, session: { isDraft: true, filePath: null } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
            />
        )

        fireEvent.keyDown(window, { ctrlKey: true, key: 's' })

        await new Promise((r) => setTimeout(r, 0))
        expect(save).not.toHaveBeenCalled()
    })

    test('does not call save when filePath is null', async () => {
        const save = vi.fn(() => Promise.resolve({ saved: true, canceled: false }))
        render(
            <SplitViewPage
                editorHook={makeHook({ save, session: { isDraft: false, filePath: null } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
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
            <SplitViewPage editorHook={makeHook()} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
        )

        expect(screen.getByRole('button', { name: /copy as markdown/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /copy as plain text/i })).toBeInTheDocument()
    })

    test('clicking Copy MD calls copyToClipboard with the raw Markdown content', async () => {
        render(
            <SplitViewPage
                editorHook={makeHook({ session: { content: '# Hello\n**world**' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(copyToClipboard).toHaveBeenCalledWith('# Hello\n**world**')
        })
    })

    test('clicking Copy MD shows a success toast', async () => {
        render(
            <SplitViewPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(screen.getByText('Copied as Markdown')).toBeInTheDocument()
        })
    })

    test('clicking Copy MD on an empty document shows an empty document notice', async () => {
        render(
            <SplitViewPage
                editorHook={makeHook({ session: { content: '' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
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
            <SplitViewPage
                editorHook={makeHook({ session: { content: '# Hello\n**world**' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
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
            <SplitViewPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
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
            <SplitViewPage
                editorHook={makeHook({ session: { content: '# Hello' } })}
                onBack={vi.fn()}
                onDocumentSaved={vi.fn()}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /copy as markdown/i }))

        await waitFor(() => {
            expect(screen.getByText(/Could not copy/)).toBeInTheDocument()
        })
    })
})
