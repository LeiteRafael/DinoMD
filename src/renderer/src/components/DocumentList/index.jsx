import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DocumentCard from '../DocumentCard/index.jsx'
import styles from './DocumentList.module.css'
function SortableCard({ doc, onOpen, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: doc.id,
    })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 10 : 'auto',
    }
    return (
        <div ref={setNodeRef} style={style}>
            <DocumentCard
                id={doc.id}
                name={doc.name}
                status={doc.status}
                onClick={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
                dragHandleProps={{
                    ...attributes,
                    ...listeners,
                }}
            />
        </div>
    )
}
export default function DocumentList({ documents, onOpen, onEdit, onDelete, onReorder }) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )
    function handleDragEnd(event) {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = documents.findIndex((d) => d.id === active.id)
        const newIndex = documents.findIndex((d) => d.id === over.id)
        const reordered = arrayMove(documents, oldIndex, newIndex)
        onReorder(reordered.map((d) => d.id))
    }
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={documents.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className={styles.list}>
                    {documents.map((doc) => (
                        <SortableCard
                            key={doc.id}
                            doc={doc}
                            onOpen={onOpen}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
