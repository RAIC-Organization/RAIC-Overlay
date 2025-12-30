# Data Model: WebView Browser Architecture

**Feature**: 040-webview-browser
**Date**: 2025-12-30

## Entities

### 1. BrowserWebViewState (Rust)

Tracks all active browser WebViews for overlay integration.

```
BrowserWebViewState
├── webviews: HashMap<String, BrowserWebViewInfo>  # webview_id → info
└── Methods:
    ├── register(webview_id, window_id)
    ├── unregister(webview_id)
    ├── get_all_labels() → Vec<String>
    └── get_by_window_id(window_id) → Option<String>
```

**Attributes**:
| Field | Type | Description |
|-------|------|-------------|
| webviews | HashMap<String, BrowserWebViewInfo> | Map of webview labels to their info |

### 2. BrowserWebViewInfo (Rust)

Information about a single browser WebView.

```
BrowserWebViewInfo
├── webview_id: String      # Unique webview label (e.g., "browser-webview-abc123")
├── window_id: String       # Associated React browser window ID
├── current_url: String     # Last known URL
├── zoom_factor: f64        # Current zoom (0.1 - 2.0)
├── is_visible: bool        # Current visibility state
└── created_at: DateTime    # Creation timestamp
```

**Attributes**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| webview_id | String | Unique, pattern: `browser-webview-{uuid}` | Tauri webview label |
| window_id | String | Required | React browser window ID for correlation |
| current_url | String | Valid URL or empty | Last navigated URL |
| zoom_factor | f64 | 0.1 - 2.0 | Zoom multiplier |
| is_visible | bool | Default: true | Visibility state |
| created_at | DateTime | Auto-set | Creation timestamp |

### 3. BrowserWebViewBounds (Rust/TypeScript)

Position and size for WebView synchronization.

```
BrowserWebViewBounds
├── x: f64       # X position in logical pixels
├── y: f64       # Y position in logical pixels
├── width: f64   # Width in logical pixels
└── height: f64  # Height in logical pixels
```

**Validation Rules**:
- All values must be non-negative
- Width and height must be > 0
- Coordinates are in logical pixels (DPI-independent)

### 4. BrowserUrlPayload (Event)

Event payload for URL change notifications.

```
BrowserUrlPayload
├── webview_id: String   # Source webview label
├── url: String          # New URL
└── can_go_back: bool    # Navigation history state
└── can_go_forward: bool # Navigation history state
```

### 5. BrowserErrorPayload (Event)

Event payload for error notifications.

```
BrowserErrorPayload
├── webview_id: String    # Source webview label
├── error_type: String    # Error category
└── message: String       # Human-readable error message
```

**Error Types**:
| Type | Description |
|------|-------------|
| `navigation_failed` | URL could not be loaded |
| `ssl_error` | Certificate/HTTPS issue |
| `timeout` | Page load timed out |
| `webview_error` | Internal webview error |

## State Transitions

### WebView Lifecycle

```
[Not Created]
    → create_browser_webview()
    → [Active]

[Active]
    → hide() → [Hidden]
    → destroy() → [Destroyed]

[Hidden]
    → show() → [Active]
    → destroy() → [Destroyed]

[Destroyed]
    → (terminal state)
```

### Navigation State

```
[Idle]
    → navigate(url) → [Loading]

[Loading]
    → success → [Loaded] → emit(url-changed)
    → failure → [Error] → emit(browser-error)

[Loaded]
    → link_click → [Loading]
    → navigate(url) → [Loading]

[Error]
    → navigate(url) → [Loading]
    → refresh() → [Loading]
```

## Relationships

```
React Browser Window (1) ←→ (1) Browser WebView
                         │
                         ├── Controls: URL, zoom, navigation
                         ├── Syncs: position, size, visibility
                         └── Receives: url-changed, error events

Overlay State (1) ←→ (N) Browser WebViews
                    │
                    └── Visibility sync: hide/show all on overlay toggle
```

## Persistence Integration

Browser WebView state extends existing persistence:

```
state.json (existing)
└── windows[]
    └── {
          id: "window-abc",
          type: "browser",
          content: {
            url: "https://google.com",  # Persisted URL
            zoom: 100                    # Persisted zoom (10-200 percentage)
          }
        }
```

**Note**: WebView instances are ephemeral; only URL and zoom are persisted. WebViews are recreated on app restart from persisted state.

## TypeScript Types

```typescript
// Browser WebView control types
interface BrowserWebViewConfig {
  webviewId: string;
  windowId: string;
  initialUrl: string;
  initialZoom: number; // 10-200 percentage
}

interface BrowserWebViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Event payload types
interface BrowserUrlChangedEvent {
  webviewId: string;
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserErrorEvent {
  webviewId: string;
  errorType: 'navigation_failed' | 'ssl_error' | 'timeout' | 'webview_error';
  message: string;
}

// Hook state
interface UseBrowserWebViewState {
  isLoading: boolean;
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  error: BrowserErrorEvent | null;
  zoom: number;
}
```
