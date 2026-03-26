import styles from './CodePanelHeader.module.css'

const MODES = [
    { id: 'code', label: 'Code' },
    { id: 'snapshot', label: 'Snapshot' },
]

const CodePanelHeader = ({ mode, onModeChange, onExport, exporting, error }) => {
    return (
        <div className={styles.header}>
            <div className={styles.toggleGroup} role="group" aria-label="Code panel view mode">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        className={`${styles.toggleBtn} ${mode === m.id ? styles.active : ''}`}
                        onClick={() => onModeChange(m.id)}
                        aria-pressed={mode === m.id}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
            {mode === 'snapshot' && (
                <div className={styles.exportArea} aria-live="polite">
                    {error && (
                        <span className={styles.errorMessage} role="alert">
                            {error}
                        </span>
                    )}
                    <button
                        className={styles.exportBtn}
                        onClick={onExport}
                        disabled={exporting}
                        aria-label="Export as PNG"
                    >
                        {exporting ? 'Exporting…' : 'Export PNG'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default CodePanelHeader
