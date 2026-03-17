import { promises as fs, watch } from 'fs'
import { join } from 'path'

const SYSTEM_NAMES = new Set(['node_modules', '.git', '.DS_Store', '.hg', '.svn', 'dist', 'build'])

function isVisible(dirent) {
    if (dirent.name.startsWith('.')) return false
    if (SYSTEM_NAMES.has(dirent.name)) return false
    return true
}

function compareEntries(a, b) {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export async function readDirFiltered(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
        .filter(isVisible)
        .map((dirent) => ({
            name: dirent.name,
            isDirectory: dirent.isDirectory(),
            path: join(dirPath, dirent.name),
        }))
        .sort(compareEntries)
}

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
export async function writeFileUtf8(filePath, content) {
    await fs.writeFile(filePath, content, 'utf8')
}
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
let _watcher = null
let _debounceTimer = null
const DEBOUNCE_MS = 200
export function watchFile(filePath, onChange) {
    stopWatching()
    _watcher = watch(filePath, () => {
        clearTimeout(_debounceTimer)
        _debounceTimer = setTimeout(() => onChange(filePath), DEBOUNCE_MS)
    })
}
export function stopWatching() {
    if (_watcher) {
        _watcher.close()
        _watcher = null
    }
    clearTimeout(_debounceTimer)
    _debounceTimer = null
}
