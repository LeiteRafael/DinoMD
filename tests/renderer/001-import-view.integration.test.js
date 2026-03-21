vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }) => <div>{children}</div>,
    closestCenter: vi.fn(),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
}))
vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
    arrayMove: vi.fn((arr, from, to) => {
        const next = [...arr]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
    }),
    useSortable: vi.fn(() => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    })),
}))
vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: vi.fn(() => ''),
        },
    },
}))
vi.mock('../../src/renderer/src/services/api.js', () => ({
    api: {
        getAll: vi.fn(() => Promise.resolve({ success: true, documents: [] })),
        importFiles: vi.fn(),
        reorder: vi.fn(),
        remove: vi.fn(),
        delete: vi.fn(),
        readContent: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        rename: vi.fn(),
        onFileChangedExternally: vi.fn(),
        removeFileChangedListener: vi.fn(),
        folder: {
            readDir: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
            openPicker: vi.fn(),
        },
        ui: {
            getSidebarState: vi.fn(() =>
                Promise.resolve({ open: true, widthPercent: 22, rootFolderPath: null })
            ),
            setSidebarState: vi.fn(() => Promise.resolve({ success: true })),
        },
    },
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DocumentList from '../../src/renderer/src/components/DocumentList/index.jsx'
import MainPage from '../../src/renderer/src/pages/MainPage.jsx'
import EmptyState from '../../src/renderer/src/components/EmptyState/index.jsx'
import ConfirmModal from '../../src/renderer/src/components/ConfirmModal/index.jsx'
import { api } from '../../src/renderer/src/services/api.js'

const docs = [
    {
        id: 'doc-a',
        name: 'Alpha Document',
        filePath: '/alpha.md',
        orderIndex: 0,
        status: 'available',
    },
    {
        id: 'doc-b',
        name: 'Beta Document',
        filePath: '/beta.md',
        orderIndex: 1,
        status: 'available',
    },
]

describe('DocumentList + DocumentCard integration', () => {
    test('renders both document card names', () => {
        render(<DocumentList documents={docs} onOpen={vi.fn()} onReorder={vi.fn()} />)

        expect(screen.getByText('Alpha Document')).toBeInTheDocument()
        expect(screen.getByText('Beta Document')).toBeInTheDocument()
    })

    test('calls onOpen with document id and name when card body is clicked', () => {
        const onOpen = vi.fn()

        render(<DocumentList documents={docs} onOpen={onOpen} onReorder={vi.fn()} />)
        fireEvent.click(screen.getByTitle('Alpha Document'))

        expect(onOpen).toHaveBeenCalledWith('doc-a', 'Alpha Document')
    })

    test('renders the drag handle for each card', () => {
        render(<DocumentList documents={docs} onOpen={vi.fn()} onReorder={vi.fn()} />)

        const handles = screen.getAllByLabelText('Drag to reorder')
        expect(handles).toHaveLength(2)
    })

    test('marks a missing document with a badge', () => {
        const missingDocs = [{ ...docs[0], status: 'missing' }]

        render(<DocumentList documents={missingDocs} onOpen={vi.fn()} onReorder={vi.fn()} />)

        expect(screen.getByText('Missing')).toBeInTheDocument()
    })
})

describe('EmptyState component', () => {
    test('renders heading and import call-to-action button', () => {
        const onImport = vi.fn()

        render(<EmptyState onImport={onImport} />)

        expect(screen.getByText('No documents yet')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
    })

    test('calls onImport when the import button is clicked', () => {
        const onImport = vi.fn()

        render(<EmptyState onImport={onImport} />)
        fireEvent.click(screen.getByRole('button', { name: /import/i }))

        expect(onImport).toHaveBeenCalledTimes(1)
    })
})

describe('ConfirmModal component', () => {
    test('renders title, message and primary action button', () => {
        render(
            <ConfirmModal
                title="Delete file?"
                message="This action cannot be undone."
                primaryLabel="Delete"
                onPrimary={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText('Delete file?')).toBeInTheDocument()
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    test('calls onPrimary when primary button is clicked', () => {
        const onPrimary = vi.fn()

        render(
            <ConfirmModal
                title="Confirm"
                primaryLabel="OK"
                onPrimary={onPrimary}
                onCancel={vi.fn()}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'OK' }))

        expect(onPrimary).toHaveBeenCalledTimes(1)
    })

    test('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn()

        render(
            <ConfirmModal
                title="Confirm"
                primaryLabel="OK"
                onPrimary={vi.fn()}
                onCancel={onCancel}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onCancel).toHaveBeenCalledTimes(1)
    })
})

describe('MainPage integration', () => {
    const makeHook = (overrides = {}) => ({
        documents: [],
        loading: false,
        error: null,
        importFiles: vi.fn(),
        reorderDocuments: vi.fn(),
        refreshDocuments: vi.fn(),
        ...overrides,
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders the DinoMD logo and action buttons', () => {
        render(
            <MainPage
                docsHook={makeHook()}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText(/DinoMD/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /new document/i })).toBeInTheDocument()
    })

    test('shows EmptyState when there are no documents', () => {
        render(
            <MainPage
                docsHook={makeHook()}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText('No documents yet')).toBeInTheDocument()
    })

    test('displays the document list when documents exist', () => {
        render(
            <MainPage
                docsHook={makeHook({ documents: docs })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText('Alpha Document')).toBeInTheDocument()
        expect(screen.getByText('Beta Document')).toBeInTheDocument()
    })

    test('calls onNewDocument when New document button is clicked', () => {
        const onNewDocument = vi.fn()

        render(
            <MainPage
                docsHook={makeHook()}
                onOpenDocument={vi.fn()}
                onNewDocument={onNewDocument}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: /new document/i }))

        expect(onNewDocument).toHaveBeenCalledTimes(1)
    })

    test('shows loading indicator while loading is true', () => {
        render(
            <MainPage
                docsHook={makeHook({ loading: true })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    test('shows error message when hook has an error', () => {
        render(
            <MainPage
                docsHook={makeHook({ error: 'Disk read failure' })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        expect(screen.getByText(/Disk read failure/)).toBeInTheDocument()
    })

    test('shows notification after import has skipped files', async () => {
        const importFiles = vi.fn(() =>
            Promise.resolve({
                success: true,
                imported: [],
                skipped: [{ filePath: '/docs/notes.md', reason: 'duplicate' }],
            })
        )

        render(
            <MainPage
                docsHook={makeHook({ importFiles })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )
        const [headerImportBtn] = screen.getAllByRole('button', { name: '+ Import .md files' })
        fireEvent.click(headerImportBtn)

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument()
        })
        expect(screen.getByText(/notes\.md.*already imported/)).toBeInTheDocument()
    })

    test('shows ConfirmModal when a document delete action is triggered', async () => {
        const docsWithId = [{ ...docs[0], id: 'doc-a' }]
        api.delete.mockResolvedValue({ success: true })

        render(
            <MainPage
                docsHook={makeHook({ documents: docsWithId })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={vi.fn()}
            />
        )

        const deleteBtn = screen.getByRole('button', { name: /delete/i })
        fireEvent.click(deleteBtn)

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
        expect(screen.getByText(/Move to Trash/)).toBeInTheDocument()
    })

    test('calls api.delete and onDocumentDeleted when ConfirmModal primary is clicked', async () => {
        const docsWithId = [{ ...docs[0], id: 'doc-a' }]
        const onDocumentDeleted = vi.fn()
        api.delete.mockResolvedValue({ success: true })

        render(
            <MainPage
                docsHook={makeHook({ documents: docsWithId })}
                onOpenDocument={vi.fn()}
                onNewDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onDocumentDeleted={onDocumentDeleted}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /delete/i }))
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: 'Move to Trash' }))

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith({ id: 'doc-a' })
            expect(onDocumentDeleted).toHaveBeenCalledWith('doc-a')
        })
    })
})
