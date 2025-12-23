# Data Model: Widget Container System

**Feature**: 027-widget-container
**Date**: 2025-12-23

## Entities

### 1. Widget

A transparent, borderless container for displaying content with flip-to-settings capability.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | string | Unique identifier | Format: `wgt_{uuid}`, required |
| type | WidgetType | Widget content type | Required, extensible enum |
| position | Position | Top-left coordinates | x, y >= 0, constrained to visible area |
| size | Size | Width and height | Min 80x60px, max container bounds |
| opacity | number | Transparency level | 0.1 to 1.0 (10-100%), default 0.6 |
| isFlipped | boolean | Settings panel visible | Runtime only, not persisted |

### 2. WidgetType (Enum)

```typescript
type WidgetType = 'clock'; // Extensible for future: 'timer', 'weather', etc.
```

### 3. Position

Reuses existing type from window system.

| Field | Type | Description |
|-------|------|-------------|
| x | number | Horizontal offset from container left (px) |
| y | number | Vertical offset from container top (px) |

### 4. Size

Reuses existing type from window system.

| Field | Type | Description |
|-------|------|-------------|
| width | number | Widget width in pixels |
| height | number | Widget height in pixels |

---

## State Structures

### WidgetInstance (Runtime State)

Full widget representation in memory during app execution.

```typescript
interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isFlipped: boolean;      // Not persisted
  createdAt: number;       // Timestamp for ordering
}
```

### WidgetStructure (Persisted State)

Serialized widget data for storage.

```typescript
interface WidgetStructure {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  opacity: number;
}
```

### WidgetsState (Aggregate State)

Complete widget system state.

```typescript
interface WidgetsState {
  widgets: WidgetInstance[];
  activeWidgetId: string | null;
}
```

---

## Persistence Schema

### state.json Extension

```json
{
  "version": 1,
  "lastModified": "2025-12-23T12:00:00.000Z",
  "global": {
    "scanlinesEnabled": false,
    "overlayMode": "windowed",
    "overlayVisible": true
  },
  "windows": [...],
  "widgets": [
    {
      "id": "wgt_abc123",
      "type": "clock",
      "position": { "x": 100, "y": 50 },
      "size": { "width": 200, "height": 80 },
      "opacity": 0.8
    }
  ]
}
```

### TypeScript Types (src/types/persistence.ts additions)

```typescript
export interface PersistedState {
  version: number;
  lastModified: string;
  global: GlobalSettings;
  windows: WindowStructure[];
  widgets: WidgetStructure[];  // NEW
}

export interface WidgetStructure {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  opacity: number;
}

export type WidgetType = 'clock';
```

### Rust Types (src-tauri/src/persistence_types.rs additions)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub version: u32,
    pub last_modified: String,
    pub global: GlobalSettings,
    pub windows: Vec<WindowStructure>,
    #[serde(default)]
    pub widgets: Vec<WidgetStructure>,  // NEW
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetStructure {
    pub id: String,
    pub widget_type: WidgetType,
    pub position: Position,
    pub size: Size,
    pub opacity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WidgetType {
    Clock,
}
```

---

## Constants

### Widget Defaults

```typescript
export const WIDGET_CONSTANTS = {
  MIN_WIDTH: 80,
  MIN_HEIGHT: 60,
  DEFAULT_WIDTH: 200,
  DEFAULT_HEIGHT: 80,
  MIN_VISIBLE_EDGE: 30,
  MIN_OPACITY: 0.1,
  MAX_OPACITY: 1.0,
  DEFAULT_OPACITY: 0.6,
  HOLD_THRESHOLD_MS: 175,
  FLIP_DURATION_MS: 500,
} as const;
```

### Clock Widget Defaults

```typescript
export const CLOCK_WIDGET_DEFAULTS = {
  WIDTH: 200,
  HEIGHT: 80,
  OPACITY: 0.8,
  UPDATE_INTERVAL_MS: 1000,
  MIN_FONT_SIZE: 12,
} as const;
```

---

## Validation Rules

### Widget Creation
1. `id` must be unique (generated with `wgt_` prefix + UUID)
2. `type` must be valid WidgetType enum value
3. `position` must keep widget at least partially visible
4. `size` must be >= minimum dimensions
5. `opacity` must be within 0.1-1.0 range

### Widget Update
1. Position changes must maintain visibility constraint
2. Size changes must respect minimum dimensions
3. Opacity changes must be within valid range

### Widget Persistence
1. Only WidgetStructure fields are saved (no `isFlipped`, `createdAt`)
2. `widgets` array defaults to `[]` for backward compatibility
3. Invalid widget entries are skipped during restoration

---

## State Transitions

### Widget Lifecycle

```
[Not Created] --create--> [Active (Content View)]
                               |
    [Settings View] <--flip--> [Active (Content View)]
         |                          |
         +--------close-------------+
                    |
                    v
               [Destroyed]
```

### Flip State Machine

```
Content View:
  - on click (release < 175ms): transition to Settings View
  - on hold (> 175ms): enable drag mode

Settings View:
  - on close button click: transition to Content View
  - opacity slider: update opacity in real-time
```

---

## Relationships

```
PersistedState
├── GlobalSettings (1:1)
├── WindowStructure[] (1:N)
└── WidgetStructure[] (1:N) ←── NEW

WidgetInstance
└── WidgetType (1:1)
    └── ClockWidgetContent (renders based on type)
```

---

## Migration Notes

### From Existing state.json
- Existing files without `widgets` field will deserialize with empty array (via `#[serde(default)]`)
- No version bump required (additive change)
- No migration script needed

### Deprecated: Clock Window
- Remove `'clock'` from `WindowType` enum
- Existing clock windows in saved state will be ignored during restoration
- Log warning when skipping deprecated clock window entries
