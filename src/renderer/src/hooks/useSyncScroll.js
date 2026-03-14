import { useRef, useCallback } from 'react'

/**
 * useSyncScroll — synchronises proportional scroll position between two panes.
 *
 * @param {{ enabled: boolean }} options
 * @returns {{ editorScrollRef: React.RefObject, previewScrollRef: React.RefObject,
 *             onEditorScroll: Function, onPreviewScroll: Function }}
 */
export default function useSyncScroll({ enabled }) {
  const editorScrollRef = useRef(null)
  const previewScrollRef = useRef(null)
  const isSyncingRef = useRef(false)

  const onEditorScroll = useCallback(() => {
    if (!enabled || isSyncingRef.current) return
    const editor = editorScrollRef.current
    const preview = previewScrollRef.current
    if (!editor || !preview) return

    isSyncingRef.current = true
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1)
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [enabled])

  const onPreviewScroll = useCallback(() => {
    if (!enabled || isSyncingRef.current) return
    const editor = editorScrollRef.current
    const preview = previewScrollRef.current
    if (!editor || !preview) return

    isSyncingRef.current = true
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1)
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight)
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }, [enabled])

  return { editorScrollRef, previewScrollRef, onEditorScroll, onPreviewScroll }
}
