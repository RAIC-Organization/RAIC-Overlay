# Data Model: System Clock Window

**Feature**: 023-system-clock-window
**Date**: 2025-12-22

## Entities

### ClockWindow

A specialized overlay window that displays system time.

**Attributes**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | string | Unique window identifier | Format: `win_{timestamp}_{random}` |
| position | Position | Window screen coordinates | x, y >= 0 |
| size | Size | Window dimensions | width >= 150, height >= 100 |
| zIndex | number | Stacking order | >= BASE_Z_INDEX (100) |
| opacity | number | Window opacity level | 0.1 to 1.0 |
| backgroundTransparent | boolean | Whether background is transparent | Default: true |
| contentType | string | Window type identifier | Fixed: "clock" |

**Inherited from WindowInstance** (existing):
- All standard window properties
- Managed by WindowsContext

### Position

Screen coordinates for window placement.

| Field | Type | Description |
|-------|------|-------------|
| x | number | Horizontal position (pixels from left) |
| y | number | Vertical position (pixels from top) |

### Size

Window dimensions.

| Field | Type | Description |
|-------|------|-------------|
| width | number | Window width in pixels |
| height | number | Window height in pixels |

## Type Definitions

### Frontend (TypeScript)

```typescript
// Addition to src/types/windows.ts
export type WindowContentType =
  | 'notes'
  | 'draw'
  | 'browser'
  | 'fileviewer'
  | 'clock'  // NEW
  | 'test';

// Addition to src/types/persistence.ts
export type WindowType =
  | 'notes'
  | 'draw'
  | 'browser'
  | 'fileviewer'
  | 'clock';  // NEW

// ClockContent props (new component interface)
export interface ClockContentProps {
  isInteractive: boolean;  // true = windowed mode, false = fullscreen
  windowId?: string;       // For window identification (optional)
}

// Note: No ClockPersistedContent needed - clock has no saveable state
// Window position/size handled by existing WindowStructure
```

### Backend (Rust)

```rust
// Addition to src-tauri/src/persistence_types.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WindowType {
    Notes,
    Draw,
    Browser,
    Fileviewer,
    Clock,  // NEW
}
```

## State Transitions

### Clock Window Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐    Create     ┌──────────┐                   │
│  │  (none)  │──────────────>│  Active  │                   │
│  └──────────┘               └──────────┘                   │
│                                  │                          │
│                                  │ Close                    │
│                                  ▼                          │
│                             ┌──────────┐                   │
│                             │ Deleted  │                   │
│                             └──────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**States**:
- **Active**: Window is visible and updating time every second
- **Deleted**: Window closed, removed from state (position/size lost unless persisted)

**Transitions**:
- **Create**: User clicks "Clock" in main menu
- **Close**: User closes window (via header button or tray menu exit)

### Time Display State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────┐   1 second   ┌───────────────┐          │
│  │ HH:MM:SS (t)  │────────────>│ HH:MM:SS (t+1)│          │
│  └───────────────┘<────────────└───────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note**: Time state is ephemeral (React useState), not persisted.

## Validation Rules

### Window Position
- `x >= -window.width + MIN_VISIBLE_EDGE` (part must remain visible)
- `y >= 0` (cannot move above screen)
- Enforced by existing window drag logic

### Window Size
- `width >= MIN_WIDTH` (150px)
- `height >= MIN_HEIGHT` (100px)
- Enforced by existing window resize logic

### Time Display
- Format: 24-hour (HH:MM:SS)
- Range: 00:00:00 to 23:59:59
- Source: System clock (JavaScript Date object)

## Relationships

```
┌─────────────────┐         ┌─────────────────┐
│   MainMenu      │         │  WindowsContext │
│   Component     │────────>│    (Provider)   │
└─────────────────┘         └─────────────────┘
        │                           │
        │ emit                      │ manages
        │ window:open               │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  windowEvents   │         │  WindowInstance │
│    (emitter)    │────────>│   (clock type)  │
└─────────────────┘         └─────────────────┘
                                    │
                                    │ renders
                                    ▼
                            ┌─────────────────┐
                            │    Window       │
                            │   (wrapper)     │
                            └─────────────────┘
                                    │
                                    │ contains
                                    ▼
                            ┌─────────────────┐
                            │  ClockContent   │
                            │  (component)    │
                            └─────────────────┘
```

## Persistence Schema

### state.json (window structure)

```json
{
  "version": 1,
  "lastModified": "2025-12-22T12:00:00.000Z",
  "global": {
    "overlayMode": "windowed",
    "overlayVisible": true
  },
  "windows": [
    {
      "id": "win_1703260800000_abc123",
      "type": "clock",
      "position": { "x": 100, "y": 50 },
      "size": { "width": 200, "height": 80 },
      "zIndex": 101,
      "flags": { "minimized": false, "maximized": false },
      "opacity": 0.8,
      "backgroundTransparent": true
    }
  ]
}
```

### window-{id}.json

**Not required for clock windows.** Clock has no content state to persist. If created for consistency with other window types:

```json
{
  "windowId": "win_1703260800000_abc123",
  "type": "clock",
  "content": null,
  "lastModified": "2025-12-22T12:00:00.000Z"
}
```

## Default Values

| Property | Default Value | Source |
|----------|---------------|--------|
| width | 200 | Sensible for HH:MM:SS display |
| height | 80 | Compact height |
| opacity | 0.8 | Slightly more visible than default 0.6 |
| backgroundTransparent | true | Spec requirement |
| position | Center of screen | Standard window placement |
