import { invokeHandler, dialog, resetMocks } from '../../tests/__mocks__/electron.js'

vi.mock('../../src/main/fs/fileUtils.js', () => ({
    readDirFiltered: vi.fn(),
    readFileAsUtf8: vi.fn(),
    fileExists: vi.fn(),
    writeFileUtf8: vi.fn(),
    renameFile: vi.fn(),
    watchFile: vi.fn(),
    stopWatching: vi.fn(),
}))

import * as fileUtils from '../../src/main/fs/fileUtils.js'
import { registerFolderHandlers } from '../../src/main/ipc/folder.js'

beforeAll(() => {
    registerFolderHandlers()
})

beforeEach(() => {
    resetMocks()
    vi.clearAllMocks()
    registerFolderHandlers()
})

describe('folder:open-picker', () => {
    test('returns selected directory path when user picks a folder', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/home/user/notes'],
        })

        const result = await invokeHandler('folder:open-picker')

        expect(result).toBe('/home/user/notes')
    })

    test('returns null when user cancels the dialog', async () => {
        dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

        const result = await invokeHandler('folder:open-picker')

        expect(result).toBeNull()
    })
})

describe('folder:read-dir', () => {
    test('returns sorted entries for a valid directory path', async () => {
        const entries = [
            { name: 'notes.md', isDirectory: false, path: '/home/user/notes/notes.md' },
            { name: 'docs', isDirectory: true, path: '/home/user/notes/docs' },
        ]
        fileUtils.readDirFiltered.mockResolvedValue(entries)

        const result = await invokeHandler('folder:read-dir', '/home/user/notes')

        expect(result).toEqual(entries)
        expect(fileUtils.readDirFiltered).toHaveBeenCalledWith('/home/user/notes')
    })

    test('returns error object when readDirFiltered throws', async () => {
        fileUtils.readDirFiltered.mockRejectedValue(new Error('Permission denied'))

        const result = await invokeHandler('folder:read-dir', '/restricted')

        expect(result).toHaveProperty('error')
        expect(result.error).toContain('Permission denied')
    })
})

describe('folder:read-file', () => {
    test('returns file content for a valid .md file', async () => {
        fileUtils.readFileAsUtf8.mockResolvedValue('# Hello World\nContent here.')

        const result = await invokeHandler('folder:read-file', '/home/user/notes/readme.md')

        expect(result.success).toBe(true)
        expect(result.content).toBe('# Hello World\nContent here.')
    })

    test('returns success:false with error when file read fails', async () => {
        fileUtils.readFileAsUtf8.mockRejectedValue(new Error('File not found'))

        const result = await invokeHandler('folder:read-file', '/missing.md')

        expect(result.success).toBe(false)
        expect(result.error).toContain('File not found')
    })
})
