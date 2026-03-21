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
vi.mock('../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useState } from 'react'
import SplitViewPage from '../../src/renderer/src/pages/SplitViewPage.jsx'

function SplitWrapper({ initialContent = '' }) {
    const [content, setContent] = useState(initialContent)
    const hook = {
        session: {
            documentId: 'doc-split-01',
            filePath: '/notes/split.md',
            name: 'Split Test Doc',
            content,
            savedContent: content,
            mtimeMs: null,
            isDraft: false,
        },
        isDirty: false,
        saving: false,
        error: null,
        updateContent: setContent,
        save: vi.fn(() => Promise.resolve({ saved: true, canceled: false })),
        discard: vi.fn(),
    }
    return <SplitViewPage editorHook={hook} onBack={vi.fn()} onDocumentSaved={vi.fn()} />
}

describe('SplitViewPage + EditorPane + PreviewPane integration', () => {
    test('renders both the editor textarea and the preview panel group', () => {
        render(<SplitWrapper initialContent="# Hello" />)

        expect(screen.getByRole('textbox', { name: /markdown editor/i })).toBeInTheDocument()
        expect(screen.getByTestId('panel-group')).toBeInTheDocument()
    })

    test('displays the document name in the header', () => {
        render(<SplitWrapper initialContent="# Hello" />)

        expect(screen.getByText(/Split Test Doc/)).toBeInTheDocument()
    })

    test('typing in the editor propagates to the preview pane content', () => {
        render(<SplitWrapper initialContent="Initial content" />)
        const editor = screen.getByRole('textbox', { name: /markdown editor/i })

        fireEvent.change(editor, { target: { value: '# Updated Heading' } })

        expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Updated Heading')
    })

    test('shows nothing to preview when content is empty', () => {
        render(<SplitWrapper initialContent="" />)

        expect(screen.getByText(/nothing to preview yet/i)).toBeInTheDocument()
    })
})
