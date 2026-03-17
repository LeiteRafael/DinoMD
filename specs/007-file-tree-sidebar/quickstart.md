# Quickstart: File Tree Sidebar

**Feature**: 007-file-tree-sidebar  
**Date**: 2026-03-16  
**Purpose**: Manual end-to-end verification guide for a developer completing the implementation or reviewing the feature.

---

## Prerequisites

- `npm run dev` running (Electron + Vite dev server)
- A test folder on your filesystem, e.g.:

```
/tmp/dino-test/
├── notes/
│   ├── daily/
│   │   └── 2026-03-16.md
│   └── ideas.md
├── archive/
│   └── old.md
├── README.md
├── .gitignore          ← should NOT appear
└── node_modules/       ← should NOT appear
```

Create it quickly:

```bash
mkdir -p /tmp/dino-test/notes/daily /tmp/dino-test/archive
echo "# Daily" > /tmp/dino-test/notes/daily/2026-03-16.md
echo "# Ideas" > /tmp/dino-test/notes/ideas.md
echo "# Archive" > /tmp/dino-test/archive/old.md
echo "# Readme" > /tmp/dino-test/README.md
touch /tmp/dino-test/.gitignore
mkdir -p /tmp/dino-test/node_modules
```

---

## Verification Steps

### 1 — Empty state (no folder open yet)

1. Launch the app (`npm run dev`).
2. Navigate to the editor or reader view so the sidebar is visible.

**Expected**: Sidebar shows an invitation message (e.g., "No folder open") and an **Open Folder** button. No document list, no tree.

---

### 2 — Open Folder picker

1. Click **Open Folder** in the sidebar.
2. The native OS folder-picker dialog opens.
3. Select `/tmp/dino-test`.

**Expected**:
- The dialog opens and allows folder selection only (no file selection).
- After selecting, the sidebar populates with the tree.
- Root-level items in correct order: folders first (`archive`, `notes`), then files (`README.md`).
- No `.gitignore` or `node_modules` entries.

---

### 3 — Expand a folder

1. Click on the `notes` folder in the tree.

**Expected**:
- `notes` shows an "open" icon (`▼`).
- Two children appear below it, indented: `daily` (folder), `ideas.md` (file).
- Correct order: `daily` folder before `ideas.md` file.

---

### 4 — Expand a nested folder

1. Click on `daily` inside `notes`.

**Expected**:
- `daily` opens and shows `2026-03-16.md` indented one level deeper.
- Indentation for `2026-03-16.md` is 2× the indent step of `notes` children.

---

### 5 — Collapse a folder

1. Click `notes` again (currently expanded).

**Expected**:
- `notes` shows a "closed" icon (`▶`).
- All children of `notes` (including the nested `daily` contents) are hidden.

---

### 6 — Open a file

1. Expand `notes` and click `ideas.md`.

**Expected**:
- The file's Markdown content loads in the main editor area.
- `ideas.md` is visually highlighted (active state) in the tree.
- No other file is highlighted.

---

### 7 — Switch files with unsaved edits

1. With `ideas.md` open, type something in the editor to create unsaved changes.
2. Click `README.md` in the tree.

**Expected**:
- No prompt or dialog appears.
- The editor switches to `README.md`.
- `ideas.md`'s changes have been saved silently (re-open it and confirm the text is preserved).
- `README.md` is now highlighted in the tree; `ideas.md` is not.

---

### 8 — Open a different root folder

1. Click **Open Folder** again (button in the sidebar header).
2. Select a different folder.

**Expected**:
- The sidebar reloads with the new folder's tree.
- All previously expanded folders are collapsed (expanded state reset).

---

### 9 — Cancel the folder picker

1. Click **Open Folder**.
2. Cancel the dialog without selecting a folder.

**Expected**:
- The sidebar remains unchanged (same tree still shown).
- No error message appears.

---

### 10 — Icon verification

Scan the tree and verify:

| Item | Expected icon |
|------|--------------|
| Closed folder | `▶` |
| Open folder | `▼` |
| `.md` file | `📝` |
| Non-markdown file (e.g., `.txt`) | `📄` |

---

### 11 — Persistence across restart

1. With `/tmp/dino-test` open and some folders expanded, quit the app (`Cmd/Ctrl+Q` or close the window).
2. Relaunch (`npm run dev`).

**Expected**:
- The sidebar reopens to `/tmp/dino-test` automatically (root folder persisted).
- Expand/collapse state is reset (all folders collapsed) — this is expected per spec.

---

## What NOT to do

- **Do not** check that `node_modules` or `.gitignore` appear — they should never be visible.
- **Do not** expect expand state to persist across restarts — it intentionally does not.
