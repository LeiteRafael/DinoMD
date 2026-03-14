# Quickstart: DinoMD — Split-View Live Preview Editor

**Branch**: `003-split-view-preview` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

This guide extends the spec 001 quickstart to cover the new dependency and development workflow for the split-view feature.

---

## Prerequisites

Same as spec 001:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime for main process and build tools |
| npm | 10+ | Package management |
| Git | any | Version control |
| Docker | 24+ | Dev container / CI (optional) |

---

## Setup

### 1. Switch to the feature branch

```bash
git checkout 003-split-view-preview
npm install
```

This installs the one new dependency introduced by this feature:

| Package | Version | Purpose |
|---------|---------|---------|
| `react-resizable-panels` | `^2.x` | Resizable pane divider between editor and preview |

> **Note**: This branch should be based on `002-create-edit-md` being merged first. If it is not yet merged, cherry-pick or rebase accordingly to have the `EditorPane` component available.

---

### 2. Start in development mode

```bash
npm run dev
```

This starts the `electron-vite` dev server with HMR. Changes to renderer components (including `SplitViewPage`, `EditorPane`, `PreviewPane`) hot-reload without restarting Electron.

To open split-view manually during development:
1. Import or create any `.md` document from the main page.
2. Open the document (navigates to the editor page from spec 002).
3. Click the **Split View** button in the toolbar — the layout divides into two panes.

---

### 3. Run tests

```bash
npm test
```

Runs both Jest projects. Tests specific to this feature:

| Test file | Environment | What it covers |
|-----------|-------------|---------------|
| `tests/renderer/SplitViewPage.test.jsx` | jsdom | Renders split layout; both panes present; view mode toggle |
| `tests/renderer/useSyncScroll.test.js` | jsdom | Scroll ratio calculation; isSyncingRef guard |
| `tests/renderer/useDebounce.test.js` | jsdom | Value updates after delay; no update before delay |

```bash
npm run test:watch   # Watch mode during development
npm run test:coverage  # Full coverage report
```

---

## Key Files

| File | Role |
|------|------|
| `src/renderer/src/pages/SplitViewPage.jsx` | Root page — composes all panes and hooks |
| `src/renderer/src/components/EditorPane/index.jsx` | Editor pane (controlled textarea from spec 002) |
| `src/renderer/src/components/PreviewPane/index.jsx` | Preview pane (wraps `MarkdownViewer` from spec 001) |
| `src/renderer/src/components/SplitDivider/index.jsx` | `react-resizable-panels` wrapper |
| `src/renderer/src/components/ViewModeToggle/index.jsx` | Split / Editor-only / Preview-only toggle buttons |
| `src/renderer/src/hooks/useSplitView.js` | View mode state |
| `src/renderer/src/hooks/useSyncScroll.js` | Synchronized scrolling between panes |
| `src/renderer/src/hooks/useDebounce.js` | 300 ms debounce for preview updates |

---

## Docker (headless tests only)

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml exec app bash
npm install
npm test
```

The Electron GUI cannot launch inside Docker. Use this for CI test validation only.
