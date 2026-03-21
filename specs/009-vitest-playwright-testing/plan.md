# Implementation Plan: DinoMD Testing Infrastructure (Vitest + Playwright)

**Branch**: `009-vitest-playwright-testing` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-vitest-playwright-testing/spec.md`

## Summary

Migrate the existing Jest unit suite to Vitest (single unified framework), add Vitest integration tests covering core acceptance scenarios from specs 001–008, and add a Playwright E2E suite targeting the web-mode build (port 5174) with automatic server lifecycle, `browserContext` state isolation, and dual HTML + JUnit XML reports. Jest and Babel are removed. No production source files are modified.

---

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18.3, JSX  
**Primary Dependencies**:
- **Add**: `vitest`, `@vitest/coverage-v8`, `@playwright/test`
- **Remove**: `jest`, `babel-jest`, `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `jest-environment-jsdom`, `jest-util`
- **Keep**: `@testing-library/react 16`, `@testing-library/jest-dom`, `@testing-library/user-event`, `identity-obj-proxy`, `@vitejs/plugin-react` (already installed)

**Storage**: No new storage. E2E state injected into `localStorage` via `page.evaluate()` using the `dinomd:docs` / `dinomd:ui` keys already defined by `browserApi.js`.  
**Testing**: Vitest (unit + integration) + Playwright (E2E). Existing test mocks (`tests/__mocks__/electron.js`, `styleMock.js`) reused unchanged.  
**Target Platform**: Chromium (headless for CI, headed for local debugging). Web-mode build only—no Electron binary.  
**Performance Goals**: Vitest suite < 3 min; E2E suite < 10 min (SC-004, SC-005).  
**Constraints**: Zero production source changes (FR-017); `browserContext` isolation for E2E state (FR-009); automatic dev server management by Playwright (FR-007); `babel.config.js` deleted.  
**Scale/Scope**: 4 new config files, 2 config files deleted/replaced, 23 existing test files migrated (API changes only: `jest.fn` → `vi.fn`), 8 new E2E test files, 1 shared Page Object file, 8 new `*.integration.test.js` files.

---

## Constitution Check

*No `.specify/memory/constitution.md` exists for this project. Gates derived from project conventions in prior plans (001–008).*

| Gate | Status | Notes |
|------|--------|-------|
| Architecture gates | ✅ PASS | No new layers; testing infrastructure only; all new files are under `tests/` |
| Dependency gates | ✅ PASS | Net dependency change: –7 dev packages (Jest/Babel), +2 (vitest, @vitest/coverage-v8), +1 (@playwright/test); runtime deps unchanged |
| Scope gates | ✅ PASS | Zero `src/` file modifications; only config files and `tests/` touched |
| Test gates | ✅ PASS | Feature *is* the test infrastructure; all migrated tests must pass before new ones are added |

Post-design re-check: ✅ All gates still pass after Phase 1 design (data-model, contracts).

---

## Project Structure

### Documentation (this feature)

```text
specs/009-vitest-playwright-testing/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 decisions (10 decisions)
├── data-model.md        ← config shapes, entities, state flows
├── quickstart.md        ← manual verification guide
└── checklists/
    └── requirements.md
```

### Source Code — files created/modified/deleted

