const DOCS_KEY = 'dinomd:docs'
const UI_KEY = 'dinomd:ui'

const SYSTEM_NAMES = new Set(['node_modules', '.git', '.DS_Store', '.hg', '.svn', 'dist', 'build'])

function isVisible(name) {
    if (name.startsWith('.')) return false
    if (SYSTEM_NAMES.has(name)) return false
    return true
}

function compareEntries(a, b) {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

let rootHandle = null
let rootVirtualPath = null

async function resolveHandleAtPath(pathStr) {
    if (!rootHandle) return null
    const isRoot = pathStr === rootVirtualPath
    if (isRoot) return rootHandle
    const relative = pathStr.slice(rootVirtualPath.length + 1).split('/')
    let current = rootHandle
    for (const part of relative) {
        if (!part) continue
        current = await current.getDirectoryHandle(part)
    }
    return current
}

async function folderOpenPicker() {
    try {
        const handle = await window.showDirectoryPicker({ mode: 'read' })
        rootHandle = handle
        rootVirtualPath = handle.name
        return rootVirtualPath
    } catch {
        return null
    }
}

async function folderReadDir(dirPath) {
    try {
        const handle = await resolveHandleAtPath(dirPath)
        if (!handle) return { error: 'Folder not opened' }
        const entries = []
        for await (const [name, entry] of handle.entries()) {
            if (!isVisible(name)) continue
            entries.push({
                name,
                isDirectory: entry.kind === 'directory',
                path: `${dirPath}/${name}`,
            })
        }
        entries.sort(compareEntries)
        return entries
    } catch (err) {
        return { error: err.message }
    }
}

async function folderReadFile(filePath) {
    try {
        const parts = filePath.split('/')
        const fileName = parts.pop()
        const dirPath = parts.join('/')
        const dirHandle = await resolveHandleAtPath(dirPath)
        const fileHandle = await dirHandle.getFileHandle(fileName)
        const file = await fileHandle.getFile()
        const content = await file.text()
        return { success: true, content }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

async function folderWriteFile(filePath, content) {
    try {
        const parts = filePath.split('/')
        const fileName = parts.pop()
        const dirPath = parts.join('/')
        const dirHandle = await resolveHandleAtPath(dirPath)
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: false })
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()
        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}
function generatePreview(content) {
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
function loadDocs() {
    try {
        return JSON.parse(localStorage.getItem(DOCS_KEY) || '[]')
    } catch {
        return []
    }
}
function saveDocs(docs) {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
}
function contentKey(id) {
    return `dinomd:content:${id}`
}
function genId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}
function pickMarkdownFiles() {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.md,text/markdown'
        input.multiple = true
        input.style.display = 'none'
        document.body.appendChild(input)
        input.addEventListener('change', () => {
            const files = Array.from(input.files || [])
            document.body.removeChild(input)
            resolve(files)
        })
        window.addEventListener(
            'focus',
            () => {
                setTimeout(() => {
                    if (!input.files || input.files.length === 0) {
                        document.body.removeChild(input)
                        resolve([])
                    }
                }, 300)
            },
            {
                once: true,
            }
        )
        input.click()
    })
}
async function importFiles() {
    const files = await pickMarkdownFiles()
    if (!files.length) {
        return {
            success: true,
            imported: [],
            skipped: [],
        }
    }
    const docs = loadDocs()
    const imported = []
    const skipped = []
    for (const file of files) {
        if (!file.name.endsWith('.md')) {
            skipped.push({
                filePath: file.name,
                reason: 'invalid-type',
            })
            continue
        }
        const filePath = file.name
        if (docs.find((d) => d.filePath === filePath)) {
            skipped.push({
                filePath,
                reason: 'duplicate',
            })
            continue
        }
        let content
        try {
            content = await file.text()
        } catch {
            skipped.push({
                filePath,
                reason: 'unreadable',
            })
            continue
        }
        const id = genId()
        const doc = {
            id,
            name: file.name.replace(/\.md$/i, ''),
            filePath,
            orderIndex: docs.length + imported.length,
            importedAt: new Date().toISOString(),
        }
        const preview = generatePreview(content)
        localStorage.setItem(contentKey(id), content)
        imported.push({
            ...doc,
            preview,
            mtimeMs: Date.now(),
        })
    }
    if (imported.length > 0) {
        saveDocs([...docs, ...imported])
    }
    return {
        success: true,
        imported,
        skipped,
    }
}
async function getAll() {
    const docs = loadDocs()
    const withStatus = docs
        .map((doc) => ({
            ...doc,
            status: localStorage.getItem(contentKey(doc.id)) !== null ? 'available' : 'missing',
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex)
    return {
        success: true,
        documents: withStatus,
    }
}
async function readContent({ id }) {
    const content = localStorage.getItem(contentKey(id))
    if (content === null) {
        return {
            success: false,
            content: null,
            error: 'Document content not found',
        }
    }
    return {
        success: true,
        content,
    }
}
async function remove({ id }) {
    let docs = loadDocs().filter((d) => d.id !== id)
    docs = docs.map((d, i) => ({
        ...d,
        orderIndex: i,
    }))
    saveDocs(docs)
    localStorage.removeItem(contentKey(id))
    return {
        success: true,
    }
}
async function reorder({ orderedIds }) {
    const docs = loadDocs()
    if (orderedIds.length !== docs.length) {
        return {
            success: false,
            error: 'orderedIds length mismatch',
        }
    }
    const reordered = orderedIds.map((id, index) => {
        const doc = docs.find((d) => d.id === id)
        if (!doc) throw new Error(`Unknown id: ${id}`)
        return {
            ...doc,
            orderIndex: index,
        }
    })
    saveDocs(reordered)
    return {
        success: true,
    }
}
async function create() {
    const id = genId()
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
}
async function save({ id, filePath, name, content }) {
    const mtimeMs = Date.now()
    try {
        if (!filePath) {
            const docs = loadDocs()
            const resolvedName = (name || 'Untitled').replace(/\.md$/i, '')
            const resolvedPath = `${resolvedName}.md`
            const newDoc = {
                id,
                name: resolvedName,
                filePath: resolvedPath,
                orderIndex: docs.length,
                importedAt: new Date().toISOString(),
                mtimeMs,
                preview: generatePreview(content ?? ''),
            }
            localStorage.setItem(contentKey(id), content ?? '')
            saveDocs([...docs, newDoc])
            return {
                success: true,
                canceled: false,
                filePath: resolvedPath,
                name: resolvedName,
                mtimeMs,
                error: null,
            }
        }
        const docs = loadDocs()
        const updated = docs.map((d) =>
            d.id === id
                ? {
                      ...d,
                      mtimeMs,
                      preview: generatePreview(content ?? ''),
                  }
                : d
        )
        localStorage.setItem(contentKey(id), content ?? '')
        saveDocs(updated)
        return {
            success: true,
            canceled: false,
            filePath,
            name: null,
            mtimeMs,
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
async function renameDoc({ id, newName }) {
    try {
        const trimmed = (newName ?? '').trim()
        if (!trimmed)
            return {
                success: false,
                newFilePath: null,
                error: 'Invalid document name',
            }
        const docs = loadDocs()
        const newFilePath = `${trimmed}.md`
        const updated = docs.map((d) =>
            d.id === id
                ? {
                      ...d,
                      name: trimmed,
                      filePath: newFilePath,
                  }
                : d
        )
        saveDocs(updated)
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
async function deleteDoc({ id }) {
    try {
        const docs = loadDocs()
            .filter((d) => d.id !== id)
            .map((d, i) => ({
                ...d,
                orderIndex: i,
            }))
        saveDocs(docs)
        localStorage.removeItem(contentKey(id))
        return {
            success: true,
            canForceDelete: false,
            error: null,
        }
    } catch (err) {
        return {
            success: false,
            canForceDelete: false,
            error: err.message,
        }
    }
}
function loadUiState() {
    try {
        return JSON.parse(localStorage.getItem(UI_KEY) || 'null')
    } catch {
        return null
    }
}
async function getSidebarState() {
    const stored = loadUiState()
    return {
        open: stored?.open ?? true,
        widthPercent: stored?.widthPercent ?? 22,
        rootFolderPath: stored?.rootFolderPath ?? null,
    }
}
async function setSidebarState(patch) {
    const current = await getSidebarState()
    const next = { ...current }
    if (patch && typeof patch.open === 'boolean') next.open = patch.open
    if (patch && typeof patch.widthPercent === 'number') {
        next.widthPercent = Math.min(35, Math.max(15, patch.widthPercent))
    }
    if (patch && (typeof patch.rootFolderPath === 'string' || patch.rootFolderPath === null)) {
        next.rootFolderPath = patch.rootFolderPath
    }
    localStorage.setItem(UI_KEY, JSON.stringify(next))
    return { success: true }
}
export const api = {
    importFiles,
    getAll,
    readContent,
    remove,
    reorder,
    create,
    save,
    rename: renameDoc,
    delete: deleteDoc,
    onFileChangedExternally: () => undefined,
    removeFileChangedListener: () => undefined,
    folder: {
        openPicker: folderOpenPicker,
        readDir: folderReadDir,
        readFile: folderReadFile,
        writeFile: folderWriteFile,
    },
    ui: {
        getSidebarState,
        setSidebarState,
    },
}
