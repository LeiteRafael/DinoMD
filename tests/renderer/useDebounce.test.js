import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import useDebounce from '../../src/renderer/src/hooks/useDebounce.js'
describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    test('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300))

        expect(result.current).toBe('hello')
    })

    test('does not update before the delay expires', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: {
                value: 'initial',
                delay: 300,
            },
        })

        rerender({
            value: 'updated',
            delay: 300,
        })
        act(() => {
            vi.advanceTimersByTime(200)
        })

        expect(result.current).toBe('initial')
    })

    test('updates after the delay expires', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: {
                value: 'initial',
                delay: 300,
            },
        })

        rerender({
            value: 'updated',
            delay: 300,
        })
        act(() => {
            vi.advanceTimersByTime(300)
        })

        expect(result.current).toBe('updated')
    })

    test('resets the timer on rapid successive changes (only last value applied)', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: {
                value: 'v1',
                delay: 300,
            },
        })

        rerender({
            value: 'v2',
            delay: 300,
        })
        act(() => {
            vi.advanceTimersByTime(100)
        })
        rerender({
            value: 'v3',
            delay: 300,
        })
        act(() => {
            vi.advanceTimersByTime(100)
        })

        expect(result.current).toBe('v1')

        act(() => {
            vi.advanceTimersByTime(200)
        })

        expect(result.current).toBe('v3')
    })
})
