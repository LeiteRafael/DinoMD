import { renderHook, act } from '@testing-library/react'

vi.mock('../../../src/renderer/src/utils/diffUtils.js', () => ({
    computeLineDiff: vi.fn(),
}))

import { computeLineDiff } from '../../../src/renderer/src/utils/diffUtils.js'
import useChangeIndicators from '../../../src/renderer/src/hooks/useChangeIndicators.js'

describe('useChangeIndicators', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('returns empty changeMap when currentContent matches savedContent', () => {
        const content = 'line1\nline2\nline3'
        computeLineDiff.mockReturnValue(new Map())

        const { result } = renderHook(() => useChangeIndicators(content, content))

        expect(result.current.changeMap.size).toBe(0)
        expect(result.current.isDirty).toBe(false)
    })

    test('returns populated changeMap when currentContent differs from savedContent', () => {
        const savedContent = 'line1\nline2'
        const currentContent = 'line1\nline2\nline3'
        const changeMap = new Map([[3, 'added']])
        computeLineDiff.mockReturnValue(changeMap)

        const { result } = renderHook(() => useChangeIndicators(currentContent, savedContent))

        expect(result.current.changeMap.size).toBe(1)
        expect(result.current.changeMap.get(3)).toBe('added')
        expect(result.current.isDirty).toBe(true)
    })

    test('isDirty is false when changeMap is empty', () => {
        computeLineDiff.mockReturnValue(new Map())

        const { result } = renderHook(() => useChangeIndicators('line1', 'line1'))

        expect(result.current.isDirty).toBe(false)
    })

    test('isDirty is true when changeMap has entries', () => {
        computeLineDiff.mockReturnValue(new Map([[1, 'modified']]))

        const { result } = renderHook(() => useChangeIndicators('modified', 'original'))

        expect(result.current.isDirty).toBe(true)
    })

    test('baseline resets when savedContent changes', async () => {
        const initialSaved = 'line1\nline2'
        const currentContent = 'line1\nline2\nline3'
        computeLineDiff.mockReturnValue(new Map([[3, 'added']]))

        const { result, rerender } = renderHook(
            ({ current, saved }) => useChangeIndicators(current, saved),
            { initialProps: { current: currentContent, saved: initialSaved } }
        )

        expect(result.current.isDirty).toBe(true)

        computeLineDiff.mockReturnValue(new Map())

        await act(async () => {
            rerender({ current: currentContent, saved: currentContent })
        })

        expect(result.current.isDirty).toBe(false)
    })

    test('calls computeLineDiff with baseline lines and current lines', () => {
        const savedContent = 'line1\nline2'
        const currentContent = 'line1\nline2\nline3'
        computeLineDiff.mockReturnValue(new Map())

        renderHook(() => useChangeIndicators(currentContent, savedContent))

        expect(computeLineDiff).toHaveBeenCalledWith(
            savedContent.split('\n'),
            currentContent.split('\n')
        )
    })
})