```text
# ── Config files ─────────────────────────────────────────────────────────────
vitest.config.js                          ← NEW: coverage config + workspace pointer
vitest.workspace.js                       ← NEW: dual-environment workspace (main + renderer)
playwright.config.js                      ← NEW: E2E config (webServer, reporters, browserContext)
jest.config.js                            ← DELETE (replaced by vitest.config.js)
babel.config.js                           ← DELETE (no longer needed; Vite handles JSX)
package.json                              ← MODIFY: update test scripts, remove Jest/Babel deps

# ── Existing tests (migration — API changes only) ─────────────────────────────
tests/__mocks__/electron.js               ← KEEP unchanged
tests/__mocks__/styleMock.js              ← KEEP unchanged
tests/renderer/setup.js                   ← KEEP unchanged
tests/main/documents.test.js              ← MIGRATE: jest.fn → vi.fn, jest.mock → vi.mock
tests/main/documents-edit.test.js         ← MIGRATE: same
tests/main/folder.test.js                 ← MIGRATE: same
tests/main/ui-state.test.js               ← MIGRATE: same
tests/renderer/DocumentCard.test.js       ← MIGRATE: same
tests/renderer/DocumentList.test.js       ← MIGRATE: same
tests/renderer/EditorPage.test.js         ← MIGRATE: same
tests/renderer/MarkdownEditor.test.js     ← MIGRATE: same
tests/renderer/MarkdownViewer.test.js     ← MIGRATE: same
tests/renderer/Sidebar.test.js            ← MIGRATE: same
tests/renderer/SplitViewPage.test.js      ← MIGRATE: same
tests/renderer/clipboardUtils.test.js     ← MIGRATE: same
tests/renderer/markdownTokenizer.test.js  ← MIGRATE: same
tests/renderer/useDebounce.test.js        ← MIGRATE: same
tests/renderer/useDocuments.test.js       ← MIGRATE: same
tests/renderer/useEditor.test.js          ← MIGRATE: same
tests/renderer/useFileTree.test.js        ← MIGRATE: same
tests/renderer/useSidebar.test.js         ← MIGRATE: same
tests/renderer/useSyncScroll.test.js      ← MIGRATE: same
tests/renderer/useToast.test.js           ← MIGRATE: same

# ── New Vitest integration tests ──────────────────────────────────────────────
tests/renderer/001-import-view.integration.test.js   ← NEW: spec 001 module boundaries
tests/renderer/002-create-edit.integration.test.js   ← NEW: spec 002
tests/renderer/003-split-view.integration.test.js    ← NEW: spec 003
tests/renderer/004-file-browser.integration.test.js  ← NEW: spec 004
tests/renderer/005-enhanced-editor.integration.test.js ← NEW: spec 005
tests/renderer/006-ui-refinements.integration.test.js ← NEW: spec 006
tests/renderer/007-file-tree.integration.test.js     ← NEW: spec 007
tests/renderer/008-copy-save.integration.test.js     ← NEW: spec 008

# ── New Playwright E2E tests ──────────────────────────────────────────────────
tests/e2e/pages/AppPage.js               ← NEW: Page Object (shared locators + seedDocument helper)
tests/e2e/fixtures/docs.js               ← NEW: sample DinoMDDocument fixtures (md content)
tests/e2e/001-import-view.e2e.js         ← NEW: spec 001 happy-path journey
tests/e2e/002-create-edit.e2e.js         ← NEW: spec 002
tests/e2e/003-split-view.e2e.js          ← NEW: spec 003
tests/e2e/004-file-browser.e2e.js        ← NEW: spec 004
tests/e2e/005-enhanced-editor.e2e.js     ← NEW: spec 005
tests/e2e/006-ui-refinements.e2e.js      ← NEW: spec 006
tests/e2e/007-file-tree.e2e.js           ← NEW: spec 007
tests/e2e/008-copy-save.e2e.js           ← NEW: spec 008
```

**Structure Decision**: Single-project layout. All test files remain under `tests/`. Config files are at the repository root. No new directories are created at the root beyond `tests/e2e/`. The `tests/` directory retains its existing `main/`, `renderer/`, and `__mocks__/` structure; a new `e2e/` subdirectory is added.

---

## Implementation Phases

### Phase A — Remove Jest, Install Vitest (prerequisite for all other work)

1. Remove Jest + Babel packages:
   ```bash
   npm uninstall jest babel-jest @babel/core @babel/preset-env @babel/preset-react jest-environment-jsdom jest-util
   ```
2. Install Vitest + coverage:
   ```bash
   npm install -D vitest @vitest/coverage-v8
   ```
3. Delete `jest.config.js` and `babel.config.js`.
4. Create `vitest.workspace.js` (dual-environment: `main/node` + `renderer/jsdom`).
5. Create `vitest.config.js` (coverage config, thresholds at current levels: lines 50, functions 40, branches 45 — will be raised in a later phase once integration tests are added).
6. Update `package.json` scripts:
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`
   - `"test:coverage": "vitest run --coverage"`

**Gate**: `npm test` must pass with all existing tests green before proceeding.

---

### Phase B — Migrate Existing Unit Tests (jest.fn → vi.fn)

For each of the 19 existing test files, replace Jest globals with Vitest equivalents:

| Find | Replace |
|------|---------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock(` | `vi.mock(` |
| `jest.spyOn(` | `vi.spyOn(` |
| `jest.resetAllMocks()` | `vi.resetAllMocks()` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.runAllTimers()` | `vi.runAllTimers()` |

No test logic changes — only API renaming. `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` APIs are identical.

**Gate**: `npm test` passes with all 23 migrated files green.

---

### Phase C — Install Playwright and Create E2E Infrastructure

1. Install Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium
   ```
2. Create `playwright.config.js` at repository root:
   - `webServer`: `npm run dev:web`, port 5174, auto start/stop
   - Three reporters: `list`, `html` (→ `playwright-report/`), `junit` (→ `test-results/junit.xml`)
   - `screenshot: 'only-on-failure'`, `trace: 'on-first-retry'`
   - `browserContext` isolation: default (each `page` fixture = fresh context)
