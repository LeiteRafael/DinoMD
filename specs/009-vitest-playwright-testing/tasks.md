# Tasks: DinoMD Testing Infrastructure (Vitest + Playwright)

**Input**: Design documents from `/specs/009-vitest-playwright-testing/`
**Branch**: `009-vitest-playwright-testing`
**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup (Package Management)

**Purpose**: Install new dependencies and remove obsolete ones. All package changes happen here before any config or code work begins.

- [X] T001 Uninstall Jest and Babel packages: `npm uninstall jest babel-jest @babel/core @babel/preset-env @babel/preset-react jest-environment-jsdom jest-util` in `package.json`
- [X] T002 Install Vitest and V8 coverage provider: `npm install -D vitest @vitest/coverage-v8`
- [X] T003 Install Playwright test runner and download Chromium: `npm install -D @playwright/test` then `npx playwright install chromium`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All configuration, infrastructure, and test migration work that MUST be complete before any new test can be written.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — the test runner itself does not exist until these tasks are done.

### 2a — Vitest configuration

- [X] T004 Delete `jest.config.js` and `babel.config.js` from the repository root
- [X] T005 Create `vitest.workspace.js` at repository root — dual-environment workspace: project `main` (environment: `node`, includes `tests/main/**/*.test.js`, mocks `electron` module) and project `renderer` (environment: `jsdom`, includes `tests/renderer/**/*.test.{js,jsx}`, sets up `@testing-library/jest-dom` and CSS module mocks via `identity-obj-proxy`)
- [X] T006 Create `vitest.config.js` at repository root — coverage config: provider `v8`, includes `src/main/**`, `src/preload/**`, `src/renderer/src/**`, excludes `src/renderer/src/main.jsx`, reporters `['text', 'lcov', 'html']`, `reportsDirectory: 'coverage'`, initial thresholds at `lines: 50, functions: 40, branches: 45, statements: 50` (will be raised in Phase 5)
- [X] T007 Update `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"` — replacing all three existing Jest script entries

**Checkpoint**: `npm test` must pass with all existing tests green before proceeding to T008.

### 2b — Migrate existing unit tests (jest.fn → vi.fn)

All 20 files below require the same mechanical substitution: `jest.fn` → `vi.fn`, `jest.mock` → `vi.mock`, `jest.spyOn` → `vi.spyOn`, `jest.resetAllMocks` → `vi.resetAllMocks`, `jest.clearAllMocks` → `vi.clearAllMocks`. No test logic changes.

- [X] T008 [P] Migrate `tests/main/documents.test.js`
- [X] T009 [P] Migrate `tests/main/documents-edit.test.js`
- [X] T010 [P] Migrate `tests/main/folder.test.js`
- [X] T011 [P] Migrate `tests/main/ui-state.test.js`
- [X] T012 [P] Migrate `tests/renderer/DocumentCard.test.js`
- [X] T013 [P] Migrate `tests/renderer/DocumentList.test.js`
- [X] T014 [P] Migrate `tests/renderer/EditorPage.test.js`
- [X] T015 [P] Migrate `tests/renderer/MarkdownEditor.test.js`
- [X] T016 [P] Migrate `tests/renderer/MarkdownViewer.test.js`
- [X] T017 [P] Migrate `tests/renderer/Sidebar.test.js`
- [X] T018 [P] Migrate `tests/renderer/SplitViewPage.test.js`
- [X] T019 [P] Migrate `tests/renderer/clipboardUtils.test.js`
- [X] T020 [P] Migrate `tests/renderer/markdownTokenizer.test.js`
- [X] T021 [P] Migrate `tests/renderer/useDebounce.test.js`
- [X] T022 [P] Migrate `tests/renderer/useDocuments.test.js`
- [X] T023 [P] Migrate `tests/renderer/useEditor.test.js`
- [X] T024 [P] Migrate `tests/renderer/useFileTree.test.js`
- [X] T025 [P] Migrate `tests/renderer/useSidebar.test.js`
- [X] T026 [P] Migrate `tests/renderer/useSyncScroll.test.js`
- [X] T027 [P] Migrate `tests/renderer/useToast.test.js`

**Checkpoint**: `npm test` passes for all 23 migrated test files with zero failures.

