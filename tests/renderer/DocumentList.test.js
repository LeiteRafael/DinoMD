import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children, onDragEnd }) => {
        if (typeof global.__dndOnDragEnd === 'undefined') {
            global.__dndOnDragEnd = onDragEnd
        } else {
            global.__dndOnDragEnd = onDragEnd
        }
        return <div data-testid="dnd-context">{children}</div>
    },
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
import DocumentList from '../../src/renderer/src/components/DocumentList/index.jsx'
const docs = [
    {
        id: 'a',
        name: 'Alpha',
        filePath: '/a.md',
        orderIndex: 0,
        status: 'available',
    },
    {
        id: 'b',
        name: 'Beta',
        filePath: '/b.md',
        orderIndex: 1,
        status: 'available',
    },
]
describe('DocumentList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete global.__dndOnDragEnd
    })

    test('renders all document names', () => {
        render(<DocumentList documents={docs} onOpen={vi.fn()} onReorder={vi.fn()} />)

        expect(screen.getByText('Alpha')).toBeInTheDocument()
        expect(screen.getByText('Beta')).toBeInTheDocument()
    })

    test('calls onReorder with new id order when drag ends', () => {
        const onReorder = vi.fn()

        render(<DocumentList documents={docs} onOpen={vi.fn()} onReorder={onReorder} />)
        const dragEndEvent = {
            active: {
                id: 'b',
            },
            over: {
                id: 'a',
            },
        }
        global.__dndOnDragEnd(dragEndEvent)

        expect(onReorder).toHaveBeenCalledWith(['b', 'a'])
    })

    test('does NOT call onReorder when dropped on same item', () => {
        const onReorder = vi.fn()

        render(<DocumentList documents={docs} onOpen={vi.fn()} onReorder={onReorder} />)
        global.__dndOnDragEnd({
            active: {
                id: 'a',
            },
            over: {
                id: 'a',
            },
        })

        expect(onReorder).not.toHaveBeenCalled()
    })
})
