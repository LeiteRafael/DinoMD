import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

export default function useMarkdown(documentId) {
  const [rawMarkdown, setRawMarkdown] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!documentId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setRawMarkdown(null)

      try {
        const result = await api.readContent({ id: documentId })
        if (cancelled) return

        if (result.success) {
          setRawMarkdown(result.content)
        } else {
          setError(result.error ?? 'Failed to load document')
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [documentId])

  return { rawMarkdown, loading, error }
}
