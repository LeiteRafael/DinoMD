import { useRef } from 'react'
import EditorPane from '../EditorPane/index.jsx'
import CodePanelHeader from '../CodePanelHeader/index.jsx'
import SnapshotPane from '../SnapshotPane/index.jsx'
import useSnapshotMode from '../../hooks/useSnapshotMode.js'
import useSnapshotExport from '../../hooks/useSnapshotExport.js'
import languageFromExtension from '../../utils/languageFromExtension.js'
import styles from './CodePanel.module.css'

const CodePanel = ({
    value,
    onChange,
    onSave,
    onDiscard,
    containerRef,
    onScroll,
    documentId,
    documentName,
    filePath,
}) => {
    const { mode, setMode } = useSnapshotMode(documentId)
    const snapshotFrameRef = useRef(null)
    const { exportPng, exporting, error } = useSnapshotExport(snapshotFrameRef, documentName ?? '')
    const snapshotTitle = documentName || languageFromExtension(filePath ?? '') || ''

    return (
        <div className={styles.panel}>
            <CodePanelHeader
                mode={mode}
                onModeChange={setMode}
                onExport={exportPng}
                exporting={exporting}
                error={error}
            />
            {mode === 'snapshot' ? (
                <SnapshotPane ref={snapshotFrameRef} content={value} title={snapshotTitle} />
            ) : (
                <EditorPane
                    value={value}
                    onChange={onChange}
                    onSave={onSave}
                    onDiscard={onDiscard}
                    containerRef={containerRef}
                    onScroll={onScroll}
                />
            )}
        </div>
    )
}

export default CodePanel
