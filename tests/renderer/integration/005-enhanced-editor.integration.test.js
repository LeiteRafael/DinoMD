import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MarkdownEditor from '../../../src/renderer/src/components/MarkdownEditor/index.jsx'

describe('MarkdownEditor component integration', () => {
    test('renders a textarea with the provided content value', () => {
        render(<MarkdownEditor value="# Heading" onChange={vi.fn()} />)

        expect(screen.getByRole('textbox', { name: /markdown editor/i })).toHaveValue('# Heading')
    })

    test('calls onChange with updated content when user types in the textarea', () => {
        const onChange = vi.fn()

        render(<MarkdownEditor value="" onChange={onChange} />)
        fireEvent.change(screen.getByRole('textbox', { name: /markdown editor/i }), {
            target: { value: '## New Section' },
        })

        expect(onChange).toHaveBeenCalledWith('## New Section')
    })

    test('renders a line number for each line of content', () => {
        render(<MarkdownEditor value={'line one\nline two\nline three'} onChange={vi.fn()} />)

        expect(screen.getByText('1\u200B')).toBeInTheDocument()
        expect(screen.getByText('2\u200B')).toBeInTheDocument()
        expect(screen.getByText('3\u200B')).toBeInTheDocument()
    })

    test('textarea has spellCheck disabled', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} />)

        expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
    })

    test('placeholder text appears when value is empty', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} placeholder="Start writing…" />)

        expect(screen.getByPlaceholderText('Start writing…')).toBeInTheDocument()
    })
})
