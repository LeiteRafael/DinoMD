# Data Model: DinoMD Testing Infrastructure (009)

**Branch**: `009-vitest-playwright-testing`  
**Date**: 2026-03-17

This document describes the entities, configuration shapes, and data flows for the testing infrastructure. There is no new application data model — this feature is purely infrastructural.

---

## Entity 1: Vitest Configuration

### `vitest.config.js` (root coverage config)

```
VitestRootConfig {
  test: {
    workspace: string                  // path to vitest.workspace.js
    coverage: {
      provider: 'v8'
      include: string[]                // src/main/**, src/preload/**, src/renderer/src/**
      exclude: string[]                // entry points, mocks, node_modules
      reporter: ['text', 'lcov', 'html']
      reportsDirectory: 'coverage'    // same dir as existing Jest output
      thresholds: {
        lines: 80
        functions: 80
        branches: 80
        statements: 80
      }
    }
  }
}
```

### `vitest.workspace.js` (dual-environment workspace)

```
VitestWorkspace = [
  VitestProject {
    name: 'main'
    environment: 'node'
    include: ['tests/main/**/*.test.js']
    globals: true
    deps.moduleNameMapper: { '^electron$': '<rootDir>/tests/__mocks__/electron.js' }
  },
  VitestProject {
    name: 'renderer'
    environment: 'jsdom'
    include: ['tests/renderer/**/*.test.{js,jsx}']
    globals: true
    setupFiles: ['tests/renderer/setup.js', '@testing-library/jest-dom']
    deps.moduleNameMapper: {
      '\.module\.css$': 'identity-obj-proxy'
      '\.css$': '<rootDir>/tests/__mocks__/styleMock.js'
    }
  }
]
```

---

## Entity 2: Playwright Configuration

### `playwright.config.js` (root)

```
PlaywrightConfig {
  testDir: 'tests/e2e'
  testMatch: ['**/*.e2e.js']
  fullyParallel: true
  forbidOnly: boolean                  // true on CI
  retries: 0 | 2                       // 2 on CI
  workers: 1 | undefined               // 1 on CI, auto locally

  reporter: [
    ['list']
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ]

  use: {
    baseURL: 'http://localhost:5174'
    screenshot: 'only-on-failure'
    video: 'off'
    trace: 'on-first-retry'
  }

  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] }
  ]

  webServer: {
    command: 'npx vite --config vite.web.config.js'
    url: 'http://localhost:5174'
    reuseExistingServer: boolean        // false on CI, true locally
    timeout: 30_000
  }
}
```

---

## Entity 3: E2E Test Fixture

Documents injected into `localStorage` by E2E tests to simulate post-import state. Matches the schema used by `src/web/browserApi.js`.

```
DinoMDDocument {
  id: string        // uuid v4
  name: string      // filename without path, e.g. "hello.md"
  content: string   // raw Markdown text
  position: number  // 0-indexed order in the document list
  path?: string     // optional virtual path (used in file tree features)
}

localStorage key: 'dinomd:docs'  →  JSON.stringify(DinoMDDocument[])
localStorage key: 'dinomd:ui'    →  JSON.stringify(UIState)
```

### `UIState`

```
UIState {
  sidebarOpen?: boolean
  rootFolderPath?: string | null
  activeFilePath?: string | null
}
```

---

## Entity 4: Page Object (AppPage)

Encapsulates Playwright locators for the DinoMD web app. Used by all E2E tests to avoid selector duplication.

```
AppPage {
  page: Page                              // Playwright Page instance

  // Navigation
  goto(): Promise<void>                   // navigates to baseURL (/)

  // Document list
  documentCards(): Locator               // all [data-testid="document-card"]
  documentCardByName(name): Locator      // card with given text

  // Editor
  editorContent(): Locator               // .cm-content (CodeMirror) or textarea
  previewPanel(): Locator               // rendered HTML preview pane

  // Sidebar
  sidebar(): Locator                     // sidebar root element

  // Toolbar
  newDocumentButton(): Locator
  importButton(): Locator                // triggers file import (mocked via localStorage)

  // Helpers
  seedDocument(doc: DinoMDDocument): Promise<void>   // writes directly to localStorage
  clearStorage(): Promise<void>                      // clears dinomd:docs and dinomd:ui
}
```

---

## Entity 5: Test Inventory Entry

Maps an acceptance scenario from a spec to one or more test files.

```
TestInventoryEntry {
  spec: '001' | '002' | '003' | '004' | '005' | '006' | '007' | '008'
  fr: string                    // e.g., 'FR-001'
  scenario: string              // acceptance scenario text
  unitTest?: string             // relative path to Vitest test file
  integrationTest?: string      // relative path to Vitest integration test file
  e2eTest?: string              // relative path to Playwright e2e test file
}
```

---

## State Transitions for E2E Tests

```
[Fresh BrowserContext]
  └── seedDocument() via page.evaluate → localStorage populated
      └── page.goto('/') → app loads with pre-seeded documents
          └── user interactions → assertions
              └── BrowserContext torn down → storage discarded
                  └── [Next test: Fresh BrowserContext]
```

This ensures FR-009 (clean state per test) is satisfied without any production code changes.
