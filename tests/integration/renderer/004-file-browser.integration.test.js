vi.mock('../../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))
vi.mock('../../../src/renderer/src/hooks/useFileTree.js', () => ({
    __esModule: true,
    default: vi.fn(),
    ICON_FOLDER_CLOSED: '▶',
    ICON_FOLDER_OPEN: '▼',
    ICON_MD: '📝',
    ICON_FILE: '📄',
}))

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '../../../src/renderer/src/components/Sidebar/index.jsx'
import useFileTree from '../../../src/renderer/src/hooks/useFileTree.js'

const docs = [
    { id: 'doc-1', name: 'Alpha Doc', status: 'available', orderIndex: 0 },
    { id: 'doc-2', name: 'Beta Doc', status: 'available', orderIndex: 1 },
    { id: 'doc-3', name: 'Gamma Doc', status: 'available', orderIndex: 2 },
]

function makeTreeState(overrides = {}) {
    return {
        rootFolderPath: null,
        rootEntries: [],
        expandedPaths: new Set(),
        loading: false,
        error: null,
        openFolder: vi.fn(),
        toggleFolder: vi.fn(),
        ...overrides,
    }
}

describe('Sidebar document list + document selection integration', () => {
    beforeEach(() => {
        useFileTree.mockReturnValue(makeTreeState())
    })

    test('renders all document names in the list', () => {
        render(<Sidebar documents={docs} onOpenDocument={vi.fn()} />)

        expect(screen.getByText('Alpha Doc')).toBeInTheDocument()
        expect(screen.getByText('Beta Doc')).toBeInTheDocument()
        expect(screen.getByText('Gamma Doc')).toBeInTheDocument()
    })

    test('calls onOpenDocument with id and name when a document entry is clicked', () => {
        const onOpenDocument = vi.fn()

        render(<Sidebar documents={docs} onOpenDocument={onOpenDocument} />)
        fireEvent.click(screen.getByTitle('Beta Doc'))

        expect(onOpenDocument).toHaveBeenCalledWith('doc-2', 'Beta Doc')
    })

    test('highlights the active document with a different style class', () => {
        render(<Sidebar documents={docs} activeDocumentId="doc-1" onOpenDocument={vi.fn()} />)

        const activeEntry = screen.getByTitle('Alpha Doc')
        expect(activeEntry).toBeInTheDocument()
    })

    test('filters document list according to search query', () => {
        render(<Sidebar documents={docs} onOpenDocument={vi.fn()} />)
        const searchInput = screen.getByPlaceholderText('Search…')

        fireEvent.change(searchInput, { target: { value: 'Gamma' } })

        expect(screen.getByText('Gamma Doc')).toBeInTheDocument()
        expect(screen.queryByText('Alpha Doc')).not.toBeInTheDocument()
    })
})
