const mockHandlers = {}
const mockWindow = {}
const ipcMain = {
    handle: jest.fn((channel, handler) => {
        mockHandlers[channel] = handler
    }),
    removeHandler: jest.fn(),
}
const BrowserWindow = {
    fromWebContents: jest.fn(() => mockWindow),
    getAllWindows: jest.fn(() => []),
}
const dialog = {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
}
const shell = {
    trashItem: jest.fn(() => Promise.resolve()),
    openExternal: jest.fn(),
}
const app = {
    getPath: jest.fn(() => '/tmp/test-userdata'),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
}
async function invokeHandler(channel, ...args) {
    const handler = mockHandlers[channel]
    if (!handler) throw new Error(`No ipcMain handler registered for: ${channel}`)
    return handler({ sender: {} }, ...args)
}
function resetMocks() {
    Object.keys(mockHandlers).forEach((k) => delete mockHandlers[k])
    jest.clearAllMocks()
}
module.exports = {
    ipcMain,
    BrowserWindow,
    dialog,
    shell,
    app,
    invokeHandler,
    resetMocks,
}
