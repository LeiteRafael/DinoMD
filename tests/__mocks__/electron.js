const mockHandlers = {}

const ipcMain = {
  handle: jest.fn((channel, handler) => {
    mockHandlers[channel] = handler
  }),
  removeHandler: jest.fn()
}

const dialog = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn()
}

const shell = {
  trashItem: jest.fn(() => Promise.resolve()),
  openExternal: jest.fn()
}

const app = {
  getPath: jest.fn(() => '/tmp/test-userdata'),
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn()
}

// Helper: call a registered ipcMain handler as if the renderer invoked it
async function invokeHandler(channel, ...args) {
  const handler = mockHandlers[channel]
  if (!handler) throw new Error(`No ipcMain handler registered for: ${channel}`)
  // Simulate the event object (first arg to ipcMain.handle is the event)
  return handler({}, ...args)
}

// Reset all mock state between tests
function resetMocks() {
  Object.keys(mockHandlers).forEach((k) => delete mockHandlers[k])
  jest.clearAllMocks()
}

module.exports = { ipcMain, dialog, shell, app, invokeHandler, resetMocks }
