import MarkdownEditor from '../MarkdownEditor/index.jsx'
import styles from './EditorPane.module.css'
export default function EditorPane({ value, onChange, containerRef, onScroll }) {
    return (
        <div className={styles.container}>
            <MarkdownEditor
                value={value}
                onChange={onChange}
                placeholder="Start typing Markdown…"
                textareaRef={containerRef}
                onScroll={onScroll}
            />
        </div>
    )
}
