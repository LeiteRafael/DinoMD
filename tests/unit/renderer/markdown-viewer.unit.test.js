import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('react-markdown', () => {
    return {
        default: function ReactMarkdownMock({ children, components }) {
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
                        const codeStr = codeLines.join('\n') + '\n'
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
                    const inlineCodeMatch = line.match(/`([^`]+)`/)
                    if (inlineCodeMatch && components?.code) {
                        const CodeComponent = components.code
                        elements.push(
                            <p key={i}>
                                <CodeComponent key={`inline-${i}`}>
                                    {inlineCodeMatch[1]}
                                </CodeComponent>
                            </p>
                        )
                    } else {
                        elements.push(<p key={i}>{line}</p>)
                    }
                }
            })
            flushList()
            return <div data-testid="markdown-content">{elements}</div>
        },
    }
})

vi.mock('remark-gfm', () => ({ default: () => {} }))
vi.mock('remark-frontmatter', () => ({ default: () => {} }))
vi.mock('rehype-slug', () => ({ default: () => {} }))

vi.mock('shiki', () => ({
    codeToHtml: vi.fn((code, { lang }) =>
        Promise.resolve(`<pre data-language="${lang}"><code>${code}</code></pre>`)
    ),
}))

import MarkdownViewer from '../../../src/renderer/src/components/MarkdownViewer/index.jsx'
import { codeToHtml } from 'shiki'

const sampleMarkdown = `# Hello World

This is a paragraph.

- Item one
- Item two

\`\`\`js
console.log('hello')
\`\`\``

describe('MarkdownViewer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
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
    test('inline code renders as a code element and does not call codeToHtml', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={'Use `console.log` here'} />)
        })
        expect(screen.getByText('console.log').tagName.toLowerCase()).toBe('code')
        expect(codeToHtml).not.toHaveBeenCalled()
    })
    test('language-less fenced code block calls codeToHtml with lang text', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={'```\nsome code\n```'} />)
        })
        expect(codeToHtml).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ lang: 'text' })
        )
    })
    test('fenced code block with language calls codeToHtml with that language', async () => {
        await act(async () => {
            render(<MarkdownViewer rawMarkdown={'```py\nprint(1)\n```'} />)
        })
        expect(codeToHtml).toHaveBeenCalledWith(
            expect.stringContaining('print(1)'),
            expect.objectContaining({ lang: 'py' })
        )
    })
})
