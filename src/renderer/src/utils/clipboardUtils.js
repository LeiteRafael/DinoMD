export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            throw new Error(
                'Clipboard access denied. Allow clipboard permissions in your browser settings and try again.'
            )
        }
        throw new Error(`Failed to copy to clipboard: ${err.message}`)
    }
}

export const stripMarkdown = (text) => {
    if (!text || typeof text !== 'string') return ''

    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^>\s*/gm, '')
        .replace(/^[-*_]{3,}\s*$/gm, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*\n]+)\*/g, '$1')
        .replace(/_([^_\n]+)_/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
