# Data Model: Per-Window Opacity Control

**Feature**: 013-window-opacity-control
**Date**: 2025-12-20

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WindowInstance (in-memory)                    │
├─────────────────────────────────────────────────────────────────┤
│ id: string                                                       │
│ title: string                                                    │
│ contentType: WindowContentType                                   │
│ component: React.ComponentType                                   │
│ x, y: number                                                     │
│ width, height: number                                            │
│ zIndex: number                                                   │
│ opacity: number  ◄── NEW (0.1 to 1.0, default 0.6)              │
│ createdAt: number                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ serializes to
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 WindowStructure (state.json)                     │
├─────────────────────────────────────────────────────────────────┤
│ id: string                                                       │
│ type: 'notes' | 'draw'                                           │
│ position: { x, y }                                               │
│ size: { width, height }                                          │
│ zIndex: number                                                   │
│ flags: { minimized, maximized }                                  │
│ opacity: number  ◄── NEW (0.1 to 1.0, default 0.6)              │
└─────────────────────────────────────────────────────────────────┘
```

## Modified Entities

### 1. WindowInstance (Extended)

**Description**: In-memory representation of a window in the windowing system. Extended with opacity property.

**File**: `src/types/windows.ts`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | Yes | (generated) | Unique identifier |
| title | string | Yes | - | Window title |
| contentType | WindowContentType | No | - | Type for persistence |
| component | React.ComponentType | Yes | - | Rendered component |
| componentProps | Record<string, unknown> | No | - | Component props |
| x | number | Yes | centered | X position in pixels |
| y | number | Yes | centered | Y position in pixels |
| width | number | Yes | 400 | Width in pixels |
| height | number | Yes | 300 | Height in pixels |
| zIndex | number | Yes | 100+ | Stacking order |
| createdAt | number | Yes | Date.now() | Creation timestamp |
| **opacity** | **number** | **Yes** | **0.6** | **NEW: Window opacity (0.1-1.0)** |

**Validation Rules**:
- `opacity` must be >= 0.1 (MIN_OPACITY)
- `opacity` must be <= 1.0 (MAX_OPACITY)
- `opacity` defaults to 0.6 (DEFAULT_OPACITY) if not specified or out of range

---

### 2. WindowStructure (Extended)

**Description**: Persisted window structure in state.json. Extended with opacity property.

**File**: `src/types/persistence.ts`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | Yes | - | Unique identifier |
| type | WindowType | Yes | - | 'notes' or 'draw' |
| position | Position | Yes | - | { x, y } coordinates |
| size | Size | Yes | - | { width, height } |
| zIndex | number | Yes | 100 | Stacking order |
| flags | WindowFlags | Yes | - | { minimized, maximized } |
| **opacity** | **number** | **Yes** | **0.6** | **NEW: Window opacity (0.1-1.0)** |

**Validation Rules**:
- Same as WindowInstance opacity rules
- Clamp to valid range when loading from persisted state

---

### 3. WindowOpenPayload (Extended)

**Description**: Payload for opening a new window. Extended with optional initial opacity.

**File**: `src/types/windows.ts`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| component | React.ComponentType | Yes | - | Component to render |
| title | string | Yes | - | Window title |
| contentType | WindowContentType | No | - | Type for persistence |
| componentProps | Record<string, unknown> | No | - | Component props |
| initialWidth | number | No | 400 | Initial width |
| initialHeight | number | No | 300 | Initial height |
| initialX | number | No | centered | Initial X position |
| initialY | number | No | centered | Initial Y position |
| windowId | string | No | (generated) | Pre-assigned ID |
| initialZIndex | number | No | nextZIndex | Initial z-index |
| **initialOpacity** | **number** | **No** | **0.6** | **NEW: Initial opacity** |

---

## New Constants

**File**: `src/types/windows.ts`

```typescript
export const WINDOW_CONSTANTS = {
  // ... existing constants
  MIN_OPACITY: 0.1,      // 10% - minimum to keep window visible
  MAX_OPACITY: 1.0,      // 100% - fully opaque
  DEFAULT_OPACITY: 0.6,  // 60% - default for new windows
} as const;
```

---

## New Reducer Action

**File**: `src/contexts/WindowsContext.tsx`

```typescript
type WindowsAction =
  // ... existing actions
  | { type: 'SET_WINDOW_OPACITY'; windowId: string; opacity: number };
