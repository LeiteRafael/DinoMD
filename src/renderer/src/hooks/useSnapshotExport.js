import { useState, useCallback } from 'react'
import { captureElement, downloadBlob } from '../utils/snapshotExport.js'

const buildFilename = (name) => {
    const trimmed = name && name.trim()
    if (!trimmed) return 'snapshot.png'
    return `snapshot-${trimmed}.png`
}

const useSnapshotExport = (snapshotFrameRef, name) => {
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState(null)

    const exportPng = useCallback(async () => {
        const element = snapshotFrameRef.current
        if (!element) return
        setExporting(true)
        setError(null)
        try {
            const blob = await captureElement(element)
            downloadBlob(blob, buildFilename(name))
        } catch (err) {
            setError('Export failed. Please try again.')
        } finally {
            setExporting(false)
        }
    }, [snapshotFrameRef, name])

    return { exportPng, exporting, error }
}

export default useSnapshotExport
