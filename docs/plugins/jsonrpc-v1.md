# JSON-RPC v1 Method Catalog

**Feature**: 060-plugin-system
**Date**: 2026-05-21
**Protocol version**: `1`
**Transport (UI ↔ host)**: Tauri internal IPC (a single Tauri command `plugin_rpc` dispatches by method name). The bootstrap script exposes this as `window.raic.rpc(method, params, options?)`.
**Transport (host ↔ sidecar)**: newline-delimited JSON over the sidecar's stdin/stdout (see `sidecar-protocol.md`).

All requests follow JSON-RPC 2.0:
```json
{ "jsonrpc": "2.0", "id": "<request-id>", "method": "<group>.<verb>", "params": { ... } }
```

All responses follow JSON-RPC 2.0:
```json
{ "jsonrpc": "2.0", "id": "<request-id>", "result": { ... } }
{ "jsonrpc": "2.0", "id": "<request-id>", "error": { "code": -32000, "message": "...", "data": { ... } } }
```

Event push (host → plugin UI, e.g. hotkey trigger) uses JSON-RPC 2.0 *notifications* (no `id` field):
```json
{ "jsonrpc": "2.0", "method": "raic.event", "params": { "subscription": "<id>", "event": { ... } } }
```

---

## Methods

### Window control (no permission)

Scoped to the plugin's own windows (primary + secondaries).

#### `window.setTitle`
- **Params**: `{ "title": string }` — 1..120 chars.
- **Returns**: `{ }`
- **Errors**: `InvalidParams`

#### `window.setIcon`
- **Params**: `{ "icon": string }` — data URL (`data:image/...`) or a path under the plugin bundle (`/ui/icon.png`).
- **Returns**: `{ }`
- **Errors**: `InvalidParams`

#### `window.close`
- **Params**: `{ "windowId"?: string }` — defaults to the calling window. Pass a secondary window id to close that one specifically.
- **Returns**: `{ }`
- **Errors**: `InvalidParams` (unknown windowId)

#### `window.requestResize`
- **Params**: `{ "width": int, "height": int, "windowId"?: string }` — 100..4000 each.
- **Returns**: `{ "width": int, "height": int }` — actual size after host clamping.
- **Errors**: `InvalidParams`

#### `window.getBounds`
- **Params**: `{ "windowId"?: string }`
- **Returns**: `{ "x": int, "y": int, "width": int, "height": int }`
- **Errors**: `InvalidParams`

#### `window.onFocusChange`
- **Params**: `{ "windowId"?: string }`
- **Returns**: `{ "subscriptionId": string }`
- **Events**: `{ "focused": bool, "windowId": string }`

#### `window.openSecondary`
- **Params**: `{ "id": string, "title": string, "width"?: int, "height"?: int, "ui": string }` — `id` is plugin-chosen (unique within this plugin instance); `ui` is a path within the bundle.
- **Returns**: `{ "windowId": string }` — opaque, includes a host-assigned suffix to prevent collisions.
- **Errors**: `InvalidParams`, `Conflict` (duplicate id within this plugin)

#### `window.closeSecondary`
- **Params**: `{ "windowId": string }`
- **Returns**: `{ }`
- **Errors**: `InvalidParams`

#### `window.listSecondary`
- **Params**: `{ }`
- **Returns**: `{ "windows": [ { "id": string, "windowId": string, "title": string } ] }`

---

### Persistent state (no permission)

Scoped to this plugin's own KV store. Other plugins cannot access these keys.

#### `state.get`
- **Params**: `{ "key": string }` — 1..128 chars.
- **Returns**: `{ "value": <any JSON value or null> }`
- **Errors**: `InvalidParams`

#### `state.set`
- **Params**: `{ "key": string, "value": <any JSON value> }`
- **Returns**: `{ }`
- **Errors**: `InvalidParams`

#### `state.delete`
- **Params**: `{ "key": string }`
- **Returns**: `{ "existed": bool }`
- **Errors**: `InvalidParams`

#### `state.list`
- **Params**: `{ }`
- **Returns**: `{ "keys": [string, ...] }`

#### `state.usage`
- **Params**: `{ }`
- **Returns**: `{ "bytes": int }` — current on-disk size of this plugin's `state.json`.

---

### Theme (no permission)

#### `theme.getTokens`
- **Params**: `{ }`
- **Returns**: `{ "tokens": { "<tokenName>": "<cssValue>", ... } }` — the same set of tokens injected as CSS custom properties (see `window-raic.d.ts`).

#### `theme.onChange`
- **Params**: `{ }`
- **Returns**: `{ "subscriptionId": string }`
- **Events**: `{ "tokens": { ... } }` — full new token map on every theme change.

---

### Logging (no permission)

All entries are written to the host's unified log, tagged with `plugin=<id>`.

#### `log.info` / `log.warn` / `log.error`
- **Params**: `{ "message": string, "data"?: <any JSON value> }`
- **Returns**: `{ }`
- **Errors**: none (logging never fails for the caller)

---

### Notifications (permission: `notifications`)

