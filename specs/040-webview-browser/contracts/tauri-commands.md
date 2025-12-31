# Tauri Commands Contract: WebView Browser

**Feature**: 040-webview-browser
**Date**: 2025-12-30

## Commands Overview

| Command | Purpose | Returns |
|---------|---------|---------|
| `create_browser_webview` | Create new WebView for browser window | `Result<String, String>` |
| `destroy_browser_webview` | Destroy WebView when browser closes | `Result<(), String>` |
| `browser_navigate` | Navigate WebView to URL | `Result<(), String>` |
| `browser_go_back` | Navigate back in history | `Result<(), String>` |
| `browser_go_forward` | Navigate forward in history | `Result<(), String>` |
| `browser_refresh` | Reload current page | `Result<(), String>` |
| `set_browser_zoom` | Set WebView zoom level | `Result<(), String>` |
| `sync_browser_webview_bounds` | Update WebView position/size | `Result<(), String>` |
| `set_browser_webview_visibility` | Show/hide WebView | `Result<(), String>` |

---

## Command Specifications

### create_browser_webview

Creates a new WebView window for rendering external web content.

**Signature**:
```rust
#[tauri::command]
async fn create_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    window_id: String,
    initial_url: String,
    bounds: BrowserWebViewBounds,
    zoom: f64,
) -> Result<String, String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| window_id | String | Yes | React browser window ID |
| initial_url | String | Yes | Initial URL to load |
| bounds | BrowserWebViewBounds | Yes | Initial position and size |
| zoom | f64 | Yes | Initial zoom factor (0.1-2.0) |

**Returns**: WebView ID (label) on success

**TypeScript**:
```typescript
await invoke<string>('create_browser_webview', {
  windowId: 'window-abc123',
  initialUrl: 'https://google.com',
  bounds: { x: 100, y: 150, width: 800, height: 600 },
  zoom: 1.0
});
```

---

### destroy_browser_webview

Destroys a WebView window when browser is closed.

**Signature**:
```rust
#[tauri::command]
fn destroy_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    webview_id: String,
) -> Result<(), String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| webview_id | String | Yes | WebView label to destroy |

**TypeScript**:
```typescript
await invoke('destroy_browser_webview', {
  webviewId: 'browser-webview-abc123'
});
```

---

### browser_navigate

Navigates WebView to a new URL.

**Signature**:
```rust
#[tauri::command]
fn browser_navigate(
    app: AppHandle,
    webview_id: String,
    url: String,
) -> Result<(), String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| webview_id | String | Yes | Target WebView label |
| url | String | Yes | URL to navigate to |

**Validation**:
- URL must be valid HTTP/HTTPS URL
- Protocol is auto-added if missing (assumes https://)

**TypeScript**:
```typescript
await invoke('browser_navigate', {
  webviewId: 'browser-webview-abc123',
  url: 'https://github.com'
});
```

---

### browser_go_back

Navigates back in WebView history.

**Signature**:
```rust
#[tauri::command]
fn browser_go_back(
    app: AppHandle,
    webview_id: String,
) -> Result<(), String>
```

**TypeScript**:
```typescript
await invoke('browser_go_back', { webviewId: 'browser-webview-abc123' });
```

---

### browser_go_forward

Navigates forward in WebView history.

**Signature**:
```rust
#[tauri::command]
fn browser_go_forward(
    app: AppHandle,
    webview_id: String,
) -> Result<(), String>
```

**TypeScript**:
```typescript
await invoke('browser_go_forward', { webviewId: 'browser-webview-abc123' });
```

---

### browser_refresh

Reloads the current page in WebView.

**Signature**:
```rust
#[tauri::command]
fn browser_refresh(
    app: AppHandle,
    webview_id: String,
) -> Result<(), String>
```

**TypeScript**:
```typescript
await invoke('browser_refresh', { webviewId: 'browser-webview-abc123' });
```

---

### set_browser_zoom

Sets the zoom level for WebView content.

**Signature**:
```rust
#[tauri::command]
fn set_browser_zoom(
    app: AppHandle,
    webview_id: String,
    zoom: f64,
) -> Result<(), String>
```

**Parameters**:
| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| webview_id | String | Yes | | Target WebView label |
| zoom | f64 | Yes | 0.1 - 2.0 | Zoom factor |

**Note**: React zoom (10-200%) converts to factor: `zoom_factor = zoom_percent / 100`

**TypeScript**:
```typescript
await invoke('set_browser_zoom', {
  webviewId: 'browser-webview-abc123',
  zoom: 1.5  // 150%
});
```

---

### sync_browser_webview_bounds

Updates WebView position and size to match browser window content area.

**Signature**:
```rust
#[tauri::command]
fn sync_browser_webview_bounds(
    app: AppHandle,
    webview_id: String,
    bounds: BrowserWebViewBounds,
) -> Result<(), String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| webview_id | String | Yes | Target WebView label |
| bounds | BrowserWebViewBounds | Yes | New position and size |

**Performance**: Must complete within 100ms per SC-003

**TypeScript**:
```typescript
await invoke('sync_browser_webview_bounds', {
  webviewId: 'browser-webview-abc123',
  bounds: { x: 100, y: 150, width: 800, height: 600 }
});
```

---

### set_browser_webview_visibility

Shows or hides a WebView.

**Signature**:
```rust
#[tauri::command]
fn set_browser_webview_visibility(
    app: AppHandle,
    webview_id: String,
    visible: bool,
) -> Result<(), String>
```

**TypeScript**:
```typescript
await invoke('set_browser_webview_visibility', {
  webviewId: 'browser-webview-abc123',
  visible: false
});
```

---

## Events

### browser-url-changed

Emitted when WebView URL changes (link click, redirect, JS navigation).

**Payload**:
```typescript
interface BrowserUrlChangedPayload {
  webviewId: string;
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
}
```

**Listen**:
```typescript
import { listen } from '@tauri-apps/api/event';

await listen<BrowserUrlChangedPayload>('browser-url-changed', (event) => {
  console.log(`WebView ${event.payload.webviewId} navigated to ${event.payload.url}`);
});
```

---

### browser-error

Emitted when WebView encounters an error.

**Payload**:
```typescript
interface BrowserErrorPayload {
  webviewId: string;
  errorType: 'navigation_failed' | 'ssl_error' | 'timeout' | 'webview_error';
  message: string;
}
```

**Listen**:
```typescript
await listen<BrowserErrorPayload>('browser-error', (event) => {
  console.error(`WebView ${event.payload.webviewId} error: ${event.payload.message}`);
});
```

---

### browser-loading

Emitted when WebView starts/finishes loading.

**Payload**:
```typescript
interface BrowserLoadingPayload {
  webviewId: string;
  isLoading: boolean;
}
```

---

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `WEBVIEW_NOT_FOUND` | WebView with given ID doesn't exist | Check ID or recreate |
| `INVALID_URL` | URL format is invalid | Validate URL before sending |
| `NAVIGATION_FAILED` | Could not navigate to URL | Check network/URL |
| `WEBVIEW_CREATE_FAILED` | Failed to create WebView | Check system resources |
| `POSITION_ERROR` | Failed to set position | Check bounds values |
