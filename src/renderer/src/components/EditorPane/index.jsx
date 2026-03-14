import MarkdownEditor from '../MarkdownEditor/index.jsx'
import styles from './EditorPane.module.css'

/**
 * EditorPane — thin controlled wrapper around MarkdownEditor.
 *
 * Props:
 *   value        — current editor string
 *   onChange     — (newValue: string) => void
 *   onSave       — () => void
 *   onDiscard    — () => void
 *   containerRef — optional ref forwarded to the textarea (for sync scroll)
 *   onScroll     — optional scroll handler on the textarea
 */
export default function EditorPane({ value, onChange, onSave, onDiscard, containerRef, onScroll }) {
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
