# DinoMD

<p align="center">
  <img src="https://github.com/user-attachments/assets/aced24ad-0aad-4ac2-b34c-4d67c7597a25" width="512"/>
</p>

<p align="center"> A lightweight and friendly Markdown reader desktop app. Simple, fast, and prehistoric. <br/><br/> Built with <b>Electron</b>, <b>React 18</b>, and <b>Vite</b> via <code>electron-vite</code>. </p> <p align="center"> <img src="https://img.shields.io/github/stars/LeiteRafael/DinoMD?style=social" alt="GitHub stars"/> <img src="https://img.shields.io/github/license/LeiteRafael/DinoMD" alt="License"/> <img src="https://img.shields.io/github/last-commit/LeiteRafael/DinoMD" alt="Last commit"/> <img src="https://img.shields.io/github/repo-size/LeiteRafael/DinoMD" alt="Repo size"/> <img src="https://img.shields.io/github/issues/LeiteRafael/DinoMD" alt="Issues"/> <img src="https://img.shields.io/badge/Electron-Desktop-blue?logo=electron" alt="Electron"/> <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React"/> <img src="https://img.shields.io/badge/Vite-Build-purple?logo=vite" alt="Vite"/> </p>

---

## Features

- **Import & manage** Markdown files — add, rename, reorder (drag-and-drop), and delete documents
- **Reader view** — clean, styled Markdown rendering with syntax highlighting (Shiki) and GFM support
- **Editor view** — in-app Markdown editor with live debounce saving
- **Split view** — side-by-side editor and preview with synchronized scrolling
- **File tree sidebar** — browse and open any folder from disk; detects external file changes
- **Persistent state** — document list and sidebar state are saved between sessions via `electron-store`
- **Web mode** — runs as a plain browser app (without Electron) for development and testing

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                Electron Main                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │documents │  │  folder  │  │    ui    │   │  ← IPC handlers
│  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  electron-store  │  fs/fileUtils     │   │
│  └──────────────────────────────────────┘   │
└────────────────────┬────────────────────────┘
                     │ contextBridge (window.api)
┌────────────────────▼────────────────────────┐
│              React Renderer                 │
│  Pages: MainPage · ReaderPage               │
│          EditorPage · SplitViewPage         │
│  Components: Sidebar · MarkdownViewer       │
│              MarkdownEditor · Toast …       │
│  Hooks: useDocuments · useEditor            │
│         useSidebar · useFileTree            │
│         useSyncScroll · useToast …          │
└─────────────────────────────────────────────┘
```

**IPC channels exposed via preload:**

| Namespace | Channels |
|---|---|
| `documents` | `import-files`, `get-all`, `reorder`, `read-content`, `remove`, `create`, `save`, `rename`, `delete` |
| `folder` | `open-picker`, `read-dir`, `read-file`, `write-file` |
| `ui` | `get-sidebar-state`, `set-sidebar-state` |
| event | `file:changed-externally` |

---

## Project structure

```
src/
├── main/               # Electron main process
│   ├── index.js        # App entry point, BrowserWindow setup
│   ├── ipc/            # IPC handler registration (documents, folder, ui)
│   ├── fs/             # File system utilities
│   └── store/          # electron-store persistence layer
├── preload/
│   └── index.js        # contextBridge API exposed to renderer
├── renderer/           # React app (Electron target)
│   └── src/
│       ├── App.jsx
│       ├── pages/      # MainPage, ReaderPage, EditorPage, SplitViewPage
│       ├── components/ # Sidebar, MarkdownViewer, MarkdownEditor, Toast …
│       ├── hooks/      # useDocuments, useEditor, useSidebar, useFileTree …
│       ├── services/   # api.js — wraps window.api with browser fallbacks
│       └── utils/      # clipboardUtils, markdownTokenizer
└── web/                # Browser-only entry point (no Electron)
    ├── index.html
    ├── main.jsx
    └── browserApi.js   # Mock of window.api for browser mode
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **npm** 10+

### Install

```bash
npm install
```

### Run in development (Electron)

```bash
npm run dev
```

### Run in development (browser only)

```bash
npm run dev:web
```

Opens at `http://localhost:5174` — no Electron required, useful for fast UI iteration.

---

## Build

```bash
# Electron app
npm run build

# Web-only bundle
npm run build:web

# Preview built web bundle
npm run preview:web
```

---

## Docker

The `docker/` directory contains a minimal image for running the test suite in CI without a desktop environment.

```bash
# Build and run tests inside Docker
docker compose -f docker/docker-compose.yml up --build
```

The container mounts `src/` and `tests/` as volumes, so local changes are picked up without rebuilding the image.

---

## Code quality

| Command | Description |
|---|---|
| `npm run lint` | ESLint on `src/` and `tests/` |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier write on `src/` and `tests/` |
| `npm run format:check` | Prettier check (CI) |

A `husky` pre-commit hook runs lint and format checks automatically.

---

## Testing

DinoMD has a full test suite covering unit, integration, and end-to-end scenarios.

### Prerequisites

Install Playwright browsers once before running E2E tests:

```bash
npx playwright install chromium
```

### Commands

| Command | Description |
|---|---|
| `npm test` | Run all Vitest unit and integration tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with V8 coverage report |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:headed` | Run Playwright E2E tests in a visible browser |
| `npm run test:e2e:ui` | Open the Playwright interactive UI |
| `npm run test:all` | Run Vitest coverage then Playwright E2E |
| `CI=true npm run test:all` | Full CI suite (no server reuse) |

### Test structure

```
tests/
├── __mocks__/          # Shared mocks (electron, styleMock)
├── main/               # Unit tests — Electron main process (Vitest)
├── renderer/           # Unit + integration tests — React renderer (Vitest + RTL)
└── e2e/                # End-to-end tests (Playwright)
```

#### E2E — `tests/e2e/` — pattern: `{num}-{feature}.e2e.js`

Full user flows executed against the running Electron app via Playwright.

#### Unit — `tests/main/` — pattern: `{domain}.test.js`

Isolated tests for IPC handlers and store logic; Electron APIs are mocked.

#### Unit + Integration — `tests/renderer/`

Two patterns coexist:

| Pattern | Type | Examples |
|---|---|---|
| `PascalCase.test.js` | unit — React components | `DocumentCard.test.js` |
| `camelCase.test.js` | unit — hooks / utils | `useDebounce.test.js` |
| `{num}-{feature}.integration.test.js` | integration — full page render | `001-import-view.integration.test.js` |

> See [`tests/README.md`](tests/README.md) for a detailed naming analysis and proposed improvements.

### Coverage thresholds

The project enforces a minimum of **80%** on lines, statements, functions, and branches.

Coverage reports are written to:
- `coverage/` — HTML report (`coverage/index.html`)
- `coverage/lcov.info` — LCOV report for IDE integration

### E2E reports

Playwright test reports are written to:
- `playwright-report/` — HTML report
- `test-results/junit.xml` — JUnit XML report for CI

---

## Key dependencies

| Package | Role |
|---|---|
| `electron` | Desktop shell |
| `electron-vite` | Build tooling for Electron + Vite |
| `react` / `react-dom` | UI framework |
| `react-markdown` | Markdown rendering |
| `rehype-pretty-code` + `shiki` | Syntax highlighting |
| `remark-gfm` | GitHub Flavored Markdown |
| `remark-frontmatter` | YAML frontmatter parsing |
| `@dnd-kit/*` | Drag-and-drop for document reordering |
| `react-resizable-panels` | Resizable split view |
| `electron-store` | Persistent key-value storage |
| `uuid` | Document ID generation |
