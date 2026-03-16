import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
jest.mock('../../src/renderer/src/services/api.js', () => ({
    api: {
        create: jest.fn(),
        readContent: jest.fn(),
        save: jest.fn(),
        rename: jest.fn(),
        delete: jest.fn(),
        onFileChangedExternally: jest.fn(),
        removeFileChangedListener: jest.fn(),
    },
}))
const { api } = require('../../src/renderer/src/services/api.js')
const useEditorModule = require('../../src/renderer/src/hooks/useEditor.js')
const useEditor = useEditorModule.default
beforeEach(() => {
    jest.clearAllMocks()
})
describe('openNew', () => {
    test('creates a draft session with empty content and isDraft=true', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        expect(result.current.session.documentId).toBe('draft-001')
        expect(result.current.session.name).toBe('Untitled')
        expect(result.current.session.filePath).toBeNull()
        expect(result.current.session.content).toBe('')
        expect(result.current.session.isDraft).toBe(true)
    })
    test('isDirty is false after openNew (content equals savedContent)', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        expect(result.current.isDirty).toBe(false)
    })
    test('sets error state when api.create fails', async () => {
        api.create.mockResolvedValue({
            success: false,
            draft: null,
            error: 'API error',
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        expect(result.current.error).toBe('API error')
    })
})
describe('openExisting', () => {
    const doc = {
        id: 'doc-001',
        name: 'My Notes',
        filePath: '/notes/my-notes.md',
        mtimeMs: 1700000,
    }
    test('loads content from disk and seeds savedContent', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '# My Notes\nHello',
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting(doc)
        })
        expect(result.current.session.documentId).toBe('doc-001')
        expect(result.current.session.content).toBe('# My Notes\nHello')
        expect(result.current.session.savedContent).toBe('# My Notes\nHello')
        expect(result.current.session.name).toBe('My Notes')
        expect(result.current.session.isDraft).toBe(false)
    })
    test('isDirty is false immediately after openExisting', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '# Loaded',
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting(doc)
        })
        expect(result.current.isDirty).toBe(false)
    })
})
describe('isDirty', () => {
    async function openedHook() {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        const r = renderHook(() => useEditor())
        await act(async () => {
            await r.result.current.openNew()
        })
        return r
    }
    test('becomes true after updateContent changes content', async () => {
        const { result } = await openedHook()
        act(() => {
            result.current.updateContent('some new content')
        })
        expect(result.current.isDirty).toBe(true)
    })
    test('becomes false again when content is reset to savedContent', async () => {
        const { result } = await openedHook()
        act(() => {
            result.current.updateContent('changed')
        })
        expect(result.current.isDirty).toBe(true)
        act(() => {
            result.current.updateContent('')
        })
        expect(result.current.isDirty).toBe(false)
    })
})
describe('save', () => {
    test('saves a draft: updates session with resolved path/name and clears isDraft', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        api.save.mockResolvedValue({
            success: true,
            canceled: false,
            filePath: '/notes/doc.md',
            name: 'doc',
            mtimeMs: 1700000,
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        act(() => {
            result.current.updateContent('# New doc')
        })
        let saveResult
        await act(async () => {
            saveResult = await result.current.save()
        })
        expect(api.save).toHaveBeenCalledWith({
            id: 'draft-001',
            filePath: null,
            name: 'Untitled',
            content: '# New doc',
        })
        expect(saveResult.saved).toBe(true)
        expect(result.current.session.filePath).toBe('/notes/doc.md')
        expect(result.current.session.name).toBe('doc')
        expect(result.current.session.isDraft).toBe(false)
        expect(result.current.isDirty).toBe(false)
    })
    test('returns canceled=true without changing state when dialog is dismissed', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        api.save.mockResolvedValue({
            success: true,
            canceled: true,
            filePath: null,
            name: null,
            mtimeMs: null,
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        act(() => {
            result.current.updateContent('something')
        })
        let saveResult
        await act(async () => {
            saveResult = await result.current.save()
        })
        expect(saveResult.saved).toBe(false)
        expect(saveResult.canceled).toBe(true)
        expect(result.current.session.isDraft).toBe(true)
        expect(result.current.isDirty).toBe(true)
    })
    test('sets error state and returns saved=false when api.save reports failure', async () => {
        api.create.mockResolvedValue({
            success: true,
            draft: {
                id: 'draft-001',
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        })
        api.save.mockResolvedValue({
            success: false,
            canceled: false,
            error: 'EACCES: permission denied',
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openNew()
        })
        let saveResult
        await act(async () => {
            saveResult = await result.current.save()
        })
        expect(saveResult.saved).toBe(false)
        expect(result.current.error).toContain('EACCES')
    })
})
describe('discard', () => {
    test('resets content to savedContent, making isDirty false', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '# Original',
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'Doc',
                filePath: '/doc.md',
                mtimeMs: null,
            })
        })
        act(() => {
            result.current.updateContent('# Changed')
        })
        expect(result.current.isDirty).toBe(true)
        act(() => {
            result.current.discard()
        })
        expect(result.current.session.content).toBe('# Original')
        expect(result.current.isDirty).toBe(false)
    })
})
describe('rename', () => {
    test('updates session name and filePath on success', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '# Doc',
            error: null,
        })
        api.rename.mockResolvedValue({
            success: true,
            newFilePath: '/notes/new-name.md',
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'old-name',
                filePath: '/notes/old-name.md',
                mtimeMs: null,
            })
        })
        await act(async () => {
            await result.current.rename('new-name')
        })
        expect(result.current.session.name).toBe('new-name')
        expect(result.current.session.filePath).toBe('/notes/new-name.md')
    })
    test('sets error state when rename fails (e.g. name conflict)', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '# Doc',
            error: null,
        })
        api.rename.mockResolvedValue({
            success: false,
            newFilePath: null,
            error: 'A document with that name already exists.',
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'old-name',
                filePath: '/notes/old-name.md',
                mtimeMs: null,
            })
        })
        await act(async () => {
            await result.current.rename('conflicting-name')
        })
        expect(result.current.error).toMatch(/already exists/i)
        expect(result.current.session.name).toBe('old-name')
    })
})
describe('deleteDocument', () => {
    test('calls api.delete with the document id', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '',
            error: null,
        })
        api.delete.mockResolvedValue({
            success: true,
            canForceDelete: false,
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'My Doc',
                filePath: '/doc.md',
                mtimeMs: null,
            })
        })
        let deleteResult
        await act(async () => {
            deleteResult = await result.current.deleteDocument()
        })
        expect(api.delete).toHaveBeenCalledWith({
            id: 'doc-001',
            force: false,
        })
        expect(deleteResult.success).toBe(true)
    })
    test('passes force=true to api.delete when called with true', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '',
            error: null,
        })
        api.delete.mockResolvedValue({
            success: true,
            canForceDelete: false,
            error: null,
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'My Doc',
                filePath: '/doc.md',
                mtimeMs: null,
            })
        })
        await act(async () => {
            await result.current.deleteDocument(true)
        })
        expect(api.delete).toHaveBeenCalledWith({
            id: 'doc-001',
            force: true,
        })
    })
    test('sets error state when delete fails', async () => {
        api.readContent.mockResolvedValue({
            success: true,
            content: '',
            error: null,
        })
        api.delete.mockResolvedValue({
            success: false,
            canForceDelete: true,
            error: 'Trash unavailable',
        })
        const { result } = renderHook(() => useEditor())
        await act(async () => {
            await result.current.openExisting({
                id: 'doc-001',
                name: 'My Doc',
                filePath: '/doc.md',
                mtimeMs: null,
            })
        })
        await act(async () => {
            await result.current.deleteDocument()
        })
        expect(result.current.error).toContain('Trash unavailable')
    })
})
