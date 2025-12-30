# Quickstart: WebView Browser Architecture

**Feature**: 040-webview-browser
**Date**: 2025-12-30

## Overview

This feature replaces the iframe-based browser with native Tauri WebView windows to bypass X-Frame-Options restrictions. The architecture uses a dual-window pattern:

1. **React Browser Window**: Contains toolbar (URL bar, navigation buttons, zoom controls)
2. **Tauri WebView**: Native window rendering website content, synchronized with React window

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Main Overlay Window                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Browser Window (React)                 │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ ← → ⟳  [https://google.com________] 🔍 - +   │  │ │  ← Toolbar
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │                                              │  │ │
│  │  │           Content Area (empty)               │  │ │  ← Placeholder
│  │  │                                              │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│         Browser WebView (Tauri)              │  ← Positioned over content area
│                                              │
│         [Actual Website Content]             │
│         (google.com rendered here)           │
│                                              │
└──────────────────────────────────────────────┘
```

## Key Files

### Rust (Backend)

| File | Purpose |
|------|---------|
| `src-tauri/src/browser_webview.rs` | WebView lifecycle, commands |
| `src-tauri/src/browser_webview_types.rs` | Type definitions |
| `src-tauri/src/lib.rs` | Command registration, plugin setup |

### TypeScript (Frontend)

| File | Purpose |
|------|---------|
| `src/hooks/useBrowserWebView.ts` | WebView control hook |
| `src/components/windows/BrowserContent.tsx` | Browser component (modified) |
| `src/components/windows/BrowserToolbar.tsx` | Toolbar with error indicator |
| `src/types/browserWebView.ts` | TypeScript types |

## Implementation Flow

### 1. Browser Window Mount

```typescript
// BrowserContent.tsx
function BrowserContent({ windowId, initialUrl, initialZoom }) {
  const webview = useBrowserWebView(windowId, initialUrl, initialZoom);

  // Calculate content area bounds
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      webview.syncBounds({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    }
  }, [windowPosition, windowSize]);

  return (
    <div className="flex flex-col h-full">
      <BrowserToolbar
        url={webview.currentUrl}
        onNavigate={webview.navigate}
        onBack={webview.goBack}
        onForward={webview.goForward}
        onRefresh={webview.refresh}
        error={webview.error}
      />
      <div ref={contentRef} className="flex-1">
        {/* Content area - WebView renders here visually */}
      </div>
    </div>
  );
}
```

### 2. WebView Hook

```typescript
// useBrowserWebView.ts
function useBrowserWebView(windowId: string, initialUrl: string, initialZoom: number) {
  const [webviewId, setWebviewId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [error, setError] = useState<BrowserErrorEvent | null>(null);

  // Create WebView on mount
  useEffect(() => {
    const create = async () => {
      const id = await invoke<string>('create_browser_webview', {
        windowId,
        initialUrl,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        zoom: initialZoom / 100
      });
      setWebviewId(id);
    };
    create();

    return () => {
      if (webviewId) {
        invoke('destroy_browser_webview', { webviewId });
      }
    };
  }, []);

  // Listen for URL changes
  useEffect(() => {
    const unlisten = listen<BrowserUrlChangedPayload>('browser-url-changed', (event) => {
      if (event.payload.webviewId === webviewId) {
        setCurrentUrl(event.payload.url);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [webviewId]);

  return {
    webviewId,
    currentUrl,
    error,
    navigate: (url) => invoke('browser_navigate', { webviewId, url }),
    goBack: () => invoke('browser_go_back', { webviewId }),
    goForward: () => invoke('browser_go_forward', { webviewId }),
    refresh: () => invoke('browser_refresh', { webviewId }),
    setZoom: (zoom) => invoke('set_browser_zoom', { webviewId, zoom: zoom / 100 }),
    syncBounds: (bounds) => invoke('sync_browser_webview_bounds', { webviewId, bounds }),
  };
}
```

### 3. Rust WebView Creation

```rust
// browser_webview.rs
#[tauri::command]
pub async fn create_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    window_id: String,
    initial_url: String,
    bounds: BrowserWebViewBounds,
    zoom: f64,
) -> Result<String, String> {
    let webview_id = format!("browser-webview-{}", window_id);

    let url = initial_url.parse::<tauri::Url>()
        .map_err(|e| format!("Invalid URL: {}", e))?;

    WebviewWindowBuilder::new(&app, &webview_id, WebviewUrl::External(url))
        .title("Browser")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .build()
        .map_err(|e| format!("Failed to create WebView: {}", e))?;

    // Set initial zoom
    if let Some(webview) = app.get_webview_window(&webview_id) {
        let _ = webview.set_zoom(zoom);
    }

    // Register in state
    state.register(&webview_id, &window_id);

    Ok(webview_id)
}
```

## Testing Strategy

### Unit Tests
- URL normalization logic
- Zoom factor conversion (percentage ↔ factor)
- Bounds validation

### Integration Tests
- WebView creation/destruction lifecycle
- Navigation commands (navigate, back, forward, refresh)
- Position synchronization accuracy

### Manual Testing Checklist
- [ ] Navigate to google.com (previously blocked by X-Frame-Options)
- [ ] Navigate to youtube.com (previously blocked)
- [ ] Navigate to github.com (previously blocked)
- [ ] Click links within page, verify URL bar updates
- [ ] Test back/forward navigation
- [ ] Test zoom in/out
- [ ] Resize browser window, verify WebView follows
- [ ] Move browser window, verify WebView follows
- [ ] Hide overlay (F3), verify WebView hides
- [ ] Close browser window, verify WebView destroyed
- [ ] Multiple browser windows simultaneously

## Common Issues

### WebView Not Appearing
- Check z-order: WebView must be `always_on_top(true)`
- Verify bounds are calculated correctly
- Check if `decorations(false)` is set

### URL Bar Not Updating
- Verify `on_navigation` hook is registered
- Check event listener is set up before WebView creation
- Confirm webview_id matches in event payload

### Position Drift
- Use logical pixels consistently
- Account for window border/shadow offsets
- Sync on both resize AND move events

## Performance Considerations

- **Position sync**: Debounce rapid resize/move events, but ensure final position is accurate
- **URL change events**: Already debounced by persistence system (existing debounce logic)
- **WebView creation**: Async operation, show loading state in toolbar

## Hotkey Priority

Overlay hotkeys (F3 to toggle visibility, F5 to toggle mode) take priority over WebView keyboard input. This is achieved through a low-level Windows keyboard hook (`src-tauri/src/keyboard_hook.rs`) that intercepts keyboard events at the OS level before they reach any window, including the WebView.

The priority order is:
1. **Low-level keyboard hook** (F3, F5) - Intercepts at OS level
2. **WebView keyboard events** - Only receives keys not consumed by hook
3. **Main overlay window** - Standard Tauri webview

This ensures the user can always toggle the overlay even when focus is on a WebView displaying an interactive web page.

## Known Limitations

### WebView Opacity Synchronization

Tauri 2.x doesn't expose a cross-platform opacity API for `WebviewWindow`. The `set_browser_webview_opacity` command exists for API compatibility but is a no-op. The WebView window is created with `transparent: true` which allows HTML content to have transparency, but the window itself cannot have its opacity adjusted programmatically like the parent browser window.

### Navigation Events

Tauri 2.x's WebviewWindow doesn't expose loading start/finish hooks. The `on_navigation` hook only fires when navigation begins (for URL bar sync). Loading state is approximated in the frontend by:
- Setting `isLoading = true` when a navigation command is invoked
- Clearing `isLoading` when URL change event is received or error occurs
