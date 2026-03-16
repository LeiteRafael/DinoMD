const HEADING_PATTERN = /^(#{1,6}) /
const BOLD_PATTERN = /\*\*(.+?)\*\*/g
const LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g
const CODE_FENCE_PATTERN = /^```/

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const applyInlineTokens = (escapedLine) =>
    escapedLine
        .replace(BOLD_PATTERN, '<span class="token-bold">**$1**</span>')
        .replace(LINK_PATTERN, (match) => `<span class="token-link">${match}</span>`)

const classifyLine = (escapedLine, isInCodeBlock) => {
    if (CODE_FENCE_PATTERN.test(escapedLine)) return { type: 'code-fence', content: escapedLine }

    if (isInCodeBlock) return { type: 'code-block', content: escapedLine }

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

    const tokenized = lines.map((line) => {
        const escapedLine = escapeHtml(line)
        const classified = classifyLine(escapedLine, isInCodeBlock)

        if (classified.type === 'code-fence') {
            isInCodeBlock = !isInCodeBlock
        }

        return wrapLine(classified.type, classified.content)
    })

    return tokenized.join('\n') + '\n'
}
