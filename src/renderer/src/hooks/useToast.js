import { useState, useRef, useCallback } from 'react'

const DISMISS_DELAY_MS = 2500

export default function useToast() {
    const [toast, setToast] = useState(null)
    const timerRef = useRef(null)

    const showToast = useCallback(({ message, type = 'success' }) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setToast({ message, type })
        timerRef.current = setTimeout(() => setToast(null), DISMISS_DELAY_MS)
    }, [])

    const dismissToast = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setToast(null)
    }, [])

    return { toast, showToast, dismissToast }
}
