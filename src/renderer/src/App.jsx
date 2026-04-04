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
import { api } from './services/api.js'
export default function App() {
    const [view, setView] = useState('main')
    const [activeDocumentId, setActiveDocumentId] = useState(null)
    const [activeDocumentName, setActiveDocumentName] = useState('')
    const [activeFilePath, setActiveFilePath] = useState(null)
    const editorHook = useEditor()
    const docsHook = useDocuments()
    const sidebarHook = useSidebar()
    useEffect(() => {
        if (!activeDocumentId) return
        const ids = new Set((docsHook.documents ?? []).map((d) => d.id))
        if (!ids.has(activeDocumentId)) {
            setActiveDocumentId(null)
            setActiveDocumentName('')
            setView('main')
        }
    }, [docsHook.documents, activeDocumentId])

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
    function handleOpenDocument(id, name) {
        setActiveDocumentId(id)
        setActiveDocumentName(name)
        setView('reader')
    }
    async function handleTreeOpenFile(filePath) {
        if (editorHook.isDirty) {
            await editorHook.save()
        }
        const result = await api.folder.readFile(filePath)
        if (!result || !result.success) return
        const name = filePath.split(/[\\/]/).pop() ?? filePath
        editorHook.openFromFilePath(filePath, result.content, name)
        setActiveFilePath(filePath)
        setView('editor')
    }
    function withSidebar(pageNode) {
        const sidebar = (
            <Sidebar
                rootFolderPath={sidebarHook.rootFolderPath}
                activeFilePath={activeFilePath}
                onOpenFile={handleTreeOpenFile}
                onRootFolderChange={sidebarHook.persistRootFolderPath}
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
                            alignSelf: 'stretch',
                            width: '36px',
                            background: 'linear-gradient(180deg, #1a2320 0%, #151d1b 100%)',
                            border: 'none',
                            borderRight: '1px solid #2d4138',
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: '#c8ded5',
                            flexShrink: 0,
                        }}
                    >
                        <span className="material-icons">chevron_right</span>
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
        return withSidebar(
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
