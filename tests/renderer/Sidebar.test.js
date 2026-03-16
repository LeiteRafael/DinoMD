import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))

import Sidebar from '../../src/renderer/src/components/Sidebar/index.jsx'

const sampleDocs = [
    { id: 'doc-1', name: 'Alpha Note', preview: 'First document preview text', mtimeMs: 1000 },
    { id: 'doc-2', name: 'Beta Guide', preview: 'Second document about guides', mtimeMs: 900 },
    { id: 'doc-3', name: 'Gamma Tips', preview: 'Tips and tricks collection', mtimeMs: 800 },
]

describe('Sidebar — document list (US1)', () => {
    test('renders document entries with title and preview', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        expect(screen.getByText('Alpha Note')).toBeInTheDocument()
        expect(screen.getByText('First document preview text')).toBeInTheDocument()
        expect(screen.getByText('Beta Guide')).toBeInTheDocument()
    })

    test('active document row has active CSS class', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId="doc-2"
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const betaEntry = screen.getByTitle('Beta Guide')
        expect(betaEntry.className).toMatch(/entryActive/)
        const alphaEntry = screen.getByTitle('Alpha Note')
        expect(alphaEntry.className).not.toMatch(/entryActive/)
    })

    test('empty-state element appears when documents array is empty', () => {
        render(
            <Sidebar
                documents={[]}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        expect(screen.getByText(/no documents yet/i)).toBeInTheDocument()
    })

    test('clicking a row fires onOpenDocument with correct id and name', () => {
        const onOpenDocument = jest.fn()
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={onOpenDocument}
                onNewDocument={jest.fn()}
            />
        )
        fireEvent.click(screen.getByTitle('Gamma Tips'))
        expect(onOpenDocument).toHaveBeenCalledTimes(1)
        expect(onOpenDocument).toHaveBeenCalledWith('doc-3', 'Gamma Tips')
    })
})

describe('Sidebar — search / filter (US2)', () => {
    test('typing a query filters entries to matching documents only', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const input = screen.getByPlaceholderText(/search/i)
        fireEvent.change(input, { target: { value: 'alpha' } })
        expect(screen.getByText('Alpha Note')).toBeInTheDocument()
        expect(screen.queryByText('Beta Guide')).not.toBeInTheDocument()
        expect(screen.queryByText('Gamma Tips')).not.toBeInTheDocument()
    })

    test('clearing the input restores all entries', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const input = screen.getByPlaceholderText(/search/i)
        fireEvent.change(input, { target: { value: 'alpha' } })
        fireEvent.change(input, { target: { value: '' } })
        expect(screen.getByText('Alpha Note')).toBeInTheDocument()
        expect(screen.getByText('Beta Guide')).toBeInTheDocument()
        expect(screen.getByText('Gamma Tips')).toBeInTheDocument()
    })

    test('a non-matching query renders the no-results message', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const input = screen.getByPlaceholderText(/search/i)
        fireEvent.change(input, { target: { value: 'xyzabcdef' } })
        expect(screen.getByText(/no results/i)).toBeInTheDocument()
    })

    test('filtering is case-insensitive', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const input = screen.getByPlaceholderText(/search/i)
        fireEvent.change(input, { target: { value: 'BETA' } })
        expect(screen.getByText('Beta Guide')).toBeInTheDocument()
        expect(screen.queryByText('Alpha Note')).not.toBeInTheDocument()
    })

    test('search also matches on preview text', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        const input = screen.getByPlaceholderText(/search/i)
        fireEvent.change(input, { target: { value: 'tricks' } })
        expect(screen.getByText('Gamma Tips')).toBeInTheDocument()
        expect(screen.queryByText('Alpha Note')).not.toBeInTheDocument()
    })
})

describe('Sidebar — new document button (US4)', () => {
    test('"+" button is present in the rendered sidebar', () => {
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={jest.fn()}
            />
        )
        expect(screen.getByRole('button', { name: /new document/i })).toBeInTheDocument()
    })

    test('clicking "+" fires onNewDocument callback exactly once', () => {
        const onNewDocument = jest.fn()
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={jest.fn()}
                onNewDocument={onNewDocument}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: /new document/i }))
        expect(onNewDocument).toHaveBeenCalledTimes(1)
    })
})
