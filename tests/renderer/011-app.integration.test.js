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
    CSS: { Transform: { toString: vi.fn(() => '') } },
}))
vi.mock('react-resizable-panels', () => ({
    PanelGroup: ({ children }) => <div data-testid="panel-group">{children}</div>,
    Panel: ({ children }) => <div data-testid="panel">{children}</div>,
    PanelResizeHandle: () => <div data-testid="resize-handle" />,
}))
vi.mock('react-markdown', () => ({
    default: ({ children }) => <div data-testid="markdown-content">{children}</div>,
}))
vi.mock('remark-gfm', () => ({ default: () => {} }))
vi.mock('remark-frontmatter', () => ({ default: () => {} }))
vi.mock('rehype-slug', () => ({ default: () => {} }))
vi.mock('shiki', () => ({
    codeToHtml: vi.fn(() => Promise.resolve('<pre><code></code></pre>')),
}))
vi.mock('../../src/renderer/src/services/api.js', () => ({
    api: {
        getAll: vi.fn(() => Promise.resolve({ success: true, documents: [] })),
        importFiles: vi.fn(),
        reorder: vi.fn(),
        readContent: vi.fn(() => Promise.resolve({ success: true, content: '# Hello' })),
        remove: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(() =>
            Promise.resolve({
                success: true,
                draft: { id: 'draft-1', filePath: null, name: 'Untitled' },
            })
        ),
        save: vi.fn(() =>
            Promise.resolve({
                success: true,
                filePath: '/files/doc.md',
                name: 'My Doc',
                mtimeMs: 1000,
            })
        ),
        rename: vi.fn(),
        onFileChangedExternally: vi.fn(),
        removeFileChangedListener: vi.fn(),
        folder: {
            readDir: vi.fn(() => Promise.resolve([])),
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
import App from '../../src/renderer/src/App.jsx'
import { api } from '../../src/renderer/src/services/api.js'

describe('App integration — view routing', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.getAll.mockResolvedValue({ success: true, documents: [] })
        api.ui.getSidebarState.mockResolvedValue({
            open: true,
            widthPercent: 22,
            rootFolderPath: null,
        })
    })

    test('renders the main page (document list) by default', async () => {
        render(<App />)

        await waitFor(() => {
            expect(screen.getByText(/DinoMD/)).toBeInTheDocument()
        })
        expect(screen.getByText('No documents yet')).toBeInTheDocument()
    })

    test('navigates to editor view when New document is clicked', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: { id: 'draft-1', filePath: null, name: 'Untitled' },
        })

        render(<App />)
        await waitFor(() => expect(screen.getByText(/DinoMD/)).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: '+ New document' }))

        await waitFor(() => {
            expect(screen.getByLabelText('Markdown editor')).toBeInTheDocument()
        })
    })

    test('navigates back to main view from editor', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: { id: 'draft-1', filePath: null, name: 'Untitled' },
        })

        render(<App />)
        await waitFor(() => expect(screen.getByText(/DinoMD/)).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: '+ New document' }))
        await waitFor(() => expect(screen.getByLabelText('Markdown editor')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: 'Back to document list' }))

        await waitFor(() => {
            expect(screen.getByText(/DinoMD/)).toBeInTheDocument()
        })
    })

    test('renders main page with sidebar panel group when sidebar is open', async () => {
        render(<App />)

        await waitFor(() => {
            expect(screen.getByTestId('panel-group')).toBeInTheDocument()
        })
    })

    test('shows reader view when a document is opened', async () => {
        const docs = [
            {
                id: 'doc-1',
                name: 'My Notes',
                filePath: '/my-notes.md',
                orderIndex: 0,
                status: 'available',
            },
        ]
        api.getAll.mockResolvedValue({ success: true, documents: docs })
        api.readContent.mockResolvedValue({ success: true, content: '# My Notes' })

        render(<App />)

        await waitFor(() => expect(screen.getByText('My Notes')).toBeInTheDocument())
        fireEvent.click(screen.getByTitle('My Notes'))

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Back to document list' })
            ).toBeInTheDocument()
            expect(screen.getByText('My Notes')).toBeInTheDocument()
        })
    })

    test('sidebar toggle button appears and toggles sidebar open state', async () => {
        api.ui.getSidebarState.mockResolvedValue({
            open: false,
            widthPercent: 22,
            rootFolderPath: null,
        })
        api.ui.setSidebarState.mockResolvedValue({ success: true })

        render(<App />)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeInTheDocument()
        })
    })
})
