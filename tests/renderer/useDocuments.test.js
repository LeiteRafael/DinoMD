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
})