### 2c — Playwright infrastructure

- [X] T028 Create `playwright.config.js` at repository root — `webServer: { command: 'npm run dev:web', url: 'http://localhost:5174', reuseExistingServer: !process.env.CI, timeout: 30_000 }`, `use: { baseURL: 'http://localhost:5174', screenshot: 'only-on-failure', video: 'off', trace: 'on-first-retry' }`, reporters: `['list']`, `['html', { outputFolder: 'playwright-report', open: 'never' }]`, `['junit', { outputFile: 'test-results/junit.xml' }]`, single project: `chromium` with `devices['Desktop Chrome']`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`
- [X] T029 Create `tests/e2e/pages/AppPage.js` — Page Object class wrapping Playwright `Page` instance: `goto()`, `documentCards()`, `documentCardByName(name)`, `editorContent()`, `previewPanel()`, `sidebar()`, `newDocumentButton()`, `importButton()`, `seedDocument(doc)` (injects into `localStorage` via `page.evaluate` using `dinomd:docs` key), `clearStorage()` (clears both `dinomd:docs` and `dinomd:ui`)
- [X] T030 Create `tests/e2e/fixtures/docs.js` — exports sample `DinoMDDocument` objects for use in E2E tests: at minimum one document per spec area (headings, code blocks, lists, edit content, split view content)
- [X] T031 Add E2E and combined scripts to `package.json`: `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`, `"test:e2e:headed": "playwright test --headed"`, `"test:all": "vitest run --coverage && playwright test"`
- [X] T032 Add `playwright-report/` and `test-results/` entries to `.gitignore`

**Checkpoint**: `npm run test:e2e` starts the dev server, connects to `localhost:5174`, executes (with 0 test files) and exits cleanly with no errors.

---

## Phase 3: User Story 1 - Developers Can Run Integration Tests (Priority: P1) 🎯 MVP

**Goal**: Eight Vitest integration tests (one per spec) verifying module-boundary interactions for each DinoMD feature area. A developer runs `npm test` and sees all unit and integration tests pass with a coverage report.

**Independent Test**: Run `npm test` and confirm the `[main]` and `[renderer]` project groups both pass, including the eight new `*.integration.test.js` files. Run `npm run test:coverage` and confirm an HTML coverage report is generated under `coverage/`.

- [X] T033 [P] [US1] Create `tests/renderer/001-import-view.integration.test.js` — renders `DocumentList` with mocked `api.documents.list()` returning two docs; asserts both `DocumentCard` elements appear; simulates click on first card and asserts navigation to reader view (mocked router)
- [X] T034 [P] [US1] Create `tests/renderer/002-create-edit.integration.test.js` — renders the editor page with `useEditor` hook; simulates typing content; asserts `api.documents.update()` is called with the correct content via `vi.fn()` spy on the API layer
- [X] T035 [P] [US1] Create `tests/renderer/003-split-view.integration.test.js` — renders `SplitViewPage`; asserts both the editor pane and preview pane are present in the DOM; simulates text input in the editor and asserts preview content updates
- [X] T036 [P] [US1] Create `tests/renderer/004-file-browser.integration.test.js` — renders `Sidebar` with mocked document list; asserts document items are rendered; simulates selecting an item and asserts the active document state updates
- [X] T037 [P] [US1] Create `tests/renderer/005-enhanced-editor.integration.test.js` — renders `MarkdownEditor` component; asserts the CodeMirror editor element is present; simulates keyboard input and asserts `onChange` callback fires with updated content
- [X] T038 [P] [US1] Create `tests/renderer/006-ui-refinements.integration.test.js` — renders `ViewModeToggle` alongside `EditorPane` and `PreviewPane`; asserts toggling mode switches which pane is visible; asserts correct CSS class is applied per mode
- [X] T039 [P] [US1] Create `tests/renderer/007-file-tree.integration.test.js` — renders `Sidebar` with `useFileTree` hook and mocked `api.folder.readDir()`; asserts folder node is rendered; simulates expand click and asserts child `TreeNode` elements appear
- [X] T040 [P] [US1] Create `tests/renderer/008-copy-save.integration.test.js` — tests `clipboardUtils.copyAsMarkdown()` and `copyAsText()` with `vi.spyOn(navigator.clipboard, 'writeText')`; renders `EditorPage` and simulates `Ctrl+S` keydown — asserts `api.documents.update()` is called

**Checkpoint**: `npm test` passes with all 31 test files (23 migrated + 8 integration). Coverage report generated at `coverage/index.html`.

---

## Phase 4: User Story 2 - Developers Can Run E2E Tests (Priority: P2)

**Goal**: Eight Playwright E2E tests covering the primary happy-path journey for each spec (001–008). The dev server starts automatically, each test runs in an isolated `browserContext`, and the HTML + JUnit reports are generated on every run.

**Independent Test**: Run `npm run test:e2e`; verify all 8 E2E files pass, `playwright-report/index.html` exists with embedded screenshots on any failure, and `test-results/junit.xml` is written.

- [X] T041 [P] [US2] Create `tests/e2e/001-import-view.e2e.js` — seeds one document via `AppPage.seedDocument()`, navigates to `/`, asserts document card appears with correct name, clicks the card, asserts rendered Markdown heading is visible in the reader view
- [X] T042 [P] [US2] Create `tests/e2e/002-create-edit.e2e.js` — navigates to `/`, clicks new-document button, types Markdown content into the editor, navigates back to the main page, asserts the new document card appears in the list
- [X] T043 [P] [US2] Create `tests/e2e/003-split-view.e2e.js` — seeds a document, opens it in split view, asserts both editor pane and preview pane are visible, types text in the editor, asserts the preview pane reflects the updated content
- [X] T044 [P] [US2] Create `tests/e2e/004-file-browser.e2e.js` — seeds documents, opens the sidebar, asserts document list items are visible, clicks an item, asserts the document content loads in the main area
- [X] T045 [P] [US2] Create `tests/e2e/005-enhanced-editor.e2e.js` — navigates to the editor for a seeded document, asserts the CodeMirror `.cm-content` element is present and editable, types content, asserts it is reflected in the editor
- [X] T046 [P] [US2] Create `tests/e2e/006-ui-refinements.e2e.js` — opens a document in editor view, clicks the view-mode toggle, asserts the layout switches between editor-only, split, and preview-only modes by checking visible panes
- [X] T047 [P] [US2] Create `tests/e2e/007-file-tree.e2e.js` — seeds `dinomd:ui` with a `rootFolderPath` via `AppPage.clearStorage()` + `page.evaluate`; uses `page.addInitScript()` to stub `window.showDirectoryPicker` before page load, returning a mock `FileSystemDirectoryHandle` with preset child file entries; navigates to `/`, asserts sidebar tree renders the expected folder and file nodes, clicking a file node highlights it as active
- [X] T048 [P] [US2] Create `tests/e2e/008-copy-save.e2e.js` — opens a document in the editor, presses `Ctrl+S`, asserts a save-success toast or indicator appears; clicks the copy-as-Markdown button, asserts clipboard write was called (via `page.evaluate(() => navigator.clipboard.readText())`)

**Checkpoint**: `npm run test:e2e` passes all 8 E2E tests. `playwright-report/index.html` and `test-results/junit.xml` exist. Temporarily break one assertion to confirm a failure screenshot appears in the HTML report.

---

## Phase 5: User Story 3 - CI Pipeline Enforces Test Quality (Priority: P3)

**Goal**: The `test:all` command runs Vitest then Playwright sequentially, exits with non-zero code on any failure, and coverage thresholds are raised to the 80% target.

**Independent Test**: Run `CI=true npm run test:all` and verify: Vitest exits 0, Playwright exits 0, combined exit code is 0. Run with one failing test and verify exit code is non-zero and Playwright does not start.

- [X] T049 [US3] Raise coverage thresholds in `vitest.config.js` to `lines: 80, functions: 80, branches: 80, statements: 80` — run `npm run test:coverage` and address any files that cause the global threshold to fail by adding targeted assertions to the relevant integration test
- [X] T050 [US3] Update root `README.md` — add a `## Testing` heading (or expand existing section) containing: all test commands (`npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm run test:all`, `CI=true npm run test:all`), prerequisite (`npx playwright install chromium`), report locations (`coverage/index.html`, `playwright-report/index.html`, `test-results/junit.xml`), and a note that `test:all` is the CI entry point

