import { promises as fs, watch } from 'fs'

export async function readFileAsUtf8(filePath) {
  return fs.readFile(filePath, 'utf8')
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Write UTF-8 content to filePath, creating/overwriting the file.
 */
export async function writeFileUtf8(filePath, content) {
  await fs.writeFile(filePath, content, 'utf8')
}

/**
 * Rename (move) a file from oldPath to newPath.
 * Falls back to copy+unlink when the OS returns EXDEV (cross-device).
 * Throws if newPath already exists (pre-flight should be done by callers).
 */
export async function renameFile(oldPath, newPath) {
  try {
    await fs.rename(oldPath, newPath)
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.copyFile(oldPath, newPath)
      await fs.unlink(oldPath)
    } else {
      throw err
    }
  }
}

// ── File watcher ─────────────────────────────────────────────────────────────

let _watcher = null
let _debounceTimer = null
const DEBOUNCE_MS = 200

/**
 * Start watching `filePath`. Calls `onChange(filePath)` at most once per 200 ms.
 * Calling this again while a watcher is active automatically stops the previous one.
 */
export function watchFile(filePath, onChange) {
  stopWatching()
  _watcher = watch(filePath, () => {
    clearTimeout(_debounceTimer)
    _debounceTimer = setTimeout(() => onChange(filePath), DEBOUNCE_MS)
  })
}

/**
 * Stop the current file watcher (if any).
 */
export function stopWatching() {
  if (_watcher) {
    _watcher.close()
    _watcher = null
  }
  clearTimeout(_debounceTimer)
  _debounceTimer = null
}
