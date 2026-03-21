import { describe, test, expect, beforeEach } from 'vitest'

describe('api module — fallback when window.api is absent', () => {
    let api

    beforeEach(async () => {
        const mod = await import('../../src/renderer/src/services/api.js')
        api = mod.api
    })

    test('importFiles resolves with error when window.api is not available', async () => {
        const result = await api.importFiles()

        expect(result.success).toBe(false)
        expect(result.imported).toEqual([])
        expect(result.skipped).toEqual([])
    })

    test('getAll resolves with empty documents when window.api is not available', async () => {
        const result = await api.getAll()

        expect(result.success).toBe(false)
        expect(result.documents).toEqual([])
    })

    test('readContent resolves with null content when window.api is not available', async () => {
        const result = await api.readContent({ id: 'doc-1' })

        expect(result.success).toBe(false)
        expect(result.content).toBeNull()
    })

    test('save resolves with failure shape when window.api is not available', async () => {
        const result = await api.save({ id: 'doc-1', content: '# Hi' })

        expect(result.success).toBe(false)
        expect(result.filePath).toBeNull()
    })

    test('create resolves with null draft when window.api is not available', async () => {
        const result = await api.create()

        expect(result.success).toBe(false)
        expect(result.draft).toBeNull()
    })

    test('delete resolves with failure when window.api is not available', async () => {
        const result = await api.delete({ id: 'doc-1' })

        expect(result.success).toBe(false)
    })

    test('reorder resolves with failure when window.api is not available', async () => {
        const result = await api.reorder({ ids: [] })

        expect(result.success).toBe(false)
    })

    test('rename resolves with failure when window.api is not available', async () => {
        const result = await api.rename({ id: 'doc-1', name: 'New Name' })

        expect(result.success).toBe(false)
        expect(result.newFilePath).toBeNull()
    })

    test('remove resolves with failure when window.api is not available', async () => {
        const result = await api.remove({ id: 'doc-1' })

        expect(result.success).toBe(false)
    })

    test('folder.readDir resolves with empty array when window.api is not available', async () => {
        const result = await api.folder.readDir('/some/path')

        expect(result).toEqual([])
    })

    test('folder.readFile resolves with failure when window.api is not available', async () => {
        const result = await api.folder.readFile('/some/file.md')

        expect(result.success).toBe(false)
    })

    test('folder.writeFile resolves with failure when window.api is not available', async () => {
        const result = await api.folder.writeFile('/some/file.md', '# Content')

        expect(result.success).toBe(false)
    })

    test('folder.openPicker resolves with null when window.api is not available', async () => {
        const result = await api.folder.openPicker()

        expect(result).toBeNull()
    })

    test('ui.getSidebarState resolves with default state when window.api is not available', async () => {
        const result = await api.ui.getSidebarState()

        expect(result.open).toBe(true)
        expect(result.widthPercent).toBe(22)
        expect(result.rootFolderPath).toBeNull()
    })

    test('ui.setSidebarState resolves with failure when window.api is not available', async () => {
        const result = await api.ui.setSidebarState({ open: false })

        expect(result.success).toBe(false)
    })
})

describe('api module — onFileChangedExternally and removeFileChangedListener', () => {
    test('onFileChangedExternally returns undefined when window.api is absent', async () => {
        const { api } = await import('../../src/renderer/src/services/api.js')

        const result = api.onFileChangedExternally(() => {})

        expect(result).toBeUndefined()
    })

    test('removeFileChangedListener returns undefined when window.api is absent', async () => {
        const { api } = await import('../../src/renderer/src/services/api.js')

        const result = api.removeFileChangedListener()

        expect(result).toBeUndefined()
    })
})
