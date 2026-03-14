import styles from './MarkdownEditor.module.css'

/**
 * Plain <textarea> Markdown editor.
 * Tab key inserts two spaces instead of moving focus.
 */
export default function MarkdownEditor({ value, onChange, placeholder, textareaRef, onScroll }) {
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart, selectionEnd, value: val } = e.target
      const next = val.slice(0, selectionStart) + '  ' + val.slice(selectionEnd)
      onChange(next)
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        e.target.selectionStart = selectionStart + 2
        e.target.selectionEnd = selectionStart + 2
      })
    }
  }

  return (
    <textarea
      ref={textareaRef}
      className={styles.editor}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onScroll={onScroll}
      spellCheck={false}
      aria-label="Markdown editor"
      placeholder={placeholder ?? 'Start typing Markdown…'}
    />
  )
}
