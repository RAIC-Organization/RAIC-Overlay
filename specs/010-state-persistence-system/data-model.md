# Data Model: State Persistence System

**Feature**: 010-state-persistence-system
**Date**: 2025-12-19

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PersistedState (state.json)                  │
├─────────────────────────────────────────────────────────────────┤
│ version: number                                                 │
│ lastModified: string (ISO)                                      │
│ global: GlobalSettings                                          │
│ windows: WindowStructure[]                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (references)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 WindowContentFile (window-{id}.json)            │
├─────────────────────────────────────────────────────────────────┤
│ windowId: string (matches WindowStructure.id)                   │
│ type: 'notes' | 'draw'                                          │
│ content: NotesContent | DrawContent                             │
│ lastModified: string (ISO)                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Entities

### 1. PersistedState

**Description**: Root container for the main state file (`state.json`). Contains global settings and structural information for all windows, but NOT window content.

**File**: `{appDataDir}/state.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | number | Yes | State schema version (starts at 1) |
| lastModified | string | Yes | ISO 8601 timestamp of last save |
| global | GlobalSettings | Yes | Application-wide settings |
| windows | WindowStructure[] | Yes | Array of window structural data |

**Validation Rules**:
- `version` must be a positive integer
- `version` must match current application version or trigger reset
- `lastModified` must be valid ISO 8601 format
- `windows` can be empty array (no windows open)

**Example**:
```json
{
  "version": 1,
  "lastModified": "2025-12-19T10:30:00.000Z",
  "global": {
    "overlayMode": "windowed",
    "overlayVisible": true
  },
  "windows": [
    {
      "id": "win_abc123",
      "type": "notes",
      "position": { "x": 100, "y": 150 },
      "size": { "width": 400, "height": 300 },
      "zIndex": 101,
      "flags": { "minimized": false, "maximized": false }
    }
  ]
}
```

---

### 2. GlobalSettings

**Description**: Application-wide settings that apply to the entire overlay.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| overlayMode | 'windowed' \| 'fullscreen' | Yes | 'windowed' | Current overlay display mode |
| overlayVisible | boolean | Yes | false | Whether overlay is currently visible |

**Validation Rules**:
- `overlayMode` must be one of the allowed enum values
- `overlayVisible` must be boolean

---

### 3. WindowStructure

**Description**: Structural/positional data for a single window. Does NOT include content (content is in separate `window-{id}.json` files).

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | Yes | (generated) | Unique identifier, stable across sessions |
| type | 'notes' \| 'draw' | Yes | - | Window content type |
| position | Position | Yes | { x: 100, y: 100 } | Screen position |
| size | Size | Yes | { width: 400, height: 300 } | Window dimensions |
| zIndex | number | Yes | 100 | Stacking order |
| flags | WindowFlags | Yes | (all false) | Window state flags |

**Validation Rules**:
- `id` must be non-empty string, unique within windows array
- `id` format: `win_` prefix + alphanumeric (e.g., `win_abc123`)
- `type` must be one of the allowed enum values
- `position.x` and `position.y` can be any integer (negative allowed for multi-monitor)
- `size.width` >= 150 (MIN_WIDTH)
- `size.height` >= 100 (MIN_HEIGHT)
- `zIndex` >= 100 (BASE_Z_INDEX)

---

### 4. Position

**Description**: 2D screen coordinates for window placement.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| x | number | Yes | Horizontal position in pixels |
| y | number | Yes | Vertical position in pixels |

---

### 5. Size

**Description**: Window dimensions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| width | number | Yes | Width in pixels (min: 150) |
| height | number | Yes | Height in pixels (min: 100) |

---

### 6. WindowFlags

**Description**: Boolean flags for window state.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| minimized | boolean | Yes | false | Window is minimized |
| maximized | boolean | Yes | false | Window is maximized |

**Note**: `locked` flag from spec deferred - not currently used in existing code.

---

### 7. WindowContentFile

**Description**: Content data for a single window. Stored in separate file (`window-{id}.json`) for isolation and easier deletion.

**File**: `{appDataDir}/window-{id}.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| windowId | string | Yes | Must match WindowStructure.id |
| type | 'notes' \| 'draw' | Yes | Content type (redundant for validation) |
| content | NotesContent \| DrawContent | Yes | Type-specific content |
| lastModified | string | Yes | ISO 8601 timestamp |

**Validation Rules**:
- `windowId` must match the `{id}` in filename
- `type` must match the content structure

**Example (Notes)**:
```json
{
  "windowId": "win_abc123",
  "type": "notes",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Hello world" }]
      }
    ]
  },
  "lastModified": "2025-12-19T10:30:00.000Z"
}
```

**Example (Draw)**:
```json
{
  "windowId": "win_def456",
  "type": "draw",
  "content": {
    "elements": [
      {
        "id": "elem_1",
        "type": "rectangle",
        "x": 10,
        "y": 20,
        "width": 100,
        "height": 50
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    }
  },
  "lastModified": "2025-12-19T10:30:00.000Z"
}
```

---

### 8. NotesContent

**Description**: TipTap editor JSON content structure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | 'doc' | Yes | Root node type |
| content | TipTapNode[] | Yes | Array of TipTap nodes |

**Note**: This follows TipTap's `JSONContent` structure from `@tiptap/core`.

---

