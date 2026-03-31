import { computeLineDiff } from '../../../src/renderer/src/utils/diffUtils.js'

describe('diffUtils', () => {
    describe('computeLineDiff', () => {
        test('identical lines return empty changeMap', () => {
            const baseline = ['line1', 'line2', 'line3']
            const current = ['line1', 'line2', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result.size).toBe(0)
        })

        test('new line added returns entry with added type', () => {
            const baseline = ['line1', 'line2']
            const current = ['line1', 'line2', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result.get(3)).toBe('added')
            expect(result.size).toBe(1)
        })

        test('line modified returns entry with modified type', () => {
            const baseline = ['line1', 'line2', 'line3']
            const current = ['line1', 'modified', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result.get(2)).toBe('modified')
            expect(result.size).toBe(1)
        })

        test('line deleted returns entry with deleted type', () => {
            const baseline = ['line1', 'line2', 'line3']
            const current = ['line1', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result.has(2)).toBe(true)
            expect(result.get(2)).toBe('deleted')
        })

        test('multiple changes return correct map with all types', () => {
            const baseline = ['line1', 'line2', 'line3', 'line4']
            const current = ['line1', 'modified2', 'line3', 'line5']

            const result = computeLineDiff(baseline, current)

            expect(result.get(2)).toBe('modified')
            expect(result.get(4)).toBe('added')
            expect(result.has(4)).toBe(true)
        })

        test('empty baseline with new lines returns all as added', () => {
            const baseline = []
            const current = ['line1', 'line2', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result.get(1)).toBe('added')
            expect(result.get(2)).toBe('added')
            expect(result.get(3)).toBe('added')
            expect(result.size).toBe(3)
        })

        test('handles empty lines correctly', () => {
            const baseline = ['line1', '', 'line3']
            const current = ['line1', '', 'modified3']

            const result = computeLineDiff(baseline, current)

            expect(result.has(2)).toBe(false)
            expect(result.get(3)).toBe('modified')
        })

        test('handles trailing whitespace in lines', () => {
            const baseline = ['line1  ', 'line2']
            const current = ['line1', 'line2']

            const result = computeLineDiff(baseline, current)

            expect(result.get(1)).toBe('modified')
        })

        test('insertion shift adjusts line numbers correctly', () => {
            const baseline = ['a', 'b', 'c']
            const current = ['a', 'x', 'y', 'b', 'c']

            const result = computeLineDiff(baseline, current)

            expect(result.get(2)).toBe('added')
            expect(result.get(3)).toBe('added')
        })

        test('deletion shift adjusts line numbers correctly', () => {
            const baseline = ['a', 'b', 'c', 'd']
            const current = ['a', 'c', 'd']

            const result = computeLineDiff(baseline, current)

            expect(result.has(2)).toBe(true)
            expect(result.get(2)).toBe('deleted')
        })

        test('performance requirement: completes within 50ms for 500 lines', () => {
            const baseline = Array.from({ length: 500 }, (_, i) => `line ${i}`)
            const current = Array.from({ length: 500 }, (_, i) =>
                i % 10 === 0 ? `modified line ${i}` : `line ${i}`
            )
            current.push('new line')

            const startTime = performance.now()
            const result = computeLineDiff(baseline, current)
            const endTime = performance.now()

            expect(endTime - startTime).toBeLessThan(50)
            expect(result.size).toBeGreaterThan(0)
        })

        test('returns Map with correct structure', () => {
            const baseline = ['line1', 'line2']
            const current = ['line1', 'line2', 'line3']

            const result = computeLineDiff(baseline, current)

            expect(result).toBeInstanceOf(Map)
            expect(Array.from(result.entries())).toEqual([[3, 'added']])
        })
    })
})
