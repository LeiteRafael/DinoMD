````skill
---
name: jest-testing-standards
description: Guide for writing tests in this project. Use this whenever creating, editing, or reviewing test files for main-process or renderer code.
---

## Core principles

- Tests communicate intent through naming and structure, not comments
- Never add inline comments or block comments to test files
- Each test verifies exactly one behavior
- Test names are declarative sentences that describe what the system does, not what the test does
- Tests must be deterministic — no random values, no time-dependence without explicit control
- Tests must be independent — no shared mutable state between tests

---

## File placement and naming

- Main-process tests: `tests/main/<module-name>.test.js`
- Renderer tests: `tests/renderer/<ComponentOrHook>.test.js`
- File name must match the module or component under test: `DocumentCard.test.js`, `useDocuments.test.js`, `documents.test.js`
- One test file per module, component, or hook

---

## Test environments

- Main-process code (`src/main/`): use Jest `testEnvironment: 'node'`
- Renderer code (`src/renderer/`): use Jest `testEnvironment: 'jsdom'`
- Environment is controlled by project configuration in `jest.config.js` — do not override it per-file

---

## Structure

- Group related tests under `describe` blocks named after the feature, component, or IPC channel being tested
- Use `test()` for individual cases — do not use `it()`
- Nest `describe` blocks only when grouping by sub-feature or input category adds clarity

```js
describe('documents:import-files', () => {
  test('imports a valid .md file and returns it in imported[]', async () => { ... })
  test('skips duplicate file (same path already imported)', async () => { ... })
  test('returns empty imported[] when dialog is cancelled', async () => { ... })
})
```

---

## Arrange / Act / Assert

- Structure every test as: arrange inputs and mocks → act by calling the unit under test → assert on the result
- Keep each section visually separated by a blank line
- Do not interleave setup with assertions

```js
test('returns file content for a valid document id', async () => {
  store.findDocumentById.mockReturnValue({ id: 'doc1', filePath: '/readme.md' })
  fileUtils.readFileAsUtf8.mockResolvedValue('# My Readme\nHello world')

  const result = await invokeHandler('documents:read-content', { id: 'doc1' })

  expect(result.success).toBe(true)
  expect(result.content).toBe('# My Readme\nHello world')
})
```

---

## Mocking

- Mock entire modules with `jest.mock()` at the top of the file, before any imports of the module under test
- Always import mocked modules after `jest.mock()` declarations
- Prefer factory functions in `jest.mock()` that return `jest.fn()` for every exported function
- Set specific return values per test using `.mockReturnValue()`, `.mockResolvedValue()`, or `.mockRejectedValue()`
- Reset all mocks in `beforeEach` with `jest.clearAllMocks()`

```js
jest.mock('../../src/main/fs/fileUtils.js', () => ({
  fileExists: jest.fn(() => Promise.resolve(true)),
  readFileAsUtf8: jest.fn(() => Promise.resolve('# Hello')),
  writeFileUtf8: jest.fn(() => Promise.resolve()),
}))

const fileUtils = require('../../src/main/fs/fileUtils.js')

beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## IPC handler tests (main process)

- Use `invokeHandler(channel, args)` from `tests/__mocks__/electron.js` to simulate renderer-to-main IPC calls
- Register handlers in `beforeAll` and re-register in `beforeEach` after `jest.clearAllMocks()` because clearing mocks resets `ipcMain.handle`
- Always call `resetMocks()` from the Electron mock before `jest.clearAllMocks()` to clear the handler registry

```js
const { invokeHandler, resetMocks } = require('../../tests/__mocks__/electron.js')
const { registerDocumentHandlers } = require('../../src/main/ipc/documents.js')

beforeAll(() => {
  registerDocumentHandlers()
})

beforeEach(() => {
  resetMocks()
  jest.clearAllMocks()
  registerDocumentHandlers()
})
```

- Assert on `result.success`, `result.error`, and the specific payload fields the contract defines
- Verify side effects (e.g., `store.setDocuments` was called) with `toHaveBeenCalledTimes` and `toHaveBeenCalledWith`

---

## Component tests (renderer)

- Use `@testing-library/react` — `render`, `screen`, `fireEvent`, `waitFor`
- Import `@testing-library/jest-dom` for DOM matchers (`toBeInTheDocument`, `toHaveClass`, etc.)
- Query elements by visible text, role, or label — not by class names or internal structure
- Use `fireEvent` for simple interactions; use `userEvent` for realistic keyboard/pointer sequences
- Do not assert on implementation details such as state variables or internal component structure

```js
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DocumentCard from '../../src/renderer/src/components/DocumentCard/index.jsx'

describe('DocumentCard', () => {
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
})
```

---

## Hook tests (renderer)

- Use `renderHook` and `act` from `@testing-library/react`
- Wrap async state updates inside `act(async () => {})`
- Mock the `api` service module before importing the hook

```js
import { renderHook, act } from '@testing-library/react'

jest.mock('../../src/renderer/src/services/api.js', () => ({
  api: {
    getAll: jest.fn(),
    importFiles: jest.fn(),
  }
}))

const { api } = require('../../src/renderer/src/services/api.js')
const useDocumentsModule = require('../../src/renderer/src/hooks/useDocuments.js')
const useDocuments = useDocumentsModule.default

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('loads documents on mount', async () => {
    api.getAll.mockResolvedValue({ success: true, documents: sampleDocs })

    const { result } = renderHook(() => useDocuments())

    expect(result.current.loading).toBe(true)

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.documents).toEqual(sampleDocs)
  })
})
```

---

## Assertions

- Prefer specific matchers over generic ones: `toBe` over `toBeTruthy`, `toHaveLength(0)` over `toHaveLength` with ambiguous value
- Assert both the happy path value and the structure — not just truthiness
- When testing error paths, assert `result.success === false` and `result.error` is defined
- When testing that something did not happen, use `.not.toHaveBeenCalled()` or `.not.toBeInTheDocument()`

```js
expect(result.success).toBe(true)
expect(result.imported).toHaveLength(1)
expect(result.imported[0].name).toBe('readme')
expect(result.skipped).toHaveLength(0)

expect(result.success).toBe(false)
expect(result.error).toBeDefined()
```

---

## Test data

- Define shared fixtures as named constants outside `describe` blocks
- Use realistic but minimal data — enough to exercise the behavior, nothing more
- Use fixed strings and dates — never `Date.now()` or `Math.random()`

```js
const sampleDocs = [
  { id: '1', name: 'Doc A', filePath: '/a.md', orderIndex: 0, status: 'available' },
  { id: '2', name: 'Doc B', filePath: '/b.md', orderIndex: 1, status: 'available' },
]
```

---

## CSS modules in renderer tests

- CSS module imports are mapped to `identity-obj-proxy` automatically via `jest.config.js`
- Do not mock CSS modules manually in test files

---

## What not to do

- Do not add comments explaining what a test does — rename the test instead
- Do not test implementation details — test observable behavior and public API contracts
- Do not share mutable state between tests — reset all mocks and state in `beforeEach`
- Do not use `it()` — use `test()` only
- Do not use `toBeTruthy` or `toBeFalsy` when a more specific matcher exists
- Do not write tests that always pass regardless of implementation
- Do not mock what you do not own — mock at the boundary (services, IPC, file system), not internal helpers
- Do not create test helper files unless the helper is reused across three or more test files
````
