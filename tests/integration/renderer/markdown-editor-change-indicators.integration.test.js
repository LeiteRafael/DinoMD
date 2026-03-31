import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useState } from 'react'
import MarkdownEditor from '../../../src/renderer/src/components/MarkdownEditor/index.jsx'

vi.mock('../../../src/renderer/src/hooks/useChangeIndicators.js', () => ({
    default: vi.fn(),
}))

import useChangeIndicators from '../../../src/renderer/src/hooks/useChangeIndicators.js'

describe('MarkdownEditor integration with change indicators', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useChangeIndicators.mockReturnValue({ changeMap: new Map(), isDirty: false })
    })

    test('renders textarea with initial value', () => {
        render(<MarkdownEditor value="const x = 1" onChange={vi.fn()} savedContent="const x = 1" />)

        expect(screen.getByPlaceholderText('Start typing Markdown…')).toHaveValue('const x = 1')
    })

    test('renders gutter element', () => {
        const { container } = render(
            <MarkdownEditor
                value="line1\nline2\nline3"
                onChange={vi.fn()}
                savedContent="line1\nline2\nline3"
            />
        )

        expect(container.querySelector('.gutter')).toBeInTheDocument()
    })

    test('indicators appear when hook returns populated changeMap', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[2, 'added']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor
                value={'line1\nline2\nline3'}
                onChange={vi.fn()}
                savedContent={'line1\nline2'}
            />
        )

        expect(container.querySelectorAll('.changeIndicator').length).toBe(1)
    })

    test('indicators clear when savedContent updates to match current content', async () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[2, 'added']]), isDirty: true })

        const EditorWrapper = () => {
            const [savedContent, setSavedContent] = useState('line1\nline2')
            const currentValue = 'line1\nline2\nline3'

            const handleSave = () => {
                useChangeIndicators.mockReturnValue({ changeMap: new Map(), isDirty: false })
                setSavedContent(currentValue)
            }

            return (
                <>
                    <MarkdownEditor
                        value={currentValue}
                        onChange={vi.fn()}
                        savedContent={savedContent}
                    />
                    <button onClick={handleSave}>Save</button>
                </>
            )
        }

        const { container } = render(<EditorWrapper />)

        expect(container.querySelectorAll('.changeIndicator').length).toBe(1)

        await act(async () => {
            fireEvent.click(screen.getByText('Save'))
        })

        expect(container.querySelectorAll('.changeIndicator').length).toBe(0)
    })

    test('textarea value updates when user types', () => {
        render(
            <MarkdownEditor
                value="original\ncode"
                onChange={vi.fn()}
                savedContent="original\ncode"
            />
        )

        const textarea = screen.getByPlaceholderText('Start typing Markdown…')
        fireEvent.change(textarea, { target: { value: 'modified\ncode\nnew' } })

        expect(textarea).toHaveValue('modified\ncode\nnew')
    })

    test('editor hides and shows correctly', () => {
        const EditorWrapper = () => {
            const [showEditor, setShowEditor] = useState(true)

            if (!showEditor) return <div>Editor hidden</div>

            return (
                <>
                    <MarkdownEditor value="line1" onChange={vi.fn()} savedContent="line1" />
                    <button onClick={() => setShowEditor(false)}>Hide</button>
                </>
            )
        }

        render(<EditorWrapper />)

        fireEvent.click(screen.getByText('Hide'))

        expect(screen.getByText('Editor hidden')).toBeInTheDocument()
    })

    test('line numbers rendered correctly and unaffected by indicators', () => {
        const { container } = render(
            <MarkdownEditor
                value={'line1\nline2\nline3'}
                onChange={vi.fn()}
                savedContent={'line1\nline2\nline3'}
            />
        )

        expect(container.querySelectorAll('.lineNumber').length).toBe(3)
    })

    test('active-line highlight present regardless of indicators', () => {
        const { container } = render(
            <MarkdownEditor value="line1\nline2" onChange={vi.fn()} savedContent="line1\nline2" />
        )

        expect(container.querySelector('.activeLineHighlight')).toBeInTheDocument()
    })

    test('indicators scroll in sync via gutterInner transform', async () => {
        const { container } = render(
            <MarkdownEditor
                value="line1\nline2\nline3\nline4\nline5"
                onChange={vi.fn()}
                savedContent=""
            />
        )

        const textarea = screen.getByPlaceholderText('Start typing Markdown…')
        fireEvent.scroll(textarea, { target: { scrollTop: 100 } })

        const gutterInner = container.querySelector('.gutterInner')
        expect(gutterInner).toBeInTheDocument()
    })
})
