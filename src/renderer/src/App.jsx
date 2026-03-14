import { useState } from 'react'
import MainPage from './pages/MainPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'

export default function App() {
  const [view, setView] = useState('main') // 'main' | 'reader'
  const [activeDocumentId, setActiveDocumentId] = useState(null)
  const [activeDocumentName, setActiveDocumentName] = useState('')

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

  if (view === 'reader') {
    return (
      <ReaderPage
        documentId={activeDocumentId}
        documentName={activeDocumentName}
        onBack={handleBack}
      />
    )
  }

  return <MainPage onOpenDocument={handleOpenDocument} />
}
