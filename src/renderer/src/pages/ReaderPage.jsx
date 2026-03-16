import useMarkdown from '../hooks/useMarkdown.js'
import MarkdownViewer from '../components/MarkdownViewer/index.jsx'
import ErrorBoundary from '../components/ErrorBoundary/index.jsx'
import styles from './ReaderPage.module.css'

export default function ReaderPage({ documentId, documentName, onBack, onEditDocument }) {
    const { rawMarkdown, loading, error } = useMarkdown(documentId)

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={onBack}
                    aria-label="Back to document list"
                >
                    ← Back
                </button>
                <span className={styles.title}>{documentName}</span>
                {onEditDocument && (
                    <button
                        className={styles.editBtn}
                        onClick={() => onEditDocument({ id: documentId, name: documentName })}
                        aria-label="Edit document"
                    >
                        Edit
                    </button>
                )}
            </header>

            <main className={styles.main}>
                <ErrorBoundary>
                    {loading && <p className={styles.loading}>Loading…</p>}
                    {error && <p className={styles.error}>Could not load document: {error}</p>}
                    {!loading && !error && rawMarkdown !== null && (
                        <MarkdownViewer rawMarkdown={rawMarkdown} />
                    )}
                </ErrorBoundary>
            </main>
        </div>
    )
}
