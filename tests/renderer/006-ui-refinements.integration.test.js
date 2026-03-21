import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useState } from 'react'
import ViewModeToggle from '../../src/renderer/src/components/ViewModeToggle/index.jsx'

function ToggleWrapper({ initialMode = 'split' }) {
    const [mode, setMode] = useState(initialMode)
    return <ViewModeToggle viewMode={mode} onModeChange={setMode} />
}

describe('ViewModeToggle mode switching integration', () => {
    test('renders all three mode buttons', () => {
        render(<ToggleWrapper />)

        expect(screen.getByRole('button', { name: 'Split' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Editor Only' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Preview Only' })).toBeInTheDocument()
    })

    test('active mode button has aria-pressed set to true', () => {
        render(<ToggleWrapper initialMode="split" />)

        expect(screen.getByRole('button', { name: 'Split' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        expect(screen.getByRole('button', { name: 'Editor Only' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    test('clicking Editor Only sets it as the active mode', () => {
        render(<ToggleWrapper />)

        fireEvent.click(screen.getByRole('button', { name: 'Editor Only' }))

        expect(screen.getByRole('button', { name: 'Editor Only' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        expect(screen.getByRole('button', { name: 'Split' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    test('clicking Preview Only deactivates the previously active button', () => {
        render(<ToggleWrapper initialMode="editor" />)

        fireEvent.click(screen.getByRole('button', { name: 'Preview Only' }))

        expect(screen.getByRole('button', { name: 'Preview Only' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        expect(screen.getByRole('button', { name: 'Editor Only' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    test('group has accessible label View mode', () => {
        render(<ToggleWrapper />)

        expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument()
    })
})
