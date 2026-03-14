import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'

export default function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getAll()
      if (result.success) {
        setDocuments(result.documents)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const importFiles = useCallback(async () => {
    const result = await api.importFiles()
    if (result.success) await refresh()
    return result
  }, [refresh])

  const removeDocument = useCallback(
    async (id) => {
      const result = await api.remove({ id })
      if (result.success) await refresh()
      return result
    },
    [refresh]
  )

  const reorderDocuments = useCallback(
    async (orderedIds) => {
      const result = await api.reorder({ orderedIds })
      if (result.success) {
        // Optimistically update order in local state
        setDocuments((prev) => {
          const map = Object.fromEntries(prev.map((d) => [d.id, d]))
          return orderedIds.map((id, index) => ({ ...map[id], orderIndex: index }))
        })
      }
      return result
    },
    []
  )

  return { documents, loading, error, importFiles, removeDocument, reorderDocuments, refreshDocuments: refresh }
}