**Checkpoint**: `CI=true npm run test:all` exits 0. Coverage ≥ 80% globally. README updated.

---

## Phase 6: Polish & Cross-Cutting Concerns (Priority: P4)

**Purpose**: Final validation that all specs 001–008 are traceable to at least one Vitest integration test and one E2E test, and the quickstart guide is accurate.

- [X] T051 [P] Verify spec traceability: confirm each spec (001–008) is covered by at least one `*.integration.test.js` entry and one `*.e2e.js` entry — add a `## Traceability Index` comment block to `tests/e2e/fixtures/docs.js` mapping spec numbers to their test files
- [X] T052 Run all steps in `specs/009-vitest-playwright-testing/quickstart.md` — validate each verification checkpoint passes, update quickstart if any command or path has changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user stories**
  - 2a (Vitest config) must complete before 2b (migration) can be verified
  - 2b must fully pass before 2c (Playwright) is validated
  - 2c must complete before Phase 4 (E2E tests)
- **Phase 3 (US1 — Integration Tests)**: Depends on Phase 2 completion; tasks T033–T040 are all parallel with each other
- **Phase 4 (US2 — E2E Tests)**: Depends on Phase 2 completion; tasks T041–T048 are all parallel with each other; can run in parallel with Phase 3
- **Phase 5 (US3 — CI)**: Depends on Phase 3 AND Phase 4 completion
- **Phase 6 (Polish)**: Depends on Phase 5 completion

