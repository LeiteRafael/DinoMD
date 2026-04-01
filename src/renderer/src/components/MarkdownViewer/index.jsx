import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeSlug from 'rehype-slug'
import { useState, useEffect, useRef } from 'react'
import { codeToHtml } from 'shiki'
import SnapshotPane from '../SnapshotPane/index.jsx'
import useSnapshotExport from '../../hooks/useSnapshotExport.js'
import styles from './MarkdownViewer.module.css'

const LANG_LABELS = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    jsx: 'JSX',
    tsx: 'TSX',
    py: 'Python',
    python: 'Python',
    go: 'Go',
    rs: 'Rust',
    rust: 'Rust',
    rb: 'Ruby',
    ruby: 'Ruby',
    java: 'Java',
    php: 'PHP',
    css: 'CSS',
    html: 'HTML',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    sh: 'Bash',
    bash: 'Bash',
    shell: 'Bash',
    sql: 'SQL',
    c: 'C',
    cpp: 'C++',
}

const resolveLanguageLabel = (rawLanguage) => LANG_LABELS[rawLanguage] || rawLanguage || 'Code'

function CodeBlock({ className, children }) {
    const rawChildren = String(children)
    const isBlock = rawChildren.endsWith('\n')
    const rawLanguage = (className ?? '').replace('language-', '') || 'text'
    const code = rawChildren.replace(/\n$/, '')
    const [html, setHtml] = useState('')
    const [snapshotOpen, setSnapshotOpen] = useState(false)
    const snapshotRef = useRef(null)
    const snapshotTitle = resolveLanguageLabel(rawLanguage)
    const { exportPng, exporting, error } = useSnapshotExport(snapshotRef, snapshotTitle)

    useEffect(() => {
        if (!isBlock) return
        codeToHtml(code, { lang: rawLanguage, theme: 'github-dark' })
            .then(setHtml)
            .catch(() => {
                setHtml('')
            })
    }, [isBlock, code, rawLanguage])

    if (!isBlock) {
        return <code className={className}>{children}</code>
    }

    return (
        <>
            <div className={styles.codeBlockOuter}>
                {html ? (
                    <>
                        <button
                            className={styles.snapshotToggleBtn}
                            onClick={() => setSnapshotOpen(true)}
                            title="View as snapshot"
                        >
                            Snapshot
                        </button>
                        <div
                            data-language={rawLanguage}
                            className={styles.codeWrapper}
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </>
                ) : (
                    <pre data-language={rawLanguage} className={styles.codeFallback}>
                        <code className={className}>{children}</code>
                    </pre>
                )}
            </div>
            {snapshotOpen && (
                <div className={styles.snapshotOverlay} onClick={() => setSnapshotOpen(false)}>
                    <div className={styles.snapshotModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalToolbar}>
                            {error && (
                                <span className={styles.snapshotError} role="alert">
                                    {error}
                                </span>
                            )}
                            <button
                                className={styles.snapshotExportBtn}
                                onClick={exportPng}
                                disabled={exporting}
                            >
                                {exporting ? 'Exporting…' : 'Download PNG'}
                            </button>
                            <button
                                className={styles.closeModalBtn}
                                onClick={() => setSnapshotOpen(false)}
                                aria-label="Close snapshot"
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.snapshotPreview}>
                            <SnapshotPane ref={snapshotRef} content={code} title={snapshotTitle} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default function MarkdownViewer({ rawMarkdown }) {
    if (!rawMarkdown && rawMarkdown !== '') {
        return null
    }

    return (
        <article className={styles.article}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkFrontmatter]}
                rehypePlugins={[rehypeSlug]}
                components={{ code: CodeBlock }}
            >
                {rawMarkdown}
            </ReactMarkdown>
        </article>
    )
}
