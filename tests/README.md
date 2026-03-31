# Test Structure — DinoMD

## Folder layout

```
tests/
├── __mocks__/                    # Shared mocks (styleMock)
├── unit/
│   └── renderer/                 # Unit tests — React renderer
│       └── setup.js              # Shared test setup (jsdom polyfills)
├── integration/
│   └── renderer/                 # Integration tests — React renderer
└── e2e/                          # End-to-end tests (Playwright)
```

---

## Naming conventions

| Test type   | Pattern                                    | Example                                  |
|-------------|--------------------------------------------|------------------------------------------|
| Unit        | `{kebab-case-name}.unit.test.{js,jsx}`     | `document-card.unit.test.js`             |
| Integration | `{num}-{feature}.integration.test.js`      | `001-import-view.integration.test.js`    |
| E2E         | `{responsibility}.e2e.js`                  | `documents.e2e.js`                       |

All unit test files use **kebab-case** and include a `.unit` type suffix.
Integration tests keep their numeric prefix for ordering and include `.integration`.
E2E tests are grouped by responsibility using **kebab-case** with `.e2e`.

---

## E2E — `tests/e2e/`

**Pattern:** `{responsibility}.e2e.js`

```
documents.e2e.js
editor.e2e.js
file-tree.e2e.js
code-snapshot.e2e.js
```

---

## Unit — `tests/unit/renderer/`

**Pattern:** `{kebab-case-name}.unit.test.{js,jsx}`

```
# components
code-panel-header.unit.test.jsx
document-card.unit.test.js
document-list.unit.test.js
editor-page.unit.test.js
markdown-editor.unit.test.js
markdown-viewer.unit.test.js
sidebar.unit.test.js
snapshot-pane.unit.test.jsx
split-view-page.unit.test.js

# hooks
use-debounce.unit.test.js
use-documents.unit.test.js
use-editor.unit.test.js
use-file-tree.unit.test.js
use-sidebar.unit.test.js
use-snapshot-export.unit.test.js
use-snapshot-mode.unit.test.js
use-sync-scroll.unit.test.js
use-toast.unit.test.js

# utils
api.unit.test.js
clipboard-utils.unit.test.js
language-from-extension.unit.test.js
markdown-tokenizer.unit.test.js
snapshot-export.unit.test.js
```

---

## Integration — `tests/integration/renderer/`

**Pattern:** `{num}-{feature}.integration.test.js`

```
001-import-view.integration.test.js
002-create-edit.integration.test.js
003-split-view.integration.test.js
004-file-browser.integration.test.js
005-enhanced-editor.integration.test.js
006-ui-refinements.integration.test.js
007-file-tree.integration.test.js
008-copy-save.integration.test.js
009-reader-page.integration.test.js
011-app.integration.test.js
```

