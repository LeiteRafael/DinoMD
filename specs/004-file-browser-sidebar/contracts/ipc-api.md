# IPC API Contract: Left-Side File Browser Sidebar

**Feature Branch**: `004-file-browser-sidebar`  
**Created**: 2026-03-14  
**Depends on**: Specs 001–003 IPC channels (unchanged)

---

## Overview

This feature adds **2 new IPC channels** for sidebar UI state persistence, and **extends 3 existing channels** to populate the new `preview` field on the `Document` entity.

---

## New Channels

### `ui:get-sidebar-state`

Reads the persisted sidebar configuration from `electron-store`.

**Direction**: Renderer → Main (invoke/handle)  
**Payload**: *(none)*

**Response**:

### Teste de diff

```json
{
  "open": true,
  "widthPercent": 22
}
```

| Field | Type | Description |
|---|---|---|
| `open` | `boolean` | `true` = sidebar visible; `false` = collapsed |
| `widthPercent` | `number` | Panel width as % of window width; clamped to `[15, 35]` |

**Error response**: This channel never returns an error object. If no stored value exists, the response contains the defaults (`open: true`, `widthPercent: 22`).

---

### `ui:set-sidebar-state`

Persists a partial or full sidebar state update to `electron-store`. Accepts any subset of the state shape; unspecified fields are left unchanged.

**Direction**: Renderer → Main (invoke/handle)  
**Payload**:

```json
{
  "open": false
}
```

or

```json
{
  "widthPercent": 25.5
}
```

or both fields together.

| Field | Type | Required | Validation |
|---|---|---|---|
| `open` | `boolean` | optional | Must be boolean if present |
| `widthPercent` | `number` | optional | Clamped to `[15, 35]` before storing |

**Response**:

```json
{ "success": true }
```

On validation error (invalid types):

```json
{ "success": false, "error": "invalid-payload" }
```

---

## Modified Channels

### `documents:get-all` *(existing — response schema extended)*

Now returns `preview` on every document object.

**Added field**:

```json
{
  "documents": [
    {
      "id": "a1b2c3d4-...",
      "name": "My Note",
      "filePath": "/home/user/docs/my-note.md",
      "orderIndex": 0,
      "importedAt": "2026-03-01T10:00:00.000Z",
      "mtimeMs": 1740825600000,
      "preview": "This is the first sentence of the note without any markdown…"
    }
  ]
}
```

Documents imported before this feature was added return `preview: ""` (empty string, not `null`).

---

### `documents:import-files` *(existing — internally extended)*

After this feature: the main process generates and stores a `preview` snippet for each successfully imported document before returning. **Response shape is unchanged.**

---

### `documents:save` *(existing — internally extended)*

After this feature: the main process regenerates and stores the `preview` snippet for the saved document. **Response shape is unchanged.**

---

### `documents:create` *(existing — internally extended)*

After this feature: the main process stores `preview: ""` for the newly created blank document. **Response shape is unchanged.**

---

## Preload Bridge Additions

New entries added to `window.api` in `src/preload/index.js`:

```js
window.api.ui = {
  getSidebarState: () => ipcRenderer.invoke('ui:get-sidebar-state'),
  setSidebarState: (payload) => ipcRenderer.invoke('ui:set-sidebar-state', payload),
}
```

---

## Backwards Compatibility

- All existing IPC channels retain their current payload and response shapes.
- The `preview` field is an additive change to `documents:get-all` — existing consumers that don't use `preview` are unaffected.
- No IPC channels are removed or renamed.