### 9. DrawContent

**Description**: Excalidraw scene data structure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| elements | ExcalidrawElement[] | Yes | Array of drawing elements |
| appState | Partial\<ExcalidrawAppState\> | No | Optional app state (colors, etc.) |

**Note**: This follows Excalidraw's native export format.

---

## State Transitions

### Window Lifecycle

```
┌─────────┐    createWindow()    ┌─────────┐
│ (none)  │ ──────────────────▶  │ ACTIVE  │
└─────────┘                      └────┬────┘
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     │                                │                                │
     │ move/resize                    │ updateContent                  │ closeWindow()
     ▼                                ▼                                ▼
┌─────────┐                      ┌─────────┐                      ┌─────────┐
│ ACTIVE  │                      │ ACTIVE  │                      │ DELETED │
│(updated)│                      │(content │                      │(removed │
└─────────┘                      │ changed)│                      │from disk)
                                 └─────────┘                      └─────────┘
```

### Persistence Triggers

| Trigger | Actions | Debounce |
|---------|---------|----------|
| Window created | Save state.json (add window), Create window-{id}.json | No |
| Window moved/resized | Save state.json (update position/size) | 500ms |
| Window content changed | Save window-{id}.json | 500ms |
| Window closed | Save state.json (remove window), Delete window-{id}.json | No |
| Overlay mode changed | Save state.json (update global) | No |
| Overlay visibility changed | Save state.json (update global) | No |

---

## TypeScript Definitions

```typescript
// types/persistence.ts

export const CURRENT_STATE_VERSION = 1;

// ============ Persisted State (state.json) ============

export interface PersistedState {
  version: number;
  lastModified: string;
  global: GlobalSettings;
  windows: WindowStructure[];
}

export interface GlobalSettings {
  overlayMode: OverlayMode;
  overlayVisible: boolean;
}

export type OverlayMode = 'windowed' | 'fullscreen';

export interface WindowStructure {
  id: string;
  type: WindowType;
  position: Position;
  size: Size;
  zIndex: number;
  flags: WindowFlags;
}

export type WindowType = 'notes' | 'draw';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowFlags {
  minimized: boolean;
  maximized: boolean;
}

// ============ Window Content (window-{id}.json) ============

export interface WindowContentFile {
  windowId: string;
  type: WindowType;
  content: NotesContent | DrawContent;
  lastModified: string;
}

export interface NotesContent {
  type: 'doc';
  content: TipTapNode[];
}

// TipTap node structure (simplified)
export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
}

export interface DrawContent {
  elements: ExcalidrawElement[];
  appState?: Partial<ExcalidrawAppState>;
}

// Excalidraw types (simplified - use actual types from @excalidraw/excalidraw)
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface ExcalidrawAppState {
  viewBackgroundColor: string;
  [key: string]: unknown;
}

// ============ Default Values ============

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  overlayMode: 'windowed',
  overlayVisible: false,
};

export const DEFAULT_WINDOW_FLAGS: WindowFlags = {
  minimized: false,
  maximized: false,
};

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  version: CURRENT_STATE_VERSION,
  lastModified: new Date().toISOString(),
  global: DEFAULT_GLOBAL_SETTINGS,
  windows: [],
};
```

---

## Rust Definitions

```rust
// src-tauri/src/persistence_types.rs

use serde::{Deserialize, Serialize};

pub const CURRENT_STATE_VERSION: u32 = 1;

// ============ Persisted State (state.json) ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub version: u32,
    pub last_modified: String,
    pub global: GlobalSettings,
    pub windows: Vec<WindowStructure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    pub overlay_mode: OverlayMode,
    pub overlay_visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStructure {
    pub id: String,
    #[serde(rename = "type")]
    pub window_type: WindowType,
    pub position: Position,
    pub size: Size,
    pub z_index: u32,
    pub flags: WindowFlags,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowType {
    Notes,
    Draw,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowFlags {
    pub minimized: bool,
    pub maximized: bool,
}

// ============ Window Content (window-{id}.json) ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowContentFile {
    pub window_id: String,
    #[serde(rename = "type")]
    pub window_type: WindowType,
    pub content: serde_json::Value, // Flexible JSON for TipTap/Excalidraw
    pub last_modified: String,
}

// ============ Default Implementations ============

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            overlay_mode: OverlayMode::Windowed,
            overlay_visible: false,
        }
    }
}

impl Default for WindowFlags {
    fn default() -> Self {
        Self {
            minimized: false,
            maximized: false,
        }
    }
}

impl Default for PersistedState {
    fn default() -> Self {
        Self {
            version: CURRENT_STATE_VERSION,
            last_modified: chrono::Utc::now().to_rfc3339(),
            global: GlobalSettings::default(),
            windows: Vec::new(),
        }
    }
}
```

---

## File System Layout

```
{appDataDir}/
├── state.json                 # Main state file (global + window structure)
├── window-win_abc123.json     # Content for window win_abc123
├── window-win_def456.json     # Content for window win_def456
└── window-win_ghi789.json     # Content for window win_ghi789
```

**Cleanup Rules**:
- When a window is closed, delete its `window-{id}.json` file
- On startup, orphaned `window-*.json` files (not referenced in state.json) should be cleaned up
- Temp files (`*.json.tmp`) should be cleaned up on startup (failed atomic writes)
