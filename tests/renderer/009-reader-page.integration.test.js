vi.mock('react-markdown', () => ({
    default: ({ children }) => <div data-testid="markdown-content">{children}</div>,
}))
vi.mock('remark-gfm', () => ({ default: () => {} }))
vi.mock('remark-frontmatter', () => ({ default: () => {} }))
vi.mock('rehype-slug', () => ({ default: () => {} }))
vi.mock('shiki', () => ({
    codeToHtml: vi.fn(() => Promise.resolve('<pre><code>console.log(1)</code></pre>')),
}))
vi.mock('../../src/renderer/src/services/api.js', () => ({
    api: {
        readContent: vi.fn(),
    },
}))

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReaderPage from '../../src/renderer/src/pages/ReaderPage.jsx'
import ErrorBoundary from '../../src/renderer/src/components/ErrorBoundary/index.jsx'
import { api } from '../../src/renderer/src/services/api.js'

describe('ReaderPage integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('shows loading state initially then renders content', async () => {
        api.readContent.mockResolvedValue({ success: true, content: '# Hello World' })

        render(
            <ReaderPage
                documentId="doc-1"
                documentName="Test Doc"
                onBack={vi.fn()}
                onEditDocument={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
        })
        expect(api.readContent).toHaveBeenCalledWith({ id: 'doc-1' })
    })

    test('displays the document name in the header', async () => {
        api.readContent.mockResolvedValue({ success: true, content: '# Hello' })

        render(
            <ReaderPage
                documentId="doc-1"
                documentName="My Great File"
                onBack={vi.fn()}
                onEditDocument={vi.fn()}
            />
        )

        expect(screen.getByText('My Great File')).toBeInTheDocument()
    })

    test('shows error message when readContent fails', async () => {
        api.readContent.mockResolvedValue({ success: false, error: 'File not found' })

        render(
            <ReaderPage
                documentId="doc-bad"
                documentName="Bad Doc"
                onBack={vi.fn()}
                onEditDocument={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/File not found/)).toBeInTheDocument()
        })
    })

    test('calls onBack when the back button is clicked', () => {
        api.readContent.mockResolvedValue({ success: true, content: '# Hi' })

        const onBack = vi.fn()

        render(
            <ReaderPage
                documentId="doc-1"
                documentName="Doc"
                onBack={onBack}
                onEditDocument={vi.fn()}
            />
        )
        screen.getByRole('button', { name: 'Back to document list' }).click()

        expect(onBack).toHaveBeenCalledTimes(1)
    })

    test('calls onEditDocument when Edit button is clicked', async () => {
        api.readContent.mockResolvedValue({ success: true, content: '# Hi' })

        const onEditDocument = vi.fn()

        render(
            <ReaderPage
                documentId="doc-1"
                documentName="Doc Name"
                onBack={vi.fn()}
                onEditDocument={onEditDocument}
            />
        )
        screen.getByRole('button', { name: 'Edit document' }).click()

        expect(onEditDocument).toHaveBeenCalledWith({ id: 'doc-1', name: 'Doc Name' })
    })
})

describe('ErrorBoundary component', () => {
    const FailingChild = () => {
        throw new Error('Test render error')
    }

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        console.error.mockRestore()
    })

    test('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <span>Safe content</span>
            </ErrorBoundary>
        )

        expect(screen.getByText('Safe content')).toBeInTheDocument()
    })

    test('renders fallback UI when a child throws', () => {
        render(
            <ErrorBoundary>
                <FailingChild />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Test render error')).toBeInTheDocument()
    })

    test('shows Try again button in error fallback', () => {
        render(
            <ErrorBoundary>
                <FailingChild />
            </ErrorBoundary>
        )

        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })
})

describe('useMarkdown hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('returns loaded content after successful readContent call', async () => {
        api.readContent.mockResolvedValue({ success: true, content: '# Fetched' })

        render(
            <ReaderPage
                documentId="doc-x"
                documentName="X Doc"
                onBack={vi.fn()}
                onEditDocument={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(api.readContent).toHaveBeenCalledWith({ id: 'doc-x' })
        })
    })

    test('does not fetch when documentId is falsy', () => {
        api.readContent.mockResolvedValue({ success: true, content: '' })

        render(
            <ReaderPage
                documentId={null}
                documentName="No Doc"
                onBack={vi.fn()}
                onEditDocument={vi.fn()}
            />
        )

        expect(api.readContent).not.toHaveBeenCalled()
    })
})
