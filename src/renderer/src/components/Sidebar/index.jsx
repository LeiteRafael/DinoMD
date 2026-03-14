import { useState } from 'react'
import useDebounce from '../../hooks/useDebounce.js'
import styles from './Sidebar.module.css'

export default function Sidebar({
  documents = [],
  activeDocumentId = null,
  onOpenDocument,
  onNewDocument,
  onToggle
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 150)

  const filteredDocuments = debouncedQuery
    ? documents.filter((doc) => {
        const q = debouncedQuery.toLowerCase()
        return (
          doc.name.toLowerCase().includes(q) ||
          (doc.preview ?? '').toLowerCase().includes(q)
        )
      })
    : documents

  function handleEntryClick(doc) {
    onOpenDocument?.(doc.id, doc.name)
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Documents</span>
        <div className={styles.headerActions}>
          <button
            className={styles.newDocButton}
            onClick={() => onNewDocument?.()}
            title="New Document"
            aria-label="New Document"
          >
            +
          </button>
          <button
            className={styles.toggleButton}
            onClick={() => onToggle?.()}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            ‹
          </button>
        </div>
      </div>

      <div className={styles.searchWrapper}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search documents"
        />
      </div>

      <div className={styles.list}>
        {documents.length === 0 && (
          <div className={styles.emptyState}>
            No documents yet. Click + to create one.
          </div>
        )}

        {documents.length > 0 && filteredDocuments.length === 0 && debouncedQuery && (
          <div className={styles.noResults}>
            No results for &ldquo;{debouncedQuery}&rdquo;
          </div>
        )}

        {filteredDocuments.map((doc) => (
          <button
            key={doc.id}
            className={[
              styles.entry,
              doc.id === activeDocumentId ? styles.entryActive : ''
            ]
              .join(' ')
              .trim()}
            onClick={() => handleEntryClick(doc)}
            title={doc.name}
          >
            <span className={styles.entryTitle}>{doc.name}</span>
            {doc.preview && (
              <span className={styles.entryPreview}>{doc.preview}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
