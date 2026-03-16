import { useState, useMemo, useEffect, useRef } from 'react'
import { tokenize } from '../../utils/markdownTokenizer'
import styles from './MarkdownEditor.module.css'
const LINE_HEIGHT_REM = 0.95 * 1.6
const PADDING_TOP_REM = 1.5
export default function MarkdownEditor({ value, onChange, placeholder, textareaRef, onScroll }) {
    const [activeLine, setActiveLine] = useState(1)
    const [scrollTop, setScrollTop] = useState(0)
    const [localValue, setLocalValue] = useState(value)
    const preRef = useRef(null)
    useEffect(() => {
        setLocalValue(value)
    }, [value])
    const lineCount = useMemo(() => localValue.split('\n').length, [localValue])
    const highlightedHtml = useMemo(() => tokenize(localValue), [localValue])
    const gutterLines = useMemo(
        () =>
            Array.from(
                {
                    length: lineCount,
                },
                (_, i) => (
                    <div key={i} className={styles.lineNumber}>
                        {i + 1}
                    </div>
                )
            ),
        [lineCount]
    )
    const activeLineTop = `calc(${PADDING_TOP_REM + (activeLine - 1) * LINE_HEIGHT_REM}rem - ${scrollTop}px)`
    function updateActiveLine(e) {
        const line = localValue.slice(0, e.target.selectionStart).split('\n').length
        setActiveLine(line)
    }
    function handleScroll(e) {
        const top = e.target.scrollTop
        setScrollTop(top)
        if (preRef.current) preRef.current.scrollTop = top
        onScroll?.(e)
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault()
            const { selectionStart, selectionEnd, value: val } = e.target
            const lineStart = val.lastIndexOf('\n', selectionStart - 1) + 1
            const indent = val.slice(lineStart, selectionStart).match(/^(\s*)/)[1]
            const next = val.slice(0, selectionStart) + '\n' + indent + val.slice(selectionEnd)
            setLocalValue(next)
            onChange(next)
            requestAnimationFrame(() => {
                e.target.selectionStart = selectionStart + 1 + indent.length
                e.target.selectionEnd = selectionStart + 1 + indent.length
            })
            return
        }
        if (e.key === 'Tab') {
            e.preventDefault()
            const { selectionStart, selectionEnd, value: val } = e.target
            const next = val.slice(0, selectionStart) + '  ' + val.slice(selectionEnd)
            setLocalValue(next)
            onChange(next)
            requestAnimationFrame(() => {
                e.target.selectionStart = selectionStart + 2
                e.target.selectionEnd = selectionStart + 2
            })
        }
    }
    return (
        <div className={styles.wrapper}>
            <div className={styles.gutter} aria-hidden="true">
                {}
                <div
                    className={styles.gutterActiveLine}
                    style={{
                        top: activeLineTop,
                    }}
                />
                <div
                    className={styles.gutterInner}
                    style={{
                        transform: `translateY(-${scrollTop}px)`,
                    }}
                >
                    {gutterLines}
                </div>
            </div>

            <div className={styles.editorContainer}>
                {}
                <div
                    className={styles.activeLineHighlight}
                    style={{
                        top: activeLineTop,
                    }}
                />
                <pre
                    ref={preRef}
                    className={styles.highlight}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{
                        __html: highlightedHtml,
                    }}
                />
                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={localValue}
                    onChange={(e) => {
                        const next = e.target.value
                        setLocalValue(next)
                        onChange(next)
                    }}
                    onKeyDown={handleKeyDown}
                    onSelect={updateActiveLine}
                    onKeyUp={updateActiveLine}
                    onClick={updateActiveLine}
                    onScroll={handleScroll}
                    spellCheck={false}
                    aria-label="Markdown editor"
                    placeholder={placeholder ?? 'Start typing Markdown…'}
                />
            </div>
        </div>
    )
}
