import { ipcMain } from 'electron'
import { getSidebarState, setSidebarState } from '../store/index.js'
export function registerUiHandlers() {
    ipcMain.handle('ui:get-sidebar-state', handleGetSidebarState)
    ipcMain.handle('ui:set-sidebar-state', handleSetSidebarState)
}
function handleGetSidebarState() {
    try {
        return getSidebarState()
    } catch (err) {
        return {
            open: true,
            widthPercent: 22,
        }
    }
}
function handleSetSidebarState(_event, payload) {
    try {
        if (!payload || typeof payload !== 'object') {
            return {
                success: false,
                error: 'invalid-payload',
            }
        }
        if ('open' in payload && typeof payload.open !== 'boolean') {
            return {
                success: false,
                error: 'invalid-payload',
            }
        }
        if ('widthPercent' in payload && typeof payload.widthPercent !== 'number') {
            return {
                success: false,
                error: 'invalid-payload',
            }
        }
        setSidebarState(payload)
        return {
            success: true,
        }
    } catch (err) {
        return {
            success: false,
            error: err.message,
        }
    }
}
