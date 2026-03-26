import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SnapshotPane from '../../../src/renderer/src/components/SnapshotPane/index.jsx'

describe('SnapshotPane', () => {
    test('renders the Code snapshot region', () => {
        render(<SnapshotPane content="const x = 1" title="test.js" />)

        expect(screen.getByLabelText('Code snapshot')).toBeInTheDocument()
    })

    test('renders the close traffic-light dot', () => {
        render(<SnapshotPane content="const x = 1" title="" />)

        expect(screen.getByLabelText('close')).toBeInTheDocument()
    })

    test('renders the minimize traffic-light dot', () => {
        render(<SnapshotPane content="const x = 1" title="" />)

        expect(screen.getByLabelText('minimize')).toBeInTheDocument()
    })

    test('renders the maximize traffic-light dot', () => {
        render(<SnapshotPane content="const x = 1" title="" />)

        expect(screen.getByLabelText('maximize')).toBeInTheDocument()
    })

    test('shows the filename in the title bar when title is provided', () => {
        render(<SnapshotPane content="const x = 1" title="server.js" />)

        expect(screen.getByText('server.js')).toBeInTheDocument()
    })

    test('shows a language label in the title bar when passed as title', () => {
        render(<SnapshotPane content="const x = 1" title="javascript" />)

        expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    test('renders no title label when title is an empty string', () => {
        render(<SnapshotPane content="const x = 1" title="" />)

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

    test('renders the provided code content when content is non-empty', () => {
        const { container } = render(<SnapshotPane content="const x = 42" title="" />)

        expect(container.querySelector('code').textContent).toBe('const x = 42')
    })
})
