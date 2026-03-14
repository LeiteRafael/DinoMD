# Research: DinoMD — Markdown Reader Application

**Branch**: `001-dinomd-markdown-reader` | **Date**: 2026-03-10  
**Plan**: [plan.md](./plan.md)

All NEEDS CLARIFICATION items from Technical Context are resolved below.

---

## RES-001: Electron Application Architecture

**Question**: How should the Electron main process (Node.js) and the React renderer process be structured and communicate?

**Decision**: Single-repo using `electron-vite`. Main process is the Node.js backend. No separate Express server.

**Rationale**:
- The Electron main process has direct access to `fs`, OS dialogs (`dialog.showOpenDialog`), and app data paths — it already is the backend. Adding an HTTP server introduces unnecessary complexity (port binding, CORS, network security surface).
- `electron-vite` scaffolds all three entry points (main, preload, renderer) in one project with a unified config, Vite HMR in the renderer, and hot reload for the main and preload processes.
- Communication follows the only secure IPC pattern: `renderer → contextBridge (preload) → ipcRenderer.invoke → ipcMain.handle (main)`. `nodeIntegration: false` and `contextIsolation: true` are non-negotiable defaults.

**Alternatives considered**:
- **Separate Express server** — rejected: unnecessary network overhead, security surface, and CORS issues for a local-only app.
- **Electron Forge + Webpack** — rejected: slower rebuild times, heavier config. Viable but worse DX than electron-vite.
- **Enabling `nodeIntegration`** — rejected: security vulnerability; the contextBridge pattern is the current standard.

---

## RES-002: Drag-and-Drop Library

**Question**: Which React drag-and-drop library is best for reordering a flat list of document cards?

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Rationale**:
- Smallest bundle (~11–12 kB min+gz) of the serious contenders.
- Highest adoption (8.2M weekly downloads as of 2026) — clear ecosystem leader.
- `useSortable` hook + `arrayMove` utility from `@dnd-kit/sortable` is the minimal, clean API for card list reordering.
- Uses the Pointer Events API (not the HTML5 DnD API), which works reliably inside Electron's Chromium renderer and handles touch/stylus inputs.
- Ships with built-in ARIA live regions and keyboard navigation with zero extra config.

**Alternatives considered**:
- **`@hello-pangea/dnd`** — robust, opinionated animations, but larger bundle (28 kB, bundles Redux), slower maintenance cadence. Good choice if Kanban-style opinions are wanted.
- **`react-dnd`** — unmaintained (last release 4 years ago); skip entirely.

---

## RES-003: Markdown Rendering Stack

**Question**: Which library stack provides the best Markdown rendering and syntax highlighting in React?

**Decision**: `react-markdown` + `remark-gfm` + `rehype-pretty-code` + `shiki`

**Rationale**:
- `react-markdown` renders Markdown as React components (no `dangerouslySetInnerHTML`), safe by default, composable via remark/rehype plugins.
- `remark-gfm` adds GitHub Flavored Markdown: tables, strikethrough, task lists, autolinks.
- `shiki` uses VS Code's TextMate grammar engine — the highest-quality syntax highlighting available. All target languages (Python, JS, TS, Bash, JSON, HTML, CSS, Java, Go, Rust) are first-class. Ships with all VS Code themes.
- `rehype-pretty-code` wraps shiki as a rehype plugin, integrating cleanly into the react-markdown pipeline. Adds line numbers, line highlighting, and word highlighting out of the box.
- In an Electron context there is no browser bundle-size penalty; shiki can run at document-load time without performance concern.

**Additional plugins**:
- `rehype-slug` — adds anchor IDs to headings for future TOC support.
- `remark-frontmatter` — parses YAML front matter (enables future metadata extraction from documents).

**Alternatives considered**:
- **`marked` + DOMPurify** — simpler to wire up but requires manual HTML sanitisation, loses the React component tree model, and syntax highlighting is a separate integration step.
- **`rehype-highlight` (highlight.js)** — good language coverage but grammar quality and theme depth are noticeably below shiki.
- **`@mdx-js/react`** — ideal for JSX-in-Markdown; overkill for a pure reader with no dynamic Markdown components.

