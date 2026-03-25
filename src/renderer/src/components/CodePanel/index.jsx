import EditorPane from '../EditorPane/index.jsx'
import styles from './CodePanel.module.css'

const CodePanel = ({ value, onChange, onSave, onDiscard, containerRef, onScroll }) => (
    <div className={styles.panel}>
        <EditorPane
            value={value}
            onChange={onChange}
            onSave={onSave}
            onDiscard={onDiscard}
            containerRef={containerRef}
            onScroll={onScroll}
        />
    </div>
)

export default CodePanel
