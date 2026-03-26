# Test Structure — DinoMD

## Folder layout

```
tests/
├── __mocks__/          # Shared mocks (electron, styleMock)
├── main/               # Unit tests — Electron main process
├── renderer/           # Unit + integration tests — React renderer
└── e2e/                # End-to-end tests (Playwright)
```

---

## E2E — `tests/e2e/`

**Pattern:** `{num}-{feature}.e2e.js`

```
001-import-view.e2e.js
002-create-edit.e2e.js
003-split-view.e2e.js
004-file-browser.e2e.js
005-enhanced-editor.e2e.js
006-ui-refinements.e2e.js
007-file-tree.e2e.js
008-copy-save.e2e.js
```

Consistent and well organized.

---

## Unit — `tests/main/`

**Current pattern:** `{domain}.test.js` (no type suffix)

```
documents.test.js
documents-edit.test.js
folder.test.js
ui-state.test.js
```

**Issues:**
- No indication these are **unit** tests — could be confused with integration
- `documents.test.js` and `documents-edit.test.js` cover the same domain but are split without clear criteria

**Suggested rename:** add `.unit` to the suffix

```
documents.unit.test.js
documents-edit.unit.test.js
folder.unit.test.js
ui-state.unit.test.js
```

---

## Unit + Integration mixed — `tests/renderer/`

The biggest organizational problem. Three different naming styles coexist in the same flat directory:

| Group | Current pattern | Actual type |
|---|---|---|
| `DocumentCard.test.js`, `Sidebar.test.js` … | `PascalCase.test.js` | unit — components |
| `useDebounce.test.js`, `clipboardUtils.test.js` … | `camelCase.test.js` | unit — hooks/utils |
| `001-import-view.integration.test.js` … | `{num}-{feature}.integration.test.js` | integration |
| `010-api.test.js` | `{num}-{feature}.test.js` | unit (outlier) |

**Issues:**
1. **Inconsistent casing** among unit tests: components in `PascalCase`, hooks/utils in `camelCase`
2. **`010-api.test.js`** has a numeric prefix (integration pattern) but is a unit test and lacks `.integration` in its name — outlier
3. Unit and integration tests live **in the same flat directory** with no visual separation

---

## Proposed solutions

### Option A — Minimal (rename only)

Standardize casing to `kebab-case` and add `.unit` suffix; fix the outlier:

```
# unit tests
document-card.unit.test.js
document-list.unit.test.js
editor-page.unit.test.js
markdown-editor.unit.test.js
markdown-viewer.unit.test.js
sidebar.unit.test.js
split-view-page.unit.test.js
clipboard-utils.unit.test.js
markdown-tokenizer.unit.test.js
use-debounce.unit.test.js
use-documents.unit.test.js
use-editor.unit.test.js
use-file-tree.unit.test.js
use-sidebar.unit.test.js
use-sync-scroll.unit.test.js
use-toast.unit.test.js
api.unit.test.js            ← removes numeric prefix, adds .unit

# integration tests — no change needed
001-import-view.integration.test.js
...
```

### Option B — Structural (split into subfolders)

```
tests/
  renderer/
    unit/
      document-card.test.js
      use-debounce.test.js
      ...
    integration/
      001-import-view.test.js   ← .integration implicit from folder name
      ...
  main/
    unit/
      documents.test.js
      ...
```

---

## Issues by priority

| Priority | Issue | File(s) |
|---|---|---|
| High | `010-api.test.js` has numeric prefix but is a unit test | `renderer/010-api.test.js` |
| High | Inconsistent casing in renderer unit tests (PascalCase vs camelCase) | `renderer/*.test.js` |
| Medium | `tests/main/` files have no type indicator | `main/*.test.js` |
| Low | Unit and integration tests share the same flat directory | `tests/renderer/` |
