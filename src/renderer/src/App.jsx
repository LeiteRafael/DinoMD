import { useState } from 'react'
import MainPage from './pages/MainPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import useEditor from './hooks/useEditor.js'
import useDocuments from './hooks/useDocuments.js'

export default function App() {
  const [view, setView] = useState('main') // 'main' | 'reader' | 'editor'
  const [activeDocumentId, setActiveDocumentId] = useState(null)
  const [activeDocumentName, setActiveDocumentName] = useState('')

  const editorHook = useEditor()
  const docsHook = useDocuments()

  // ── Reader navigation ───────────────────────────────────────────────────────
  function handleOpenDocument(id, name) {
    setActiveDocumentId(id)
    setActiveDocumentName(name)
    setView('reader')
  }

  function handleBack() {
    setActiveDocumentId(null)
    setActiveDocumentName('')
    setView('main')
  }

  // ── Editor navigation ───────────────────────────────────────────────────────
  async function handleNewDocument() {
    await editorHook.openNew()
    setView('editor')
  }

  async function handleEditDocument(doc) {
    // Accept either (id, name) from card click or a full doc object
    const docObj = typeof doc === 'object' && doc !== null
      ? doc
      : { id: doc, name: '' }
    await editorHook.openExisting(docObj)
    setView('editor')
  }

  function handleEditorBack() {
    docsHook.refreshDocuments()
    setView('main')
  }

  // ── After successful first save of a draft ──────────────────────────────────
  function handleDocumentSaved() {
    docsHook.refreshDocuments()
  }

  // ── After successful delete ─────────────────────────────────────────────────
  function handleDocumentDeleted() {
    docsHook.refreshDocuments()
    setView('main')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (view === 'editor') {
    return (
      <EditorPage
        editorHook={editorHook}
        onBack={handleEditorBack}
        onDocumentSaved={handleDocumentSaved}
        onDocumentDeleted={handleDocumentDeleted}
      />
    )
  }

  if (view === 'reader') {
    return (
      <ReaderPage
        documentId={activeDocumentId}
        documentName={activeDocumentName}
        onBack={handleBack}
        onEditDocument={handleEditDocument}
      />
    )
  }

  return (
    <MainPage
      docsHook={docsHook}
      onOpenDocument={handleOpenDocument}
      onNewDocument={handleNewDocument}
      onEditDocument={(id, name) => handleEditDocument({ id, name })}
      onDocumentDeleted={handleDocumentDeleted}
    />
  )
}
