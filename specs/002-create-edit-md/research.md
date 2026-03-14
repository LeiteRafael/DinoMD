# Research: DinoMD — Create & Edit Markdown Files

**Branch**: `002-create-edit-md` | **Date**: 2026-03-14  
**Plan**: [plan.md](./plan.md)

All NEEDS CLARIFICATION items from Technical Context are resolved below.

---

## RES-001: Markdown Editor Component

---

## Candidates

### 1. Plain HTML `<textarea>`

**Description:** Native browser element, zero dependencies. Controlled via React `useState` / `useRef`. Line breaks and indentation handled natively.

| Metric | Value |
|---|---|
| Additional bundle size (min+gz) | **0 kB** — no dependency added |
| npm weekly downloads | N/A — native |
| API complexity | Minimal: `value`, `onChange`, CSS for `font-family: monospace` |
| Electron compatibility | Perfect — no special config needed |

**Markdown-specific behaviour:**
- All characters (`#`, `*`, `_`, `` ` ``, `[`, `]`, etc.) work as-is.
- Line breaks: natural (`Enter` key).
- Indentation: `Tab` key inserts a tab character only if `onKeyDown` is wired to preventDefault and `document.execCommand('insertText', false, '\t')`, or a controlled handler using `e.target.setRangeText`. The default Tab behaviour moves focus to the next element — must be manually intercepted.
- No syntax highlighting without additional work.

**Limitations:**
- No syntax highlighting at all (not a problem for MVP per requirements).
- Auto-indent continuation (e.g., continuing a list item on the next line) requires custom key-handler logic.
- `Tab` key focus-trap must be handled explicitly for accessibility.
- Large documents (tens of thousands of lines) can be sluggish — acceptable for typical Markdown files.

---

### 2. CodeMirror 6 via `@uiw/react-codemirror`

**Description:** A React wrapper around the CodeMirror 6 core (`@codemirror/state` + `@codemirror/view`). Provides a declarative `<CodeMirror>` component. Markdown support is added via `@codemirror/lang-markdown`.

**Packages required:**
```
@uiw/react-codemirror       # React wrapper + CM6 core battery
@codemirror/lang-markdown   # Markdown grammar + syntax highlighting
@codemirror/language-data   # (optional) fenced-code language detection
```

| Metric | Value |
|---|---|
| `@uiw/react-codemirror` (min+gz) | **146.2 kB / 47.1 kB** (source: Bundlephobia v4.25.8) |
| `@codemirror/lang-markdown` (min+gz, self-contained) | **473.3 kB / 161.1 kB** (source: Bundlephobia v6.5.0) |
| **Real deduped total in a Vite bundle** | **~220–260 kB min / ~70–90 kB gz** (shared deps—`@codemirror/view`, `@codemirror/state`, `@lezer/common`—counted once) |
| npm weekly downloads (`@uiw/react-codemirror`) | **~1.68 M** (npm, 2025-03) |
| npm weekly downloads (`@codemirror/lang-markdown`) | **~3.5 M** (core CodeMirror ecosystem) |
| API complexity | Low–Medium |
| Electron compatibility | Excellent — pure DOM, no special config |

> **Important note on bundle arithmetic:** Bundlephobia reports each package in isolation, including all transitive deps. In a real Vite build `@uiw/react-codemirror` already bundles `@codemirror/view`, `@codemirror/state`, `@codemirror/language`, `@codemirror/autocomplete`, etc. The incremental cost of adding `@codemirror/lang-markdown` on top is therefore only the parser tables (`@lezer/markdown`, `@lezer/javascript`) and the language grammar itself — roughly **~25–35 kB gz** of new code, not 161 kB.

**Minimal usage for a Markdown editor:**
```jsx
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';

const extensions = [markdown({ base: markdownLanguage })];

function MarkdownEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ lineNumbers: false, foldGutter: false }}
    />
  );
}
```

**Electron compatibility notes:**
- Works out of the box. No AMD loader, no CDN, no web workers.
- Renders entirely via the DOM. Compatible with Electron's renderer process without any extra configuration.
- Tested against Electron 20+ by the community; no known issues with Electron 34.

---

### 3. Monaco Editor via `@monaco-editor/react`

**Description:** A React wrapper for the Monaco editor — the engine that powers VS Code. Loaded by default via CDN (AMD/RequireJS); can be reconfigured to bundle from `node_modules` with Vite worker scaffolding.

**Packages required:**
```
@monaco-editor/react    # React wrapper + CDN loader
monaco-editor           # Core (required for Vite/node_modules path, types)
```

| Metric | Value |
|---|---|
| `@monaco-editor/react` wrapper (min+gz) | **13.7 kB / 4.7 kB** — misleading; this is only the loader glue |
| `monaco-editor` core (ESM entry, Bundlephobia) | **131.7 kB / 20.8 kB** — also misleading; see note below |
| **Real bundle cost (Vite, local, no CDN)** | **~3–4 MB min / ~1–1.5 MB gz total assets** including editor worker, tokenizer workers, and language grammars |
| **CDN-loaded runtime size** | ~8–12 MB of JS/assets loaded from CDN at runtime |
| npm weekly downloads (`@monaco-editor/react`) | **~3.12 M** (npm, 2025-03) |
| API complexity | Medium–High (for Electron specifically: High) |
| Electron compatibility | **Problematic** — requires non-trivial configuration |

> **Critical bundle size note:** Bundlephobia reports only the AMD/ESM loader entry point for `monaco-editor`. The actual Monaco runtime consists of ~20+ lazy-loaded modules, multiple Web Workers (editor worker, JSON/CSS/HTML/TS language workers), and tokenizer grammar files. When bundled with Vite for a local (offline) Electron app, the total shipped JS is typically **3 MB gzipped or more** depending on which languages are included. This makes Monaco the heaviest option by a factor of 10–20×.

**Electron-specific issues:**

1. **Default CDN loading breaks in packaged apps.** By default `@monaco-editor/react` loads Monaco's AMD modules from `https://cdn.jsdelivr.net/...`. In an Electron app with `webSecurity` enabled or in a fully offline/packaged build this fetch will fail, showing a permanent loading spinner.

