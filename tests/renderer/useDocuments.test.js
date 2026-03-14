// T023: Unit tests for useDocuments hook
import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../../src/renderer/src/services/api.js', () => ({
  api: {
    getAll: jest.fn(),
    importFiles: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn()
  }
}))

const { api } = require('../../src/renderer/src/services/api.js')
const useDocumentsModule = require('../../src/renderer/src/hooks/useDocuments.js')
const useDocuments = useDocumentsModule.default

const sampleDocs = [
  { id: '1', name: 'Doc A', filePath: '/a.md', orderIndex: 0, status: 'available' },
  { id: '2', name: 'Doc B', filePath: '/b.md', orderIndex: 1, status: 'available' }
]

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('loads documents on mount', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: sampleDocs })

    const { result } = renderHook(() => useDocuments())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for load
    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.documents).toEqual(sampleDocs)
    expect(result.current.error).toBeNull()
  })

  test('sets error state when getAll fails', async () => {
    api.getAll.mockResolvedValue({ success: false, documents: [], error: 'DB error' })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    expect(result.current.error).toBe('DB error')
    expect(result.current.documents).toEqual([])
  })

  test('importFiles calls api.importFiles then refreshes the list', async () => {
    api.getAll
      .mockResolvedValueOnce({ success: true, documents: [] })
      .mockResolvedValueOnce({ success: true, documents: sampleDocs })
    api.importFiles.mockResolvedValue({ success: true, imported: sampleDocs, skipped: [] })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    expect(result.current.documents).toEqual([])

    await act(async () => {
      await result.current.importFiles()
    })

    expect(api.importFiles).toHaveBeenCalledTimes(1)
    expect(api.getAll).toHaveBeenCalledTimes(2)
    expect(result.current.documents).toEqual(sampleDocs)
  })

  test('importFiles does not refresh when api.importFiles fails', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: [] })
    api.importFiles.mockResolvedValue({ success: false, imported: [], skipped: [], error: 'Cancelled' })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    await act(async () => {
      await result.current.importFiles()
    })

    expect(api.importFiles).toHaveBeenCalledTimes(1)
    expect(api.getAll).toHaveBeenCalledTimes(1)
  })

  test('removeDocument calls api.remove then refreshes', async () => {
    api.getAll
      .mockResolvedValueOnce({ success: true, documents: sampleDocs })
      .mockResolvedValueOnce({ success: true, documents: [sampleDocs[1]] })
    api.remove.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    await act(async () => {
      await result.current.removeDocument('1')
    })

    expect(api.remove).toHaveBeenCalledWith({ id: '1' })
    expect(result.current.documents).toEqual([sampleDocs[1]])
  })

  test('removeDocument does not refresh when api.remove fails', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: sampleDocs })
    api.remove.mockResolvedValue({ success: false, error: 'Remove failed' })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    await act(async () => {
      await result.current.removeDocument('1')
    })

    expect(api.remove).toHaveBeenCalledWith({ id: '1' })
    expect(api.getAll).toHaveBeenCalledTimes(1)
  })

  test('sets error when api.getAll throws an exception', async () => {
    api.getAll.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    expect(result.current.error).toBe('Network error')
    expect(result.current.loading).toBe(false)
    expect(result.current.documents).toEqual([])
  })

  test('reorderDocuments calls api.reorder and optimistically updates document order', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: sampleDocs })
    api.reorder.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    await act(async () => {
      await result.current.reorderDocuments(['2', '1'])
    })

    expect(api.reorder).toHaveBeenCalledWith({ orderedIds: ['2', '1'] })
    expect(result.current.documents[0].id).toBe('2')
    expect(result.current.documents[0].orderIndex).toBe(0)
    expect(result.current.documents[1].id).toBe('1')
    expect(result.current.documents[1].orderIndex).toBe(1)
  })

  test('reorderDocuments does not update state when api.reorder fails', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: sampleDocs })
    api.reorder.mockResolvedValue({ success: false, error: 'Reorder failed' })

    const { result } = renderHook(() => useDocuments())
    await act(async () => {})

    await act(async () => {
      await result.current.reorderDocuments(['2', '1'])
    })

    expect(result.current.documents).toEqual(sampleDocs)
  })
})
