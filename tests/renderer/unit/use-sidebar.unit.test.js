import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('../../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))

vi.mock('../../../src/renderer/src/services/api.js', () => ({
    api: {
        ui: {
            getSidebarState: vi.fn(),
            setSidebarState: vi.fn(),
        },
    },
}))

import { api } from '../../../src/renderer/src/services/api.js'
import useSidebar from '../../../src/renderer/src/hooks/useSidebar.js'

describe('useSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        api.ui.getSidebarState.mockResolvedValue({ open: true, widthPercent: 22 })
        api.ui.setSidebarState.mockResolvedValue({ success: true })
    })

    test('mount calls api.ui.getSidebarState', async () => {
        renderHook(() => useSidebar())
        await act(async () => {})
        expect(api.ui.getSidebarState).toHaveBeenCalledTimes(1)
    })

    test('defaults applied when getSidebarState returns null', async () => {
        api.ui.getSidebarState.mockResolvedValue(null)
        const { result } = renderHook(() => useSidebar())
        await act(async () => {})
        expect(result.current.open).toBe(true)
        expect(result.current.widthPercent).toBe(22)
    })

    test('state loaded from IPC on mount', async () => {
        api.ui.getSidebarState.mockResolvedValue({ open: false, widthPercent: 30 })
        const { result } = renderHook(() => useSidebar())
        await act(async () => {})
        expect(result.current.open).toBe(false)
        expect(result.current.widthPercent).toBe(30)
    })

    test('toggle() calls setSidebarState({ open: false }) on first call', async () => {
        api.ui.getSidebarState.mockResolvedValue({ open: true, widthPercent: 22 })
        const { result } = renderHook(() => useSidebar())
        await act(async () => {})

        await act(async () => {
            result.current.toggle()
        })

        expect(api.ui.setSidebarState).toHaveBeenCalledWith({ open: false })
        expect(result.current.open).toBe(false)
    })

    test('toggle() calls setSidebarState({ open: true }) on second call', async () => {
        api.ui.getSidebarState.mockResolvedValue({ open: true, widthPercent: 22 })
        const { result } = renderHook(() => useSidebar())
        await act(async () => {})

        await act(async () => {
            result.current.toggle()
        })
        await act(async () => {
            result.current.toggle()
        })

        const calls = api.ui.setSidebarState.mock.calls
        expect(calls[calls.length - 1][0]).toEqual({ open: true })
        expect(result.current.open).toBe(true)
    })

    test('handleResize(25) updates widthPercent', async () => {
        const { result } = renderHook(() => useSidebar())
        await act(async () => {})

        await act(async () => {
            result.current.handleResize(25)
        })

        expect(result.current.widthPercent).toBe(25)
    })
})
