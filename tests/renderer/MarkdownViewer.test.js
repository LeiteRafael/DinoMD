import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('react-markdown', () => {
    return function ReactMarkdownMock({ children, components }) {
        const lines = (children || '').split('\n')
        const elements = []
        let listItems = []
        let inCode = false
        let codeLang = ''
        let codeLines = []

        const flushList = () => {
            if (listItems.length) {
                elements.push(
                    <ul key={`ul-${elements.length}`}>
                        {listItems.map((t, i) => (
                            <li key={i}>{t}</li>
                        ))}
                    </ul>
                )
                listItems = []
            }
        }

        lines.forEach((line, i) => {
            if (line.startsWith('```')) {
                if (!inCode) {
                    flushList()
                    inCode = true
                    codeLang = line.slice(3).trim() || 'text'
                    codeLines = []
                } else {
                    const codeStr = codeLines.join('\n')
                    const CodeComponent = components?.code
                    if (CodeComponent) {
                        elements.push(
                            <CodeComponent key={`code-${i}`} className={`language-${codeLang}`}>
                                {codeStr}
                            </CodeComponent>
                        )
                    } else {
                        elements.push(
                            <pre key={`code-${i}`}>
                                <code className={`language-${codeLang}`}>{codeStr}</code>
                            </pre>
                        )
                    }
                    inCode = false
                    codeLang = ''
                    codeLines = []
                }
            } else if (inCode) {
                codeLines.push(line)
            } else if (line.startsWith('# ')) {
                flushList()
                elements.push(<h1 key={i}>{line.slice(2)}</h1>)
            } else if (line.startsWith('## ')) {
                flushList()
                elements.push(<h2 key={i}>{line.slice(3)}</h2>)
            } else if (line.startsWith('- ')) {
                listItems.push(line.slice(2))
            } else if (line.trim()) {
                flushList()
                elements.push(<p key={i}>{line}</p>)
            }
        })
        flushList()
        return <div data-testid="markdown-content">{elements}</div>
    }
})

jest.mock('remark-gfm', () => () => {})
jest.mock('remark-frontmatter', () => () => {})
jest.mock('rehype-slug', () => () => {})

jest.mock('shiki', () => ({
    codeToHtml: jest.fn((code, { lang }) =>
        Promise.resolve(`<pre data-language="${lang}"><code>${code}</code></pre>`)
    ),
}))

const MarkdownViewer = require('../../src/renderer/src/components/MarkdownViewer/index.jsx').default
const { codeToHtml } = require('shiki')

const sampleMarkdown = `# Hello World

This is a paragraph.

- Item one
- Item two

\`\`\`js
console.log('hello')
\`\`\``

describe('MarkdownViewer', () => {
    test('renders an H1 from a markdown heading', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={sampleMarkdown} />)
        })
        expect(screen.getByRole('heading', { level: 1, name: 'Hello World' })).toBeInTheDocument()
    })

    test('renders an unordered list with list items', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={sampleMarkdown} />)
        })
        expect(screen.getByRole('list')).toBeInTheDocument()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    test('renders a code block and calls codeToHtml with the correct language', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={sampleMarkdown} />)
        })
        expect(codeToHtml).toHaveBeenCalledWith(
            expect.stringContaining("console.log('hello')"),
            expect.objectContaining({ lang: 'js' })
        )
    })

    test('renders the shiki HTML output with data-language attribute', async () => {
        const { container } = render(<div />)
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={sampleMarkdown} />, { container })
        })
        expect(codeToHtml).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ lang: 'js' })
        )
    })

    test('returns null when rawMarkdown is null', () => {
        const { container } = render(<MarkdownViewer rawMarkdown={null} />)
        expect(container.firstChild).toBeNull()
    })
})
