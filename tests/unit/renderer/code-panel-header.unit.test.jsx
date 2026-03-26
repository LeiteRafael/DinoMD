import { render, screen, fireEvent } from '@testing-library/react'
import CodePanelHeader from '../../../src/renderer/src/components/CodePanelHeader/index.jsx'

const noop = () => {}

test('renders Code and Snapshot toggle buttons', () => {
    render(<CodePanelHeader mode="code" onModeChange={noop} />)
    expect(screen.getByRole('button', { name: 'Code' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Snapshot' })).toBeInTheDocument()
})

test('Code button has aria-pressed true in code mode', () => {
    render(<CodePanelHeader mode="code" onModeChange={noop} />)
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Snapshot' })).toHaveAttribute(
        'aria-pressed',
        'false'
    )
})

test('Snapshot button has aria-pressed true in snapshot mode', () => {
    render(<CodePanelHeader mode="snapshot" onModeChange={noop} />)
    expect(screen.getByRole('button', { name: 'Snapshot' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'false')
})

test('calls onModeChange with correct id when button clicked', () => {
    const onModeChange = vi.fn()
    render(<CodePanelHeader mode="code" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Snapshot' }))
    expect(onModeChange).toHaveBeenCalledWith('snapshot')
})

test('Export PNG button is not visible in code mode', () => {
    render(
        <CodePanelHeader
            mode="code"
            onModeChange={noop}
            onExport={noop}
            exporting={false}
            error={null}
        />
    )
    expect(screen.queryByRole('button', { name: 'Export as PNG' })).not.toBeInTheDocument()
})

test('Export PNG button is visible in snapshot mode', () => {
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={noop}
            exporting={false}
            error={null}
        />
    )
    expect(screen.getByRole('button', { name: 'Export as PNG' })).toBeInTheDocument()
})

test('Export PNG button is disabled when exporting is true', () => {
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={noop}
            exporting={true}
            error={null}
        />
    )
    expect(screen.getByRole('button', { name: 'Export as PNG' })).toBeDisabled()
})

test('Export PNG button shows Exporting text when exporting is true', () => {
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={noop}
            exporting={true}
            error={null}
        />
    )
    expect(screen.getByRole('button', { name: 'Export as PNG' })).toHaveTextContent('Exporting…')
})

test('error message is shown when error is set in snapshot mode', () => {
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={noop}
            exporting={false}
            error="Export failed. Please try again."
        />
    )
    expect(screen.getByText('Export failed. Please try again.')).toBeInTheDocument()
})

test('error message is not shown when error is null', () => {
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={noop}
            exporting={false}
            error={null}
        />
    )
    expect(screen.queryByText('Export failed. Please try again.')).not.toBeInTheDocument()
})

test('calls onExport when Export PNG button clicked', () => {
    const onExport = vi.fn()
    render(
        <CodePanelHeader
            mode="snapshot"
            onModeChange={noop}
            onExport={onExport}
            exporting={false}
            error={null}
        />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Export as PNG' }))
    expect(onExport).toHaveBeenCalledTimes(1)
})
