import { useState } from 'react'
import DocumentList from '../components/DocumentList/index.jsx'
import EmptyState from '../components/EmptyState/index.jsx'
import ConfirmModal from '../components/ConfirmModal/index.jsx'
import { api } from '../services/api.js'
import styles from './MainPage.module.css'

export default function MainPage({ docsHook, onOpenDocument, onNewDocument, onEditDocument, onDocumentDeleted }) {
  const { documents, loading, error, importFiles, reorderDocuments } = docsHook
  const [notification, setNotification] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null) // { id, name }

  async function handleImport() {
    const result = await importFiles()
    if (result?.skipped?.length > 0) {
      const messages = result.skipped.map((s) => {
        const filename = s.filePath.split(/[\\/]/).pop()
        const reasons = { duplicate: 'already imported', 'invalid-type': 'not a .md file', unreadable: 'cannot be read' }
        return `${filename} (${reasons[s.reason] ?? s.reason})`
      })
      setNotification(`Skipped: ${messages.join(', ')}`)
      setTimeout(() => setNotification(null), 5000)
    }
  }

  function handleDeleteDocument(id) {
    const doc = documents.find((d) => d.id === id)
    if (doc) setDeleteModal({ id: doc.id, name: doc.name })
  }

  async function confirmDelete() {
    if (!deleteModal) return
    const result = await api.delete({ id: deleteModal.id })
    const deletedId = deleteModal.id
    setDeleteModal(null)
    if (result.success) {
      onDocumentDeleted?.(deletedId)
    } else {
      setNotification(`Delete failed: ${result.error}`)
      setTimeout(() => setNotification(null), 5000)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>🦕 DinoMD</div>
        <div className={styles.headerActions}>
          <button className={styles.newBtn} onClick={onNewDocument}>
            + New document
          </button>
          <button className={styles.importBtn} onClick={handleImport}>
            + Import .md files
          </button>
        </div>
      </header>

      {notification && (
        <div className={styles.notification} role="alert">
          {notification}
          <button className={styles.notificationClose} onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <main className={styles.main}>
        {error && <p className={styles.error}>Error: {error}</p>}
        {loading && <p className={styles.loading}>Loading…</p>}
        {!loading && !error && documents.length === 0 && <EmptyState onImport={handleImport} />}
        {!loading && !error && documents.length > 0 && (
          <DocumentList
            documents={documents}
            onOpen={onOpenDocument}
            onEdit={onEditDocument}
            onDelete={handleDeleteDocument}
            onReorder={reorderDocuments}
          />
        )}
      </main>

      {deleteModal && (
        <ConfirmModal
          title="Delete document"
          message={`Move "${deleteModal.name}" to the trash?`}
          primaryLabel="Move to Trash"
          cancelLabel="Cancel"
          onPrimary={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  )
}
