import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('../../../src/renderer/src/hooks/useChangeIndicators.js', () => ({
    default: vi.fn(),
}))

import useChangeIndicators from '../../../src/renderer/src/hooks/useChangeIndicators.js'
import MarkdownEditor from '../../../src/renderer/src/components/MarkdownEditor/index.jsx'

describe('change indicator rendering in MarkdownEditor gutter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders added indicator span for added line in changeMap', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[2, 'added']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor
                value={'line1\nline2\nline3'}
                onChange={vi.fn()}
                savedContent="line1\nline2"
            />
        )

        expect(container.querySelectorAll('.indicatorAdded').length).toBe(1)
    })

    test('renders modified indicator span for modified line in changeMap', () => {
        useChangeIndicators.mockReturnValue({
            changeMap: new Map([[1, 'modified']]),
            isDirty: true,
        })

        const { container } = render(
            <MarkdownEditor
                value={'modified line'}
                onChange={vi.fn()}
                savedContent="original line"
            />
        )

        expect(container.querySelectorAll('.indicatorModified').length).toBe(1)
    })

    test('renders deleted indicator span for deleted line in changeMap', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[2, 'deleted']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor
                value={'line1\nline3'}
                onChange={vi.fn()}
                savedContent="line1\nline2\nline3"
            />
        )

        expect(container.querySelectorAll('.indicatorDeleted').length).toBe(1)
    })

    test('added indicator has correct title attribute', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[1, 'added']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor value={'new line'} onChange={vi.fn()} savedContent="" />
        )

        expect(container.querySelector('.indicatorAdded').getAttribute('title')).toBe('Added line')
    })

    test('modified indicator has correct title attribute', () => {
        useChangeIndicators.mockReturnValue({
            changeMap: new Map([[1, 'modified']]),
            isDirty: true,
        })

        const { container } = render(
            <MarkdownEditor value={'changed'} onChange={vi.fn()} savedContent="original" />
        )

        expect(container.querySelector('.indicatorModified').getAttribute('title')).toBe(
            'Modified line'
        )
    })

    test('deleted indicator has correct title attribute', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[1, 'deleted']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor value={''} onChange={vi.fn()} savedContent="deleted line" />
        )

        expect(container.querySelector('.indicatorDeleted').getAttribute('title')).toBe(
            'Deleted line'
        )
    })

    test('added indicator has correct aria-label', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[1, 'added']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor value={'new line'} onChange={vi.fn()} savedContent="" />
        )

        expect(container.querySelector('.indicatorAdded').getAttribute('aria-label')).toBe(
            'Added line'
        )
    })

    test('modified indicator has correct aria-label', () => {
        useChangeIndicators.mockReturnValue({
            changeMap: new Map([[1, 'modified']]),
            isDirty: true,
        })

        const { container } = render(
            <MarkdownEditor value={'changed'} onChange={vi.fn()} savedContent="original" />
        )

        expect(container.querySelector('.indicatorModified').getAttribute('aria-label')).toBe(
            'Modified line'
        )
    })

    test('deleted indicator has correct aria-label', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[1, 'deleted']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor value={''} onChange={vi.fn()} savedContent="deleted line" />
        )

        expect(container.querySelector('.indicatorDeleted').getAttribute('aria-label')).toBe(
            'Deleted line'
        )
    })

    test('renders no indicators when changeMap is empty', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map(), isDirty: false })

        const { container } = render(
            <MarkdownEditor value={'line1\nline2'} onChange={vi.fn()} savedContent="line1\nline2" />
        )

        expect(container.querySelectorAll('.changeIndicator').length).toBe(0)
    })

    test('renders multiple indicators for multiple changed lines', () => {
        useChangeIndicators.mockReturnValue({
            changeMap: new Map([
                [1, 'modified'],
                [3, 'added'],
            ]),
            isDirty: true,
        })

        const { container } = render(
            <MarkdownEditor
                value={'mod\nline2\nnew'}
                onChange={vi.fn()}
                savedContent="orig\nline2"
            />
        )

        expect(container.querySelectorAll('.changeIndicator').length).toBe(2)
    })

    test('indicator span has changeIndicator base class', () => {
        useChangeIndicators.mockReturnValue({ changeMap: new Map([[1, 'added']]), isDirty: true })

        const { container } = render(
            <MarkdownEditor value={'new line'} onChange={vi.fn()} savedContent="" />
        )

        expect(container.querySelector('.changeIndicator')).toBeInTheDocument()
    })
})
