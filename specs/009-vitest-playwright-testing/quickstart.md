# Quickstart: DinoMD Testing Infrastructure (009)

**Branch**: `009-vitest-playwright-testing`  
**Date**: 2026-03-17

This guide describes how to manually verify the testing infrastructure once it is implemented.

---

## Prerequisites

```bash
node --version    # must be 20+
npm --version     # must be 10+
```

---

## 1. Install Dependencies

```bash
cd /path/to/DinoMD
npm install
npx playwright install chromium
```

---

## 2. Run the Vitest Suite (unit + integration)

```bash
# Run once, all environments (main + renderer)
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# With coverage report
npm run test:coverage
```

**What to verify**:
- Terminal output shows two project groups: `[main]` and `[renderer]`
- All tests pass (green)
- `npm run test:coverage` creates `coverage/index.html` — open it in a browser to see per-file coverage
- Global coverage lines/branches/functions/statements are all ≥ 80%
- Any file below 50% appears with a warning in the text report

---

## 3. Run the Playwright E2E Suite

```bash
# Headless (CI mode)
npm run test:e2e

# Headed (watch the browser)
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui
```

**What to verify**:
- The Vite dev server starts automatically (no manual `npm run dev:web` needed)
- Browser opens on `http://localhost:5174`
- All 8 E2E journeys (one per spec 001–008) pass
- After the run: `playwright-report/index.html` contains the HTML report (open with `npx playwright show-report`)
- `test-results/junit.xml` exists and contains `<testcase>` entries for each test

---

## 4. Verify a Failing E2E Test Produces a Screenshot

Temporarily break one test (e.g., change `expect(cards).toHaveCount(1)` to `expect(cards).toHaveCount(99)`) and run:

```bash
npm run test:e2e
```

**What to verify**:
- The test fails with the assertion message
- A screenshot appears in `test-results/` directory
- The HTML report (`playwright-report/index.html`) shows the screenshot embedded in the failed test entry
- `test-results/junit.xml` shows the test as `failure`

Revert the change afterwards.

---

## 5. Run the Full CI Pipeline Locally

```bash
npm run test:all
```

**What to verify**:
- Vitest runs first; output includes pass/fail for both `main` and `renderer` projects
- Playwright runs second only if Vitest exits with code 0
- If Vitest fails, Playwright does NOT start (the `&&` in the script ensures this)
- Exit code of `npm run test:all` is 0 on full pass, non-zero on any failure

---

## 6. E2E Coverage — Spec Traceability

Each E2E file is named after its spec number. Verify that all eight exist and pass:

| File | Spec covered |
|------|-------------|
| `tests/e2e/001-import-view.e2e.js` | Spec 001 — Import & View Documents |
| `tests/e2e/002-create-edit.e2e.js` | Spec 002 — Create & Edit Markdown |
| `tests/e2e/003-split-view.e2e.js` | Spec 003 — Split-View Live Preview |
| `tests/e2e/004-file-browser.e2e.js` | Spec 004 — File Browser Sidebar |
| `tests/e2e/005-enhanced-editor.e2e.js` | Spec 005 — Enhanced Markdown Editor |
| `tests/e2e/006-ui-refinements.e2e.js` | Spec 006 — Editor UI Refinements |
| `tests/e2e/007-file-tree.e2e.js` | Spec 007 — File Tree Sidebar |
| `tests/e2e/008-copy-save.e2e.js` | Spec 008 — Copy Actions & Save Shortcut |

---

## 7. Verify Headless CI Compatibility

```bash
CI=true npm run test:all
```

**What to verify**:
- No browser window opens
- Playwright runs in headless Chromium
- Reports are still generated
- `forbidOnly` flag is active (any `test.only` would cause the suite to fail)
