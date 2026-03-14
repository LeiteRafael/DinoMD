// Tests for EditorPage — unsaved-changes guard, save flow, delete modal, error banner
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('../../src/renderer/src/services/api.js', () => ({
  api: {
    create: jest.fn(),
    readContent: jest.fn(),
    save: jest.fn(),
    rename: jest.fn(),
    delete: jest.fn(),
    onFileChangedExternally: jest.fn(),
    removeFileChangedListener: jest.fn()
  }
}))

import EditorPage from '../../src/renderer/src/pages/EditorPage.jsx'

// ── Helper: build a mock editorHook prop ──────────────────────────────────────
function makeHook(overrides = {}) {
  // Extract session overrides separately so the top-level spread
  // does not clobber the fully-merged session object.
  const { session: sessionOverrides, ...hookOverrides } = overrides
  return {
    session: {
      documentId: 'doc-001',
      filePath: '/notes/my-doc.md',
      name: 'My Doc',
      content: '# Hello',
      savedContent: '# Hello',
      mtimeMs: null,
      isDraft: false,
      ...(sessionOverrides ?? {})
    },
    isDirty: false,
    saving: false,
    error: null,
    setError: jest.fn(),
    updateContent: jest.fn(),
    save: jest.fn(() => Promise.resolve({ saved: true, canceled: false })),
    rename: jest.fn(() => Promise.resolve({ success: true, newFilePath: '/notes/my-doc.md' })),
    discard: jest.fn(),
    deleteDocument: jest.fn(() => Promise.resolve({ success: true, canForceDelete: false, error: null })),
    reloadContent: jest.fn(() => Promise.resolve()),
    ...hookOverrides
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────
describe('EditorPage rendering', () => {
  test('displays the document name from the session', () => {
    render(
      <EditorPage
        editorHook={makeHook()}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByText('My Doc')).toBeInTheDocument()
  })

  test('shows a Save button', () => {
    render(
      <EditorPage
        editorHook={makeHook()}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  test('shows a Delete button for non-draft documents', () => {
    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: false } })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  test('does NOT show a Delete button for drafts', () => {
    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: true } })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /delete document/i })).not.toBeInTheDocument()
  })

  test('Save button is disabled when not dirty and not a draft', () => {
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: false, session: { isDraft: false } })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  test('Save button is enabled when isDirty', () => {
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: true })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
  })

  test('shows "Saving…" label while save is in progress', () => {
    render(
      <EditorPage
        editorHook={makeHook({ saving: true })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    // The button text changes to "Saving…" while saving=true.
    // aria-label stays "Save document", so query by visible text.
    expect(screen.getByText(/saving/i)).toBeInTheDocument()
  })

  test('displays a Back button', () => {
    render(
      <EditorPage
        editorHook={makeHook()}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })
})

// ── Navigation guard ──────────────────────────────────────────────────────────
describe('navigation guard (unsaved changes)', () => {
  test('calls onBack immediately when not dirty', () => {
    const onBack = jest.fn()
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: false })}
        onBack={onBack}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  test('shows ConfirmModal (not onBack) when Back is clicked with unsaved changes', () => {
    const onBack = jest.fn()
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: true })}
        onBack={onBack}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(onBack).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // Target the modal heading specifically to avoid matching the body message too
    expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
  })

  test('closes modal and calls onBack when Discard is chosen', () => {
    const onBack = jest.fn()
    const discard = jest.fn()
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: true, discard })}
        onBack={onBack}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /discard/i }))

    expect(discard).toHaveBeenCalledTimes(1)
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes modal without calling onBack when Cancel is chosen', () => {
    const onBack = jest.fn()
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: true })}
        onBack={onBack}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(onBack).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('saves and calls onBack when Save is chosen in the modal', async () => {
    const onBack = jest.fn()
    const save = jest.fn(() => Promise.resolve({ saved: true, canceled: false }))
    render(
      <EditorPage
        editorHook={makeHook({ isDirty: true, save })}
        onBack={onBack}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(save).toHaveBeenCalledTimes(1)
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })
})

// ── Delete flow ───────────────────────────────────────────────────────────────
describe('delete flow', () => {
  test('shows ConfirmModal when Delete button is clicked', () => {
    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: false } })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete document/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/delete document/i)).toBeInTheDocument()
  })

  test('calls deleteDocument and onDocumentDeleted on confirmation', async () => {
    const deleteDocument = jest.fn(() =>
      Promise.resolve({ success: true, canForceDelete: false, error: null })
    )
    const onDocumentDeleted = jest.fn()

    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: false }, deleteDocument })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={onDocumentDeleted}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete document/i }))
    fireEvent.click(screen.getByRole('button', { name: /move to trash/i }))

    await waitFor(() => {
      expect(deleteDocument).toHaveBeenCalledTimes(1)
      expect(onDocumentDeleted).toHaveBeenCalledWith('doc-001')
    })
  })

  test('closes modal without deleting when Cancel is clicked', () => {
    const deleteDocument = jest.fn()
    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: false }, deleteDocument })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete document/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(deleteDocument).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('shows force-delete modal when trashItem fails (canForceDelete=true)', async () => {
    const deleteDocument = jest.fn(() =>
      Promise.resolve({ success: false, canForceDelete: true, error: 'Trash unavailable' })
    )

    render(
      <EditorPage
        editorHook={makeHook({ session: { isDraft: false }, deleteDocument })}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete document/i }))
    fireEvent.click(screen.getByRole('button', { name: /move to trash/i }))

    await waitFor(() => {
      expect(screen.getByText(/move to trash failed/i)).toBeInTheDocument()
    })
  })
})

// ── Inline title rename ───────────────────────────────────────────────────────
describe('inline title rename', () => {
  test('clicking the title switches to an input field', () => {
    render(
      <EditorPage
        editorHook={makeHook()}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByText('My Doc'))
    expect(screen.getByRole('textbox', { name: /document name/i })).toBeInTheDocument()
  })

  test('pressing Escape reverts to the original name without calling rename', () => {
    render(
      <EditorPage
        editorHook={makeHook()}
        onBack={jest.fn()}
        onDocumentSaved={jest.fn()}
        onDocumentDeleted={jest.fn()}
      />
    )
    fireEvent.click(screen.getByText('My Doc'))
    const input = screen.getByRole('textbox', { name: /document name/i })
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('textbox', { name: /document name/i })).not.toBeInTheDocument()
    expect(screen.getByText('My Doc')).toBeInTheDocument()
  })
})
