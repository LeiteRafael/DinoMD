import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

vi.mock('shiki', () => ({
    codeToHtml: vi.fn((code) => Promise.resolve(`<pre><code>${code}</code></pre>`)),
}))

import { codeToHtml } from 'shiki'
import SnapshotPane from '../../../src/renderer/src/components/SnapshotPane/index.jsx'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('SnapshotPane', () => {
    test('renders the Code snapshot region', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="test.js" />)
        })

        expect(screen.getByLabelText('Code snapshot')).toBeInTheDocument()
    })

    test('renders the close traffic-light dot', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="" />)
        })

        expect(screen.getByLabelText('close')).toBeInTheDocument()
    })

    test('renders the minimize traffic-light dot', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="" />)
        })

        expect(screen.getByLabelText('minimize')).toBeInTheDocument()
    })

    test('renders the maximize traffic-light dot', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="" />)
        })

        expect(screen.getByLabelText('maximize')).toBeInTheDocument()
    })

    test('shows the filename in the title bar when title is provided', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="server.js" />)
        })

        expect(screen.getByText('server.js')).toBeInTheDocument()
    })

    test('shows a language label in the title bar when passed as title', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="javascript" />)
        })

        expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    test('renders no title label when title is an empty string', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 1" title="" />)
        })

        expect(screen.queryByText('server.js')).not.toBeInTheDocument()
        expect(screen.queryByText('javascript')).not.toBeInTheDocument()
    })

    test('renders placeholder when content is empty string', () => {
        render(<SnapshotPane content="" title="" />)

        expect(screen.getByText('// No code to display')).toBeInTheDocument()
    })

    test('renders placeholder when content is only whitespace', () => {
        render(<SnapshotPane content="   " title="" />)

        expect(screen.getByText('// No code to display')).toBeInTheDocument()
    })

    test('calls codeToHtml with content and lang when content is non-empty', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 42" title="" lang="js" />)
        })

        expect(codeToHtml).toHaveBeenCalledWith('const x = 42', {
            lang: 'js',
            theme: 'github-dark',
        })
    })

    test('renders the shiki HTML output inside the code element', async () => {
        await act(async () => {
            render(<SnapshotPane content="const x = 42" title="" lang="js" />)
        })

        expect(screen.getByLabelText('Code snapshot').querySelector('code').textContent).toBe(
            'const x = 42'
        )
    })

    test('defaults lang to text when lang prop is not provided', async () => {
        await act(async () => {
            render(<SnapshotPane content="hello world" title="" />)
        })

        expect(codeToHtml).toHaveBeenCalledWith('hello world', {
            lang: 'text',
            theme: 'github-dark',
        })
    })

    test('does not call codeToHtml when content is empty', () => {
        render(<SnapshotPane content="" title="" />)

        expect(codeToHtml).not.toHaveBeenCalled()
    })
})
