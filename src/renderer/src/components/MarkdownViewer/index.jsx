import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeSlug from 'rehype-slug'
import { useState, useEffect } from 'react'
import { codeToHtml } from 'shiki'
import styles from './MarkdownViewer.module.css'

function CodeBlock({ className, children }) {
  const rawLanguage = (className ?? '').replace('language-', '') || 'text'
  const code = String(children).replace(/\n$/, '')
  const [html, setHtml] = useState('')

  useEffect(() => {
    codeToHtml(code, { lang: rawLanguage, theme: 'github-dark' })
      .then(setHtml)
      .catch(() => {
        setHtml(`<pre data-language="${rawLanguage}"><code>${code}</code></pre>`)
      })
  }, [code, rawLanguage])

  if (html) {
    return (
      <div
        data-language={rawLanguage}
        className={styles.codeWrapper}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <pre data-language={rawLanguage} className={styles.codeFallback}>
      <code className={className}>{children}</code>
    </pre>
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
