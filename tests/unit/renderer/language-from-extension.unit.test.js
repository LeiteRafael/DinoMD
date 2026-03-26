import languageFromExtension from '../../../src/renderer/src/utils/languageFromExtension.js'

test('returns JavaScript for .js extension', () => {
    expect(languageFromExtension('app.js')).toBe('JavaScript')
})

test('returns TypeScript for .ts extension', () => {
    expect(languageFromExtension('index.ts')).toBe('TypeScript')
})

test('returns Python for .py extension', () => {
    expect(languageFromExtension('main.py')).toBe('Python')
})

test('returns JSX for .jsx extension', () => {
    expect(languageFromExtension('Component.jsx')).toBe('JSX')
})

test('returns TSX for .tsx extension', () => {
    expect(languageFromExtension('Page.tsx')).toBe('TSX')
})

test('returns Markdown for .md extension', () => {
    expect(languageFromExtension('README.md')).toBe('Markdown')
})

test('returns HTML for .html extension', () => {
    expect(languageFromExtension('index.html')).toBe('HTML')
})

test('returns CSS for .css extension', () => {
    expect(languageFromExtension('styles.css')).toBe('CSS')
})

test('returns JSON for .json extension', () => {
    expect(languageFromExtension('package.json')).toBe('JSON')
})

test('returns empty string for unknown extension', () => {
    expect(languageFromExtension('file.xyz123')).toBe('')
})

test('returns empty string for filename with no extension', () => {
    expect(languageFromExtension('Makefile')).toBe('')
})

test('returns empty string for null input', () => {
    expect(languageFromExtension(null)).toBe('')
})

test('returns empty string for empty string input', () => {
    expect(languageFromExtension('')).toBe('')
})

test('handles filenames with multiple dots correctly', () => {
    expect(languageFromExtension('index.test.js')).toBe('JavaScript')
})
