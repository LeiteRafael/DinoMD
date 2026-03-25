import { forwardRef } from 'react'
import { tokenizeSnapshotLine, escapeHtml } from '../../utils/markdownTokenizer.js'
import styles from './SnapshotPane.module.css'

const PLACEHOLDER = '// No code to display'

const isEmptyContent = (content) => !content || content.trim() === ''

const buildTokenizedHtml = (content) => {
    const lines = content.split('\n')
    const html = lines.map((line) => tokenizeSnapshotLine(escapeHtml(line))).join('\n')
    return { __html: html }
}

const SnapshotPane = forwardRef(({ content, title }, ref) => {
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
                        <code dangerouslySetInnerHTML={buildTokenizedHtml(content)} />
                    )}
                </pre>
            </div>
        </div>
    )
})

SnapshotPane.displayName = 'SnapshotPane'

export default SnapshotPane
