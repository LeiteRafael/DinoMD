import { useState } from 'react'

/**
 * useSplitView — manages the current view mode for the split-view page.
 *
 * @returns {{ viewMode: string, setViewMode: Function }}
 *   viewMode: 'split' | 'editor' | 'preview'
 */
export default function useSplitView() {
  const [viewMode, setViewMode] = useState('split')

  return { viewMode, setViewMode }
}
