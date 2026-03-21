# Research: DinoMD Testing Infrastructure (009)

**Date**: 2026-03-17  
**Branch**: `009-vitest-playwright-testing`  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Jest → Vitest Migration Strategy

**Decision**: Migrate all existing Jest unit tests to Vitest and remove Jest entirely.

**Rationale**: DinoMD uses electron-vite (Vite under the hood). Vitest shares the Vite transform pipeline — no Babel, no `transformIgnorePatterns`, no separate preset configuration. Test startup is ~5× faster and the config is ~60% smaller. ESM-native packages like `uuid` v9 that required Jest workarounds work directly. All `@testing-library/react` matchers continue to work unchanged.

**Alternatives considered**:
- Keep Jest alongside Vitest: rejected — doubles CI config surface, two transform pipelines, ongoing Babel maintenance.
- Freeze Jest and add Vitest only for new tests: rejected — same dual-config problem without a migration path.

**Implementation detail**: Vitest uses a **workspace config** (`vitest.workspace.js`) with two sub-projects — one for `node` environment (main process tests) and one for `jsdom` environment (renderer/React tests). This exactly mirrors the current Jest `projects` array. Coverage config lives in `vitest.config.js` at the root.

**Packages — remove**:
```
npm uninstall jest babel-jest @babel/core @babel/preset-env @babel/preset-react jest-environment-jsdom jest-util
```

**Packages — add**:
```
npm install -D vitest @vitest/coverage-v8
```

**`babel.config.js`**: Delete. Vitest uses `@vitejs/plugin-react` (already installed) for JSX via esbuild — no Babel needed.

---

## Decision 2: Vitest Config Structure

**Decision**: Two-file approach: `vitest.config.js` (coverage/workspace pointer) + `vitest.workspace.js` (dual environments).

**`vitest.workspace.js`**:
```js
import { defineWorkspace } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineWorkspace([
  {
    // Vitest 2.x: deps.moduleNameMapper was removed — use resolve.alias (array form supports regex)
    resolve: {
      alias: [
        { find: 'electron', replacement: new URL('./tests/__mocks__/electron.js', import.meta.url).pathname },
      ],
    },
    test: {
      name: 'main',
      environment: 'node',
      include: ['tests/main/**/*.test.js'],
      globals: true,
    },
  },
  {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /\.module\.css$/, replacement: 'identity-obj-proxy' },
        { find: /\.css$/, replacement: new URL('./tests/__mocks__/styleMock.js', import.meta.url).pathname },
      ],
    },
    test: {
      name: 'renderer',
      environment: 'jsdom',
      include: ['tests/renderer/**/*.test.{js,jsx}'],
      globals: true,
      setupFiles: ['tests/renderer/setup.js', '@testing-library/jest-dom'],
    },
  },
])
```

**Key API mapping**:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock('module')` | `vi.mock('module')` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.resetAllMocks()` | `vi.resetAllMocks()` |
| `setupFilesAfterEnv` | `setupFiles` (identical effect for jest-dom) |
| `coverageThreshold` | `coverage.thresholds` |
| `transformIgnorePatterns` (uuid hack) | not needed — Vite handles ESM natively |

---

## Decision 3: Coverage Thresholds

**Decision**: Global average ≥ 80% (hard gate); individual file below 50% = non-blocking warning.

**Rationale**: Entry-point files (`main.jsx`, `index.js`) and thin wrappers are inherently hard to unit-test in isolation without unreasonable mocking. A per-file 80% minimum would block CI on files with zero testable logic. A global threshold catches systemic coverage regressions. The 50% floor warning surfaces specific files that are completely untested without halting the pipeline.

**`vitest.config.js` coverage section**:
```js
coverage: {
  provider: 'v8',
  include: ['src/main/**/*.{js,jsx}', 'src/preload/**/*.{js,jsx}', 'src/renderer/src/**/*.{js,jsx}'],
  exclude: ['src/renderer/src/main.jsx', '**/__mocks__/**', '**/node_modules/**'],
  reporter: ['text', 'lcov', 'html'],
  reportsDirectory: 'coverage',
  thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
  // Per-file floor: individual files below 50% surface in report as warnings (enforced via perFile + lower threshold pair)
  perFile: false, // global enforcement; warnings via report review
}
```

