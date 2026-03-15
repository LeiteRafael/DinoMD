import { tokenize } from '../../src/renderer/src/utils/markdownTokenizer'

describe('tokenize', () => {
    test('# H1 heading produces output containing token-h1', () => {
        const result = tokenize('# H1 heading')

        expect(result).toContain('token-h1')
    })

    test('## H2 heading produces output containing token-h2', () => {
        const result = tokenize('## H2 heading')

        expect(result).toContain('token-h2')
    })

    test('**bold** inline text produces output containing token-bold', () => {
        const result = tokenize('**bold**')

        expect(result).toContain('token-bold')
    })

    test('[label](url) link produces output containing token-link', () => {
        const result = tokenize('[label](url)')

        expect(result).toContain('token-link')
    })

    test('code fence opening line produces output containing token-code-fence', () => {
        const result = tokenize('```\ncode\n```')

        expect(result).toContain('token-code-fence')
    })

    test('lines inside a fenced code block produce output containing token-code-block', () => {
        const result = tokenize('```\ncode line\n```')

        expect(result).toContain('token-code-block')
    })

    test('input containing <script> is HTML-escaped and raw < never appears in output', () => {
        const result = tokenize('<script>alert(1)</script>')

        expect(result).not.toContain('<script>')
        expect(result).toContain('&lt;script&gt;')
    })

    test('empty string returns a single newline without error', () => {
        expect(tokenize('')).toBe('\n')
    })
})
