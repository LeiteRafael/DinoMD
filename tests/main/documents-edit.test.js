// Tests for feature-002 IPC handlers: documents:create, documents:save,
// documents:rename, documents:delete
// Electron is mocked via jest.config.js moduleNameMapper → tests/__mocks__/electron.js

const { invokeHandler, dialog, shell, resetMocks } = require('../../tests/__mocks__/electron.js')

jest.mock('../../src/main/store/index.js', () => ({
  getDocuments: jest.fn(() => []),
  setDocuments: jest.fn(),
  findDocumentById: jest.fn(() => null),
  findDocumentByPath: jest.fn(() => null),
  updateDocument: jest.fn(),
  removeDocumentById: jest.fn()
}))

jest.mock('../../src/main/fs/fileUtils.js', () => ({
  fileExists: jest.fn(() => Promise.resolve(true)),
  readFileAsUtf8: jest.fn(() => Promise.resolve('# Hello')),
  writeFileUtf8: jest.fn(() => Promise.resolve()),
  renameFile: jest.fn(() => Promise.resolve()),
  watchFile: jest.fn(),
  stopWatching: jest.fn()
}))

// Mock fs.promises.stat and unlink (called directly in handleSave / handleDelete)
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(() => Promise.resolve({ mtimeMs: 1700000000000 })),
    unlink: jest.fn(() => Promise.resolve())
  }
}))

const store = require('../../src/main/store/index.js')
const fileUtils = require('../../src/main/fs/fileUtils.js')
const fs = require('fs')

// Import AFTER mocks are in place
const { registerDocumentHandlers } = require('../../src/main/ipc/documents.js')

beforeAll(() => {
  registerDocumentHandlers()
})

beforeEach(() => {
  resetMocks()
  registerDocumentHandlers()
  // Restore default mock return values after clearAllMocks
  // (clearAllMocks preserves implementations; reset everything to known-good state)
  store.getDocuments.mockReturnValue([])
  fileUtils.fileExists.mockResolvedValue(true)
  fileUtils.writeFileUtf8.mockResolvedValue(undefined)
  fileUtils.renameFile.mockResolvedValue(undefined)
  fs.promises.stat.mockResolvedValue({ mtimeMs: 1700000000000 })
  fs.promises.unlink.mockResolvedValue(undefined)
  shell.trashItem.mockResolvedValue(undefined)
})

