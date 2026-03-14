import styles from './DocumentCard.module.css'

export default function DocumentCard({ id, name, status, onClick, style, dragHandleProps }) {
  const isMissing = status === 'missing'

  return (
    <div
      className={`${styles.card} ${isMissing ? styles.missing : ''}`}
      onClick={isMissing ? undefined : () => onClick(id, name)}
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
    </div>
  )
}
