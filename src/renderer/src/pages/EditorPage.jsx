import { useState, useEffect, useRef } from 'react'
import MarkdownEditor from '../components/MarkdownEditor/index.jsx'
import ConfirmModal from '../components/ConfirmModal/index.jsx'
import Toast from '../components/Toast/index.jsx'
import { api } from '../services/api.js'
import useToast from '../hooks/useToast.js'
import { copyToClipboard, stripMarkdown } from '../utils/clipboardUtils.js'
import styles from './EditorPage.module.css'
export default function EditorPage({
    editorHook,
    onBack,
    onDocumentSaved,
    onDocumentDeleted,
    onDocumentRenamed,
    onSplitView,
}) {
    const {
        session,
        isDirty,
        saving,
        error,
        updateContent,
        save,
        rename,
        discard,
        deleteDocument,
        reloadContent,
    } = editorHook
    const [titleValue, setTitleValue] = useState(session.name)
    const [titleEditing, setTitleEditing] = useState(false)
    const [titleError, setTitleError] = useState(null)
    const [modal, setModal] = useState(null)
    const [externalChangeBanner, setExternalChangeBanner] = useState(false)
    const [bannerError, setBannerError] = useState(null)
    const titleRef = useRef(null)
    const handleSaveRef = useRef(handleSave)
    handleSaveRef.current = handleSave
    const { toast, showToast, dismissToast } = useToast()
    useEffect(() => {
        setTitleValue(session.name)
    }, [session.name])
    useEffect(() => {
        function handleCtrlS(e) {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
                if (!session.isDraft && session.filePath) {
                    handleSaveRef.current()
                }
            }
        }
        window.addEventListener('keydown', handleCtrlS)
        return () => window.removeEventListener('keydown', handleCtrlS)
    }, [session.isDraft, session.filePath])
    useEffect(() => {
        if (!session.documentId || session.isDraft) return
        api.onFileChangedExternally?.((data) => {
            if (data.id === session.documentId) {
                setExternalChangeBanner(true)
            }
        })
        return () => {
            api.removeFileChangedListener?.()
        }
    }, [session.documentId, session.isDraft])
    async function handleSave() {
        const result = await save()
        if (result.saved && session.isDraft) {
            onDocumentSaved?.({
                id: session.documentId,
                filePath: result.filePath,
                name: result.name,
            })
        }
        if (!result.saved && !result.canceled && error) {
            setBannerError(error)
        }
    }
    async function handleCopyAsMarkdown() {
        if (session.content.trim() === '') {
            showToast({ message: 'Document is empty', type: 'info' })
            return
        }
        try {
            await copyToClipboard(session.content)
            showToast({ message: 'Copied as Markdown', type: 'success' })
        } catch (err) {
            showToast({ message: `Could not copy: ${err.message}`, type: 'error' })
        }
    }
    async function handleCopyAsPlainText() {
        if (session.content.trim() === '') {
            showToast({ message: 'Document is empty', type: 'info' })
            return
        }
        try {
            await copyToClipboard(stripMarkdown(session.content))
            showToast({ message: 'Copied as Plain Text', type: 'success' })
        } catch (err) {
            showToast({ message: `Could not copy: ${err.message}`, type: 'error' })
        }
    }
    function requestNavigation(action) {
        if (!isDirty) {
            action()
            return
        }
        setModal({
            type: 'unsaved',
            deferred: action,
        })
    }
    async function handleModalSave() {
        setModal(null)
        const result = await save()
        if (result.saved) {
            if (session.isDraft && result.filePath) {
                onDocumentSaved?.({
                    id: session.documentId,
                    filePath: result.filePath,
                    name: result.name,
                })
            }
            modal?.deferred?.()
        }
    }
    function handleModalDiscard() {
        discard()
        const deferred = modal?.deferred
        setModal(null)
        deferred?.()
    }
    function handleModalCancel() {
        setModal(null)
    }
    async function commitRename() {
        setTitleEditing(false)
        const newName = titleValue.trim()
        if (!newName || newName === session.name) {
            setTitleValue(session.name)
            return
        }
        if (session.isDraft) {
            updateContent(session.content)
            return
        }
        const result = await rename(newName)
        if (!result.success) {
            setTitleError(result.error)
            setTitleValue(session.name)
            setTimeout(() => setTitleError(null), 4000)
        } else {
            onDocumentRenamed?.()
        }
    }
    function handleTitleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitRename()
        } else if (e.key === 'Escape') {
            setTitleEditing(false)
            setTitleValue(session.name)
        }
    }
    function handleDeleteClick() {
        setModal({
            type: 'delete',
        })
    }
    async function confirmDelete() {
        setModal(null)
        const result = await deleteDocument()
        if (result.success) {
            onDocumentDeleted?.(session.documentId)
        } else if (result.canForceDelete) {
            setModal({
                type: 'forceDelete',
            })
        } else {
            setBannerError(result.error)
        }
    }
    async function confirmForceDelete() {
        setModal(null)
        const result = await deleteDocument(true)
        if (result.success) {
            onDocumentDeleted?.(session.documentId)
        } else {
            setBannerError(result.error)
        }
    }
    async function handleReload() {
        setExternalChangeBanner(false)
        await reloadContent()
    }
    return (
        <div className={styles.page}>
            {}
            <header className={styles.header}>
                <button
                    className={styles.backBtn}
                    onClick={() => requestNavigation(onBack)}
                    aria-label="Back to document list"
                >
                    ← Back
                </button>

                <div className={styles.titleArea}>
                    {titleEditing ? (
                        <input
                            ref={titleRef}
                            className={styles.titleInput}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={handleTitleKeyDown}
                            aria-label="Document name"
                        />
                    ) : (
                        <span
                            className={`${styles.titleDisplay} ${isDirty ? styles.dirty : ''}`}
                            onClick={() => {
                                setTitleEditing(true)
                                setTimeout(() => titleRef.current?.select(), 0)
                            }}
                            title="Click to rename"
                        >
                            {session.name}
                            {isDirty && ' •'}
                        </span>
                    )}
                    {titleError && <span className={styles.titleError}>{titleError}</span>}
                </div>

                <div className={styles.actions}>
                    {onSplitView && (
                        <button
                            className={styles.splitBtn}
                            onClick={() => requestNavigation(onSplitView)}
                            aria-label="Open split view"
                        >
                            Split View
                        </button>
                    )}
                    <button
                        className={styles.copyBtn}
                        onClick={handleCopyAsMarkdown}
                        aria-label="Copy as Markdown"
                    >
                        Copy MD
                    </button>
                    <button
                        className={styles.copyBtn}
                        onClick={handleCopyAsPlainText}
                        aria-label="Copy as Plain Text"
                    >
                        Copy Text
                    </button>
                    {!session.isDraft && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDeleteClick}
                            aria-label="Delete document"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving || (!isDirty && !session.isDraft)}
                        aria-label="Save document"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </header>

            {}
            {externalChangeBanner && (
                <div className={styles.banner} role="status">
                    <span>File changed on disk —</span>
                    <button className={styles.bannerAction} onClick={handleReload}>
                        Reload
                    </button>
                    <button
                        className={styles.bannerDismiss}
                        onClick={() => setExternalChangeBanner(false)}
                    >
                        Keep editing
                    </button>
                </div>
            )}

            {}
            {bannerError && (
                <div className={styles.errorBanner} role="alert">
                    <span>{bannerError}</span>
                    <button className={styles.bannerDismiss} onClick={() => setBannerError(null)}>
                        ×
                    </button>
                </div>
            )}

            {}
            <main className={styles.main}>
                <MarkdownEditor
                    key={session.documentId ?? session.filePath ?? 'draft'}
                    value={session.content}
                    onChange={updateContent}
                />
            </main>

            {}
            {modal?.type === 'unsaved' && (
                <ConfirmModal
                    title="Unsaved changes"
                    message="You have unsaved changes. What would you like to do?"
                    primaryLabel="Save"
                    secondaryLabel="Discard"
                    cancelLabel="Cancel"
                    onPrimary={handleModalSave}
                    onSecondary={handleModalDiscard}
                    onCancel={handleModalCancel}
                />
            )}

            {modal?.type === 'delete' && (
                <ConfirmModal
                    title="Delete document"
                    message={`Move "${session.name}" to the trash? This can be undone from the OS trash.`}
                    primaryLabel="Move to Trash"
                    cancelLabel="Cancel"
                    onPrimary={confirmDelete}
                    onCancel={() => setModal(null)}
                />
            )}

            {modal?.type === 'forceDelete' && (
                <ConfirmModal
                    title="Move to trash failed"
                    message="Could not move the file to trash. Permanently delete it instead?"
                    primaryLabel="Delete permanently"
                    cancelLabel="Cancel"
                    onPrimary={confirmForceDelete}
                    onCancel={() => setModal(null)}
                />
            )}
            <Toast toast={toast} onDismiss={dismissToast} />
        </div>
    )
}
