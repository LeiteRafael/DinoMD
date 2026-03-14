// Tests for useDebounce hook
import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

const useDebounce = require('../../src/renderer/src/hooks/useDebounce.js').default

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  test('does not update before the delay expires', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 }
    })

    rerender({ value: 'updated', delay: 300 })

    // Advance less than the delay
    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current).toBe('initial')
  })

  test('updates after the delay expires', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 }
    })

    rerender({ value: 'updated', delay: 300 })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  test('resets the timer on rapid successive changes (only last value applied)', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'v1', delay: 300 }
    })

    rerender({ value: 'v2', delay: 300 })
    act(() => { jest.advanceTimersByTime(100) })

    rerender({ value: 'v3', delay: 300 })
    act(() => { jest.advanceTimersByTime(100) })

    // Only 200ms since last change — should still be v1
    expect(result.current).toBe('v1')

    act(() => { jest.advanceTimersByTime(200) })
    // Now 300ms since v3 was set
    expect(result.current).toBe('v3')
  })
})
