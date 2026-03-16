import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import { tokenize } from '../../utils/markdownTokenizer'
import styles from './MarkdownEditor.module.css'
const INITIAL_LINE_HEIGHT_PX = 24.32
const PADDING_TOP_REM = 1.5
export default function MarkdownEditor({ value, onChange, placeholder, textareaRef, onScroll }) {
    const [activeLine, setActiveLine] = useState(1)
    const [scrollTop, setScrollTop] = useState(0)
    const [localValue, setLocalValue] = useState(value)
    const [lineHeightPx, setLineHeightPx] = useState(INITIAL_LINE_HEIGHT_PX)
    const preRef = useRef(null)
    const sizerRef = useRef(null)
    useEffect(() => {
        setLocalValue(value)
    }, [value])
    useEffect(() => {
        if (!sizerRef.current) return
        const initialHeight = sizerRef.current.getBoundingClientRect().height
        if (initialHeight > 0) setLineHeightPx(initialHeight)
        const observer = new ResizeObserver(([entry]) => {
            const height = entry.contentRect.height
            if (height > 0) setLineHeightPx(height)
        })
        observer.observe(sizerRef.current)
        return () => observer.disconnect()
    }, [])
    const lineCount = useMemo(() => localValue.split('\n').length, [localValue])
    const highlightedHtml = useMemo(() => tokenize(localValue), [localValue])
    const [codeRegionRects, setCodeRegionRects] = useState([])
    useLayoutEffect(() => {
        if (!preRef.current) return
        const spans = preRef.current.querySelectorAll('.token-code-region')
        setCodeRegionRects(
            Array.from(spans).map((span) => ({
                top: span.offsetTop,
                height: span.offsetHeight,
            }))
        )
    }, [highlightedHtml])
    const gutterLines = useMemo(
        () =>
            Array.from(
                {
                    length: lineCount,
                },
                (_, i) => (
                    <div key={i} className={styles.lineNumber}>
                        {i + 1}
                        {'\u200B'}
                    </div>
                )
            ),
        [lineCount]
    )
    const activeLineTop = `calc(${PADDING_TOP_REM}rem + ${(activeLine - 1) * lineHeightPx}px - ${scrollTop}px)`
    const activeLineStyle = { top: activeLineTop, height: `${lineHeightPx}px` }
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
            <span ref={sizerRef} aria-hidden="true" className={styles.lineSizer}>
                {'\u200B'}
            </span>
            <div className={styles.gutter} aria-hidden="true">
                {}
                <div className={styles.gutterActiveLine} style={activeLineStyle} />
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
                {codeRegionRects.map(({ top, height }, i) => (
                    <div
                        key={i}
                        className={styles.codeBlockBackground}
                        style={{
                            top: `${top - scrollTop}px`,
                            height: `${height}px`,
                        }}
                    />
                ))}
                <div className={styles.activeLineHighlight} style={activeLineStyle} />
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
