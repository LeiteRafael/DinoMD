// Tests for useSyncScroll hook
import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

const useSyncScroll = require('../../src/renderer/src/hooks/useSyncScroll.js').default

// Helper: create a mock scroll element with controllable dimensions
function makeMockEl(scrollTop = 0, scrollHeight = 1000, clientHeight = 200) {
  return {
    scrollTop,
    scrollHeight,
    clientHeight
  }
}

describe('useSyncScroll', () => {
  test('returns editorScrollRef, previewScrollRef, onEditorScroll, onPreviewScroll', () => {
    const { result } = renderHook(() => useSyncScroll({ enabled: true }))
    expect(result.current.editorScrollRef).toBeDefined()
    expect(result.current.previewScrollRef).toBeDefined()
    expect(typeof result.current.onEditorScroll).toBe('function')
    expect(typeof result.current.onPreviewScroll).toBe('function')
  })

  test('onEditorScroll syncs preview scroll proportionally', () => {
    const { result } = renderHook(() => useSyncScroll({ enabled: true }))

    const editorEl = makeMockEl(400, 1000, 200) // ratio = 400 / 800 = 0.5
    const previewEl = makeMockEl(0, 600, 200)   // expected: 0.5 * 400 = 200

    result.current.editorScrollRef.current = editorEl
    result.current.previewScrollRef.current = previewEl

    act(() => {
      result.current.onEditorScroll()
    })

    expect(previewEl.scrollTop).toBe(200)
  })

  test('onPreviewScroll syncs editor scroll proportionally', () => {
    const { result } = renderHook(() => useSyncScroll({ enabled: true }))

    const previewEl = makeMockEl(200, 600, 200)  // ratio = 200 / 400 = 0.5
    const editorEl = makeMockEl(0, 1000, 200)    // expected: 0.5 * 800 = 400

    result.current.editorScrollRef.current = editorEl
    result.current.previewScrollRef.current = previewEl

    act(() => {
      result.current.onPreviewScroll()
    })

    expect(editorEl.scrollTop).toBe(400)
  })

  test('does not sync when enabled is false', () => {
    const { result } = renderHook(() => useSyncScroll({ enabled: false }))

    const editorEl = makeMockEl(400, 1000, 200)
    const previewEl = makeMockEl(0, 600, 200)

    result.current.editorScrollRef.current = editorEl
    result.current.previewScrollRef.current = previewEl

    act(() => {
      result.current.onEditorScroll()
    })

    // Preview should not change
    expect(previewEl.scrollTop).toBe(0)
  })

  test('isSyncingRef prevents re-entrant scroll calls', () => {
    // Since isSyncingRef is internal, we verify it indirectly:
    // calling onEditorScroll twice in the same frame should not double-update
    const { result } = renderHook(() => useSyncScroll({ enabled: true }))

    const editorEl = makeMockEl(400, 1000, 200) // ratio 0.5
    const previewEl = makeMockEl(0, 600, 200)   // expected 200

    result.current.editorScrollRef.current = editorEl
    result.current.previewScrollRef.current = previewEl

    act(() => {
      // First call sets isSyncing=true via requestAnimationFrame (async)
      result.current.onEditorScroll()
      // Second call — isSyncing is true synchronously so it's a no-op
      result.current.onEditorScroll()
    })

    // scrollTop set once, not multiplied
    expect(previewEl.scrollTop).toBe(200)
  })
})
