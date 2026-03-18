import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

const useToast = require('../../src/renderer/src/hooks/useToast.js').default

describe('useToast', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    test('returns null toast initially', () => {
        const { result } = renderHook(() => useToast())

        expect(result.current.toast).toBeNull()
    })

    test('showToast sets the toast with the provided message and type', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'Copied!', type: 'success' })
        })

        expect(result.current.toast).toEqual({ message: 'Copied!', type: 'success' })
    })

    test('showToast defaults type to success when type is omitted', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'Done' })
        })

        expect(result.current.toast).toEqual({ message: 'Done', type: 'success' })
    })

    test('toast auto-dismisses after 2500 ms', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'Hello', type: 'info' })
        })
        expect(result.current.toast).not.toBeNull()

        act(() => {
            jest.advanceTimersByTime(2500)
        })

        expect(result.current.toast).toBeNull()
    })

    test('toast is still visible at 2499 ms', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'Hello', type: 'info' })
        })

        act(() => {
            jest.advanceTimersByTime(2499)
        })

        expect(result.current.toast).not.toBeNull()
    })

    test('dismissToast clears the toast immediately', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'Hello', type: 'success' })
        })
        expect(result.current.toast).not.toBeNull()

        act(() => {
            result.current.dismissToast()
        })

        expect(result.current.toast).toBeNull()
    })

    test('calling showToast twice replaces the previous toast', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'First', type: 'success' })
        })
        act(() => {
            result.current.showToast({ message: 'Second', type: 'error' })
        })

        expect(result.current.toast).toEqual({ message: 'Second', type: 'error' })
    })

    test('calling showToast twice resets the auto-dismiss timer', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showToast({ message: 'First', type: 'success' })
        })
        act(() => {
            jest.advanceTimersByTime(2000)
        })
        act(() => {
            result.current.showToast({ message: 'Second', type: 'error' })
        })
        act(() => {
            jest.advanceTimersByTime(2000)
        })

        expect(result.current.toast).not.toBeNull()

        act(() => {
            jest.advanceTimersByTime(500)
        })

        expect(result.current.toast).toBeNull()
    })
})
