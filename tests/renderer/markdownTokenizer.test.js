import { tokenize, tokenizeCodeLine } from '../../src/renderer/src/utils/markdownTokenizer'

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

    test('fenced code block produces output containing token-code-region', () => {
        const result = tokenize('```\ncode\n```')

        expect(result).toContain('token-code-region')
    })

    test('lines inside a fenced code block are wrapped in token-code-region', () => {
        const result = tokenize('```\ncode line\n```')

        expect(result).toContain('token-code-region')
        expect(result).toContain('code line')
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

describe('tokenizeCodeLine', () => {
    test('double-slash comment produces output containing token-code-comment', () => {
        const result = tokenizeCodeLine('// this is a comment')

        expect(result).toContain('token-code-comment')
    })

    test('hash comment produces output containing token-code-comment', () => {
        const result = tokenizeCodeLine('# comment')

        expect(result).toContain('token-code-comment')
    })

    test('double-quoted string produces output containing token-code-str', () => {
        const result = tokenizeCodeLine('"hello"')

        expect(result).toContain('token-code-str')
    })

    test('number literal produces output containing token-code-num', () => {
        const result = tokenizeCodeLine('42')

        expect(result).toContain('token-code-num')
    })

    test('keyword produces output containing token-code-kw', () => {
        const result = tokenizeCodeLine('const x')

        expect(result).toContain('token-code-kw')
    })

    test('operator produces output containing token-code-op', () => {
        const result = tokenizeCodeLine('x = 1')

        expect(result).toContain('token-code-op')
    })

    test('keyword inside a string does not produce token-code-kw', () => {
        const result = tokenizeCodeLine('"const"')

        expect(result).not.toContain('token-code-kw')
    })

    test('empty string returns empty string without error', () => {
        expect(tokenizeCodeLine('')).toBe('')
    })
})
