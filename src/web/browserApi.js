/**
 * Browser adapter — mirrors the window.api.documents interface from the Electron
 * preload, but backed by localStorage instead of Node.js / electron-store.
 *
 * Storage layout in localStorage:
 *   dinomd:docs   → JSON array of Document metadata (id, name, filePath, orderIndex, importedAt)
 *   dinomd:content:<id> → raw Markdown string for that document
 */

const DOCS_KEY = 'dinomd:docs'

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

// ── Pick files via a hidden <input> ──────────────────────────────────────────
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

    // If the user closes the picker without selecting
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
      { once: true }
    )

    input.click()
  })
}

// ── API methods ───────────────────────────────────────────────────────────────

async function importFiles() {
  const files = await pickMarkdownFiles()
  if (!files.length) {
    return { success: true, imported: [], skipped: [] }
  }

  const docs = loadDocs()
  const imported = []
  const skipped = []

  for (const file of files) {
    // Validate extension
    if (!file.name.endsWith('.md')) {
      skipped.push({ filePath: file.name, reason: 'invalid-type' })
      continue
    }

    // Duplicate check by name (browser has no real paths)
    const filePath = file.name
    if (docs.find((d) => d.filePath === filePath)) {
      skipped.push({ filePath, reason: 'duplicate' })
      continue
    }

    let content
    try {
      content = await file.text()
    } catch {
      skipped.push({ filePath, reason: 'unreadable' })
      continue
    }

    const id = genId()
    const doc = {
      id,
      name: file.name.replace(/\.md$/i, ''),
      filePath,
      orderIndex: docs.length + imported.length,
      importedAt: new Date().toISOString()
    }

    localStorage.setItem(contentKey(id), content)
    imported.push(doc)
  }

  if (imported.length > 0) {
    saveDocs([...docs, ...imported])
  }

  return { success: true, imported, skipped }
}

async function getAll() {
  const docs = loadDocs()
  const withStatus = docs
    .map((doc) => ({
      ...doc,
      status: localStorage.getItem(contentKey(doc.id)) !== null ? 'available' : 'missing'
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return { success: true, documents: withStatus }
}

async function readContent({ id }) {
  const content = localStorage.getItem(contentKey(id))
  if (content === null) {
    return { success: false, content: null, error: 'Document content not found' }
  }
  return { success: true, content }
}

async function remove({ id }) {
  let docs = loadDocs().filter((d) => d.id !== id)
  docs = docs.map((d, i) => ({ ...d, orderIndex: i }))
  saveDocs(docs)
  localStorage.removeItem(contentKey(id))
  return { success: true }
}

async function reorder({ orderedIds }) {
  const docs = loadDocs()
  if (orderedIds.length !== docs.length) {
    return { success: false, error: 'orderedIds length mismatch' }
  }
  const reordered = orderedIds.map((id, index) => {
    const doc = docs.find((d) => d.id === id)
    if (!doc) throw new Error(`Unknown id: ${id}`)
    return { ...doc, orderIndex: index }
  })
  saveDocs(reordered)
  return { success: true }
}

// ── Export as the same shape consumed by services/api.js ─────────────────────
export const api = {
  importFiles,
  getAll,
  readContent,
  remove,
  reorder
}
