# Contracts: IPC API — Code Snapshot Export

**Branch**: `010-code-snapshot-export` | **Date**: 2026-03-21

## Summary

This feature introduces **no new IPC channels** and **no changes to existing IPC channels**. All snapshot mode logic is entirely renderer-side (React state + DOM manipulation + client-side PNG capture). No main-process involvement is required.

## Existing IPC channels used (unchanged)

The following channels from earlier specs remain in use by `SplitViewPage` and are unaffected by this feature:

| Channel | Direction | Purpose | Defined in |
|---------|-----------|---------|-----------|
| `documents:read` | renderer → main | Load document content by ID | spec 001 |
| `documents:save` | renderer → main | Save document content | spec 002 |
| `documents:create` | renderer → main | Create new document | spec 002 |

## PNG export: renderer-only boundary

The Export PNG flow is fully contained in the renderer process:

```
User click
  → useSnapshotExport.exportPng()
    → html2canvas(snapshotFrameRef.current, { scale: 2 })
      → canvas.toBlob(blob => downloadBlob(blob, filename), 'image/png')
        → <a download> click simulation (browser download API)
          → file saved to user's Downloads folder via Electron's download handler
```

No IPC call is made. Electron's built-in `will-download` handler (already configured) intercepts the download and presents the native save dialog if applicable.

## Future IPC work (out of scope v1)

If a future spec adds server-side rendering or a "save to custom path" dialog, the following channel could be introduced:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `snapshot:save-png` | renderer → main | Save PNG to a user-chosen file path via dialog |

This is explicitly out of scope for v1.