2. **Vite + local bundling requires worker boilerplate.** To ship Monaco from `node_modules`, the project must configure `vite.config.js` with explicit `?worker` imports for each language server:
   ```js
   import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
   import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
   // ... etc.
   self.MonacoEnvironment = { getWorker(_, label) { … } };
   ```
   This conflicts with `electron-vite`'s opinionated build pipeline and would require `electron-vite.config.js` changes.

3. **Markdown support in Monaco is basic.** Monaco classifies Markdown as a "basic syntax colorization only" language — no semantic highlighting, no smart indent/continuation.

4. **`nodeIntegration`/`contextIsolation` friction.** Monaco's AMD loader has historically triggered issues when Electron's `nodeIntegration` is enabled due to the `module`/`require` global collision.

**Minimal usage (with CDN default — broken in packaged Electron):**
```jsx
import Editor from '@monaco-editor/react';

function MarkdownEditor({ value, onChange }) {
  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      value={value}
      onChange={onChange}
    />
  );
}
```

---

## Comparison Matrix

| | `<textarea>` | CodeMirror 6 (`@uiw/react-codemirror`) | Monaco (`@monaco-editor/react`) |
|---|---|---|---|
| **Additional bundle (gz, real)** | 0 kB | ~70–90 kB (+~25–35 kB incremental if CM6 core is already present) | ~1–1.5 MB (Vite local) or CDN at runtime |
| **API complexity** | Very Low | Low | High (Electron-specific) |
| **Syntax highlighting** | None | Full (via `lang-markdown`) | Basic only for Markdown |
| **Line breaks / indentation** | Manual `onKeyDown` for Tab | Built-in, configurable | Built-in |
| **Markdown continuation** | None (manual) | Built-in (`markdownKeymap`) | None |
| **Electron compatibility** | Native | ✅ No config needed | ⚠️ Requires worker + loader config; CDN broken in packaged apps |
| **React 18 support** | Native | ✅ v4.x | ✅ v4.7.0 |
| **New dependency count** | 0 | 2 (`@uiw/react-codemirror`, `@codemirror/lang-markdown`) | 2 (`@monaco-editor/react`, `monaco-editor`) |
| **Weekly npm downloads** | N/A | ~1.68 M | ~3.12 M |
| **Matches project philosophy** | ✅ Minimal | ✅ Focused, modular | ❌ Heavyweight, general-purpose |