// ── documents:create ─────────────────────────────────────────────────────────
describe('documents:create', () => {
  test('returns a draft descriptor with a UUID id and isDraft=true', async () => {
    const result = await invokeHandler('documents:create')

    expect(result.success).toBe(true)
    expect(result.draft).toBeDefined()
    expect(result.draft.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(result.draft.name).toBe('Untitled')
    expect(result.draft.filePath).toBeNull()
    expect(result.draft.isDraft).toBe(true)
    expect(result.error).toBeNull()
  })

  test('each call returns a unique id', async () => {
    const r1 = await invokeHandler('documents:create')
    const r2 = await invokeHandler('documents:create')
    expect(r1.draft.id).not.toBe(r2.draft.id)
  })
})

// ── documents:save — new draft ───────────────────────────────────────────────
describe('documents:save — new draft', () => {
  const draftPayload = {
    id: 'draft-001',
    filePath: null,
    name: 'Untitled',
    content: '# Hello World'
  }

  test('opens save dialog, writes file, creates store entry, and returns resolved path', async () => {
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/notes/my-doc.md' })
    store.getDocuments.mockReturnValue([])

    const result = await invokeHandler('documents:save', draftPayload)

    expect(dialog.showSaveDialog).toHaveBeenCalledTimes(1)
    expect(fileUtils.writeFileUtf8).toHaveBeenCalledWith('/notes/my-doc.md', '# Hello World')
    expect(store.setDocuments).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(result.canceled).toBe(false)
    expect(result.filePath).toBe('/notes/my-doc.md')
    expect(result.name).toBe('my-doc')
    expect(result.mtimeMs).toBe(1700000000000)
    expect(result.error).toBeNull()
  })

  test('returns canceled=true without writing when user dismisses the dialog', async () => {
    dialog.showSaveDialog.mockResolvedValue({ canceled: true, filePath: undefined })

    const result = await invokeHandler('documents:save', draftPayload)

    expect(result.success).toBe(true)
    expect(result.canceled).toBe(true)
    expect(result.filePath).toBeNull()
    expect(fileUtils.writeFileUtf8).not.toHaveBeenCalled()
    expect(store.setDocuments).not.toHaveBeenCalled()
  })

  test('strips .md extension from filename to derive document name', async () => {
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/notes/my-notes.md' })
    store.getDocuments.mockReturnValue([])

    const result = await invokeHandler('documents:save', draftPayload)

    expect(result.name).toBe('my-notes')
  })

  test('returns success:false when writeFileUtf8 throws', async () => {
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/notes/my-doc.md' })
    fileUtils.writeFileUtf8.mockRejectedValue(new Error('EACCES: permission denied'))

    const result = await invokeHandler('documents:save', draftPayload)

    expect(result.success).toBe(false)
    expect(result.error).toContain('EACCES')
  })
})

// ── documents:save — existing document ──────────────────────────────────────
describe('documents:save — existing document', () => {
  const existingPayload = {
    id: 'doc-001',
    filePath: '/notes/my-doc.md',
    name: 'my-doc',
    content: '# Updated content'
  }

  test('writes to the existing path without opening a dialog', async () => {
    const result = await invokeHandler('documents:save', existingPayload)

    expect(dialog.showSaveDialog).not.toHaveBeenCalled()
    expect(fileUtils.writeFileUtf8).toHaveBeenCalledWith('/notes/my-doc.md', '# Updated content')
    expect(store.updateDocument).toHaveBeenCalledWith('doc-001', { mtimeMs: 1700000000000 })
    expect(result.success).toBe(true)
    expect(result.canceled).toBe(false)
    expect(result.filePath).toBe('/notes/my-doc.md')
    expect(result.mtimeMs).toBe(1700000000000)
  })

  test('allows saving empty content (zero-byte file)', async () => {
    const result = await invokeHandler('documents:save', { ...existingPayload, content: '' })

    expect(result.success).toBe(true)
    expect(fileUtils.writeFileUtf8).toHaveBeenCalledWith('/notes/my-doc.md', '')
  })

  test('returns success:false on write error', async () => {
    fileUtils.writeFileUtf8.mockRejectedValue(new Error('No space left on device'))

    const result = await invokeHandler('documents:save', existingPayload)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No space left')
  })

  test('returns error when id is missing', async () => {
    const result = await invokeHandler('documents:save', { ...existingPayload, id: undefined })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// ── documents:rename ─────────────────────────────────────────────────────────
describe('documents:rename', () => {
  const existingDoc = { id: 'doc-001', name: 'old-name', filePath: '/notes/old-name.md' }

  beforeEach(() => {
    store.findDocumentById.mockReturnValue(existingDoc)
    fileUtils.fileExists.mockResolvedValue(false) // target name does not exist
  })

  test('renames file on disk and updates store entry', async () => {
    const result = await invokeHandler('documents:rename', { id: 'doc-001', newName: 'new-name' })

    expect(fileUtils.renameFile).toHaveBeenCalledWith('/notes/old-name.md', '/notes/new-name.md')
    expect(store.updateDocument).toHaveBeenCalledWith('doc-001', {
      name: 'new-name',
      filePath: '/notes/new-name.md'
    })
    expect(result.success).toBe(true)
    expect(result.newFilePath).toBe('/notes/new-name.md')
    expect(result.error).toBeNull()
  })

  test('returns error when target name already exists', async () => {
    fileUtils.fileExists.mockResolvedValue(true) // conflict!

    const result = await invokeHandler('documents:rename', { id: 'doc-001', newName: 'existing-name' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/already exists/i)
    expect(fileUtils.renameFile).not.toHaveBeenCalled()
  })

  test('returns error when newName is empty', async () => {
    const result = await invokeHandler('documents:rename', { id: 'doc-001', newName: '' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid/i)
  })

  test('returns error when newName contains a slash', async () => {
    const result = await invokeHandler('documents:rename', { id: 'doc-001', newName: 'path/traversal' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid/i)
  })

  test('returns error when document is not found in store', async () => {
    store.findDocumentById.mockReturnValue(null)

    const result = await invokeHandler('documents:rename', { id: 'unknown', newName: 'new-name' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not found/i)
  })

  test('trims whitespace from newName before renaming', async () => {
    const result = await invokeHandler('documents:rename', { id: 'doc-001', newName: '  trimmed  ' })

    expect(result.success).toBe(true)
    expect(fileUtils.renameFile).toHaveBeenCalledWith('/notes/old-name.md', '/notes/trimmed.md')
    expect(store.updateDocument).toHaveBeenCalledWith('doc-001', {
      name: 'trimmed',
      filePath: '/notes/trimmed.md'
    })
  })
})

// ── documents:delete ─────────────────────────────────────────────────────────
describe('documents:delete', () => {
  const existingDoc = { id: 'doc-001', name: 'my-doc', filePath: '/notes/my-doc.md' }

  beforeEach(() => {
    store.findDocumentById.mockReturnValue(existingDoc)
    fileUtils.fileExists.mockResolvedValue(true)
    shell.trashItem.mockResolvedValue(undefined)
  })

  test('moves file to trash and removes from store', async () => {
    const result = await invokeHandler('documents:delete', { id: 'doc-001' })

    expect(shell.trashItem).toHaveBeenCalledWith('/notes/my-doc.md')
    expect(fileUtils.stopWatching).toHaveBeenCalled()
    expect(store.removeDocumentById).toHaveBeenCalledWith('doc-001')
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  test('uses fs.unlink when force=true instead of trashItem', async () => {
    const result = await invokeHandler('documents:delete', { id: 'doc-001', force: true })

    expect(shell.trashItem).not.toHaveBeenCalled()
    expect(fs.promises.unlink).toHaveBeenCalledWith('/notes/my-doc.md')
    expect(store.removeDocumentById).toHaveBeenCalledWith('doc-001')
    expect(result.success).toBe(true)
  })

  test('returns canForceDelete=true when trashItem fails', async () => {
    shell.trashItem.mockRejectedValue(new Error('No trash on headless Linux'))

    const result = await invokeHandler('documents:delete', { id: 'doc-001' })

    expect(result.success).toBe(false)
    expect(result.canForceDelete).toBe(true)
    expect(result.error).toContain('trash')
  })

  test('removes stale store entry without error when file is missing on disk', async () => {
    fileUtils.fileExists.mockResolvedValue(false) // file already gone

    const result = await invokeHandler('documents:delete', { id: 'doc-001' })

    expect(shell.trashItem).not.toHaveBeenCalled()
    expect(store.removeDocumentById).toHaveBeenCalledWith('doc-001')
    expect(result.success).toBe(true)
  })

  test('returns error when document id is not found in store', async () => {
    store.findDocumentById.mockReturnValue(null)

    const result = await invokeHandler('documents:delete', { id: 'unknown' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not found/i)
    expect(shell.trashItem).not.toHaveBeenCalled()
  })

  test('returns error when id is missing', async () => {
    const result = await invokeHandler('documents:delete', { id: undefined })

    expect(result.success).toBe(false)
  })
})
