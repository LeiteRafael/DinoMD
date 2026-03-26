# Quickstart: Code Snapshot Export (Carbon-style PNG View)

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-21

## Prerequisites

- Node.js 20 LTS
- All existing dependencies installed: `npm install`
- After this feature: `html2canvas` added — run `npm install` again after pulling this branch

## Install new dependency

```bash
npm install html2canvas
```

## Run the app (development)

```bash
npm run dev
```

Opens Electron with hot-reload. Navigate to any document and open the split-view to see the Code/Snapshot toggle.

## Try the feature manually

1. Open DinoMD and either create a new document or open an existing one
2. Enter split-view mode (use the **Split** toggle at the top, or `Ctrl+\`)
3. In the **left panel header**, click the **Snapshot** button (next to "Code")
4. Verify:
   - The macOS-style window frame appears with three colored traffic-light dots
   - The title bar shows the filename (or language label if untitled)
   - Code content is highlighted with the One Monokai theme
   - An **Export PNG** button appears in the header
5. Click **Export PNG** → a file named `snapshot-<filename>.png` downloads
6. Click **Code** button → plain textarea editor is restored
7. Switch to a different document → the panel resets to **Code** mode automatically

## Run unit tests

```bash
npm test
```

Runs Vitest across all renderer and main unit/integration tests.

To run only the new snapshot tests:

```bash
npm test -- --reporter=verbose SnapshotPane useSnapshotMode useSnapshotExport snapshotExport languageFromExtension CodePanel CodePanelHeader
```

## Run E2E tests

```bash
npm run test:e2e
```

To run only the new snapshot E2E test:

```bash
npm run test:e2e -- --grep "snapshot"
```

## Run all tests

```bash
npm run test:all
```

## Key files for this feature

| File | Purpose |
|------|---------|
| `src/renderer/src/components/CodePanel/index.jsx` | Orchestrates Code vs Snapshot mode |
| `src/renderer/src/components/CodePanelHeader/index.jsx` | Toggle + Export PNG button |
| `src/renderer/src/components/SnapshotPane/index.jsx` | macOS chrome + tokenized code |
| `src/renderer/src/components/SnapshotPane/SnapshotPane.module.css` | One Monokai token styles + chrome layout |
| `src/renderer/src/hooks/useSnapshotMode.js` | Mode state + reset-on-file-switch |
| `src/renderer/src/hooks/useSnapshotExport.js` | Export orchestration + error handling |
| `src/renderer/src/utils/snapshotExport.js` | Pure: html2canvas capture + download |
| `src/renderer/src/utils/languageFromExtension.js` | Pure: extension → language label |
| `src/renderer/src/pages/SplitViewPage.jsx` | Modified: `<EditorPane>` → `<CodePanel>` |

## Troubleshooting

**Export PNG button not visible**: Make sure the toggle is set to **Snapshot** mode (not Code mode). The button only appears in Snapshot mode.

**Exported PNG is blank**: This can happen if the snapshot frame has zero dimensions at capture time. Check that the panel is fully rendered and not collapsed before exporting.

**Export produces blurry image**: Ensure `html2canvas` is called with `scale: 2`. Check `snapshotExport.js`.

**Snapshot mode not resetting on file switch**: Check that `useSnapshotMode` receives the current `session.documentId` and that the `useEffect` dependency array includes it.
