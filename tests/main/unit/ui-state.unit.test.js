import { invokeHandler, resetMocks } from '../../../tests/__mocks__/electron.js'

vi.mock('../../../src/main/store/index.js', () => {
    let _state = null

    return {
        getSidebarState: vi.fn(() => {
            if (!_state) return { open: true, widthPercent: 22 }
            return { ..._state }
        }),
        setSidebarState: vi.fn((patch) => {
            const current = _state ?? { open: true, widthPercent: 22 }
            const next = { ...current }
            if (typeof patch.open === 'boolean') next.open = patch.open
            if (typeof patch.widthPercent === 'number') {
                next.widthPercent = Math.min(35, Math.max(15, patch.widthPercent))
            }
            _state = next
        }),
        __resetState: () => {
            _state = null
        },
    }
})

import * as store from '../../../src/main/store/index.js'
import { registerUiHandlers } from '../../../src/main/ipc/ui.js'

beforeAll(() => {
    registerUiHandlers()
})

beforeEach(() => {
    resetMocks()
    vi.clearAllMocks()
    store.__resetState()
    registerUiHandlers()
})

describe('ui:get-sidebar-state', () => {
    test('returns defaults when store is empty', async () => {
        const result = await invokeHandler('ui:get-sidebar-state')
        expect(result).toEqual({ open: true, widthPercent: 22 })
    })

    test('returns persisted value after a set call', async () => {
        store.getSidebarState.mockReturnValueOnce({ open: false, widthPercent: 28 })
        const result = await invokeHandler('ui:get-sidebar-state')
        expect(result.open).toBe(false)
        expect(result.widthPercent).toBe(28)
    })
})

describe('ui:set-sidebar-state', () => {
    test('returns { success: true } for valid open boolean', async () => {
        const result = await invokeHandler('ui:set-sidebar-state', { open: false })
        expect(result).toEqual({ success: true })
        expect(store.setSidebarState).toHaveBeenCalledWith({ open: false })
    })

    test('returns { success: true } for valid widthPercent number', async () => {
        const result = await invokeHandler('ui:set-sidebar-state', { widthPercent: 25 })
        expect(result).toEqual({ success: true })
        expect(store.setSidebarState).toHaveBeenCalledWith({ widthPercent: 25 })
    })

    test('clamps widthPercent to [15, 35] via setSidebarState', async () => {
        await invokeHandler('ui:set-sidebar-state', { widthPercent: 5 })
        expect(store.setSidebarState).toHaveBeenCalledWith({ widthPercent: 5 })
    })

    test('returns { success: false, error: "invalid-payload" } for non-boolean open', async () => {
        const result = await invokeHandler('ui:set-sidebar-state', { open: 'yes' })
        expect(result).toEqual({ success: false, error: 'invalid-payload' })
    })

    test('returns { success: false, error: "invalid-payload" } for non-number widthPercent', async () => {
        const result = await invokeHandler('ui:set-sidebar-state', { widthPercent: '25' })
        expect(result).toEqual({ success: false, error: 'invalid-payload' })
    })

    test('returns { success: false, error: "invalid-payload" } for null payload', async () => {
        const result = await invokeHandler('ui:set-sidebar-state', null)
        expect(result).toEqual({ success: false, error: 'invalid-payload' })
    })
})
