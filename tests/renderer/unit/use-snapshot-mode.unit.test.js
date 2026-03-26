import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import useSnapshotMode from '../../../src/renderer/src/hooks/useSnapshotMode.js'

describe('useSnapshotMode', () => {
    test('returns code as default mode', () => {
        const { result } = renderHook(() => useSnapshotMode('doc-1'))

        expect(result.current.mode).toBe('code')
    })

    test('setMode changes mode to snapshot', () => {
        const { result } = renderHook(() => useSnapshotMode('doc-1'))

        act(() => {
            result.current.setMode('snapshot')
        })

        expect(result.current.mode).toBe('snapshot')
    })

    test('mode resets to code when documentId changes', () => {
        const { result, rerender } = renderHook(({ id }) => useSnapshotMode(id), {
            initialProps: { id: 'doc-1' },
        })

        act(() => {
            result.current.setMode('snapshot')
        })
        expect(result.current.mode).toBe('snapshot')

        rerender({ id: 'doc-2' })

        expect(result.current.mode).toBe('code')
    })

    test('mode stays code when same documentId is re-provided', () => {
        const { result, rerender } = renderHook(({ id }) => useSnapshotMode(id), {
            initialProps: { id: 'doc-1' },
        })

        act(() => {
            result.current.setMode('snapshot')
        })
        expect(result.current.mode).toBe('snapshot')

        rerender({ id: 'doc-1' })

        expect(result.current.mode).toBe('snapshot')
    })
})
