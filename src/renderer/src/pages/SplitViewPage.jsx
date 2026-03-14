import { useState, useEffect } from 'react'
import EditorPane from '../components/EditorPane/index.jsx'
import PreviewPane from '../components/PreviewPane/index.jsx'
import SplitDivider from '../components/SplitDivider/index.jsx'
import ViewModeToggle from '../components/ViewModeToggle/index.jsx'
import ConfirmModal from '../components/ConfirmModal/index.jsx'
import useDebounce from '../hooks/useDebounce.js'
import useSplitView from '../hooks/useSplitView.js'
import useSyncScroll from '../hooks/useSyncScroll.js'
import styles from './SplitViewPage.module.css'

/**
 * SplitViewPage — split editor + live preview page.
 *
 * Props:
 *   editorHook  — useEditor() instance from App
 *   onBack      — callback to exit split-view (navigate back)
 *   onDocumentSaved — called after first save of a draft
 */
export default function SplitViewPage({ editorHook, onBack, onDocumentSaved }) {
  const {
    session,
    isDirty,
    saving,
    error,
    updateContent,
    save,
    discard
  } = editorHook

  const { viewMode, setViewMode } = useSplitView()
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [modal, setModal] = useState(null)

  const debouncedContent = useDebounce(session.content, 300)

  const { editorScrollRef, previewScrollRef, onEditorScroll, onPreviewScroll } = useSyncScroll({
    enabled: syncEnabled
  })

  // ── Keyboard shortcut: Ctrl+\ cycles view modes ────────────────────────────
  useEffect(() => {
    const CYCLE = ['split', 'editor', 'preview']

    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        setViewMode((prev) => {
          const idx = CYCLE.indexOf(prev)
          return CYCLE[(idx + 1) % CYCLE.length]
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setViewMode])

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    const result = await save()
    if (result.saved && session.isDraft) {
      onDocumentSaved?.({ id: session.documentId, filePath: result.filePath, name: result.name })
    }
  }

  // ── Navigation guard ───────────────────────────────────────────────────────
  function requestNavigation(action) {
    if (!isDirty) {
      action()
      return
    }
    setModal({ type: 'unsaved', deferred: action })
  }

  async function handleModalSave() {
    const deferred = modal?.deferred
    setModal(null)
    const result = await save()
    if (result.saved) {
      if (session.isDraft && result.filePath) {
        onDocumentSaved?.({ id: session.documentId, filePath: result.filePath, name: result.name })
      }
      deferred?.()
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

  // ── Pane visibility ────────────────────────────────────────────────────────
  const showEditor = viewMode === 'split' || viewMode === 'editor'
  const showPreview = viewMode === 'split' || viewMode === 'preview'

  // ── Render ─────────────────────────────────────────────────────────────────
  const editorPane = (
    <EditorPane
      value={session.content}
      onChange={updateContent}
      onSave={handleSave}
      onDiscard={discard}
      containerRef={editorScrollRef}
      onScroll={onEditorScroll}
    />
  )

  const previewPane = (
    <PreviewPane
      content={debouncedContent}
      containerRef={previewScrollRef}
      onScroll={onPreviewScroll}
    />
  )

  return (
    <div className={`${styles.page} ${styles.minWidth}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => requestNavigation(onBack)}
          aria-label="Back to document list"
        >
          ← Back
        </button>

        <span className={`${styles.title} ${isDirty ? styles.dirty : ''}`}>
          {session.name}{isDirty && ' •'}
        </span>

        <div className={styles.controls}>
          <ViewModeToggle viewMode={viewMode} onModeChange={setViewMode} />

          <button
            className={`${styles.syncBtn} ${syncEnabled ? styles.syncActive : ''}`}
            onClick={() => setSyncEnabled((v) => !v)}
            aria-pressed={syncEnabled}
            title="Toggle synchronized scrolling"
          >
            ⇅ Sync
          </button>

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

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <main className={styles.main}>
        {viewMode === 'split' ? (
          <SplitDivider left={editorPane} right={previewPane} />
        ) : (
          <>
            {/* EditorPane: always mounted to avoid discarding content */}
            <div className={styles.pane} style={showEditor ? undefined : { display: 'none' }}>
              {editorPane}
            </div>
            <div className={styles.pane} style={showPreview ? undefined : { display: 'none' }}>
              {previewPane}
            </div>
          </>
        )}
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
    </div>
  )
}
