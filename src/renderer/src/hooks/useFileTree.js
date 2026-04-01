import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'

const ICON_FOLDER_CLOSED = '▶'
const ICON_FOLDER_OPEN = '▼'
const ICON_MD = '📝'
const ICON_FILE = '📄'

export { ICON_FOLDER_CLOSED, ICON_FOLDER_OPEN, ICON_MD, ICON_FILE }

function buildExtension(name) {
    const dotIndex = name.lastIndexOf('.')
    if (dotIndex < 1) return null
    return name.slice(dotIndex + 1).toLowerCase()
}

function buildTreeNodes(entries, depth) {
    return entries.map((entry) => ({
        name: entry.name,
        path: entry.path,
        type: entry.isDirectory ? 'folder' : 'file',
        extension: entry.isDirectory ? null : buildExtension(entry.name),
        depth,
        children: entry.isDirectory ? null : undefined,
    }))
}

export default function useFileTree({ initialRootFolderPath = null, onRootFolderChange } = {}) {
    const [rootFolderPath, setRootFolderPath] = useState(initialRootFolderPath)
    const [rootEntries, setRootEntries] = useState([])
    const [expandedPaths, setExpandedPaths] = useState(new Set())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!rootFolderPath) {
            setRootEntries([])
            setExpandedPaths(new Set())
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)
        setExpandedPaths(new Set())

        api.folder
            .readDir(rootFolderPath)
            .then((result) => {
                if (cancelled) return
                if (result && result.error) {
                    setError(result.error)
                    setRootEntries([])
                } else {
                    setRootEntries(buildTreeNodes(result, 0))
                }
            })
            .catch((err) => {
                if (cancelled) return
                setError(err?.message ?? 'Failed to read folder')
                setRootEntries([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [rootFolderPath])

    const openFolder = useCallback(async () => {
        const selectedPath = await api.folder.openPicker()
        if (!selectedPath) return
        setRootFolderPath(selectedPath)
        onRootFolderChange?.(selectedPath)
    }, [onRootFolderChange])

    const toggleFolder = useCallback((nodePath, currentChildren) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev)
            if (next.has(nodePath)) {
                next.delete(nodePath)
                return next
            }
            next.add(nodePath)
            return next
        })

        if (currentChildren !== null) return

        setRootEntries((prev) => updateNodeLoadingState(prev, nodePath, true))

        api.folder
            .readDir(nodePath)
            .then((result) => {
                const children = result && result.error ? [] : buildTreeNodes(result, 0)
                setRootEntries((prev) => updateNodeChildren(prev, nodePath, children))
            })
            .catch(() => {
                setRootEntries((prev) => updateNodeChildren(prev, nodePath, []))
            })
    }, [])

    return {
        rootFolderPath,
        rootEntries,
        expandedPaths,
        loading,
        error,
        openFolder,
        toggleFolder,
    }
}

function updateNodeLoadingState(nodes, targetPath, isLoading) {
    return nodes.map((node) => {
        if (node.path === targetPath) return { ...node, loadingChildren: isLoading }
        if (node.type === 'folder' && node.children) {
            return {
                ...node,
                children: updateNodeLoadingState(node.children, targetPath, isLoading),
            }
        }
        return node
    })
}

function updateNodeChildren(nodes, targetPath, children) {
    return nodes.map((node) => {
        if (node.path === targetPath) {
            return {
                ...node,
                children: assignDepths(children, node.depth + 1),
                loadingChildren: false,
            }
        }
        if (node.type === 'folder' && node.children) {
            return { ...node, children: updateNodeChildren(node.children, targetPath, children) }
        }
        return node
    })
}

function assignDepths(nodes, depth) {
    return nodes.map((node) => ({ ...node, depth }))
}
