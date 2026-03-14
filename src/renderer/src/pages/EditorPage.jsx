import { useState, useEffect, useRef } from 'react'
import MarkdownEditor from '../components/MarkdownEditor/index.jsx'
import ConfirmModal from '../components/ConfirmModal/index.jsx'
import { api } from '../services/api.js'
import styles from './EditorPage.module.css'

/**
 * EditorPage — handles both "new document" and "edit existing document" flows.
 *
 * Props:
 *   editorHook      — the useEditor() instance from App (shared state)
 *   onBack          — navigate back to MainPage
 *   onDocumentSaved — called with ({ id, filePath, name }) after first save of a draft
 *   onDocumentDeleted — called with (documentId) after successful delete
 *   onEditDocument  — called with (doc) to switch to editing another document
 */
export default function EditorPage({
  editorHook,
  onBack,
  onDocumentSaved,
  onDocumentDeleted,
  onDocumentRenamed,
  onSplitView
}) {
  const {
    session,
    isDirty,
    saving,
    error,
    setError,
    updateContent,
    save,
    rename,
    discard,
    deleteDocument,
    reloadContent
  } = editorHook

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [titleValue, setTitleValue] = useState(session.name)
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleError, setTitleError] = useState(null)

  const [modal, setModal] = useState(null) // { type: 'unsaved' | 'delete', deferred?: fn }
  const [externalChangeBanner, setExternalChangeBanner] = useState(false)
  const [bannerError, setBannerError] = useState(null) // non-blocking error banner

  const titleRef = useRef(null)

  // Sync titleValue when session name changes (e.g. after rename or first save)
  useEffect(() => {
    setTitleValue(session.name)
  }, [session.name])

  // ── External file change watcher ────────────────────────────────────────────
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

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const result = await save()
    if (result.saved && session.isDraft) {
      // Was a draft — notify App so it can add the card
      onDocumentSaved?.({ id: session.documentId, filePath: result.filePath, name: result.name })
    }
    if (!result.saved && !result.canceled && error) {
      setBannerError(error)
    }
  }

  // ── Navigation guard (unsaved changes) ─────────────────────────────────────
  function requestNavigation(action) {
    if (!isDirty) {
      action()
      return
    }
    setModal({ type: 'unsaved', deferred: action })
  }

  async function handleModalSave() {
    setModal(null)
    const result = await save()
    if (result.saved) {
      if (session.isDraft && result.filePath) {
        onDocumentSaved?.({ id: session.documentId, filePath: result.filePath, name: result.name })
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

  // ── Rename (inline title) ───────────────────────────────────────────────────
  async function commitRename() {
    setTitleEditing(false)
    const newName = titleValue.trim()
    if (!newName || newName === session.name) {
      setTitleValue(session.name)
      return
    }
    if (session.isDraft) {
      // For drafts, just update the local name (used as default filename in dialog)
      updateContent(session.content) // no-op just to not call rename on no filePath
      // Directly patch the session name via the hook's internal setter is not exposed,
      // so we rely on the save dialog to set the real name; keep titleValue updated.
      return
    }
    const result = await rename(newName)
    if (!result.success) {
      setTitleError(result.error)
      setTitleValue(session.name) // revert
      // Clear error after 4 s
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

  // ── Delete ──────────────────────────────────────────────────────────────────
  function handleDeleteClick() {
    setModal({ type: 'delete' })
  }

  async function confirmDelete() {
    setModal(null)
    const result = await deleteDocument()
    if (result.success) {
      onDocumentDeleted?.(session.documentId)
    } else if (result.canForceDelete) {
      // Offer force-delete fallback
      setModal({ type: 'forceDelete' })
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

  // ── External change: reload ─────────────────────────────────────────────────
  async function handleReload() {
    setExternalChangeBanner(false)
    await reloadContent()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              onClick={() => { setTitleEditing(true); setTimeout(() => titleRef.current?.select(), 0) }}
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

      {/* ── External change banner ──────────────────────────────────────────── */}
      {externalChangeBanner && (
        <div className={styles.banner} role="status">
          <span>File changed on disk —</span>
          <button className={styles.bannerAction} onClick={handleReload}>Reload</button>
          <button className={styles.bannerDismiss} onClick={() => setExternalChangeBanner(false)}>Keep editing</button>
        </div>
      )}

      {/* ── Error banner (non-blocking) ─────────────────────────────────────── */}
      {bannerError && (
        <div className={styles.errorBanner} role="alert">
          <span>{bannerError}</span>
          <button className={styles.bannerDismiss} onClick={() => setBannerError(null)}>×</button>
        </div>
      )}

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <MarkdownEditor
          value={session.content}
          onChange={updateContent}
        />
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
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
    </div>
  )
}
