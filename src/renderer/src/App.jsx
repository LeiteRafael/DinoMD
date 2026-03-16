import { useState, useEffect } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import MainPage from './pages/MainPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import SplitViewPage from './pages/SplitViewPage.jsx'
import Sidebar from './components/Sidebar/index.jsx'
import useEditor from './hooks/useEditor.js'
import useDocuments from './hooks/useDocuments.js'
import useSidebar from './hooks/useSidebar.js'
export default function App() {
    const [view, setView] = useState('main')
    const [activeDocumentId, setActiveDocumentId] = useState(null)
    const [activeDocumentName, setActiveDocumentName] = useState('')
    const editorHook = useEditor()
    const docsHook = useDocuments()
    const sidebarHook = useSidebar()
    const sortedDocuments = [...(docsHook.documents ?? [])].sort(
        (a, b) => (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0)
    )
    useEffect(() => {
        if (!activeDocumentId) return
        const ids = new Set((docsHook.documents ?? []).map((d) => d.id))
        if (!ids.has(activeDocumentId)) {
            setActiveDocumentId(null)
            setActiveDocumentName('')
            setView('main')
        }
    }, [docsHook.documents, activeDocumentId])
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
    async function handleNewDocument() {
        await editorHook.openNew()
        docsHook.refreshDocuments()
        setView('editor')
    }
    async function handleEditDocument(doc) {
        const docObj =
            typeof doc === 'object' && doc !== null
                ? doc
                : {
                      id: doc,
                      name: '',
                  }
        await editorHook.openExisting(docObj)
        setView('editor')
    }
    function handleEditorBack() {
        docsHook.refreshDocuments()
        setView('main')
    }
    function handleOpenSplitView() {
        setView('split')
    }
    function handleSplitViewBack() {
        docsHook.refreshDocuments()
        setView('main')
    }
    function handleDocumentSaved() {
        docsHook.refreshDocuments()
    }
    function handleDocumentDeleted() {
        docsHook.refreshDocuments()
        setView('main')
    }
    function handleDocumentRenamed() {
        docsHook.refreshDocuments()
    }
    function handleSidebarOpenDocument(id, name) {
        setActiveDocumentId(id)
        setActiveDocumentName(name)
        setView('reader')
    }
    function withSidebar(pageNode) {
        const sidebar = (
            <Sidebar
                documents={sortedDocuments}
                activeDocumentId={activeDocumentId}
                onOpenDocument={handleSidebarOpenDocument}
                onNewDocument={handleNewDocument}
                onToggle={sidebarHook.toggle}
            />
        )
        if (!sidebarHook.open) {
            return (
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <button
                        onClick={sidebarHook.toggle}
                        title="Open sidebar"
                        aria-label="Open sidebar"
                        style={{
                            alignSelf: 'flex-start',
                            margin: '8px 0 0 8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: '#a6adc8',
                            flexShrink: 0,
                        }}
                    >
                        ›
                    </button>
                    <div
                        style={{
                            flex: 1,
                            overflow: 'auto',
                        }}
                    >
                        {pageNode}
                    </div>
                </div>
            )
        }
        return (
            <PanelGroup
                direction="horizontal"
                style={{
                    height: '100%',
                    width: '100%',
                }}
            >
                <Panel
                    defaultSize={sidebarHook.widthPercent}
                    minSize={15}
                    maxSize={35}
                    onResize={sidebarHook.handleResize}
                >
                    {sidebar}
                </Panel>
                <PanelResizeHandle
                    style={{
                        width: '4px',
                        background: '#313244',
                        cursor: 'col-resize',
                    }}
                />
                <Panel>{pageNode}</Panel>
            </PanelGroup>
        )
    }
    if (view === 'main') {
        return (
            <MainPage
                docsHook={docsHook}
                onOpenDocument={handleOpenDocument}
                onNewDocument={handleNewDocument}
                onEditDocument={(id, name) =>
                    handleEditDocument({
                        id,
                        name,
                    })
                }
                onDocumentDeleted={handleDocumentDeleted}
            />
        )
    }
    if (view === 'split') {
        return withSidebar(
            <SplitViewPage
                editorHook={editorHook}
                onBack={handleSplitViewBack}
                onDocumentSaved={handleDocumentSaved}
            />
        )
    }
    if (view === 'editor') {
        return withSidebar(
            <EditorPage
                editorHook={editorHook}
                onBack={handleEditorBack}
                onDocumentSaved={handleDocumentSaved}
                onDocumentDeleted={handleDocumentDeleted}
                onDocumentRenamed={handleDocumentRenamed}
                onSplitView={handleOpenSplitView}
            />
        )
    }
    return withSidebar(
        <ReaderPage
            documentId={activeDocumentId}
            documentName={activeDocumentName}
            onBack={handleBack}
            onEditDocument={handleEditDocument}
        />
    )
}
