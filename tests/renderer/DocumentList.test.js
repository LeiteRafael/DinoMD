// T028: Unit tests for DocumentList drag-and-drop
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock @dnd-kit entirely — we test our logic, not the library
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }) => {
    // Expose onDragEnd on the DOM so tests can invoke it
    if (typeof global.__dndOnDragEnd === 'undefined') {
      global.__dndOnDragEnd = onDragEnd
    } else {
      global.__dndOnDragEnd = onDragEnd
    }
    return <div data-testid="dnd-context">{children}</div>
  },
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => [])
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
  arrayMove: jest.fn((arr, from, to) => {
    const next = [...arr]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  }),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }))
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: jest.fn(() => '') } }
}))

const DocumentList = require('../../src/renderer/src/components/DocumentList/index.jsx').default

const docs = [
  { id: 'a', name: 'Alpha', filePath: '/a.md', orderIndex: 0, status: 'available' },
  { id: 'b', name: 'Beta', filePath: '/b.md', orderIndex: 1, status: 'available' }
]

describe('DocumentList', () => {
  beforeEach(() => {
    delete global.__dndOnDragEnd
  })

  test('renders all document names', () => {
    render(<DocumentList documents={docs} onOpen={jest.fn()} onReorder={jest.fn()} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  test('calls onReorder with new id order when drag ends', () => {
    const onReorder = jest.fn()
    render(<DocumentList documents={docs} onOpen={jest.fn()} onReorder={onReorder} />)

    // Simulate a drag-end event: move 'b' before 'a'
    const dragEndEvent = { active: { id: 'b' }, over: { id: 'a' } }
    global.__dndOnDragEnd(dragEndEvent)

    expect(onReorder).toHaveBeenCalledWith(['b', 'a'])
  })

  test('does NOT call onReorder when dropped on same item', () => {
    const onReorder = jest.fn()
    render(<DocumentList documents={docs} onOpen={jest.fn()} onReorder={onReorder} />)

    global.__dndOnDragEnd({ active: { id: 'a' }, over: { id: 'a' } })

    expect(onReorder).not.toHaveBeenCalled()
  })
})
