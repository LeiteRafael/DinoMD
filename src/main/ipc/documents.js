import { ipcMain, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import {
  getDocuments,
  setDocuments,
  findDocumentById,
  findDocumentByPath
} from '../store/index.js'
import { fileExists, readFileAsUtf8 } from '../fs/fileUtils.js'

export function registerDocumentHandlers() {
  ipcMain.handle('documents:import-files', handleImportFiles)
  ipcMain.handle('documents:get-all', handleGetAll)
  ipcMain.handle('documents:remove', handleRemove)
  ipcMain.handle('documents:reorder', handleReorder)
  ipcMain.handle('documents:read-content', handleReadContent)
}

// ── documents:import-files ──────────────────────────────────────────────────
async function handleImportFiles() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import Markdown Files',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || !result.filePaths.length) {
      return { success: true, imported: [], skipped: [], error: null }
    }

    const existing = getDocuments()
    const imported = []
    const skipped = []

    for (const filePath of result.filePaths) {
      // Check file extension
      if (!filePath.toLowerCase().endsWith('.md')) {
        skipped.push({ filePath, reason: 'invalid-type' })
        continue
      }

      // Check duplicate
      if (findDocumentByPath(filePath)) {
        skipped.push({ filePath, reason: 'duplicate' })
        continue
      }

      // Check readability
      const readable = await fileExists(filePath)
      if (!readable) {
        skipped.push({ filePath, reason: 'unreadable' })
        continue
      }

      const name = filePath
        .split(/[\\/]/)
        .pop()
        .replace(/\.md$/i, '')

      const doc = {
        id: uuidv4(),
        name,
        filePath,
        orderIndex: existing.length + imported.length,
        importedAt: new Date().toISOString()
      }

      imported.push(doc)
    }

    if (imported.length > 0) {
      setDocuments([...existing, ...imported])
    }

    return { success: true, imported, skipped, error: null }
  } catch (err) {
    return { success: false, imported: [], skipped: [], error: err.message }
  }
}

// ── documents:get-all ───────────────────────────────────────────────────────
async function handleGetAll() {
  try {
    const docs = getDocuments()

    const withStatus = await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        status: (await fileExists(doc.filePath)) ? 'available' : 'missing'
      }))
    )

    withStatus.sort((a, b) => a.orderIndex - b.orderIndex)
    return { success: true, documents: withStatus, error: null }
  } catch (err) {
    return { success: false, documents: [], error: err.message }
  }
}

// ── documents:remove ────────────────────────────────────────────────────────
async function handleRemove(_event, { id }) {
  try {
    if (!id) return { success: false, error: 'Missing id' }

    const docs = getDocuments().filter((doc) => doc.id !== id)
    // Rewrite contiguous orderIndex values
    docs.forEach((doc, i) => { doc.orderIndex = i })
    setDocuments(docs)
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ── documents:reorder ───────────────────────────────────────────────────────
async function handleReorder(_event, { orderedIds }) {
  try {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array' }
    }

    const docs = getDocuments()
    const knownIds = new Set(docs.map((d) => d.id))

    if (
      orderedIds.length !== docs.length ||
      !orderedIds.every((id) => knownIds.has(id))
    ) {
      return { success: false, error: 'orderedIds does not match stored document IDs' }
    }

    const idToDoc = Object.fromEntries(docs.map((d) => [d.id, d]))
    const reordered = orderedIds.map((id, index) => ({
      ...idToDoc[id],
      orderIndex: index
    }))

    setDocuments(reordered)
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ── documents:read-content ──────────────────────────────────────────────────
async function handleReadContent(_event, { id }) {
  try {
    if (!id) return { success: false, content: null, error: 'Missing id' }

    const doc = findDocumentById(id)
    if (!doc) return { success: false, content: null, error: 'Document not found' }

    const content = await readFileAsUtf8(doc.filePath)
    return { success: true, content, error: null }
  } catch (err) {
    return { success: false, content: null, error: err.message }
  }
}
