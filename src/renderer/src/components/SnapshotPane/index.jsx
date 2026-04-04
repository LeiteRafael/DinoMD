import { forwardRef, useState, useEffect } from 'react'
import { codeToHtml } from 'shiki'
import { tokenizeSnapshotLine, escapeHtml } from '../../utils/markdownTokenizer.js'
import styles from './SnapshotPane.module.css'

const PLACEHOLDER = '// No code to display'

const isEmptyContent = (content) => !content || content.trim() === ''

const extractShikiCodeHtml = (shikiHtml) => {
    const match = shikiHtml.match(/<code[^>]*>([\s\S]*)<\/code>/)
    return match ? match[1] : null
}

const buildFallbackHtml = (content) => {
    const lines = content.split('\n')
    const html = lines.map((line) => tokenizeSnapshotLine(escapeHtml(line))).join('\n')
    return html
}

const SnapshotPane = forwardRef(({ content, title, lang }, ref) => {
    const [codeHtml, setCodeHtml] = useState(null)

    useEffect(() => {
        if (isEmptyContent(content)) {
            setCodeHtml(null)
            return
        }
        const language = lang || 'text'
        codeToHtml(content, { lang: language, theme: 'github-dark' })
            .then((html) => {
                const inner = extractShikiCodeHtml(html)
                setCodeHtml(inner ?? buildFallbackHtml(content))
            })
            .catch(() => {
                setCodeHtml(buildFallbackHtml(content))
            })
    }, [content, lang])

    return (
        <div className={styles.container}>
            <div className={styles.windowChrome} aria-label="Code snapshot" ref={ref}>
                <div className={styles.titleBar}>
                    <div className={styles.trafficLights}>
                        <span className={styles.dotClose} aria-label="close" />
                        <span className={styles.dotMinimize} aria-label="minimize" />
                        <span className={styles.dotMaximize} aria-label="maximize" />
                    </div>
                    {title && <span className={styles.titleLabel}>{title}</span>}
                </div>
                <pre className={styles.codeArea}>
                    {isEmptyContent(content) ? (
                        <code>{PLACEHOLDER}</code>
                    ) : (
                        <code
                            dangerouslySetInnerHTML={{
                                __html: codeHtml ?? buildFallbackHtml(content),
                            }}
                        />
                    )}
                </pre>
            </div>
        </div>
    )
})

SnapshotPane.displayName = 'SnapshotPane'

export default SnapshotPane
