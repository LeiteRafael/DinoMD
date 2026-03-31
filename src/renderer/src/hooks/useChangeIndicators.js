import { useState, useMemo, useEffect } from 'react'
import { computeLineDiff } from '../utils/diffUtils'

const useChangeIndicators = (currentContent, savedContent) => {
    const [baseline, setBaseline] = useState(savedContent)

    useEffect(() => {
        setBaseline(savedContent)
    }, [savedContent])

    const changeMap = useMemo(
        () => computeLineDiff(baseline.split('\n'), currentContent.split('\n')),
        [baseline, currentContent]
    )

    const isDirty = changeMap.size > 0

    return { changeMap, isDirty }
}

export default useChangeIndicators
