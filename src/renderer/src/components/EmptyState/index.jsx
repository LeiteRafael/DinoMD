import styles from './EmptyState.module.css'

export default function EmptyState({ onImport }) {
  return (
    <div className={styles.container}>
      <div className={styles.dino} aria-hidden="true">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Simple dino silhouette */}
          <ellipse cx="40" cy="55" rx="22" ry="14" fill="currentColor" opacity="0.15"/>
          <path d="M24 46 C24 32 32 22 44 22 C52 22 58 28 58 36 C58 44 56 48 52 50 L52 56 L44 56 L44 50 C38 50 32 48 28 52 Z" fill="currentColor" opacity="0.7"/>
          <circle cx="50" cy="28" r="3" fill="currentColor"/>
          {/* Spikes */}
          <path d="M44 22 L42 16 L46 20 L48 13 L50 20 L54 15 L54 22" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
      <h2 className={styles.heading}>No documents yet</h2>
      <p className={styles.sub}>Import your first Markdown file to get started</p>
      <button className={styles.btn} onClick={onImport}>
        + Import .md files
      </button>
    </div>
  )
}
