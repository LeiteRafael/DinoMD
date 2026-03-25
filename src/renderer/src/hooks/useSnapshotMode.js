import { useState, useEffect } from 'react'

const useSnapshotMode = (documentId) => {
    const [mode, setMode] = useState('code')

    useEffect(() => {
        setMode('code')
    }, [documentId])

    return { mode, setMode }
}

export default useSnapshotMode
