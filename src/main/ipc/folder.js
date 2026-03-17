import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readDirFiltered, readFileAsUtf8, writeFileUtf8 } from '../fs/fileUtils.js'

export function registerFolderHandlers() {
    ipcMain.handle('folder:open-picker', handleOpenPicker)
    ipcMain.handle('folder:read-dir', (_event, dirPath) => handleReadDir(dirPath))
    ipcMain.handle('folder:read-file', (_event, filePath) => handleReadFile(filePath))
    ipcMain.handle('folder:write-file', (_event, filePath, content) =>
        handleWriteFile(filePath, content)
    )
}

async function handleOpenPicker(event) {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths[0]
}

async function handleReadDir(dirPath) {
    try {
        return await readDirFiltered(dirPath)
    } catch (err) {
        return { error: err.message }
    }
}

async function handleReadFile(filePath) {
    try {
        const content = await readFileAsUtf8(filePath)
        return { success: true, content }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

async function handleWriteFile(filePath, content) {
    try {
        await writeFileUtf8(filePath, content)
        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}
