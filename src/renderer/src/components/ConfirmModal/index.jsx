import styles from './ConfirmModal.module.css'

/**
 * Reusable confirmation dialog.
 *
 * Props:
 *   title       — Dialog heading
 *   message     — Body text
 *   primaryLabel    — Label for the primary (destructive/confirm) button
 *   secondaryLabel  — Label for the secondary button (optional)
 *   cancelLabel     — Label for the cancel button (defaults to "Cancel")
 *   onPrimary   — Called when primary button is clicked
 *   onSecondary — Called when secondary button is clicked (omit to hide button)
 *   onCancel    — Called when cancel button or backdrop is clicked
 */
export default function ConfirmModal({
  title,
  message,
  primaryLabel = 'Confirm',
  secondaryLabel,
  cancelLabel = 'Cancel',
  onPrimary,
  onSecondary,
  onCancel
}) {
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel?.()
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        <h2 id="confirm-modal-title" className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          {onSecondary && (
            <button className={styles.secondaryBtn} onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={styles.primaryBtn} onClick={onPrimary} autoFocus>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
