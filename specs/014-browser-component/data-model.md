# Data Model: Browser Component

**Date**: 2025-12-20
**Branch**: 014-browser-component

## Overview

The Browser component uses ephemeral in-memory state only. No persistence is required per specification. All state is lost when windows are closed.

---

## Entities

### BrowserState

The core state managed by each BrowserContent component instance.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | "https://www.google.com" | Current URL loaded in the iframe |
| historyStack | string[] | ["https://www.google.com"] | Array of visited URLs |
| historyIndex | number | 0 | Current position in history stack |
| zoom | number | 50 | Zoom percentage (10-200, step 10) |
| isLoading | boolean | false | Whether the iframe is currently loading |

**Validation Rules**:
- `url`: Must be a valid URL with http:// or https:// protocol
- `zoom`: Must be integer, minimum 10, maximum 200, step 10
- `historyIndex`: Must be >= 0 and < historyStack.length

**State Transitions**:
```
[Initial State]
  │
  ├─ navigateTo(url) ──► [URL changed, history updated, loading=true]
  │                           │
  │                           ├─ onLoad ──► [loading=false]
  │                           │
  ├─ goBack() ──► [historyIndex decremented, URL from stack, loading=true]
  │
  ├─ goForward() ──► [historyIndex incremented, URL from stack, loading=true]
  │
  ├─ refresh() ──► [loading=true, same URL]
  │
  ├─ zoomIn() ──► [zoom += 10, max 200]
  │
  └─ zoomOut() ──► [zoom -= 10, min 10]
```

---

### BrowserContentProps

Props interface for the BrowserContent component (follows existing pattern).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| isInteractive | boolean | Yes | Whether interaction mode is active (toolbar visible) |

---

### BrowserToolbarProps

Props interface for the BrowserToolbar component.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Current URL to display in address bar |
| canGoBack | boolean | Yes | Whether back button should be enabled |
| canGoForward | boolean | Yes | Whether forward button should be enabled |
| zoom | number | Yes | Current zoom percentage for display |
| isLoading | boolean | Yes | Whether to show loading indicator |
| onNavigate | (url: string) => void | Yes | Callback when URL is submitted |
| onBack | () => void | Yes | Callback for back button click |
| onForward | () => void | Yes | Callback for forward button click |
| onRefresh | () => void | Yes | Callback for refresh button click |
| onZoomIn | () => void | Yes | Callback for zoom in button click |
| onZoomOut | () => void | Yes | Callback for zoom out button click |

---

## Type Definitions

```typescript
// src/types/browser.ts (new file, optional - can be inline)

export interface BrowserState {
  url: string;
  historyStack: string[];
  historyIndex: number;
  zoom: number;
  isLoading: boolean;
}

export interface BrowserContentProps {
  isInteractive: boolean;
}

export interface BrowserToolbarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  zoom: number;
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}
```

---

## Constants

```typescript
export const BROWSER_DEFAULTS = {
  DEFAULT_URL: "https://www.google.com",
  DEFAULT_ZOOM: 50,
  ZOOM_MIN: 10,
  ZOOM_MAX: 200,
  ZOOM_STEP: 10,
} as const;
```

---

## Relationships

```
MainMenu
    │
    └── emits window:open event with BrowserContent
            │
            └── WindowsContainer creates Window
                    │
                    └── BrowserContent (state owner)
                            │
                            ├── BrowserToolbar (visible when isInteractive)
                            │       └── receives callbacks, displays state
                            │
                            └── iframe (displays url, scaled by zoom)
```

---

## Integration Points

### Window Event System

Browser uses the existing `windowEvents` system from `src/lib/windowEvents.ts`:

```typescript
// In MainMenu.tsx
windowEvents.emit("window:open", {
  component: BrowserContent,
  title: "Browser",
  contentType: "browser",
  componentProps: { isInteractive: mode === "windowed" },
});
```

### Interaction Mode

Component receives `isInteractive` prop that controls:
- Toolbar visibility (hidden when false)
- Iframe pointer-events (disabled when false via CSS overlay or pointer-events: none)

---

## No Persistence

Per specification (FR-029): "When a Browser window is closed, all state MUST be permanently discarded (no persistence)."

The Browser component does NOT integrate with:
- PersistenceContext
- usePersistence hook
- Window content serialization

This matches the ephemeral nature of Notes and Draw components prior to feature 010.
