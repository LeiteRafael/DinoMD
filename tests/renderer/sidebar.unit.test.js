import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))

vi.mock('../../src/renderer/src/hooks/useFileTree.js', () => ({
    __esModule: true,
    default: vi.fn(),
    ICON_FOLDER_CLOSED: '▶',
    ICON_FOLDER_OPEN: '▼',
    ICON_MD: '📝',
    ICON_FILE: '📄',
}))

import Sidebar from '../../src/renderer/src/components/Sidebar/index.jsx'
import useFileTree from '../../src/renderer/src/hooks/useFileTree.js'

const ROOT = '/home/user/notes'

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

describe('Sidebar — empty state', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useFileTree.mockReturnValue(makeTreeState())
    })

    test('shows no-folder message when rootFolderPath is null', () => {
        render(<Sidebar rootFolderPath={null} />)

        expect(screen.getByText(/no folder open/i)).toBeInTheDocument()
    })

    test('shows Open Folder button when rootFolderPath is null', () => {
        render(<Sidebar rootFolderPath={null} />)

        expect(screen.getByText('Open Folder')).toBeInTheDocument()
    })

    test('clicking Open Folder triggers openFolder from hook', () => {
        const openFolder = vi.fn()
        useFileTree.mockReturnValue(makeTreeState({ openFolder }))

        render(<Sidebar rootFolderPath={null} />)
        fireEvent.click(screen.getByText('Open Folder'))

        expect(openFolder).toHaveBeenCalledTimes(1)
    })
})

describe('Sidebar — loading state', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useFileTree.mockReturnValue(makeTreeState({ rootFolderPath: ROOT, loading: true }))
    })

    test('shows loading indicator when loading is true', () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
})

describe('Sidebar — error state', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useFileTree.mockReturnValue(
            makeTreeState({ rootFolderPath: ROOT, error: 'Permission denied' })
        )
    })

    test('shows error message when error is set', () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })
})

describe('Sidebar — tree rendering', () => {
    const folderNode = {
        name: 'docs',
        path: `${ROOT}/docs`,
        type: 'folder',
        extension: null,
        depth: 0,
        children: null,
    }
    const fileNode = {
        name: 'readme.md',
        path: `${ROOT}/readme.md`,
        type: 'file',
        extension: 'md',
        depth: 0,
        children: undefined,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        useFileTree.mockReturnValue(
            makeTreeState({
                rootFolderPath: ROOT,
                rootEntries: [folderNode, fileNode],
            })
        )
    })

    test('renders folder name in tree', () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        expect(screen.getByText('docs')).toBeInTheDocument()
    })

    test('renders file name in tree', () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        expect(screen.getByText('readme.md')).toBeInTheDocument()
    })

    test('active file row has active CSS class when activeFilePath matches', () => {
        render(<Sidebar rootFolderPath={ROOT} activeFilePath={`${ROOT}/readme.md`} />)

        const row = screen.getByTitle(`${ROOT}/readme.md`)
        expect(row.className).toMatch(/treeRowActive/)
    })

    test('non-active file row does not have active CSS class', () => {
        render(<Sidebar rootFolderPath={ROOT} activeFilePath={`${ROOT}/readme.md`} />)

        const row = screen.getByTitle(`${ROOT}/docs`)
        expect(row.className).not.toMatch(/treeRowActive/)
    })

    test('clicking a folder node calls toggleFolder', () => {
        const toggleFolder = vi.fn()
        useFileTree.mockReturnValue(
            makeTreeState({
                rootFolderPath: ROOT,
                rootEntries: [folderNode],
                toggleFolder,
            })
        )

        render(<Sidebar rootFolderPath={ROOT} />)
        fireEvent.click(screen.getByTitle(`${ROOT}/docs`))

        expect(toggleFolder).toHaveBeenCalledWith(`${ROOT}/docs`, null)
    })

    test('clicking an md file node calls onOpenFile with its path', () => {
        const onOpenFile = vi.fn()
        useFileTree.mockReturnValue(
            makeTreeState({
                rootFolderPath: ROOT,
                rootEntries: [fileNode],
            })
        )

        render(<Sidebar rootFolderPath={ROOT} onOpenFile={onOpenFile} />)
        fireEvent.click(screen.getByTitle(`${ROOT}/readme.md`))

        expect(onOpenFile).toHaveBeenCalledWith(`${ROOT}/readme.md`)
    })
})

describe('Sidebar — header', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useFileTree.mockReturnValue(makeTreeState({ rootFolderPath: ROOT }))
    })

    test('shows folder basename in header when a folder is open', () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        expect(screen.getByText('notes')).toBeInTheDocument()
    })

    test('shows Explorer in header when no folder is open', () => {
        useFileTree.mockReturnValue(makeTreeState())

        render(<Sidebar rootFolderPath={null} />)

        expect(screen.getByText('Explorer')).toBeInTheDocument()
    })
})

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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
            />
        )
        expect(screen.getByText(/no documents yet/i)).toBeInTheDocument()
    })

    test('clicking a row fires onOpenDocument with correct id and name', () => {
        const onOpenDocument = vi.fn()
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={onOpenDocument}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
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
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
            />
        )
        expect(screen.getByRole('button', { name: /new document/i })).toBeInTheDocument()
    })

    test('clicking "+" fires onNewDocument callback exactly once', () => {
        const onNewDocument = vi.fn()
        render(
            <Sidebar
                documents={sampleDocs}
                activeDocumentId={null}
                onOpenDocument={vi.fn()}
                onNewDocument={onNewDocument}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: /new document/i }))
        expect(onNewDocument).toHaveBeenCalledTimes(1)
    })
})