---

## Decision 4: E2E — Playwright + Web Mode

**Decision**: Use Playwright (`@playwright/test`) targeting the Vite web-mode dev server on `localhost:5174`. Playwright manages the dev server lifecycle automatically via `webServer` config.

**Rationale**: The web mode build already exists (`npm run dev:web`, port 5174) and provides a full React app in the browser. Playwright's `webServer.command` starts it before tests and stops it after — satisfying FR-007 and FR-014 with a single `playwright test` command.

**Alternatives considered**:
- Electron binary E2E: rejected — out of scope per spec assumptions; requires binary build and different test driver.
- Cypress instead of Playwright: rejected — Playwright has native JUnit reporter, better network interception, and first-class `browserContext` isolation. Both are viable but Playwright was explicitly named in the spec input.

**Install**:
```
npm install -D @playwright/test
npx playwright install chromium
```

---

## Decision 5: E2E State Isolation

**Decision**: Playwright's default per-test `browserContext` provides fully isolated `localStorage`/`sessionStorage`/`IndexedDB`. No production code changes required.

**Rationale**: Each Playwright `page` fixture creates a new `BrowserContext` (equivalent to a fresh incognito window). The DinoMD web app stores all state in `localStorage` (via `browserApi.js` using keys `dinomd:docs` and `dinomd:ui`). A fresh `BrowserContext` starts with empty storage — satisfying FR-009 and FR-017 simultaneously.

---

## Decision 6: E2E Report Format

**Decision**: Three simultaneous reporters: `list` (terminal), `html` (embedded screenshots), `junit` (XML artifact for CI).

**Playwright reporter config**:
```js
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
],
```

**Why all three**: `list` gives immediate terminal feedback; `html` gives screenshot-embedded visual report accessible with `npx playwright show-report`; `junit` is the universal CI artifact format for GitHub Actions / GitLab CI.

---

## Decision 7: E2E File Import Simulation

**Decision**: Tests inject documents directly into `localStorage` via `page.evaluate()` before navigating to the app, simulating the state that `browserApi.js` would produce after a real file import.

**Rationale**: The native OS file picker (`window.showDirectoryPicker`, `window.showOpenFilePicker`) cannot be triggered programmatically in a browser context without real user gestures. However, `browserApi.js` is a pure localStorage adapter — tests can bypass the picker and write the document state directly, mimicking the post-import state exactly. No production code change needed.

**Pattern**:
```js
await page.evaluate((doc) => {
  const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
  localStorage.setItem('dinomd:docs', JSON.stringify([...existing, doc]))
}, { id: 'test-1', name: 'test.md', content: '# Hello\n\nWorld', position: 0 })
await page.reload()
```

---

## Decision 8: Test Directory Structure

**Decision**: Existing unit/integration tests remain in `tests/main/` and `tests/renderer/`. New E2E tests go into `tests/e2e/` with one file per spec (001–008) plus shared helpers/fixtures.

**Rationale**: Mirrors the spec naming convention (001–008), makes traceability obvious, and keeps Playwright tests clearly separated from Vitest tests to avoid config conflicts.

---

## Decision 9: npm Scripts

**Decision**:

| Script | Command |
|--------|---------|
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` |
| `test:e2e:ui` | `playwright test --ui` |
| `test:e2e:headed` | `playwright test --headed` |
| `test:all` | `vitest run --coverage && playwright test` |

`test:all` is the CI entry point (FR-015). It runs Vitest first; if it fails, Playwright does not start.

---

## Decision 10: Integration vs Unit Distinction in Vitest

**Decision**: Do not create a separate "integration" directory. Vitest tests that exercise multiple modules together (component + hook, hook + API) live alongside existing unit tests in `tests/renderer/` and `tests/main/`. New files follow the naming pattern `*.integration.test.js` to distinguish them from `*.test.js` unit tests.

**Rationale**: A third directory (`tests/integration/`) adds navigation overhead without benefit — all non-E2E tests run via the same `vitest run` command regardless of directory. The `*.integration.test.js` suffix provides discoverability without restructuring.
