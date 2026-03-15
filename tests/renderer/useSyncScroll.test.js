import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
const useSyncScroll = require('../../src/renderer/src/hooks/useSyncScroll.js').default
function makeMockEl(scrollTop = 0, scrollHeight = 1000, clientHeight = 200) {
    return {
        scrollTop,
        scrollHeight,
        clientHeight,
    }
}
describe('useSyncScroll', () => {
    test('returns editorScrollRef, previewScrollRef, onEditorScroll, onPreviewScroll', () => {
        const { result } = renderHook(() =>
            useSyncScroll({
                enabled: true,
            })
        )
        expect(result.current.editorScrollRef).toBeDefined()
        expect(result.current.previewScrollRef).toBeDefined()
        expect(typeof result.current.onEditorScroll).toBe('function')
        expect(typeof result.current.onPreviewScroll).toBe('function')
    })
    test('onEditorScroll syncs preview scroll proportionally', () => {
        const { result } = renderHook(() =>
            useSyncScroll({
                enabled: true,
            })
        )
        const editorEl = makeMockEl(400, 1000, 200)
        const previewEl = makeMockEl(0, 600, 200)
        result.current.editorScrollRef.current = editorEl
        result.current.previewScrollRef.current = previewEl
        act(() => {
            result.current.onEditorScroll()
        })
        expect(previewEl.scrollTop).toBe(200)
    })
    test('onPreviewScroll syncs editor scroll proportionally', () => {
        const { result } = renderHook(() =>
            useSyncScroll({
                enabled: true,
            })
        )
        const previewEl = makeMockEl(200, 600, 200)
        const editorEl = makeMockEl(0, 1000, 200)
        result.current.editorScrollRef.current = editorEl
        result.current.previewScrollRef.current = previewEl
        act(() => {
            result.current.onPreviewScroll()
        })
        expect(editorEl.scrollTop).toBe(400)
    })
    test('does not sync when enabled is false', () => {
        const { result } = renderHook(() =>
            useSyncScroll({
                enabled: false,
            })
        )
        const editorEl = makeMockEl(400, 1000, 200)
        const previewEl = makeMockEl(0, 600, 200)
        result.current.editorScrollRef.current = editorEl
        result.current.previewScrollRef.current = previewEl
        act(() => {
            result.current.onEditorScroll()
        })
        expect(previewEl.scrollTop).toBe(0)
    })
    test('isSyncingRef prevents re-entrant scroll calls', () => {
        const { result } = renderHook(() =>
            useSyncScroll({
                enabled: true,
            })
        )
        const editorEl = makeMockEl(400, 1000, 200)
        const previewEl = makeMockEl(0, 600, 200)
        result.current.editorScrollRef.current = editorEl
        result.current.previewScrollRef.current = previewEl
        act(() => {
            result.current.onEditorScroll()
            result.current.onEditorScroll()
        })
        expect(previewEl.scrollTop).toBe(200)
    })
})
