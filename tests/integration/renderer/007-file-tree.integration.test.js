vi.mock('../../../src/renderer/src/services/api.js', () => ({
    api: {
        folder: {
            readDir: vi.fn(),
            openPicker: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
        },
        ui: {
            getSidebarState: vi.fn(() =>
                Promise.resolve({ open: true, widthPercent: 22, rootFolderPath: null })
            ),
            setSidebarState: vi.fn(() => Promise.resolve({ success: true })),
        },
        getAll: vi.fn(() => Promise.resolve({ success: true, documents: [] })),
        create: vi.fn(),
        readContent: vi.fn(),
        save: vi.fn(),
        rename: vi.fn(),
        delete: vi.fn(),
        onFileChangedExternally: vi.fn(),
        removeFileChangedListener: vi.fn(),
    },
}))
vi.mock('../../../src/renderer/src/hooks/useDebounce.js', () => ({
    __esModule: true,
    default: (value) => value,
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { api } from '../../../src/renderer/src/services/api.js'
import Sidebar from '../../../src/renderer/src/components/Sidebar/index.jsx'

const ROOT = '/home/user/docs'

const rootEntries = [
    { name: 'notes', path: `${ROOT}/notes`, isDirectory: true },
    { name: 'readme.md', path: `${ROOT}/readme.md`, isDirectory: false },
]

const childEntries = [{ name: 'plan.md', path: `${ROOT}/notes/plan.md`, isDirectory: false }]

describe('Sidebar file tree + useFileTree integration', () => {
    beforeEach(() => {
        api.folder.readDir.mockReset()
        api.folder.readDir.mockResolvedValueOnce(rootEntries).mockResolvedValueOnce(childEntries)
    })

    test('renders root folder entries after initial load', async () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        await waitFor(() => expect(screen.getByLabelText('notes')).toBeInTheDocument())
        expect(screen.getByLabelText('readme.md')).toBeInTheDocument()
    })

    test('loads and displays child entries when a folder node is clicked', async () => {
        render(<Sidebar rootFolderPath={ROOT} />)
        await waitFor(() => expect(screen.getByLabelText('notes')).toBeInTheDocument())

        fireEvent.click(screen.getByLabelText('notes'))

        await waitFor(() => expect(screen.getByLabelText('plan.md')).toBeInTheDocument())
    })

    test('calls api.folder.readDir with the root path on mount', async () => {
        render(<Sidebar rootFolderPath={ROOT} />)

        await waitFor(() => expect(api.folder.readDir).toHaveBeenCalledWith(ROOT))
    })
})
