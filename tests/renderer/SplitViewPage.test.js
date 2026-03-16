import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
jest.mock('react-markdown', () => {
    return function ReactMarkdownMock({ children }) {
        return <div data-testid="markdown-content">{children}</div>
    }
})
jest.mock('remark-gfm', () => () => {})
jest.mock('remark-frontmatter', () => () => {})
jest.mock('rehype-slug', () => () => {})
jest.mock('shiki', () => ({
    codeToHtml: jest.fn(() => Promise.resolve('<pre><code>code</code></pre>')),
}))
jest.mock('react-resizable-panels', () => ({
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
        updateContent: jest.fn(),
        save: jest.fn(() =>
            Promise.resolve({
                saved: true,
                canceled: false,
            })
        ),
        discard: jest.fn(),
        ...hookOverrides,
    }
}
describe('SplitViewPage rendering', () => {
    test('renders in split mode with both panes present', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
                onBack={jest.fn()}
                onDocumentSaved={jest.fn()}
            />
        )
        expect(screen.getByText(/Nothing to preview yet/i)).toBeInTheDocument()
    })
})
describe('ViewModeToggle', () => {
    test('clicking Editor Only hides the preview pane panel-group', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
        render(<SplitViewPage editorHook={hook} onBack={jest.fn()} onDocumentSaved={jest.fn()} />)
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
        const onBack = jest.fn()
        render(
            <SplitViewPage
                editorHook={makeHook({
                    isDirty: true,
                })}
                onBack={onBack}
                onDocumentSaved={jest.fn()}
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
        const onBack = jest.fn()
        render(
            <SplitViewPage
                editorHook={makeHook({
                    isDirty: false,
                })}
                onBack={onBack}
                onDocumentSaved={jest.fn()}
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
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
        )
        expect(screen.getByTitle(/synchronized scrolling/i)).toBeInTheDocument()
    })
    test('sync button toggles aria-pressed state', () => {
        render(
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
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
            <SplitViewPage editorHook={makeHook()} onBack={jest.fn()} onDocumentSaved={jest.fn()} />
        )
        const outerDiv = container.firstChild
        expect(outerDiv.className).toContain('minWidth')
    })
})
