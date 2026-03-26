import { renderHook, act } from '@testing-library/react'
import useSnapshotExport from '../../../src/renderer/src/hooks/useSnapshotExport.js'

vi.mock('../../../src/renderer/src/utils/snapshotExport.js', () => ({
    captureElement: vi.fn(),
    downloadBlob: vi.fn(),
}))

import { captureElement, downloadBlob } from '../../../src/renderer/src/utils/snapshotExport.js'

const makeRef = () => {
    const el = document.createElement('div')
    return { current: el }
}

const mockBlob = new Blob(['data'], { type: 'image/png' })

beforeEach(() => {
    captureElement.mockClear()
    captureElement.mockResolvedValue(mockBlob)
    downloadBlob.mockClear()
})

test('exports with filename snapshot-server.js.png when name is server.js', async () => {
    const ref = makeRef()
    const { result } = renderHook(() => useSnapshotExport(ref, 'server.js'))

    await act(async () => {
        await result.current.exportPng()
    })

    expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'snapshot-server.js.png')
})

test('exports with filename snapshot.png when name is empty string', async () => {
    const ref = makeRef()
    const { result } = renderHook(() => useSnapshotExport(ref, ''))

    await act(async () => {
        await result.current.exportPng()
    })

    expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'snapshot.png')
})

test('exports with filename snapshot.png when name is only whitespace', async () => {
    const ref = makeRef()
    const { result } = renderHook(() => useSnapshotExport(ref, '   '))

    await act(async () => {
        await result.current.exportPng()
    })

    expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'snapshot.png')
})

test('sets exporting to true during capture and false after', async () => {
    const ref = makeRef()
    let resolveCaptureElement
    captureElement.mockReturnValue(new Promise((res) => (resolveCaptureElement = res)))

    const { result } = renderHook(() => useSnapshotExport(ref, 'file.js'))

    act(() => {
        result.current.exportPng()
    })
    expect(result.current.exporting).toBe(true)

    await act(async () => {
        resolveCaptureElement(mockBlob)
    })
    expect(result.current.exporting).toBe(false)
})

test('sets error message when captureElement rejects', async () => {
    const ref = makeRef()
    captureElement.mockRejectedValue(new Error('canvas error'))
    const { result } = renderHook(() => useSnapshotExport(ref, 'file.js'))

    await act(async () => {
        await result.current.exportPng()
    })

    expect(result.current.error).toBeTruthy()
    expect(downloadBlob).not.toHaveBeenCalled()
})

test('does nothing when ref.current is null', async () => {
    const ref = { current: null }
    const { result } = renderHook(() => useSnapshotExport(ref, 'file.js'))

    await act(async () => {
        await result.current.exportPng()
    })

    expect(captureElement).not.toHaveBeenCalled()
    expect(downloadBlob).not.toHaveBeenCalled()
})
