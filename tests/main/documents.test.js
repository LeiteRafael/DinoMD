import { invokeHandler, dialog, resetMocks } from '../../tests/__mocks__/electron.js'
vi.mock('../../src/main/store/index.js', () => ({
    getDocuments: vi.fn(() => []),
    setDocuments: vi.fn(),
    findDocumentById: vi.fn(() => null),
    findDocumentByPath: vi.fn(() => null),
    updateDocument: vi.fn(),
    removeDocumentById: vi.fn(),
}))
vi.mock('../../src/main/fs/fileUtils.js', () => ({
    fileExists: vi.fn(() => Promise.resolve(true)),
    readFileAsUtf8: vi.fn(() => Promise.resolve('# Hello')),
    writeFileUtf8: vi.fn(() => Promise.resolve()),
    renameFile: vi.fn(() => Promise.resolve()),
    watchFile: vi.fn(),
    stopWatching: vi.fn(),
}))
import * as store from '../../src/main/store/index.js'
import * as fileUtils from '../../src/main/fs/fileUtils.js'
import { registerDocumentHandlers } from '../../src/main/ipc/documents.js'
beforeAll(() => {
    registerDocumentHandlers()
})
beforeEach(() => {
    resetMocks()
    vi.clearAllMocks()
    registerDocumentHandlers()
})
describe('documents:import-files', () => {
    test('imports a valid .md file and returns it in imported[]', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/home/user/notes/readme.md'],
        })
        store.getDocuments.mockReturnValue([])
        store.findDocumentByPath.mockReturnValue(null)
        fileUtils.fileExists.mockResolvedValue(true)

        const result = await invokeHandler('documents:import-files')

        expect(result.success).toBe(true)
        expect(result.imported).toHaveLength(1)
        expect(result.imported[0].name).toBe('readme')
        expect(result.imported[0].filePath).toBe('/home/user/notes/readme.md')
        expect(result.imported[0].orderIndex).toBe(0)
        expect(result.skipped).toHaveLength(0)
        expect(store.setDocuments).toHaveBeenCalledTimes(1)
    })

    test('skips duplicate file (same path already imported)', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/home/user/notes/readme.md'],
        })
        store.findDocumentByPath.mockReturnValue({
            id: 'existing-id',
            filePath: '/home/user/notes/readme.md',
        })

        const result = await invokeHandler('documents:import-files')

        expect(result.success).toBe(true)
        expect(result.imported).toHaveLength(0)
        expect(result.skipped).toHaveLength(1)
        expect(result.skipped[0].reason).toBe('duplicate')
    })

    test('skips non-.md file with reason "invalid-type"', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/home/user/notes/image.png'],
        })

        const result = await invokeHandler('documents:import-files')

        expect(result.skipped[0].reason).toBe('invalid-type')
        expect(result.imported).toHaveLength(0)
    })

    test('skips unreadable file with reason "unreadable"', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/home/user/notes/locked.md'],
        })
        store.findDocumentByPath.mockReturnValue(null)
        fileUtils.fileExists.mockResolvedValue(false)

        const result = await invokeHandler('documents:import-files')

        expect(result.skipped[0].reason).toBe('unreadable')
    })

    test('returns empty imported[] when dialog is cancelled', async () => {
        dialog.showOpenDialog.mockResolvedValue({
            canceled: true,
            filePaths: [],
        })

        const result = await invokeHandler('documents:import-files')

        expect(result.success).toBe(true)
        expect(result.imported).toHaveLength(0)
        expect(store.setDocuments).not.toHaveBeenCalled()
    })
})
describe('documents:get-all', () => {
    test('returns documents sorted by orderIndex with computed status', async () => {
        store.getDocuments.mockReturnValue([
            {
                id: '2',
                name: 'B',
                filePath: '/b.md',
                orderIndex: 1,
                importedAt: '2026-01-01T00:00:00Z',
            },
            {
                id: '1',
                name: 'A',
                filePath: '/a.md',
                orderIndex: 0,
                importedAt: '2026-01-01T00:00:00Z',
            },
        ])
        fileUtils.fileExists.mockImplementation((p) => Promise.resolve(p === '/a.md'))

        const result = await invokeHandler('documents:get-all')

        expect(result.success).toBe(true)
        expect(result.documents[0].id).toBe('1')
        expect(result.documents[0].status).toBe('available')
        expect(result.documents[1].id).toBe('2')
        expect(result.documents[1].status).toBe('missing')
    })
})
describe('documents:reorder', () => {
    test('rewrites orderIndex values contiguously based on orderedIds', async () => {
        const docs = [
            {
                id: 'a',
                name: 'A',
                filePath: '/a.md',
                orderIndex: 0,
                importedAt: '',
            },
            {
                id: 'b',
                name: 'B',
                filePath: '/b.md',
                orderIndex: 1,
                importedAt: '',
            },
        ]
        store.getDocuments.mockReturnValue(docs)

        const result = await invokeHandler('documents:reorder', {
            orderedIds: ['b', 'a'],
        })

        expect(result.success).toBe(true)
        const saved = store.setDocuments.mock.calls[0][0]
        expect(saved[0].id).toBe('b')
        expect(saved[0].orderIndex).toBe(0)
        expect(saved[1].id).toBe('a')
        expect(saved[1].orderIndex).toBe(1)
    })

    test('returns error when orderedIds contains an unknown id', async () => {
        store.getDocuments.mockReturnValue([
            {
                id: 'a',
                name: 'A',
                filePath: '/a.md',
                orderIndex: 0,
                importedAt: '',
            },
        ])

        const result = await invokeHandler('documents:reorder', {
            orderedIds: ['a', 'unknown-id'],
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
    })
})
describe('documents:read-content', () => {
    test('returns file content for a valid document id', async () => {
        store.findDocumentById.mockReturnValue({
            id: 'doc1',
            filePath: '/readme.md',
        })
        fileUtils.readFileAsUtf8.mockResolvedValue('# My Readme\nHello world')

        const result = await invokeHandler('documents:read-content', {
            id: 'doc1',
        })

        expect(result.success).toBe(true)
        expect(result.content).toBe('# My Readme\nHello world')
    })

    test('returns error when document id is not found', async () => {
        store.findDocumentById.mockReturnValue(null)

        const result = await invokeHandler('documents:read-content', {
            id: 'nonexistent',
        })

        expect(result.success).toBe(false)
        expect(result.content).toBeNull()
        expect(result.error).toBeDefined()
    })

    test('returns error when file cannot be read', async () => {
        store.findDocumentById.mockReturnValue({
            id: 'doc1',
            filePath: '/missing.md',
        })
        fileUtils.readFileAsUtf8.mockRejectedValue(new Error('ENOENT: no such file'))

        const result = await invokeHandler('documents:read-content', {
            id: 'doc1',
        })

        expect(result.success).toBe(false)
        expect(result.content).toBeNull()
    })
})
