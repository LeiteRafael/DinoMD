import { useState, useEffect, useCallback, useRef } from 'react'
import useDebounce from './useDebounce.js'
import { api } from '../services/api.js'
const DEFAULTS = {
    open: true,
    widthPercent: 15,
    rootFolderPath: null,
}
export default function useSidebar() {
    const [open, setOpen] = useState(DEFAULTS.open)
    const [widthPercent, setWidthPercent] = useState(DEFAULTS.widthPercent)
    const [rootFolderPath, setRootFolderPath] = useState(DEFAULTS.rootFolderPath)
    const loadedRef = useRef(false)
    const debouncedWidth = useDebounce(widthPercent, 300)
    useEffect(() => {
        let cancelled = false
        api.ui
            .getSidebarState()
            .then((state) => {
                if (cancelled) return
                if (state && typeof state.open === 'boolean') setOpen(state.open)
                if (state && typeof state.widthPercent === 'number')
                    setWidthPercent(state.widthPercent)
                if (
                    state &&
                    (typeof state.rootFolderPath === 'string' || state.rootFolderPath === null)
                )
                    setRootFolderPath(state.rootFolderPath)
                loadedRef.current = true
            })
            .catch(() => {
                loadedRef.current = true
            })
        return () => {
            cancelled = true
        }
    }, [])
    useEffect(() => {
        if (!loadedRef.current) return
        api.ui.setSidebarState({
            widthPercent: debouncedWidth,
        })
    }, [debouncedWidth])
    const toggle = useCallback(() => {
        setOpen((prev) => {
            const next = !prev
            api.ui.setSidebarState({
                open: next,
            })
            return next
        })
    }, [])
    const handleResize = useCallback((pct) => {
        setWidthPercent(pct)
    }, [])
    const persistRootFolderPath = useCallback((folderPath) => {
        setRootFolderPath(folderPath)
        api.ui.setSidebarState({ rootFolderPath: folderPath })
    }, [])
    return {
        open,
        widthPercent,
        rootFolderPath,
        toggle,
        handleResize,
        persistRootFolderPath,
    }
}