### User Story Dependencies

- **US1 (P1)**: Phases 1 + 2 + 3 → independently testable after T033–T040 pass
- **US2 (P2)**: Phases 1 + 2 + 4 → independently testable after T041–T048 pass; can proceed in parallel with US1 once Phase 2 is complete
- **US3 (P3)**: Depends on US1 + US2 both complete (needs passing coverage + passing E2E)
- **US4 (P4)**: Verified as a logical consequence of US1 + US2 completion + traceability comment (T051)

---

## Parallel Opportunities

### Phase 2b — all 20 migration tasks run in parallel

```
T008  T009  T010  T011  T012  T013  T014  T015  T016  T017
T018  T019  T020  T021  T022  T023  T024  T025  T026  T027
```

All touch different files with identical mechanical changes.

### Phase 3 — all 8 integration test files run in parallel

```
T033  T034  T035  T036  T037  T038  T039  T040
```

Each targets a different spec area with no shared state.

### Phase 4 — all 8 E2E test files run in parallel

```
T041  T042  T043  T044  T045  T046  T047  T048
```

Each targets a different journey; `AppPage` and `fixtures/docs.js` (T029, T030) must exist first.

### Phase 3 + Phase 4 — can run in parallel with each other

Once Phase 2 is complete, US1 and US2 implementation can proceed simultaneously.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Package changes
2. Complete Phase 2: Config, migration, Playwright infrastructure
3. Complete Phase 3: US1 integration tests
4. **STOP and VALIDATE**: `npm test` green, `npm run test:coverage` generates report
5. Deliver: a developer can now run all unit + integration tests with a single command

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (Vitest replaces Jest, Playwright configured)
2. Phase 3 → US1 done: `npm test` covers 001–008 at integration level
3. Phase 4 → US2 done: `npm run test:e2e` covers 001–008 as user journeys
4. Phase 5 → US3 done: CI-ready with coverage gates and combined command
5. Phase 6 → US4 verified: full traceability confirmed

---

## Task Count Summary

| Phase | Tasks | Parallelizable |
|-------|-------|---------------|
| Phase 1 — Setup | 3 | 0 |
| Phase 2a — Vitest config | 4 | 0 |
| Phase 2b — Test migration | 20 | **20** |
| Phase 2c — Playwright infra | 5 | 0 |
| Phase 3 — US1 Integration tests | 8 | **8** |
| Phase 4 — US2 E2E tests | 8 | **8** |
| Phase 5 — US3 CI | 2 | 0 |
| Phase 6 — Polish | 2 | 1 |
| **Total** | **52** | **37** |

**Parallel opportunities identified**: 37 of 52 tasks (71%) can run concurrently within their group.
