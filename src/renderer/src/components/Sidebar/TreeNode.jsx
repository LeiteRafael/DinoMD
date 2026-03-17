import { useState, useRef } from 'react'
import styles from './Sidebar.module.css'

function getFileIcon(extension) {
    if (extension === 'md') return 'article'
    return 'insert_drive_file'
}

function getFolderIcon(isExpanded) {
    return isExpanded ? 'folder_open' : 'folder'
}

export default function TreeNode({ node, expandedPaths, onToggle, onOpenFile, activeFilePath }) {
    const isFolder = node.type === 'folder'
    const isActive = node.path === activeFilePath
    const isExpanded = expandedPaths.has(node.path)
    const isMd = node.extension === 'md'
    const [showUnsupported, setShowUnsupported] = useState(false)
    const noticeTimer = useRef(null)

    const iconName = isFolder ? getFolderIcon(isExpanded) : getFileIcon(node.extension)

    const rowStyle = { paddingLeft: node.depth * 16 + 'px' }

    function handleClick() {
        if (isFolder) {
            onToggle(node.path, node.children ?? null)
            return
        }
        if (!isMd) {
            setShowUnsupported(true)
            clearTimeout(noticeTimer.current)
            noticeTimer.current = setTimeout(() => setShowUnsupported(false), 3000)
            return
        }
        onOpenFile?.(node.path)
    }

    const rowClass = [
        styles.treeRow,
        isActive ? styles.treeRowActive : '',
        !isFolder && !isMd ? styles.treeRowUnsupported : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div>
            <button
                className={rowClass}
                style={rowStyle}
                onClick={handleClick}
                title={node.path}
                aria-label={node.name}
            >
                <span className={`material-icons ${styles.icon}`}>{iconName}</span>
                <span className={styles.nodeName}>{node.name}</span>
            </button>

            {showUnsupported && (
                <div
                    className={styles.unsupportedNotice}
                    style={{ paddingLeft: node.depth * 16 + 8 + 'px' }}
                >
                    File type not supported
                </div>
            )}

            {isFolder && isExpanded && Array.isArray(node.children) && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            expandedPaths={expandedPaths}
                            onToggle={onToggle}
                            onOpenFile={onOpenFile}
                            activeFilePath={activeFilePath}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
