const HEADING_PATTERN = /^(#{1,6}) /
const BOLD_PATTERN = /\*\*(.+?)\*\*/g
const LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g
const CODE_FENCE_PATTERN = /^```/

const CODE_TOKEN_RE =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|((\/\/).*$|(#).*$)|(\b\d+\.?\d*\b)|\b(if|else|for|while|return|function|const|let|var|class|def|import|export|from|in|of|do|switch|case|break|continue|try|catch|finally|new|typeof|void|async|await|static|public|private|protected|true|false|null|undefined)\b|([+\-*/%=!|^~?:]+|[(){}[\];,.])/g

export const escapeHtml = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const tokenizeCodeLine = (escapedLine) =>
    escapedLine.replace(CODE_TOKEN_RE, (match, g1, g2, _g3, _g4, g5, g6) => {
        const cls =
            g1 !== undefined
                ? 'token-code-str'
                : g2 !== undefined
                  ? 'token-code-comment'
                  : g5 !== undefined
                    ? 'token-code-num'
                    : g6 !== undefined
                      ? 'token-code-kw'
                      : 'token-code-op'
        return `<span class="${cls}">${match}</span>`
    })

export const tokenizeSnapshotLine = (escapedLine) =>
    escapedLine.replace(CODE_TOKEN_RE, (match, g1, g2, _g3, _g4, g5, g6) => {
        const cls =
            g1 !== undefined
                ? 'snap-token-string'
                : g2 !== undefined
                  ? 'snap-token-comment'
                  : g5 !== undefined
                    ? 'snap-token-number'
                    : g6 !== undefined
                      ? 'snap-token-keyword'
                      : 'snap-token-punctuation'
        return `<span class="${cls}">${match}</span>`
    })

const applyInlineTokens = (escapedLine) =>
    escapedLine
        .replace(BOLD_PATTERN, '<span class="token-bold">**$1**</span>')
        .replace(LINK_PATTERN, (match) => `<span class="token-link">${match}</span>`)

const classifyLine = (escapedLine, isInCodeBlock) => {
    if (CODE_FENCE_PATTERN.test(escapedLine)) return { type: 'code-fence', content: escapedLine }

    if (isInCodeBlock) return { type: 'code-block', content: tokenizeCodeLine(escapedLine) }

    const headingMatch = escapedLine.match(HEADING_PATTERN)
    if (headingMatch) {
        const level = headingMatch[1].length
        return { type: `h${level}`, content: escapedLine }
    }

    return { type: 'plain', content: applyInlineTokens(escapedLine) }
}

const wrapLine = (type, content) => {
    if (type === 'plain') return content
    return `<span class="token-${type}">${content}</span>`
}

export const tokenize = (text) => {
    if (text === '') return '\n'

    const lines = text.split('\n')
    let isInCodeBlock = false
    let codeBlockLines = []
    const parts = []

    const flushCodeBlock = () => {
        parts.push(`<span class="token-code-region">${codeBlockLines.join('\n')}</span>`)
        codeBlockLines = []
    }

    lines.forEach((line) => {
        const escapedLine = escapeHtml(line)

        if (CODE_FENCE_PATTERN.test(escapedLine)) {
            if (!isInCodeBlock) {
                isInCodeBlock = true
                codeBlockLines = [escapedLine]
            } else {
                codeBlockLines.push(escapedLine)
                flushCodeBlock()
                isInCodeBlock = false
            }
            return
        }

        if (isInCodeBlock) {
            codeBlockLines.push(tokenizeCodeLine(escapedLine))
            return
        }

        const classified = classifyLine(escapedLine, false)
        parts.push(wrapLine(classified.type, classified.content))
    })

    if (codeBlockLines.length > 0) flushCodeBlock()

    return parts.join('\n') + '\n'
}
