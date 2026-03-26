import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('../../../src/renderer/src/services/api.js', () => ({
    api: {
        folder: {
            openPicker: vi.fn(),
            readDir: vi.fn(),
            readFile: vi.fn(),
        },
    },
}))

import { api } from '../../../src/renderer/src/services/api.js'
import useFileTree from '../../../src/renderer/src/hooks/useFileTree.js'

const ROOT = '/home/user/notes'
const ROOT_ENTRIES = [
    { name: 'docs', isDirectory: true, path: `${ROOT}/docs` },
    { name: 'readme.md', isDirectory: false, path: `${ROOT}/readme.md` },
]
const DOCS_ENTRIES = [{ name: 'guide.md', isDirectory: false, path: `${ROOT}/docs/guide.md` }]

describe('useFileTree — openFolder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.folder.openPicker.mockResolvedValue(null)
        api.folder.readDir.mockResolvedValue([])
    })

    test('openFolder calls api.folder.openPicker', async () => {
        const { result } = renderHook(() => useFileTree())

        await act(async () => {
            await result.current.openFolder()
        })

        expect(api.folder.openPicker).toHaveBeenCalledTimes(1)
    })

    test('openFolder sets rootFolderPath when picker returns a path', async () => {
        api.folder.openPicker.mockResolvedValue(ROOT)
        api.folder.readDir.mockResolvedValue(ROOT_ENTRIES)

        const { result } = renderHook(() => useFileTree())

        await act(async () => {
            await result.current.openFolder()
        })

        expect(result.current.rootFolderPath).toBe(ROOT)
    })

    test('openFolder does not update state when picker returns null', async () => {
        api.folder.openPicker.mockResolvedValue(null)

        const { result } = renderHook(() => useFileTree())

        await act(async () => {
            await result.current.openFolder()
        })

        expect(result.current.rootFolderPath).toBeNull()
    })

    test('openFolder calls onRootFolderChange callback with chosen path', async () => {
        api.folder.openPicker.mockResolvedValue(ROOT)
        api.folder.readDir.mockResolvedValue(ROOT_ENTRIES)
        const onRootFolderChange = vi.fn()

        const { result } = renderHook(() => useFileTree({ onRootFolderChange }))

        await act(async () => {
            await result.current.openFolder()
        })

        expect(onRootFolderChange).toHaveBeenCalledWith(ROOT)
    })
})

describe('useFileTree — initial root loading', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.folder.readDir.mockResolvedValue(ROOT_ENTRIES)
    })

    test('loads root entries on mount when initialRootFolderPath is provided', async () => {
        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))

        await act(async () => {})

        expect(api.folder.readDir).toHaveBeenCalledWith(ROOT)
        expect(result.current.rootEntries).toHaveLength(2)
    })

    test('sets error state when readDir returns error object', async () => {
        api.folder.readDir.mockResolvedValue({ error: 'Permission denied' })

        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))

        await act(async () => {})

        expect(result.current.error).toBe('Permission denied')
        expect(result.current.rootEntries).toHaveLength(0)
    })

    test('resets expandedPaths when rootFolderPath changes', async () => {
        api.folder.openPicker.mockResolvedValue(ROOT)
        api.folder.readDir.mockResolvedValueOnce(ROOT_ENTRIES).mockResolvedValue(DOCS_ENTRIES)

        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))
        await act(async () => {})

        await act(async () => {
            await result.current.toggleFolder(`${ROOT}/docs`, null)
        })
        expect(result.current.expandedPaths.has(`${ROOT}/docs`)).toBe(true)

        api.folder.openPicker.mockResolvedValue('/other/path')
        api.folder.readDir.mockResolvedValue([])
        await act(async () => {
            await result.current.openFolder()
        })

        expect(result.current.expandedPaths.size).toBe(0)
    })
})

describe('useFileTree — toggleFolder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.folder.readDir.mockResolvedValue(ROOT_ENTRIES)
    })

    test('toggleFolder expands a collapsed folder and fetches children', async () => {
        api.folder.readDir.mockResolvedValueOnce(ROOT_ENTRIES).mockResolvedValue(DOCS_ENTRIES)

        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))
        await act(async () => {})

        await act(async () => {
            await result.current.toggleFolder(`${ROOT}/docs`, null)
        })

        expect(result.current.expandedPaths.has(`${ROOT}/docs`)).toBe(true)
        expect(api.folder.readDir).toHaveBeenCalledWith(`${ROOT}/docs`)
    })

    test('toggleFolder collapses an already expanded folder without refetching', async () => {
        api.folder.readDir.mockResolvedValueOnce(ROOT_ENTRIES).mockResolvedValue(DOCS_ENTRIES)

        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))
        await act(async () => {})

        await act(async () => {
            await result.current.toggleFolder(`${ROOT}/docs`, null)
        })

        const callCountAfterExpand = api.folder.readDir.mock.calls.length

        await act(async () => {
            result.current.toggleFolder(`${ROOT}/docs`, DOCS_ENTRIES)
        })

        expect(result.current.expandedPaths.has(`${ROOT}/docs`)).toBe(false)
        expect(api.folder.readDir.mock.calls.length).toBe(callCountAfterExpand)
    })

    test('toggleFolder does not refetch children when already loaded', async () => {
        api.folder.readDir.mockResolvedValueOnce(ROOT_ENTRIES).mockResolvedValue(DOCS_ENTRIES)

        const { result } = renderHook(() => useFileTree({ initialRootFolderPath: ROOT }))
        await act(async () => {})

        await act(async () => {
            await result.current.toggleFolder(`${ROOT}/docs`, null)
        })

        await act(async () => {
            result.current.toggleFolder(`${ROOT}/docs`, DOCS_ENTRIES)
        })

        const callCountAfterDoubleToggle = api.folder.readDir.mock.calls.length

        await act(async () => {
            await result.current.toggleFolder(`${ROOT}/docs`, DOCS_ENTRIES)
        })

        expect(api.folder.readDir.mock.calls.length).toBe(callCountAfterDoubleToggle)
    })
})