---

## Recommendation

### For MVP: **Plain `<textarea>`**

Given the project's explicit preference for minimal dependencies and the fact that syntax highlighting is marked as a nice-to-have (not required), a plain `<textarea>` is the correct MVP choice:

- Adds **zero dependencies** and **zero bundle cost**.
- Handles all standard Markdown characters natively.
- The only manual work needed is a small `onKeyDown` handler to intercept `Tab` and insert `\t` (or two spaces) instead of moving focus — approximately 10 lines of code.
- Lines up exactly with the project's precedent (`react-markdown` for reading, a plain element for writing).

```jsx
function MarkdownEditor({ value, onChange }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newValue =
        value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      onChange(newValue);
      // Reposition cursor after inserted spaces
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      style={{ fontFamily: 'monospace', resize: 'none' }}
    />
  );
}
```

### For post-MVP (Feature 003 readiness): **CodeMirror 6**

When feature 003 (split-view preview) is implemented, the editor and preview pane will need to coexist in the same view. At that point, upgrading to `@uiw/react-codemirror` + `@codemirror/lang-markdown` is the right move:

- Adds syntax highlighting with minimal configuration.
- The `@codemirror/lang-markdown` extension enables smart `Enter`-key continuation of lists and blockquotes via `markdownKeymap`.
- The entire CodeMirror 6 ecosystem is modular and tree-shakeable — you ship only what you import.
- No Electron compatibility issues whatsoever.
- Aligns with the project's pattern of choosing focused, composable libraries (`@dnd-kit` over full drag-and-drop frameworks, `react-markdown` over full editor suites).

### Do NOT use Monaco

Monaco is the wrong tool for this job:

1. **Electron packaging complexity** is non-trivial and directly conflicts with `electron-vite`'s build setup.
2. **Bundle cost** (~1.5 MB gz) is grossly disproportionate to the feature requirement.
3. **Markdown support quality** is actually *worse* than CodeMirror 6 (only basic colorization, no smart keybindings).
4. It is designed for IDE-scale tooling (TypeScript IntelliSense, multi-language servers) — none of which is needed here.

---

## RES-002: New Document Creation Flow

**Question**: Should `dialog.showSaveDialog` be called upfront (before typing) or only on the first explicit save?

**Decision**: **Untitled buffer first** — create an in-memory draft descriptor and call `dialog.showSaveDialog` only when the user triggers Save for the first time (VS Code / Typora pattern). Do **not** prompt for a path before the editor opens.

**Rationale**: Forcing the user to name a file before they can start writing breaks the creative flow. All major desktop editors (VS Code, Typora, Zed) defer the file-name dialog to the first save. The main process returns a lightweight draft object (`{ id, name: 'Untitled', filePath: null, isDraft: true }`) immediately; `fs.writeFile` is called only when the user explicitly saves. The renderer keeps the content in component state until then.

**Alternatives considered**:
- **Obsidian-style auto-create** — creates `Untitled.md` immediately in the vault directory. Works because Obsidian owns a single vault folder. DinoMD does not have a fixed vault, so this approach would require choosing a default folder, adding complexity for no UX benefit.
- **Prompt name upfront** — simpler state management (filePath always known), but poor UX. Rejected.

---

## RES-003: File Rename on Disk

**Question**: How should renaming a document be implemented safely across platforms?

**Decision**: Use `fs.promises.rename()` as the primary path with explicit `EXDEV` fallback (copy + unlink) and a pre-flight existence check via `fs.promises.access()`.

