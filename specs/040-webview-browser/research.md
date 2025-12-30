# Research: WebView Browser Architecture

**Feature**: 040-webview-browser
**Date**: 2025-12-30
**Status**: Complete

## Research Questions

### 1. Tauri WebView Window Creation API

**Question**: How to dynamically create WebView windows that load external URLs?

**Decision**: Use `WebviewWindowBuilder` with `WebviewUrl::External` to create windows that load external websites.

**Rationale**: Tauri 2.x provides `WebviewWindowBuilder` (replaces v1's `WindowBuilder`) which supports loading external URLs directly. This bypasses X-Frame-Options since the content is rendered in a native WebView, not an iframe.

**Key API Pattern**:
```rust
use tauri::{WebviewWindowBuilder, WebviewUrl};

// Create window loading external URL
WebviewWindowBuilder::new(app, "browser-content-{id}", WebviewUrl::External("https://example.com".parse().unwrap()))
    .title("Browser Content")
    .decorations(false)  // No window chrome - we provide our own UI
    .transparent(true)   // Allow transparency
    .always_on_top(true) // Stay above main overlay
    .build()?;
```

**Alternatives Considered**:
- `tauri-plugin-localhost`: Only for local dev server, not external URLs
- Embedding in existing window: Would still use iframe, doesn't solve X-Frame-Options

---

### 2. Navigation Control from React

**Question**: How to control WebView navigation (navigate, back, forward, refresh) from React?

**Decision**: Expose Tauri commands that call `WebviewWindow::navigate()` and emit events for URL changes.

**Rationale**: Tauri 2.x provides `window.navigate(url)` method on WebviewWindow. We'll create Tauri commands that the React frontend can invoke to control navigation.

**Key API Pattern**:
```rust
// Rust command to navigate
#[tauri::command]
fn browser_navigate(app: AppHandle, webview_id: String, url: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview.navigate(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
            .map_err(|e| format!("Navigation failed: {}", e))?;
    }
    Ok(())
}
```

```typescript
// TypeScript invocation
import { invoke } from '@tauri-apps/api/core';
await invoke('browser_navigate', { webviewId: 'browser-content-123', url: 'https://google.com' });
```

**Alternatives Considered**:
- Direct JavaScript WebviewWindow API: Less control over error handling
- IPC messages: More complex, commands are simpler

---

### 3. URL Change Detection (Bidirectional Sync)

**Question**: How to detect when the user navigates within the WebView (clicks links) and sync back to React?

**Decision**: Use `on_navigation` plugin hook to intercept navigation events and emit events to the main window.

**Rationale**: Tauri's plugin `on_navigation` hook fires when webview starts navigating, providing the URL. We can emit this to the React frontend to update the URL bar.

**Key API Pattern**:
```rust
use tauri::plugin::Builder;
use tauri::Emitter;

Builder::new("browser-webview")
    .on_navigation(|window, url| {
        // Emit URL change to main window
        if let Some(app) = window.try_app_handle() {
            let _ = app.emit("browser-url-changed", BrowserUrlPayload {
                webview_id: window.label().to_string(),
                url: url.to_string(),
            });
        }
        true // Allow navigation
    })
    .build()
```

**Alternatives Considered**:
- Polling `current_url()`: Inefficient, misses intermediate navigations
- JavaScript injection: Fragile, may be blocked by CSP

---

### 4. Popup Blocking

**Question**: How to block popup windows from websites?

**Decision**: Block all new window requests by not handling `on_new_window` or returning false.

**Rationale**: Per spec clarification, all popups should be blocked silently. Tauri's default behavior doesn't open popups unless explicitly handled.

**Key API Pattern**:
```rust
// In WebviewWindowBuilder - don't set any popup handling
// Popups are blocked by default when no handler is registered

// Alternative explicit blocking via on_navigation:
.on_navigation(|window, url| {
    // Block javascript: and other popup schemes
    let scheme = url.scheme();
    scheme != "javascript" && scheme != "data"
})
```

---

### 5. Window Position/Size Synchronization

**Question**: How to synchronize WebView position with React browser window content area?

**Decision**: Use `set_position()` and `set_size()` methods with physical/logical pixel coordinates from React.

**Rationale**: React will calculate the content area bounds (excluding toolbar) and invoke a Tauri command to update WebView position/size. The existing `window.rs` patterns support this.

**Key API Pattern**:
```rust
use tauri::{LogicalPosition, LogicalSize, Position, Size};

#[tauri::command]
fn sync_browser_webview_bounds(
    app: AppHandle,
    webview_id: String,
    x: f64, y: f64,
    width: f64, height: f64
) -> Result<(), String> {
    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview.set_position(Position::Logical(LogicalPosition::new(x, y)))
            .map_err(|e| format!("Position error: {}", e))?;
        webview.set_size(Size::Logical(LogicalSize::new(width, height)))
            .map_err(|e| format!("Size error: {}", e))?;
    }
    Ok(())
}
```

**Performance**: Per spec, must complete within 100ms. Use logical pixels for DPI consistency.

---

### 6. Zoom Control

**Question**: How to implement zoom for WebView content?

**Decision**: Use `WebviewWindow::set_zoom()` method.

**Rationale**: Tauri 2.x provides native zoom support via `set_zoom(factor)` where factor is a multiplier (1.0 = 100%, 1.5 = 150%).

**Key API Pattern**:
```rust
#[tauri::command]
fn set_browser_zoom(app: AppHandle, webview_id: String, zoom: f64) -> Result<(), String> {
    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview.set_zoom(zoom)
            .map_err(|e| format!("Zoom error: {}", e))?;
    }
    Ok(())
}
```

**Note**: The existing `zoom` state (10-200 as percentage) will be converted to factor (0.1-2.0).

---

### 7. Visibility and Overlay Integration

**Question**: How to show/hide WebView when overlay visibility changes?

**Decision**: Use `show()` and `hide()` methods on WebviewWindow, synchronized with overlay state.

**Rationale**: Existing overlay toggle logic in `lib.rs` can be extended to also show/hide all browser WebViews.

**Key API Pattern**:
```rust
// In toggle_visibility when hiding overlay:
for label in get_browser_webview_labels(&state) {
    if let Some(webview) = app.get_webview_window(&label) {
        let _ = webview.hide();
    }
}

// When showing overlay:
for label in get_browser_webview_labels(&state) {
    if let Some(webview) = app.get_webview_window(&label) {
        let _ = webview.show();
    }
}
```

---

### 8. Transparency/Opacity Synchronization

**Question**: How to synchronize WebView transparency with browser window opacity?

**Decision**: WebView transparency is limited; use `transparent(true)` in builder and investigate platform-specific options.

**Rationale**: Tauri WebView transparency works best with `decorations(false)` and `transparent(true)`. True content opacity control may be limited by the underlying webview engine (WebView2 on Windows).

**Key Considerations**:
- Window-level transparency: Supported via builder options
- Content opacity: May require CSS injection or be platform-limited
- Fallback: Document limitation if true content transparency isn't achievable

---

### 9. Error Handling and Display

**Question**: How to detect and display WebView errors (navigation failures, etc.)?

**Decision**: Use `on_navigation` return value and emit error events to React for URL bar display.

**Rationale**: Navigation failures can be detected when `on_navigation` hook fires but the page fails to load. We can emit error events that React displays as icon + status text in URL bar.

**Key API Pattern**:
```rust
// Emit error event when navigation fails
app.emit("browser-error", BrowserErrorPayload {
    webview_id: label,
    error_type: "navigation_failed",
    message: "Failed to load page",
})
```

---

## Technology Decisions Summary

| Component | Technology | Version |
|-----------|------------|---------|
| WebView Creation | Tauri WebviewWindowBuilder | 2.x |
| Navigation Control | Tauri commands + WebviewWindow::navigate() | 2.x |
| URL Sync | on_navigation plugin hook + events | 2.x |
| Position/Size | set_position/set_size (LogicalPosition) | 2.x |
| Zoom | WebviewWindow::set_zoom() | 2.x |
| Visibility | show()/hide() methods | 2.x |
| Event Communication | Tauri events (emit/listen) | 2.x |

## Implementation Notes

1. **WebView Label Convention**: Use `browser-webview-{windowId}` pattern to link WebViews to browser windows
2. **Coordinate System**: Use logical pixels for all position/size operations for DPI consistency
3. **Event Payload Types**: Define shared types for browser events (url-changed, error, etc.)
4. **Lifecycle Management**: Create WebView in `on_mount`, destroy in `on_unmount` of React component
5. **State Tracking**: Maintain HashMap of active browser WebViews in Rust state for overlay integration
