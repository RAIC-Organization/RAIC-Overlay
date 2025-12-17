# Data Model: F3 Fullscreen Transparent Click-Through Overlay

**Feature Branch**: `003-f3-fullscreen-overlay`
**Date**: 2025-12-17

## Overview

This document defines the data structures and state management for the fullscreen transparent click-through overlay feature.

---

## Entities

### 1. OverlayMode (Enum)

Represents the two display modes of the overlay window.

| Value | Description |
|-------|-------------|
| `Windowed` | Normal windowed mode - header panel only, interactive |
| `Fullscreen` | Fullscreen transparent mode - covers entire screen, click-through |

**Rust Definition:**
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}
```

**TypeScript Definition:**
```typescript
type OverlayMode = 'windowed' | 'fullscreen';
```

---

### 2. WindowState (Struct)

Stores the saved window position and size for restoration when exiting fullscreen mode.

| Field | Type | Description |
|-------|------|-------------|
| `x` | `f64` | Horizontal position (logical pixels) |
| `y` | `f64` | Vertical position (logical pixels) |
| `width` | `f64` | Window width (logical pixels) |
| `height` | `f64` | Window height (logical pixels) |

**Rust Definition:**
```rust
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct WindowState {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}
```

**TypeScript Definition:**
```typescript
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

### 3. OverlayState (Extended)

Extended state management for the overlay application.

| Field | Type | Description |
|-------|------|-------------|
| `visible` | `bool` | Whether the overlay is currently visible |
| `initialized` | `bool` | Whether the overlay has been initialized |
| `mode` | `OverlayMode` | Current display mode (windowed/fullscreen) |
| `saved_window_state` | `Option<WindowState>` | Saved position/size for restoration |

**Rust Definition (Thread-Safe):**
```rust
use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Mutex;

pub struct OverlayState {
    visible: AtomicBool,
    initialized: AtomicBool,
    mode: AtomicU8,  // 0 = Windowed, 1 = Fullscreen
    saved_window_state: Mutex<Option<WindowState>>,
}
```

**TypeScript Definition:**
```typescript
interface OverlayState {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
  savedWindowState?: WindowState;
}
```

---

### 4. OverlayStateResponse (IPC)

Response structure for `get_overlay_state` command.

| Field | Type | Description |
|-------|------|-------------|
| `visible` | `bool` | Current visibility state |
| `initialized` | `bool` | Initialization status |
| `mode` | `string` | Current mode ("windowed" or "fullscreen") |

**Rust Definition:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayStateResponse {
    pub visible: bool,
    pub initialized: bool,
    pub mode: String,
}
```

**TypeScript Definition:**
```typescript
interface OverlayStateResponse {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
}
```

---

### 5. ModeChangePayload (IPC Event)

Payload for the `mode-changed` event emitted when mode toggles.

| Field | Type | Description |
|-------|------|-------------|
| `previous_mode` | `string` | Mode before the change |
| `current_mode` | `string` | Mode after the change |

**Rust Definition:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModeChangePayload {
    pub previous_mode: String,
    pub current_mode: String,
}
```

**TypeScript Definition:**
```typescript
interface ModeChangePayload {
  previousMode: OverlayMode;
  currentMode: OverlayMode;
}
```

---

## State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│                      Application Start                        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     WINDOWED      │ (default)
                 │  visible: false   │
                 │  mode: windowed   │
                 └─────────┬─────────┘
                           │
                    F3 Press
                           │
                           ▼
                 ┌───────────────────┐
                 │    FULLSCREEN     │
                 │  visible: true    │
                 │  mode: fullscreen │
                 │  click-through    │
                 │  60% transparent  │
                 └─────────┬─────────┘
                           │
                    F3 Press
                           │
                           ▼
                 ┌───────────────────┐
                 │     WINDOWED      │
                 │  visible: true    │
                 │  mode: windowed   │
                 │  restored pos/size│
                 └───────────────────┘
```

### Transition Rules

1. **Start → Windowed**: Application initializes in windowed mode, hidden
2. **Windowed → Fullscreen** (F3):
   - Save current window position and size
   - Expand window to fullscreen
   - Enable click-through (`set_ignore_cursor_events(true)`)
   - Set 60% transparency background
   - Header panel remains visible at same position
3. **Fullscreen → Windowed** (F3):
   - Restore saved position and size
   - Disable click-through (`set_ignore_cursor_events(false)`)
   - Remove fullscreen transparency background
4. **Debounce**: Ignore F3 presses within 200ms of previous press

---

## Validation Rules

| Entity | Field | Validation |
|--------|-------|------------|
| WindowState | x, y | Must be within monitor bounds |
| WindowState | width, height | Must be positive values |
| OverlayMode | - | Only "windowed" or "fullscreen" |
| Debounce | - | 200ms minimum between toggles |

---

## Relationships

```
OverlayState
    │
    ├── has one → OverlayMode
    │
    └── has optional → WindowState (saved)
```

---

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `DEBOUNCE_MS` | `200` | Minimum ms between F3 presses |
| `FULLSCREEN_OPACITY` | `0.4` | Background opacity (40% = 60% transparent) |
| `WINDOWED_WIDTH` | `400` | Default header panel width |
| `WINDOWED_HEIGHT` | `60` | Default header panel height |