**Rationale**:
- `fs.promises.rename()` is atomic on the same filesystem (inode rename syscall). Fast, no data loss risk.
- On cross-device moves (`EXDEV` error), fall back to `copyFile` + `unlink` — slower but correct.
- Must pre-check if the target path already exists (`ENOENT` = free to proceed; anything else = throw `EEXIST`). On POSIX, `rename` silently overwrites — the pre-check is the only guard.
- After rename, update the store entry's `filePath` and `name` fields. Use the stable UUID as the primary key — never `filePath`.

**Alternatives considered**:
- **`shell.moveItemToTrash` + re-create** — unnecessarily destructive; loses the original file's metadata/mtime. Rejected.
- **Sync `fs.renameSync`** — blocks the main process event loop. Rejected in favour of `fs.promises.rename`.

---

## RES-004: File Delete from Disk

**Question**: Should deleting a document use `fs.promises.unlink` (permanent) or `shell.trashItem` (recoverable)?

**Decision**: **`shell.trashItem(filePath)`** — moves the file to the OS trash. `fs.promises.unlink` is offered only as a fallback when `trashItem` fails (some headless Linux environments).

**Rationale**:
- Even with a confirmation dialog, `unlink` is irreversible. `trashItem` provides a second safety net matching desktop UX conventions (VS Code uses "Move to Trash", macOS Finder, Windows Recycle Bin).
- `shell.trashItem` is stable in Electron 29+ and works on Windows, macOS, and major Linux desktops (freedesktop-compliant trash).
- If `trashItem` fails, the renderer is informed via `canForceDelete: true` and can offer a secondary "Permanently Delete" confirmation.

**Alternatives considered**:
- **`fs.promises.unlink` directly** — rejected for user-facing delete of documents they may want to recover.
- **App-level "recycle bin" (keep in store with `deleted: true` flag)** — extra complexity, not a real OS-level recovery. Rejected.

---

## RES-005: Unsaved Changes Guard (No React Router)

**Question**: How should the app prevent silent loss of unsaved edits when navigating away from the editor?

**Decision**: Maintain a `isDirty` boolean in component state, **lifted to App root** as a deferred-action thunk pattern. Show a controlled `ConfirmModal` before any navigation. Also hook `mainWindow.on('close')` in the main process for window-close protection.

**Rationale**: The app uses a custom navigation model (prop callbacks, not React Router), so there is no `useBlocker` or `<Prompt>` available. The deferred-action pattern is idiomatic React: every navigation action is wrapped in `requestNavigation(action)`, which either executes immediately (clean) or stores the action as a thunk and shows the modal (dirty). On confirm, the thunk executes; on cancel, it is discarded.

The `mainWindow.on('close')` hook in the main process sends `app:confirm-close` to the renderer if the window is dirty; the renderer's `beforeunload` handler calls back with `app:close-confirmed` to allow the window to close.

**Alternatives considered**:
- **`window.onbeforeunload`** — only fires on page reload/close, not on in-app navigation. Insufficient alone.
- **`useContext` / global store** — heavier than needed for a single boolean flag. A lifted state prop is cleaner.

---

## RES-006: External File Modification Detection

**Question**: How should the app detect when an open document is modified externally while the user is editing?

**Decision**: Use **`fs.watch(filePath, { persistent: false })`** with a 200 ms debounce and `mtime` gate. When a change is detected, the main process sends `file:changed-externally` to the renderer, which shows a non-blocking banner: "File changed on disk — Reload or Keep editing?"

**Rationale**: For a single-file editor with one open document at a time, `fs.watch` is sufficient and requires zero extra dependencies. The 200 ms debounce collapses burst events (many editors write + flush in multiple syscalls). The `mtime` gate avoids false-positive prompts (only prompt if file content actually changed timestamp). `fs.watchFile` (polling) is more reliable on some network filesystems but has ~5 s default latency; `chokidar` would add a dependency unnecessarily given the simple use case.

**Alternatives considered**:
- **mtime check only on app focus** — misses changes while the user is actively editing. Acceptable as a minimal fallback but inferior UX.
- **`chokidar`** — production-grade file watching, handles all edge cases. Adds a dependency; overkill for single-file watching. Reserved for future use if watch reliability issues arise.
