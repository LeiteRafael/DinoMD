import { useState } from 'react'
export default function useSplitView() {
    const [viewMode, setViewMode] = useState('split')
    return {
        viewMode,
        setViewMode,
    }
}
