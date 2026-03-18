import styles from './Toast.module.css'

export default function Toast({ toast, onDismiss }) {
    if (!toast) return null

    return (
        <div
            className={`${styles.toast} ${styles[toast.type] ?? ''}`}
            role="status"
            aria-live="polite"
        >
            <span className={styles.message}>{toast.message}</span>
            <button
                className={styles.dismiss}
                onClick={onDismiss}
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    )
}
