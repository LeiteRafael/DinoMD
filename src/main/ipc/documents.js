import { ipcMain, dialog, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import {
    getDocuments,
    setDocuments,
    findDocumentById,
    findDocumentByPath,
    updateDocument,
    removeDocumentById,
} from '../store/index.js'
import {
    fileExists,
    readFileAsUtf8,
    writeFileUtf8,
    renameFile,
    watchFile,
    stopWatching,
} from '../fs/fileUtils.js'
import { promises as fs } from 'fs'
import { basename, dirname, join } from 'path'
export function generatePreview(content) {
    if (!content || typeof content !== 'string') return ''
    const stripped = content
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/[*_~`>#\-+|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return stripped.length > 150 ? stripped.slice(0, 150) + '\u2026' : stripped
}
let _mainWindow = null
export function setMainWindow(win) {
    _mainWindow = win
}
export function registerDocumentHandlers() {
    ipcMain.handle('documents:import-files', handleImportFiles)
    ipcMain.handle('documents:get-all', handleGetAll)
    ipcMain.handle('documents:remove', handleRemove)
    ipcMain.handle('documents:reorder', handleReorder)
    ipcMain.handle('documents:read-content', handleReadContent)
    ipcMain.handle('documents:create', handleCreate)
    ipcMain.handle('documents:save', handleSave)
    ipcMain.handle('documents:rename', handleRename)
    ipcMain.handle('documents:delete', handleDelete)
}
async function handleImportFiles() {
    try {
        const result = await dialog.showOpenDialog({
            title: 'Import Markdown Files',
            filters: [
                {
                    name: 'Markdown',
                    extensions: ['md'],
                },
            ],
            properties: ['openFile', 'multiSelections'],
        })
        if (result.canceled || !result.filePaths.length) {
            return {
                success: true,
                imported: [],
                skipped: [],
                error: null,
            }
        }
        const existing = getDocuments()
        const imported = []
        const skipped = []
        for (const filePath of result.filePaths) {
            if (!filePath.toLowerCase().endsWith('.md')) {
                skipped.push({
                    filePath,
                    reason: 'invalid-type',
                })
                continue
            }
            if (findDocumentByPath(filePath)) {
                skipped.push({
                    filePath,
                    reason: 'duplicate',
                })
                continue
            }
            const readable = await fileExists(filePath)
            if (!readable) {
                skipped.push({
                    filePath,
                    reason: 'unreadable',
                })
                continue
            }
            const name = filePath.split(/[\\/]/).pop().replace(/\.md$/i, '')
            const doc = {
                id: uuidv4(),
                name,
                filePath,
                orderIndex: existing.length + imported.length,
                importedAt: new Date().toISOString(),
            }
            let preview = ''
            try {
                const rawContent = await readFileAsUtf8(filePath)
                preview = generatePreview(rawContent)
            } catch {}
            imported.push({
                ...doc,
                preview,
            })
        }
        if (imported.length > 0) {
            setDocuments([...existing, ...imported])
        }
        return {
            success: true,
            imported,
            skipped,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            imported: [],
            skipped: [],
            error: err.message,
        }
    }
}
async function handleGetAll() {
    try {
        const docs = getDocuments()
        const withStatus = await Promise.all(
            docs.map(async (doc) => ({
                ...doc,
                status: (await fileExists(doc.filePath)) ? 'available' : 'missing',
            }))
        )
        withStatus.sort((a, b) => a.orderIndex - b.orderIndex)
        return {
            success: true,
            documents: withStatus,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            documents: [],
            error: err.message,
        }
    }
}
async function handleRemove(_event, { id }) {
    try {
        if (!id)
            return {
                success: false,
                error: 'Missing id',
            }
        const docs = getDocuments().filter((doc) => doc.id !== id)
        docs.forEach((doc, i) => {
            doc.orderIndex = i
        })
        setDocuments(docs)
        return {
            success: true,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            error: err.message,
        }
    }
}
async function handleReorder(_event, { orderedIds }) {
    try {
        if (!Array.isArray(orderedIds)) {
            return {
                success: false,
                error: 'orderedIds must be an array',
            }
        }
        const docs = getDocuments()
        const knownIds = new Set(docs.map((d) => d.id))
        if (orderedIds.length !== docs.length || !orderedIds.every((id) => knownIds.has(id))) {
            return {
                success: false,
                error: 'orderedIds does not match stored document IDs',
            }
        }
        const idToDoc = Object.fromEntries(docs.map((d) => [d.id, d]))
        const reordered = orderedIds.map((id, index) => ({
            ...idToDoc[id],
            orderIndex: index,
        }))
        setDocuments(reordered)
        return {
            success: true,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            error: err.message,
        }
    }
}
async function handleReadContent(_event, { id }) {
    try {
        if (!id)
            return {
                success: false,
                content: null,
                error: 'Missing id',
            }
        const doc = findDocumentById(id)
        if (!doc)
            return {
                success: false,
                content: null,
                error: 'Document not found',
            }
        const content = await readFileAsUtf8(doc.filePath)
        watchFile(doc.filePath, async (changedPath) => {
            try {
                const stat = await fs.stat(changedPath)
                if (_mainWindow && !_mainWindow.isDestroyed()) {
                    _mainWindow.webContents.send('file:changed-externally', {
                        id: doc.id,
                        filePath: changedPath,
                        mtimeMs: stat.mtimeMs,
                    })
                }
            } catch {}
        })
        return {
            success: true,
            content,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            content: null,
            error: err.message,
        }
    }
}
async function handleCreate() {
    try {
        const id = uuidv4()
        return {
            success: true,
            draft: {
                id,
                name: 'Untitled',
                filePath: null,
                isDraft: true,
            },
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            draft: null,
            error: err.message,
        }
    }
}
async function handleSave(_event, { id, filePath, name, content }) {
    try {
        if (!id)
            return {
                success: false,
                canceled: false,
                filePath: null,
                name: null,
                mtimeMs: null,
                error: 'Missing id',
            }
        if (!filePath) {
            const { canceled, filePath: chosenPath } = await dialog.showSaveDialog({
                defaultPath: `${name || 'Untitled'}.md`,
                filters: [
                    {
                        name: 'Markdown',
                        extensions: ['md'],
                    },
                ],
            })
            if (canceled || !chosenPath) {
                return {
                    success: true,
                    canceled: true,
                    filePath: null,
                    name: null,
                    mtimeMs: null,
                    error: null,
                }
            }
            await writeFileUtf8(chosenPath, content)
            const stat = await fs.stat(chosenPath)
            const resolvedName = basename(chosenPath).replace(/\.md$/i, '')
            const docs = getDocuments()
            const newDoc = {
                id,
                name: resolvedName,
                filePath: chosenPath,
                orderIndex: docs.length,
                importedAt: new Date().toISOString(),
                mtimeMs: stat.mtimeMs,
                preview: generatePreview(content),
            }
            setDocuments([...docs, newDoc])
            return {
                success: true,
                canceled: false,
                filePath: chosenPath,
                name: resolvedName,
                mtimeMs: stat.mtimeMs,
                error: null,
            }
        }
        await writeFileUtf8(filePath, content)
        const stat = await fs.stat(filePath)
        updateDocument(id, {
            mtimeMs: stat.mtimeMs,
            preview: generatePreview(content),
        })
        return {
            success: true,
            canceled: false,
            filePath,
            name: null,
            mtimeMs: stat.mtimeMs,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            canceled: false,
            filePath: null,
            name: null,
            mtimeMs: null,
            error: err.message,
        }
    }
}
async function handleRename(_event, { id, newName }) {
    try {
        if (!id)
            return {
                success: false,
                newFilePath: null,
                error: 'Missing id',
            }
        if (!newName || newName.trim() === '')
            return {
                success: false,
                newFilePath: null,
                error: 'Invalid document name',
            }
        if (/[/\\]/.test(newName))
            return {
                success: false,
                newFilePath: null,
                error: 'Invalid document name',
            }
        const doc = findDocumentById(id)
        if (!doc)
            return {
                success: false,
                newFilePath: null,
                error: 'Document not found',
            }
        const dir = dirname(doc.filePath)
        const newFilePath = join(dir, `${newName.trim()}.md`)
        if (await fileExists(newFilePath)) {
            return {
                success: false,
                newFilePath: null,
                error: 'A document with that name already exists.',
            }
        }
        await renameFile(doc.filePath, newFilePath)
        updateDocument(id, {
            name: newName.trim(),
            filePath: newFilePath,
        })
        return {
            success: true,
            newFilePath,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            newFilePath: null,
            error: err.message,
        }
    }
}
async function handleDelete(_event, { id, force = false }) {
    try {
        if (!id)
            return {
                success: false,
                canForceDelete: false,
                error: 'Missing id',
            }
        const doc = findDocumentById(id)
        if (!doc)
            return {
                success: false,
                canForceDelete: false,
                error: 'Document not found',
            }
        const exists = await fileExists(doc.filePath)
        if (!exists) {
            stopWatching()
            removeDocumentById(id)
            return {
                success: true,
                canForceDelete: false,
                error: null,
            }
        }
        if (force) {
            await fs.unlink(doc.filePath)
            stopWatching()
            removeDocumentById(id)
            return {
                success: true,
                canForceDelete: false,
                error: null,
            }
        }
        try {
            await shell.trashItem(doc.filePath)
            stopWatching()
            removeDocumentById(id)
            return {
                success: true,
                canForceDelete: false,
                error: null,
            }
        } catch (trashErr) {
            return {
                success: false,
                canForceDelete: true,
                error: trashErr.message,
            }
        }
    } catch (err) {
        return {
            success: false,
            canForceDelete: false,
            error: err.message,
        }
    }
}
