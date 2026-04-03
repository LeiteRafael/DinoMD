import { useState } from 'react'
import useFileTree from '../../hooks/useFileTree.js'
import useDebounce from '../../hooks/useDebounce.js'
import TreeNode from './TreeNode.jsx'
import styles from './Sidebar.module.css'

function basename(filePath) {
    if (!filePath) return ''
    return filePath.split(/[\\/]/).filter(Boolean).pop() ?? filePath
}

export default function Sidebar({
    rootFolderPath,
    activeFilePath = null,
    onOpenFile,
    onRootFolderChange,
    onToggle,
    documents = [],
    activeDocumentId = null,
    onOpenDocument,
    onNewDocument,
}) {
    const useFileTreeMode = rootFolderPath !== undefined

    const treeState = useFileTree({
        initialRootFolderPath: useFileTreeMode ? rootFolderPath : null,
        onRootFolderChange,
    })

    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 150)
    const docCountLabel = `${documents.length} ${documents.length === 1 ? 'item' : 'items'}`

    if (useFileTreeMode) {
        const { rootEntries, expandedPaths, loading, error, openFolder, toggleFolder } = treeState
        const folderName = treeState.rootFolderPath ? basename(treeState.rootFolderPath) : null

        return (
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <div className={styles.headerMeta}>
                        <span className={styles.headerTitle}>{folderName ?? 'Explorer'}</span>
                        {treeState.rootFolderPath && (
                            <span className={styles.headerSubtitle}>File browser</span>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.openFolderButton}
                            onClick={openFolder}
                            title="Open Folder"
                            aria-label="Open Folder"
                        >
                            <span className="material-icons">create_new_folder</span>
                        </button>
                        <button
                            className={styles.toggleButton}
                            onClick={() => onToggle?.()}
                            title="Toggle sidebar"
                            aria-label="Toggle sidebar"
                        >
                            <span className="material-icons">left_panel_close</span>
                        </button>
                    </div>
                </div>

                <div className={styles.list}>
                    {!treeState.rootFolderPath && !loading && (
                        <div className={styles.emptyState}>
                            <p>No folder open</p>
                            <button className={styles.openFolderCta} onClick={openFolder}>
                                Open Folder
                            </button>
                        </div>
                    )}

                    {treeState.rootFolderPath && loading && (
                        <div className={styles.emptyState}>Loading…</div>
                    )}

                    {treeState.rootFolderPath && !loading && error && (
                        <div className={styles.emptyState}>{error}</div>
                    )}

                    {treeState.rootFolderPath && !loading && !error && rootEntries.length === 0 && (
                        <div className={styles.emptyState}>This folder is empty.</div>
                    )}

                    {treeState.rootFolderPath &&
                        !loading &&
                        !error &&
                        rootEntries.map((node) => (
                            <TreeNode
                                key={node.path}
                                node={node}
                                expandedPaths={expandedPaths}
                                onToggle={toggleFolder}
                                onOpenFile={onOpenFile}
                                activeFilePath={activeFilePath}
                            />
                        ))}
                </div>
            </div>
        )
    }

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
                <div className={styles.headerMeta}>
                    <span className={styles.headerTitle}>Documents</span>
                    <span className={styles.headerSubtitle}>{docCountLabel}</span>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.newDocButton}
                        onClick={() => onNewDocument?.()}
                        title="New Document"
                        aria-label="New Document"
                    >
                        <span className="material-icons">add</span>
                    </button>
                    <button
                        className={styles.toggleButton}
                        onClick={() => onToggle?.()}
                        title="Toggle sidebar"
                        aria-label="Toggle sidebar"
                    >
                        <span className="material-icons">left_panel_close</span>
                    </button>
                </div>
            </div>

            <div className={styles.searchWrapper}>
                <div className={styles.searchField}>
                    <span className={`material-icons ${styles.searchIcon}`}>search</span>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search documents…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search documents"
                    />
                </div>
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
                            doc.id === activeDocumentId ? styles.entryActive : '',
                        ]
                            .join(' ')
                            .trim()}
                        onClick={() => handleEntryClick(doc)}
                        title={doc.name}
                    >
                        <span className={styles.entryTitle}>{doc.name}</span>
                        {doc.preview && <span className={styles.entryPreview}>{doc.preview}</span>}
                    </button>
                ))}
            </div>
        </div>
    )
}
