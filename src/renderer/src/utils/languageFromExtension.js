const EXTENSION_LANGUAGE_MAP = {
    js: 'JavaScript',
    jsx: 'JSX',
    ts: 'TypeScript',
    tsx: 'TSX',
    py: 'Python',
    sh: 'Bash',
    bash: 'Bash',
    md: 'Markdown',
    json: 'JSON',
    css: 'CSS',
    html: 'HTML',
    yml: 'YAML',
    yaml: 'YAML',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    java: 'Java',
    c: 'C/C++',
    cpp: 'C/C++',
    php: 'PHP',
}

const extractExtension = (filename) => {
    const dotIndex = filename.lastIndexOf('.')
    if (dotIndex === -1 || dotIndex === filename.length - 1) return ''
    return filename.slice(dotIndex + 1).toLowerCase()
}

const languageFromExtension = (filename) => {
    if (!filename) return ''
    const ext = extractExtension(filename)
    return EXTENSION_LANGUAGE_MAP[ext] ?? ''
}

export default languageFromExtension
