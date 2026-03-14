// T022: Unit tests for DocumentCard component
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DocumentCard from '../../src/renderer/src/components/DocumentCard/index.jsx'

describe('DocumentCard', () => {
  test('renders the document name', () => {
    render(<DocumentCard id="1" name="My Note" status="available" onClick={jest.fn()} />)
    expect(screen.getByText('My Note')).toBeInTheDocument()
  })

  test('calls onClick with id and name when clicked and status is available', () => {
    const onClick = jest.fn()
    render(<DocumentCard id="abc" name="My Note" status="available" onClick={onClick} />)
    fireEvent.click(screen.getByText('My Note'))
    expect(onClick).toHaveBeenCalledWith('abc', 'My Note')
  })

  test('does NOT call onClick when status is missing', () => {
    const onClick = jest.fn()
    render(<DocumentCard id="1" name="Gone" status="missing" onClick={onClick} />)
    fireEvent.click(screen.getByText('Gone'))
    expect(onClick).not.toHaveBeenCalled()
  })

  test('shows a "Missing" badge when status is missing', () => {
    render(<DocumentCard id="1" name="Gone" status="missing" onClick={jest.fn()} />)
    expect(screen.getByText('Missing')).toBeInTheDocument()
  })

  test('does NOT show a badge when status is available', () => {
    render(<DocumentCard id="1" name="OK" status="available" onClick={jest.fn()} />)
    expect(screen.queryByText('Missing')).not.toBeInTheDocument()
  })
})
