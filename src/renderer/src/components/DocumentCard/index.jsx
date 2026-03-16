import styles from './DocumentCard.module.css'

export default function DocumentCard({
    id,
    name,
    status,
    onClick,
    onEdit,
    onDelete,
    style,
    dragHandleProps,
}) {
    const isMissing = status === 'missing'

    function handleCardClick() {
        if (!isMissing) onClick(id, name)
    }

    function handleEditClick(e) {
        e.stopPropagation()
        onEdit?.(id, name)
    }

    function handleDeleteClick(e) {
        e.stopPropagation()
        onDelete?.(id)
    }

    return (
        <div
            className={`${styles.card} ${isMissing ? styles.missing : ''}`}
            onClick={handleCardClick}
            title={isMissing ? 'File not found — re-import to restore' : name}
            style={style}
        >
            <div {...dragHandleProps} className={styles.dragHandle} aria-label="Drag to reorder">
                ⠿
            </div>
            <div className={styles.content}>
                <span className={styles.name}>{name}</span>
                {isMissing && <span className={styles.badge}>Missing</span>}
            </div>
            <div className={styles.cardActions}>
                {!isMissing && (
                    <button
                        className={styles.editBtn}
                        onClick={handleEditClick}
                        aria-label={`Edit ${name}`}
                        title="Edit"
                    >
                        ✎
                    </button>
                )}
                <button
                    className={styles.deleteBtn}
                    onClick={handleDeleteClick}
                    aria-label={`Delete ${name}`}
                    title="Delete"
                >
                    ×
                </button>
            </div>
        </div>
    )
}