---

## RES-004: Local Persistence Strategy

**Question**: What is the best way to persist the document list (name, path, order index, import date) across sessions?

**Decision**: `electron-store`

**Rationale**:
- Wraps `app.getPath('userData')` JSON storage with atomic writes (write-then-rename to prevent corruption on crash), schema validation via `ajv`, and automatic migration support.
- Minimal API: `store.get`, `store.set`, `store.delete` — no boilerplate.
- More than sufficient for a dataset of up to ~500 document entries.

**Alternatives considered**:
- **Manual `fs.writeFile` to JSON** — viable but requires implementing atomic writes yourself to avoid data corruption.
- **`better-sqlite3`** — justified only for relational queries or 10k+ records; adds native binary compilation overhead (must rebuild per Electron version with `electron-rebuild`). Overkill here.

---

## RES-005: Docker Role

**Question**: How does Docker fit into an Electron desktop application project?

**Decision**: Docker is used for the **development environment** and **CI/CD headless testing** — never for delivering the GUI application.

**Rationale**:
- Electron requires a display server (X11/Wayland) and native OS integration; it cannot run as a GUI inside a standard container.
- Appropriate Docker uses:
  - `Dockerfile` pins Node.js 20 LTS, project dependencies, and tooling for consistent environments across the team.
  - `docker-compose.yml` mounts `src/` for hot-reload-compatible development.
  - CI/CD pipeline runs `jest` tests headlessly inside the container; `electron-builder` produces release artifacts on a host runner (or `xvfb-run` for E2E with a virtual framebuffer).

**Alternatives considered**:
- Running E2E tests in Docker with `xvfb` — viable for Playwright/Spectron integration tests but adds complexity. Out of scope for this feature; unit tests run headlessly without xvfb.

---

## RES-006: Unit Testing Strategy

**Question**: How should unit tests be structured for Electron + React in JavaScript?

**Decision**: Jest with two project configs + React Testing Library + manual `__mocks__/electron.js`

**Rationale**:
- Jest is the standard JS test runner; two `projects` entries in `jest.config.js` allow the renderer (React components) to run under `jsdom` and the main process (Node.js IPC handlers, store accessors) to run under `node` — each with the correct globals.
- React Testing Library tests component behaviour without implementation details, improving test reliability.
- The renderer never touches Electron APIs directly (only through the contextBridge API surface). Mocking `window.api` in tests is done by mocking the thin `services/api.js` wrapper or setting `global.api` in test setup — no need for a heavy Electron mock library.
- For main process tests, `__mocks__/electron.js` manually stubs `app`, `dialog`, `ipcMain` as needed.
- Tests co-located as `__tests__/` inside each `src/` sub-directory for components; top-level `tests/main/` for main process tests.

**Alternatives considered**:
- **Vitest** — faster runner, but the Electron ecosystem and `electron-vite` assume Jest; switching adds risk without measurable gain on this project scale.
- **`electron-mock-ipc`** — adds complexity and is rarely maintained; the manual mock pattern is simpler and more predictable.

---

## Resolution Summary

| Item | Status | Resolution |
|------|--------|-----------|
| Electron architecture | ✅ Resolved | electron-vite, main process as backend, contextBridge IPC |
| Drag-and-drop library | ✅ Resolved | @dnd-kit/core + @dnd-kit/sortable |
| Markdown rendering | ✅ Resolved | react-markdown + remark-gfm + rehype-pretty-code + shiki |
| Syntax highlighting | ✅ Resolved | shiki via rehype-pretty-code |
| Persistence | ✅ Resolved | electron-store |
| Docker role | ✅ Resolved | Dev env + CI headless tests only |
| Testing strategy | ✅ Resolved | Jest (two projects) + RTL + manual mocks |

**All NEEDS CLARIFICATION items resolved. Ready for Phase 1.**