```

**Reducer Case**:
```typescript
case 'SET_WINDOW_OPACITY': {
  const { windowId, opacity } = action;
  const clampedOpacity = Math.max(
    WINDOW_CONSTANTS.MIN_OPACITY,
    Math.min(WINDOW_CONSTANTS.MAX_OPACITY, opacity)
  );

  const updatedWindows = state.windows.map((w) =>
    w.id === windowId ? { ...w, opacity: clampedOpacity } : w
  );

  return { ...state, windows: updatedWindows };
}
```

---

## Extended Context Interface

**File**: `src/contexts/WindowsContext.tsx`

```typescript
export interface ExtendedWindowsContextValue extends WindowsContextValue {
  // ... existing methods

  /** Set opacity for a specific window */
  setWindowOpacity: (windowId: string, opacity: number) => void;
}
```

---

## TypeScript Definitions

### Frontend (TypeScript)

```typescript
// src/types/windows.ts - Extended WindowInstance
export interface WindowInstance {
  id: string;
  title: string;
  contentType?: WindowContentType;
  component: AnyComponent;
  componentProps?: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: number;
  opacity: number;  // NEW: 0.1 to 1.0
}

// src/types/windows.ts - Extended constants
export const WINDOW_CONSTANTS = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 300,
  MIN_VISIBLE_EDGE: 50,
  BASE_Z_INDEX: 100,
  HEADER_HEIGHT: 32,
  MIN_OPACITY: 0.1,       // NEW
  MAX_OPACITY: 1.0,       // NEW
  DEFAULT_OPACITY: 0.6,   // NEW
} as const;
```

```typescript
// src/types/persistence.ts - Extended WindowStructure
export interface WindowStructure {
  id: string;
  type: WindowType;
  position: Position;
  size: Size;
  zIndex: number;
  flags: WindowFlags;
  opacity: number;  // NEW: 0.1 to 1.0
}
```

### Backend (Rust)

```rust
// src-tauri/src/persistence_types.rs - Extended WindowStructure
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
    #[serde(default = "default_opacity")]
    pub opacity: f32,  // NEW: 0.1 to 1.0
}

fn default_opacity() -> f32 {
    0.6
}
```

---

## State Transitions

### Opacity Change Flow

```
┌──────────────┐    user drags slider    ┌──────────────────────┐
│ Window with  │ ─────────────────────▶  │ SET_WINDOW_OPACITY   │
│ opacity: 0.6 │                         │ (real-time updates)  │
└──────────────┘                         └──────────┬───────────┘
                                                    │
                     ┌──────────────────────────────┘
                     │
                     ▼ immediate visual update
┌──────────────────────────────────────────────────────────────┐
│ Window.tsx applies opacity via CSS                            │
│ style={{ opacity: windowInstance.opacity }}                   │
└──────────────────────────────────────────────────────────────┘
                     │
                     │ on slider release (onValueCommit)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Trigger persistence via onWindowMoved()                       │
│ Debounced save to state.json (500ms)                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Migration / Compatibility

**Backwards Compatibility**:
- Existing `state.json` files without `opacity` field are valid
- Missing `opacity` defaults to 0.6 via Rust `#[serde(default)]` and TypeScript fallback
- No state version bump required

**Validation on Load**:
```typescript
function clampOpacity(opacity: number | undefined): number {
  if (opacity === undefined) return WINDOW_CONSTANTS.DEFAULT_OPACITY;
  return Math.max(
    WINDOW_CONSTANTS.MIN_OPACITY,
    Math.min(WINDOW_CONSTANTS.MAX_OPACITY, opacity)
  );
}
```
