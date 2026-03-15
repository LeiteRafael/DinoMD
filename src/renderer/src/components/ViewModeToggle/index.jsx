import styles from './ViewModeToggle.module.css'
const MODES = [
    {
        id: 'split',
        label: 'Split',
    },
    {
        id: 'editor',
        label: 'Editor Only',
    },
    {
        id: 'preview',
        label: 'Preview Only',
    },
]
export default function ViewModeToggle({ viewMode, onModeChange }) {
    return (
        <div className={styles.group} role="group" aria-label="View mode">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    className={`${styles.btn} ${viewMode === mode.id ? styles.active : ''}`}
                    onClick={() => onModeChange(mode.id)}
                    aria-pressed={viewMode === mode.id}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    )
}
