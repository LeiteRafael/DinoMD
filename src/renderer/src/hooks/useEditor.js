import { useState, useCallback } from 'react'
import { api } from '../services/api.js'

/**
 * Editor session state.
 *
 * Fields:
 *   documentId   — null for drafts before first save, UUID otherwise
 *   filePath     — null for drafts; absolute path after save
 *   name         — display name (e.g. 'Untitled' or 'my-notes')
 *   content      — current editor text (may differ from savedContent when dirty)
 *   savedContent — last-persisted content (used to compute isDirty)
 *   mtimeMs      — mtime after last save (baseline for external-change detection)
 *   isDraft      — true until first save completes
 */
const INITIAL_SESSION = {
  documentId: null,
  filePath: null,
  name: 'Untitled',
  content: '',
  savedContent: '',
  mtimeMs: null,
  isDraft: true
}

export default function useEditor() {
  const [session, setSession] = useState(INITIAL_SESSION)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isDirty = session.content !== session.savedContent

  // ── openNew ────────────────────────────────────────────────────────────────
  const openNew = useCallback(async () => {
    const result = await api.create()
    if (!result.success) {
      setError(result.error)
      return null
    }
    const draft = result.draft
    setSession({
      documentId: draft.id,
      filePath: null,
      name: draft.name,
      content: '',
      savedContent: '',
      mtimeMs: null,
      isDraft: true
    })
    setError(null)
    return draft
  }, [])

  // ── openExisting ───────────────────────────────────────────────────────────
  const openExisting = useCallback(async (doc) => {
    const result = await api.readContent({ id: doc.id })
    if (!result.success) {
      setError(result.error)
      return
    }
    setSession({
      documentId: doc.id,
      filePath: doc.filePath,
      name: doc.name,
      content: result.content,
      savedContent: result.content,
      mtimeMs: doc.mtimeMs ?? null,
      isDraft: false
    })
    setError(null)
  }, [])

  // ── updateContent ──────────────────────────────────────────────────────────
  const updateContent = useCallback((newContent) => {
    setSession((prev) => ({ ...prev, content: newContent }))
  }, [])

  // ── save ───────────────────────────────────────────────────────────────────
  /**
   * Returns:
   *   { saved: true, canceled: false } on success
   *   { saved: false, canceled: true }  if user dismissed the Save dialog
   *   { saved: false, canceled: false } on error
   */
  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await api.save({
        id: session.documentId,
        filePath: session.filePath,
        name: session.name,
        content: session.content
      })

      if (!result.success) {
        setError(result.error)
        return { saved: false, canceled: false }
      }
      if (result.canceled) {
        return { saved: false, canceled: true }
      }

      // Update session with resolved path/name from dialog (drafts) or updated mtime
      setSession((prev) => ({
        ...prev,
        filePath: result.filePath ?? prev.filePath,
        name: result.name ?? prev.name,
        savedContent: prev.content,
        mtimeMs: result.mtimeMs,
        isDraft: false
      }))

      return { saved: true, canceled: false, filePath: result.filePath, name: result.name }
    } catch (err) {
      setError(err.message)
      return { saved: false, canceled: false }
    } finally {
      setSaving(false)
    }
  }, [session])

  // ── rename ─────────────────────────────────────────────────────────────────
  const rename = useCallback(async (newName) => {
    if (!session.documentId || session.isDraft) return { success: false, error: 'Cannot rename unsaved draft' }
    const result = await api.rename({ id: session.documentId, newName })
    if (result.success) {
      setSession((prev) => ({
        ...prev,
        name: newName.trim(),
        filePath: result.newFilePath
      }))
    } else {
      setError(result.error)
    }
    return result
  }, [session.documentId, session.isDraft])

  // ── discard ────────────────────────────────────────────────────────────────
  const discard = useCallback(() => {
    setSession((prev) => ({ ...prev, content: prev.savedContent }))
    setError(null)
  }, [])

  // ── deleteDocument ─────────────────────────────────────────────────────────
  const deleteDocument = useCallback(async (force = false) => {
    if (!session.documentId) return { success: false, error: 'No document loaded' }
    const result = await api.delete({ id: session.documentId, force })
    if (!result.success) {
      setError(result.error)
    }
    return result
  }, [session.documentId])

  // ── reloadContent ──────────────────────────────────────────────────────────
  /**
   * Called after an external file change — reload raw content from disk and
   * reset the session baseline so the document is no longer dirty.
   */
  const reloadContent = useCallback(async () => {
    if (!session.documentId) return
    const result = await api.readContent({ id: session.documentId })
    if (result.success) {
      setSession((prev) => ({
        ...prev,
        content: result.content,
        savedContent: result.content
      }))
      setError(null)
    } else {
      setError(result.error)
    }
  }, [session.documentId])

  return {
    session,
    isDirty,
    saving,
    error,
    setError,
    openNew,
    openExisting,
    updateContent,
    save,
    rename,
    discard,
    deleteDocument,
    reloadContent
  }
}
