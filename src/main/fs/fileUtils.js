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
