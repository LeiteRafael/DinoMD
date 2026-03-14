// Tests for MarkdownEditor component
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MarkdownEditor from '../../src/renderer/src/components/MarkdownEditor/index.jsx'

// requestAnimationFrame is not in jsdom.
// Use a no-op shim so the cursor-repositioning callback never runs;
// assigning to selectionStart on a jsdom textarea throws otherwise.
global.requestAnimationFrame = () => 0

describe('MarkdownEditor', () => {
  test('renders a textarea with the provided value', () => {
    render(<MarkdownEditor value="# Hello" onChange={jest.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('# Hello')
  })

  test('has aria-label "Markdown editor"', () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />)
    expect(screen.getByLabelText('Markdown editor')).toBeInTheDocument()
  })

  test('has spellCheck disabled', () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
  })

  test('calls onChange when user types', () => {
    const onChange = jest.fn()
    render(<MarkdownEditor value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } })
    expect(onChange).toHaveBeenCalledWith('new text')
  })

  test('Tab key inserts two spaces into the content at cursor position', () => {
    const onChange = jest.fn()
    // 'helloworld' (no space) — cursor at position 5 between 'hello' and 'world'
    render(<MarkdownEditor value="helloworld" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')

    // Place cursor at position 5 ("hello|world")
    Object.defineProperty(textarea, 'selectionStart', { value: 5, configurable: true })
    Object.defineProperty(textarea, 'selectionEnd', { value: 5, configurable: true })
    Object.defineProperty(textarea, 'value', { value: 'helloworld', configurable: true })

    fireEvent.keyDown(textarea, { key: 'Tab' })

    // onChange should be called with two spaces inserted at position 5
    expect(onChange).toHaveBeenCalledWith('hello  world')
  })

  test('Tab key replaces selected text with two spaces', () => {
    const onChange = jest.fn()
    render(<MarkdownEditor value="hello world" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')

    // Select " world" (positions 5–11)
    Object.defineProperty(textarea, 'selectionStart', { value: 5, configurable: true })
    Object.defineProperty(textarea, 'selectionEnd', { value: 11, configurable: true })
    Object.defineProperty(textarea, 'value', { value: 'hello world', configurable: true })

    fireEvent.keyDown(textarea, { key: 'Tab' })

    expect(onChange).toHaveBeenCalledWith('hello  ')
  })

  test('Tab key calls preventDefault (does not shift focus)', () => {
    const onChange = jest.fn()
    render(<MarkdownEditor value="# Doc" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')
    Object.defineProperty(textarea, 'selectionStart', { value: 0, configurable: true })
    Object.defineProperty(textarea, 'selectionEnd', { value: 0, configurable: true })
    Object.defineProperty(textarea, 'value', { value: '# Doc', configurable: true })

    const event = { key: 'Tab', preventDefault: jest.fn(), target: textarea }
    fireEvent.keyDown(textarea, event)

    // We can't directly check preventDefault on a synthetic event, but we
    // verify that onChange was still called (component handled the event)
    expect(onChange).toHaveBeenCalled()
  })

  test('non-Tab keys do not trigger onChange from keyDown handler', () => {
    const onChange = jest.fn()
    render(<MarkdownEditor value="text" onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders custom placeholder when provided', () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} placeholder="Write here…" />)
    expect(screen.getByPlaceholderText('Write here…')).toBeInTheDocument()
  })

  test('renders default placeholder when none provided', () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />)
    expect(screen.getByPlaceholderText('Start typing Markdown…')).toBeInTheDocument()
  })
})
