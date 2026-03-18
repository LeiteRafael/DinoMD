import '@testing-library/jest-dom'
import { copyToClipboard, stripMarkdown } from '../../src/renderer/src/utils/clipboardUtils.js'

describe('stripMarkdown', () => {
    test('returns empty string for empty input', () => {
        expect(stripMarkdown('')).toBe('')
    })

    test('removes heading markers from all levels', () => {
        const input = '# H1\n## H2\n### H3'

        expect(stripMarkdown(input)).toBe('H1\nH2\nH3')
    })

    test('removes bold markers and preserves inner text', () => {
        expect(stripMarkdown('**bold text**')).toBe('bold text')
    })

    test('removes italic asterisk markers and preserves inner text', () => {
        expect(stripMarkdown('*italic text*')).toBe('italic text')
    })

    test('removes double-underscore bold markers and preserves inner text', () => {
        expect(stripMarkdown('__bold__')).toBe('bold')
    })

    test('removes single-underscore italic markers and preserves inner text', () => {
        expect(stripMarkdown('_italic_')).toBe('italic')
    })

    test('removes strikethrough markers and preserves inner text', () => {
        expect(stripMarkdown('~~strikethrough~~')).toBe('strikethrough')
    })

    test('replaces inline links with label text only (no URL or brackets)', () => {
        expect(stripMarkdown('[click here](https://example.com)')).toBe('click here')
    })

    test('removes images entirely (no alt text or URL remains)', () => {
        expect(stripMarkdown('![alt text](https://example.com/img.png)')).toBe('')
    })

    test('removes fenced code blocks entirely', () => {
        const input = 'Before\n```\nconst x = 1\n```\nAfter'

        expect(stripMarkdown(input)).toBe('Before\n\nAfter')
    })

    test('removes inline code backticks and preserves inner text', () => {
        expect(stripMarkdown('use `npm install` to install')).toBe('use npm install to install')
    })

    test('removes blockquote markers', () => {
        expect(stripMarkdown('> This is a quote')).toBe('This is a quote')
    })

    test('removes unordered list markers (dash)', () => {
        expect(stripMarkdown('- item one\n- item two')).toBe('item one\nitem two')
    })

    test('removes ordered list markers', () => {
        expect(stripMarkdown('1. first\n2. second')).toBe('first\nsecond')
    })

    test('returns plain text unchanged', () => {
        expect(stripMarkdown('Hello world')).toBe('Hello world')
    })
})

describe('copyToClipboard', () => {
    beforeEach(() => {
        Object.assign(navigator, {
            clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
        })
    })

    test('calls navigator.clipboard.writeText with the provided text', async () => {
        await copyToClipboard('hello clipboard')

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello clipboard')
    })

    test('resolves without a value when writeText succeeds', async () => {
        await expect(copyToClipboard('text')).resolves.toBeUndefined()
    })

    test('throws a human-readable error when clipboard permission is denied', async () => {
        const permissionError = new DOMException('Permission denied', 'NotAllowedError')
        navigator.clipboard.writeText.mockRejectedValueOnce(permissionError)

        await expect(copyToClipboard('text')).rejects.toThrow('Clipboard access denied')
    })

    test('throws a descriptive error for unexpected clipboard failures', async () => {
        navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Some network error'))

        await expect(copyToClipboard('text')).rejects.toThrow(
            'Failed to copy to clipboard: Some network error'
        )
    })
})
