import MarkdownViewer from '../MarkdownViewer/index.jsx'
import styles from './PreviewPane.module.css'
export default function PreviewPane({ content, containerRef, onScroll }) {
    const isEmpty = content === '' || content == null
    return (
        <div className={styles.container} ref={containerRef} onScroll={onScroll}>
            {isEmpty ? (
                <p className={styles.empty}>Nothing to preview yet</p>
            ) : (
                <MarkdownViewer rawMarkdown={content} />
            )}
        </div>
    )
}
