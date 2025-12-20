# Data Model: Browser Window Persistence

**Feature**: 015-browser-persistence
**Date**: 2025-12-20

## Entity Relationship Overview

This feature extends the existing persistence model from 010-state-persistence-system. The diagram shows only the additions/modifications.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PersistedState (state.json)                  │
├─────────────────────────────────────────────────────────────────┤
│ windows: WindowStructure[]                                      │
│   └── type: 'notes' | 'draw' | 'browser'  ← EXTENDED            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (references)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 WindowContentFile (window-{id}.json)            │
├─────────────────────────────────────────────────────────────────┤
│ type: 'notes' | 'draw' | 'browser'  ← EXTENDED                  │
│ content: NotesContent | DrawContent | BrowserPersistedContent ← │
└─────────────────────────────────────────────────────────────────┘
```

## Modified Entities

### 1. WindowType (Extended)

**Previous**:
```typescript
export type WindowType = 'notes' | 'draw';
```

**Updated**:
```typescript
export type WindowType = 'notes' | 'draw' | 'browser';
```

---

### 2. WindowContentFile.content (Extended Union)

**Previous**:
```typescript
content: NotesContent | DrawContent;
```

**Updated**:
```typescript
content: NotesContent | DrawContent | BrowserPersistedContent;
```

---

## New Entity

### BrowserPersistedContent

**Description**: Persisted state for a Browser window. Contains only the URL and zoom level - navigation history is intentionally not persisted per spec FR-014.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| url | string | Yes | "https://example.com" | Current URL displayed in iframe |
| zoom | number | Yes | 50 | Zoom percentage (10-200) |

**Validation Rules**:
- `url` must be a non-empty string
- `url` should start with `http://` or `https://` (normalized on save)
- `zoom` must be between 10 and 200 inclusive
- Invalid `zoom` values are clamped to valid range on load

**Example**:
```json
{
  "windowId": "win_xyz789",
  "type": "browser",
  "content": {
    "url": "https://github.com",
    "zoom": 70
  },
  "lastModified": "2025-12-20T14:30:00.000Z"
}
```

---

## Default Values

| Field | Default Value | Source |
|-------|---------------|--------|
| url | "https://example.com" | BROWSER_DEFAULTS.DEFAULT_URL |
| zoom | 50 | BROWSER_DEFAULTS.DEFAULT_ZOOM |

---

## TypeScript Definitions

### Additions to `src/types/persistence.ts`

```typescript
// ============================================================================
// Browser Content (NEW - 015-browser-persistence)
// ============================================================================

/**
 * Persisted content for Browser windows.
 * Navigation history is NOT persisted (only final URL).
 * @feature 015-browser-persistence
 */
export interface BrowserPersistedContent {
  /** Current URL displayed in the iframe */
  url: string;
  /** Zoom level percentage (10-200) */
  zoom: number;
}

// ============================================================================
// Modified Types
// ============================================================================

// Update WindowType union
export type WindowType = 'notes' | 'draw' | 'browser';

// Update WindowContentFile.content union
export interface WindowContentFile {
  windowId: string;
  type: WindowType;
  content: NotesContent | DrawContent | BrowserPersistedContent;
  lastModified: string;
}
```

### Helper Functions

```typescript
// ============================================================================
// Browser Persistence Helpers
// ============================================================================

import { BROWSER_DEFAULTS } from '@/components/windows/BrowserContent';

/**
 * Clamp zoom value to valid range (10-200)
 */
export function clampBrowserZoom(zoom: number): number {
  return Math.max(
    BROWSER_DEFAULTS.ZOOM_MIN,
    Math.min(BROWSER_DEFAULTS.ZOOM_MAX, zoom)
  );
}

/**
 * Validate and normalize BrowserPersistedContent
 * Returns content with defaults for missing/invalid values
 */
export function normalizeBrowserContent(
  content: Partial<BrowserPersistedContent> | null | undefined
): BrowserPersistedContent {
  return {
    url: content?.url || BROWSER_DEFAULTS.DEFAULT_URL,
    zoom: clampBrowserZoom(content?.zoom ?? BROWSER_DEFAULTS.DEFAULT_ZOOM),
  };
}

/**
 * Create default BrowserPersistedContent
 */
export const DEFAULT_BROWSER_CONTENT: BrowserPersistedContent = {
  url: BROWSER_DEFAULTS.DEFAULT_URL,
  zoom: BROWSER_DEFAULTS.DEFAULT_ZOOM,
};
```

---

## Rust Definitions

### Additions to `src-tauri/src/persistence_types.rs`

```rust
// ============================================================================
// Modified Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowType {
    Notes,
    Draw,
    Browser,  // NEW
}

// Note: WindowContentFile.content remains serde_json::Value
// The frontend handles type-specific content parsing
```

---

## File System Layout

No changes to directory structure. Browser windows follow existing pattern:

```
{appDataDir}/
├── state.json                 # Contains browser window structure
├── window-win_abc123.json     # Notes content
├── window-win_def456.json     # Draw content
└── window-win_xyz789.json     # Browser content (url + zoom)
```

---

## Persistence Triggers

Extension of existing trigger table from 010-state-persistence-system:

| Trigger | Actions | Debounce | NEW? |
|---------|---------|----------|------|
| Browser URL navigation complete | Save window-{id}.json | 500ms | YES |
| Browser zoom change | Save window-{id}.json | 500ms | YES |
| Browser window created | Save state.json, Create window-{id}.json | No | Existing pattern |
| Browser window closed | Save state.json, Delete window-{id}.json | No | Existing pattern |
| Browser window moved/resized | Save state.json | 500ms | Existing pattern |
| Browser window opacity changed | Save state.json | 500ms | Existing pattern |

---

## Type Guards

```typescript
/**
 * Type guard for BrowserPersistedContent
 */
export function isBrowserContent(
  content: NotesContent | DrawContent | BrowserPersistedContent
): content is BrowserPersistedContent {
  return 'url' in content && 'zoom' in content;
}
```
