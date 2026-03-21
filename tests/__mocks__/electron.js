import { vi } from 'vitest'

const mockHandlers = {}
const mockWindow = {}

export const ipcMain = {
    handle: vi.fn((channel, handler) => {
        mockHandlers[channel] = handler
    }),
    removeHandler: vi.fn(),
}

export const BrowserWindow = {
    fromWebContents: vi.fn(() => mockWindow),
    getAllWindows: vi.fn(() => []),
}

export const dialog = {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
}

export const shell = {
    trashItem: vi.fn(() => Promise.resolve()),
    openExternal: vi.fn(),
}

export const app = {
    getPath: vi.fn(() => '/tmp/test-userdata'),
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    quit: vi.fn(),
}

export async function invokeHandler(channel, ...args) {
    const handler = mockHandlers[channel]
    if (!handler) throw new Error(`No ipcMain handler registered for: ${channel}`)
    return handler({ sender: {} }, ...args)
}

export function resetMocks() {
    Object.keys(mockHandlers).forEach((k) => delete mockHandlers[k])
    vi.clearAllMocks()
}
