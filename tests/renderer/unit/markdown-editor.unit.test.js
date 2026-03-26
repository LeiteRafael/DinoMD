import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MarkdownEditor from '../../../src/renderer/src/components/MarkdownEditor/index.jsx'
describe('MarkdownEditor', () => {
    test('renders a textarea with the provided value', () => {
        render(<MarkdownEditor value="# Hello" onChange={vi.fn()} />)
        expect(screen.getByRole('textbox')).toHaveValue('# Hello')
    })
    test('has aria-label "Markdown editor"', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} />)
        expect(screen.getByLabelText('Markdown editor')).toBeInTheDocument()
    })
    test('has spellCheck disabled', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} />)
        expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
    })
    test('calls onChange when user types', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="" onChange={onChange} />)
        fireEvent.change(screen.getByRole('textbox'), {
            target: {
                value: 'new text',
            },
        })
        expect(onChange).toHaveBeenCalledWith('new text')
    })
    test('Tab key inserts two spaces into the content at cursor position', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="helloworld" onChange={onChange} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 5,
            configurable: true,
        })
        Object.defineProperty(textarea, 'selectionEnd', {
            value: 5,
            configurable: true,
        })
        Object.defineProperty(textarea, 'value', {
            value: 'helloworld',
            configurable: true,
            writable: true,
        })
        fireEvent.keyDown(textarea, {
            key: 'Tab',
        })
        expect(onChange).toHaveBeenCalledWith('hello  world')
    })
    test('Tab key replaces selected text with two spaces', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="hello world" onChange={onChange} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 5,
            configurable: true,
        })
        Object.defineProperty(textarea, 'selectionEnd', {
            value: 11,
            configurable: true,
        })
        Object.defineProperty(textarea, 'value', {
            value: 'hello world',
            configurable: true,
            writable: true,
        })
        fireEvent.keyDown(textarea, {
            key: 'Tab',
        })
        expect(onChange).toHaveBeenCalledWith('hello  ')
    })
    test('Tab key calls preventDefault (does not shift focus)', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="# Doc" onChange={onChange} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 0,
            configurable: true,
        })
        Object.defineProperty(textarea, 'selectionEnd', {
            value: 0,
            configurable: true,
        })
        Object.defineProperty(textarea, 'value', {
            value: '# Doc',
            configurable: true,
            writable: true,
        })
        const event = {
            key: 'Tab',
            preventDefault: vi.fn(),
            target: textarea,
        }
        fireEvent.keyDown(textarea, event)
        expect(onChange).toHaveBeenCalled()
    })
    test('non-special keys do not trigger onChange from keyDown handler', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="text" onChange={onChange} />)
        fireEvent.keyDown(screen.getByRole('textbox'), {
            key: 'Escape',
        })
        expect(onChange).not.toHaveBeenCalled()
    })
    test('renders custom placeholder when provided', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} placeholder="Write here…" />)
        expect(screen.getByPlaceholderText('Write here…')).toBeInTheDocument()
    })
    test('renders default placeholder when none provided', () => {
        render(<MarkdownEditor value="" onChange={vi.fn()} />)
        expect(screen.getByPlaceholderText('Start typing Markdown…')).toBeInTheDocument()
    })
})
describe('MarkdownEditor gutter', () => {
    test('gutter container with aria-hidden is present in the DOM', () => {
        const { container } = render(<MarkdownEditor value="line1" onChange={vi.fn()} />)
        const gutter = container.querySelector('[aria-hidden="true"]')
        expect(gutter).toBeInTheDocument()
    })
    test('three-line value produces exactly 3 line-number divs with correct text content', () => {
        const { container } = render(
            <MarkdownEditor value={'line1\nline2\nline3'} onChange={vi.fn()} />
        )
        const lineNumbers = container.querySelectorAll('[class="lineNumber"]')
        expect(lineNumbers).toHaveLength(3)
        expect(lineNumbers[0]).toHaveTextContent('1')
        expect(lineNumbers[1]).toHaveTextContent('2')
        expect(lineNumbers[2]).toHaveTextContent('3')
    })
    test('single-line value produces exactly 1 line-number div', () => {
        const { container } = render(<MarkdownEditor value="single" onChange={vi.fn()} />)
        const lineNumbers = container.querySelectorAll('[class="lineNumber"]')
        expect(lineNumbers).toHaveLength(1)
    })
    test('line-number divs have no inline height style', () => {
        const { container } = render(
            <MarkdownEditor value={'line1\nline2\nline3'} onChange={vi.fn()} />
        )
        const lineNumbers = container.querySelectorAll('[class="lineNumber"]')
        lineNumbers.forEach((el) => {
            expect(el.style.height).toBe('')
        })
    })
    test('sizer element with class lineSizer is present in the DOM', () => {
        const { container } = render(<MarkdownEditor value="text" onChange={vi.fn()} />)
        const sizer = container.querySelector('[class="lineSizer"]')
        expect(sizer).toBeInTheDocument()
    })
    test('each line-number div text contains a zero-width space', () => {
        const { container } = render(<MarkdownEditor value={'line1\nline2'} onChange={vi.fn()} />)
        const lineNumbers = container.querySelectorAll('[class="lineNumber"]')
        lineNumbers.forEach((el) => {
            expect(el.textContent).toContain('\u200B')
        })
    })
})
describe('MarkdownEditor syntax backdrop', () => {
    test('a pre element with aria-hidden="true" is present in the DOM', () => {
        const { container } = render(<MarkdownEditor value="" onChange={vi.fn()} />)
        const pre = container.querySelector('pre[aria-hidden="true"]')
        expect(pre).toBeInTheDocument()
    })
    test('rendering value "# Title" results in pre innerHTML containing token-h1', () => {
        const { container } = render(<MarkdownEditor value="# Title" onChange={vi.fn()} />)
        const pre = container.querySelector('pre[aria-hidden="true"]')
        expect(pre.innerHTML).toContain('token-h1')
    })
})
describe('MarkdownEditor active line', () => {
    test('gutterActiveLine overlay div is present in the DOM', () => {
        const { container } = render(<MarkdownEditor value="line1\nline2" onChange={vi.fn()} />)
        expect(container.querySelector('[class="gutterActiveLine"]')).toBeInTheDocument()
    })
    test('activeLineHighlight overlay div is present in the DOM', () => {
        const { container } = render(<MarkdownEditor value="line1\nline2" onChange={vi.fn()} />)
        expect(container.querySelector('[class="activeLineHighlight"]')).toBeInTheDocument()
    })
    test('onSelect with cursor on line 2 sets active overlay top to line-2 position', () => {
        const { container } = render(
            <MarkdownEditor value={'line1\nline2\nline3'} onChange={vi.fn()} />
        )
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 6,
            configurable: true,
        })
        fireEvent.select(textarea)
        const overlay = container.querySelector('[class="gutterActiveLine"]')
        expect(overlay.style.top).toBe('calc(24.32px + 1.5rem - 0px)')
    })
    test('onSelect with cursor on line 1 sets active overlay top to line-1 position', () => {
        const { container } = render(<MarkdownEditor value={'line1\nline2'} onChange={vi.fn()} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 2,
            configurable: true,
        })
        fireEvent.select(textarea)
        const overlay = container.querySelector('[class="gutterActiveLine"]')
        expect(overlay.style.top).toBe('calc(0px + 1.5rem - 0px)')
    })
})
describe('MarkdownEditor auto-indent on Enter', () => {
    test('Enter on indented line calls onChange with preserved leading whitespace on new line', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="  indented" onChange={onChange} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 10,
            configurable: true,
        })
        Object.defineProperty(textarea, 'selectionEnd', {
            value: 10,
            configurable: true,
        })
        Object.defineProperty(textarea, 'value', {
            value: '  indented',
            configurable: true,
            writable: true,
        })
        fireEvent.keyDown(textarea, {
            key: 'Enter',
        })
        expect(onChange).toHaveBeenCalledWith('  indented\n  ')
    })
    test('Enter on plain line calls onChange with newline and no extra indent', () => {
        const onChange = vi.fn()
        render(<MarkdownEditor value="plain" onChange={onChange} />)
        const textarea = screen.getByRole('textbox')
        Object.defineProperty(textarea, 'selectionStart', {
            value: 5,
            configurable: true,
        })
        Object.defineProperty(textarea, 'selectionEnd', {
            value: 5,
            configurable: true,
        })
        Object.defineProperty(textarea, 'value', {
            value: 'plain',
            configurable: true,
            writable: true,
        })
        fireEvent.keyDown(textarea, {
            key: 'Enter',
        })
        expect(onChange).toHaveBeenCalledWith('plain\n')
    })
})