3. Create `tests/e2e/pages/AppPage.js` — Page Object with locators and `seedDocument()` helper.
4. Create `tests/e2e/fixtures/docs.js` — sample Markdown documents for seeding.
5. Add npm scripts:
   - `"test:e2e": "playwright test"`
   - `"test:e2e:ui": "playwright test --ui"`
   - `"test:e2e:headed": "playwright test --headed"`
   - `"test:all": "vitest run --coverage && playwright test"`
6. Add `playwright-report/` and `test-results/` to `.gitignore`.

**Gate**: `npm run test:e2e` starts the dev server, connects, and exits cleanly (even with 0 test files initially).

---

### Phase D — Write Vitest Integration Tests (001–008)

One new `*.integration.test.js` file per spec, placed in `tests/renderer/`. Each file covers the **integration boundary** of that spec's primary acceptance scenario — typically: a React component rendered via `@testing-library/react` interacting with the hook and API layer (mocked at the `api.js` boundary, not deeper).

| File | Core scenarios tested |
|------|-----------------------|
| `001-import-view.integration.test.js` | DocumentList renders imported docs; DocumentCard opens reader |
| `002-create-edit.integration.test.js` | New document creation; editor saves content via useEditor hook |
| `003-split-view.integration.test.js` | SplitViewPage renders both panels; live preview updates on edit |
| `004-file-browser.integration.test.js` | Sidebar renders file list; selecting file updates active path |
| `005-enhanced-editor.integration.test.js` | MarkdownEditor renders CodeMirror content; keyboard shortcuts fire |
| `006-ui-refinements.integration.test.js` | ViewModeToggle switches modes; EditorPane/PreviewPane layout |
| `007-file-tree.integration.test.js` | TreeNode expand/collapse; useFileTree hook state transitions |
| `008-copy-save.integration.test.js` | clipboardUtils copy-as-md and copy-as-text; Ctrl+S save trigger |

**Gate**: `npm test` passes all unit + integration tests. Coverage report generated.

---

### Phase E — Write Playwright E2E Tests (001–008)

One `*.e2e.js` file per spec in `tests/e2e/`. Each file contains 1–3 test cases covering the primary happy-path scenario for that spec. Tests use `AppPage` for locators and `seedDocument()` for state setup.

**Spec-to-journey mapping**:

| File | Journey |
|------|---------|
| `001-import-view.e2e.js` | Seed one doc → navigate to app → verify card appears → click card → verify rendered content |
| `002-create-edit.e2e.js` | Click new document → type content in editor → navigate back → verify card present |
| `003-split-view.e2e.js` | Open split view → type in editor pane → verify preview pane updates |
| `004-file-browser.e2e.js` | Open sidebar → verify document list → click item → verify content loads |
| `005-enhanced-editor.e2e.js` | Open editor → verify CodeMirror editor present → type → verify content |
| `006-ui-refinements.e2e.js` | Toggle view mode → verify layout switches between editor/preview/split |
| `007-file-tree.e2e.js` | Seed folder structure → verify tree renders → expand folder → click file |
| `008-copy-save.e2e.js` | Open editor → press Ctrl+S → verify save confirmation / no data loss; copy-to-clipboard buttons |

**Gate**: `npm run test:e2e` passes all 8 E2E journey files. HTML report and JUnit XML generated.

---

### Phase F — Raise Coverage Thresholds

After all integration tests are in place, raise coverage thresholds in `vitest.config.js` to the SC-002 target:

```js
thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
```

Run `npm run test:coverage` and verify the global threshold is met. If any metric falls short, add targeted tests for the lowest-coverage files rather than excluding them.

**Gate**: `npm run test:coverage` passes at ≥ 80% globally.

---

### Phase G — CI Verification

Simulate a CI run locally:

```bash
CI=true npm run test:all
```

Verify:
- Vitest runs headlessly, exits 0
- Playwright runs headlessly using Chromium, exits 0
- `playwright-report/index.html` and `test-results/junit.xml` are written
- No `test.only` or skipped tests remain

---

## Complexity Tracking

*No constitution violations. No unjustified complexity.*

| Decision | Why straightforward |
|----------|---------------------|
| Vitest workspace over separate configs | Direct replacement of Jest `projects`; same mental model |
| `browserContext` isolation | Playwright default behaviour; zero config needed |
| No POM inheritance hierarchy | DinoMD is a single-page app; one `AppPage` class is sufficient |
| `localStorage` seeding over HTTP API | No server API exists; `browserApi.js` is already a localStorage adapter |
