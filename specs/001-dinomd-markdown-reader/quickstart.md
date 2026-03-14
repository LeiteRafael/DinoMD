# Quickstart: DinoMD — Markdown Reader Application

**Branch**: `001-dinomd-markdown-reader` | **Date**: 2026-03-10  
**Plan**: [plan.md](./plan.md)

This guide gets a developer from zero to a running DinoMD app in development mode.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime for main process and build tools |
| npm | 10+ (bundled with Node 20) | Package management |
| Git | any | Version control |
| Docker | 24+ | Dev container / CI (optional for local dev) |

---

## Option A: Local Setup (no Docker)

### 1. Clone and install

```bash
git clone <repo-url> DinoMD
cd DinoMD
git checkout 001-dinomd-markdown-reader
npm install
```

### 2. Start in development mode

```bash
npm run dev
```

This uses `electron-vite` to:
- Start the Vite dev server for the React renderer (with HMR).
- Watch and reload the main and preload processes on file changes.
- Launch the Electron window automatically.

### 3. Run unit tests

```bash
npm test
```

Runs both Jest projects (renderer in jsdom, main process in node) and prints a coverage summary.

```bash
npm run test:watch   # Watch mode during development
npm run test:coverage  # With full coverage report
```

---

## Option B: Docker Dev Container

### 1. Build and enter the container

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml exec app bash
```

### 2. Install and run tests headlessly

```bash
npm install
npm test
```

> **Note**: The Electron GUI cannot launch inside Docker. Use this option for running unit tests and linting in a consistent environment. Use Option A on your local machine to see and interact with the app.

---

## Key npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start app in dev mode with HMR |
| `npm run build` | Build all three processes (main, preload, renderer) |
| `npm run preview` | Preview the production build |
| `npm test` | Run all Jest tests |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with V8 coverage |
| `npm run lint` | Run ESLint across all source files |

---

## Project structure at a glance

```
src/main/        ← Node.js backend (IPC handlers, file system, store)
src/preload/     ← contextBridge bridge (window.api surface)
src/renderer/    ← React app (pages, components, hooks)
tests/           ← Unit tests (main + renderer)
docker/          ← Dockerfile + docker-compose for dev/CI
```

---

## Verify the setup

After `npm run dev`, the DinoMD window should open. To confirm everything works end-to-end:

1. Click **Import** and select any `.md` file from your filesystem.
2. Verify the document card appears on the main page.
3. Click the card — the Markdown content should render with syntax highlighting.
4. Drag a card to a new position and restart the app — the order should persist.

---

## IPC contract reference

See [contracts/ipc-api.md](./contracts/ipc-api.md) for the full specification of all `window.api` channels available to the renderer.

## Data model reference

See [data-model.md](./data-model.md) for entity schemas and the `electron-store` persistence shape.
