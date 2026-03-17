import { useState, useCallback, useRef, useTransition } from 'react'
import { api } from '../services/api.js'
const INITIAL_SESSION = {
    documentId: null,
    filePath: null,
    name: 'Untitled',
    content: '',
    savedContent: '',
    mtimeMs: null,
    isDraft: true,
}
export default function useEditor() {
    const [session, setSession] = useState(INITIAL_SESSION)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const contentRef = useRef('')
    const [, startTransition] = useTransition()
    const isDirty = session.content !== session.savedContent
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
            isDraft: true,
        })
        setError(null)
        return draft
    }, [])
    const openExisting = useCallback(async (doc) => {
        const result = await api.readContent({
            id: doc.id,
        })
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
            isDraft: false,
        })
        setError(null)
    }, [])
    const updateContent = useCallback(
        (newContent) => {
            contentRef.current = newContent
            startTransition(() => {
                setSession((prev) => ({
                    ...prev,
                    content: newContent,
                }))
            })
        },
        [startTransition]
    )
    const save = useCallback(async () => {
        setSaving(true)
        setError(null)
        try {
            if (!session.documentId && session.filePath) {
                const content = contentRef.current || session.content
                const result = await api.folder.writeFile(session.filePath, content)
                if (!result.success) {
                    setError(result.error)
                    return { saved: false, canceled: false }
                }
                setSession((prev) => ({ ...prev, savedContent: prev.content }))
                return {
                    saved: true,
                    canceled: false,
                    filePath: session.filePath,
                    name: session.name,
                }
            }
            const result = await api.save({
                id: session.documentId,
                filePath: session.filePath,
                name: session.name,
                content: contentRef.current || session.content,
            })
            if (!result.success) {
                setError(result.error)
                return {
                    saved: false,
                    canceled: false,
                }
            }
            if (result.canceled) {
                return {
                    saved: false,
                    canceled: true,
                }
            }
            setSession((prev) => ({
                ...prev,
                filePath: result.filePath ?? prev.filePath,
                name: result.name ?? prev.name,
                savedContent: prev.content,
                mtimeMs: result.mtimeMs,
                isDraft: false,
            }))
            return {
                saved: true,
                canceled: false,
                filePath: result.filePath,
                name: result.name,
            }
        } catch (err) {
            setError(err.message)
            return {
                saved: false,
                canceled: false,
            }
        } finally {
            setSaving(false)
        }
    }, [session])
    const rename = useCallback(
        async (newName) => {
            if (!session.documentId || session.isDraft)
                return {
                    success: false,
                    error: 'Cannot rename unsaved draft',
                }
            const result = await api.rename({
                id: session.documentId,
                newName,
            })
            if (result.success) {
                setSession((prev) => ({
                    ...prev,
                    name: newName.trim(),
                    filePath: result.newFilePath,
                }))
            } else {
                setError(result.error)
            }
            return result
        },
        [session.documentId, session.isDraft]
    )
    const discard = useCallback(() => {
        setSession((prev) => ({
            ...prev,
            content: prev.savedContent,
        }))
        setError(null)
    }, [])
    const deleteDocument = useCallback(
        async (force = false) => {
            if (!session.documentId)
                return {
                    success: false,
                    error: 'No document loaded',
                }
            const result = await api.delete({
                id: session.documentId,
                force,
            })
            if (!result.success) {
                setError(result.error)
            }
            return result
        },
        [session.documentId]
    )
    const openFromFilePath = useCallback((filePath, content, name) => {
        contentRef.current = content
        setSession({
            documentId: null,
            filePath,
            name,
            content,
            savedContent: content,
            mtimeMs: null,
            isDraft: false,
        })
        setError(null)
    }, [])
    const reloadContent = useCallback(async () => {
        if (!session.documentId) return
        const result = await api.readContent({
            id: session.documentId,
        })
        if (result.success) {
            setSession((prev) => ({
                ...prev,
                content: result.content,
                savedContent: result.content,
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
        openFromFilePath,
        updateContent,
        save,
        rename,
        discard,
        deleteDocument,
        reloadContent,
    }
}
