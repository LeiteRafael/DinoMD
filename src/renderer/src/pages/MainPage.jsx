import { useState } from 'react'
import useDocuments from '../hooks/useDocuments.js'
import DocumentList from '../components/DocumentList/index.jsx'
import EmptyState from '../components/EmptyState/index.jsx'
import styles from './MainPage.module.css'

export default function MainPage({ onOpenDocument }) {
  const { documents, loading, error, importFiles, reorderDocuments } = useDocuments()
  const [notification, setNotification] = useState(null)

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>🦕 DinoMD</div>
        <button className={styles.importBtn} onClick={handleImport}>
          + Import .md files
        </button>
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
          <DocumentList documents={documents} onOpen={onOpenDocument} onReorder={reorderDocuments} />
        )}
      </main>
    </div>
  )
}