#### `notification.show`
- **Params**: `{ "title": string, "body": string, "durationMs"?: int (500..30000, default 4000) }`
- **Returns**: `{ "notificationId": string }`
- **Errors**: `PermissionDenied`, `InvalidParams`

---

### Hotkeys (permission: `hotkeys`)

#### `hotkey.register`
- **Params**: `{ "combo": string, "id": string }` — `combo` follows the host's keybind grammar (e.g. `"Ctrl+Shift+P"`, `"Alt+F5"`); `id` is a plugin-chosen identifier (must be unique within this plugin).
- **Returns**: `{ "registrationId": string }`
- **Errors**: `PermissionDenied`, `InvalidParams`, `Conflict` (combo already registered by another plugin or a built-in)

#### `hotkey.unregister`
- **Params**: `{ "registrationId": string }`
- **Returns**: `{ }`
- **Errors**: `PermissionDenied`, `InvalidParams`

#### `hotkey.onTrigger`
- **Params**: `{ }`
- **Returns**: `{ "subscriptionId": string }`
- **Events**: `{ "registrationId": string, "id": string, "combo": string, "at": <RFC3339> }`
- **Errors**: `PermissionDenied`

---

### Sidecar (permission: `sidecar`, requires `manifest.sidecar != null`)

#### `sidecar.call`
- **Params**: `{ "method": string, "params": <any JSON value>, "timeoutMs"?: int }` — `timeoutMs` defaults to `30000`, capped at `300000` by the host.
- **Returns**: `{ "result": <any JSON value> }` — whatever the sidecar returned.
- **Errors**: `PermissionDenied`, `SidecarUnavailable`, `SidecarTimeout`, `InvalidParams`, plus any custom error code in the `-32100..-32199` range that the sidecar itself defines.

#### `sidecar.onEvent`
- **Params**: `{ }`
- **Returns**: `{ "subscriptionId": string }`
- **Events**: `{ "method": string, "params": <any JSON value> }` — passed straight through from the sidecar's `raic.event` notifications.
- **Errors**: `PermissionDenied`

#### `sidecar.status`
- **Params**: `{ }`
- **Returns**: `{ "running": bool, "pid": int | null, "uptimeMs": int | null, "crashedAt"?: <RFC3339>, "lastExitCode"?: int }`
- **Errors**: `PermissionDenied`

---

### Permissions (no permission)

#### `permissions.list`
- **Params**: `{ }`
- **Returns**: `{ "declared": [string, ...], "granted": [string, ...] }` — `declared` is what the manifest requested; `granted` is what the user actually approved.

#### `permissions.has`
- **Params**: `{ "name": string }`
- **Returns**: `{ "granted": bool }`

---

## Subscriptions

Methods ending in `on...` create a subscription. The host returns `{ "subscriptionId": string }`. To cancel, call `raic.unsubscribe`:

#### `raic.unsubscribe`
- **Params**: `{ "subscriptionId": string }`
- **Returns**: `{ }`
- **Errors**: `InvalidParams` (unknown subscriptionId is non-fatal — returns `{}` for idempotency? **No, this is `InvalidParams`** to surface bugs.)

Subscriptions are automatically cleaned up when the plugin instance is destroyed (FR-006/FR-020).

---

## Error model

All error responses use JSON-RPC 2.0's standard envelope:
```json
{ "code": <int>, "message": <human-readable string>, "data": <optional structured object> }
```

| Code | Constant | When |
|------|----------|------|
| -32700 | `ParseError` | Sidecar sent malformed JSON to the host (UI side can't trigger this — Tauri serialises). |
| -32600 | `InvalidRequest` | Missing required JSON-RPC fields. |
| -32601 | `MethodNotFound` | Method name not in v1 catalogue. |
| -32602 | `InvalidParams` | Params failed schema validation. `data.errors` lists JSON-pointer paths. |
| -32603 | `InternalError` | Host bug. `data.requestId` for log correlation. |
| -32000 | `PermissionDenied` | Manifest did not declare the permission. `data.required` is the permission name. |
| -32001 | `SidecarUnavailable` | No sidecar declared, or sidecar process is not running (crashed / not yet started). |
| -32002 | `SidecarTimeout` | Sidecar call did not return within the effective timeout. `data.timeoutMs` echoes it. |
| -32003 | `Conflict` | Hotkey collision, duplicate window id, etc. `data.reason` explains. |
| -32100..-32199 | (sidecar-defined) | Reserved for the sidecar's own error codes; passed through as-is by `sidecar.call`. |

The host is free to add new error codes within the `-32xxx` range in **minor** version bumps as long as existing codes keep their meaning.

---

## Stability guarantee

Method names, parameter shapes, return shapes, and error code meanings defined here are **stable for the v1 protocol** (FR-018). Breaking changes require a new `protocol_version` value in the manifest; the host runs both v1 and v2 dispatchers side-by-side until v1 is deprecated.

Additive changes (new methods, new optional parameters, new event payload fields) are allowed within v1 as long as old clients keep working.
