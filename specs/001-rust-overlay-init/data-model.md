# Data Model: RAIC Overlay Project Initialization

**Branch**: `001-rust-overlay-init` | **Date**: 2025-12-12

## Overview

This feature is primarily stateless - the overlay manages runtime state only with no persistent storage. This document defines the minimal state model for the overlay visibility toggle.

---

## Entities

### 1. OverlayState

**Purpose**: Tracks the current visibility state of the overlay panel.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `visible` | boolean | Whether the header panel is currently displayed | Default: `false` |
| `initialized` | boolean | Whether the overlay window has completed setup | Default: `false` |

**State Transitions**:
```
[App Launch] → initialized=false, visible=false
     ↓
[Setup Complete] → initialized=true, visible=false
     ↓
[F12 Press] ↔ visible toggles between true/false
```

**Validation Rules**:
- `visible` can only be toggled when `initialized` is `true`
- State changes must complete within 100ms (per SC-002)

---

### 2. WindowConfiguration

**Purpose**: Defines the overlay window properties (static configuration).

| Field | Type | Description | Value |
|-------|------|-------------|-------|
| `width` | number | Panel width in pixels | 400 |
| `height` | number | Panel height in pixels | 60 |
| `position` | string | Screen position | "top-center" |
| `decorations` | boolean | OS window chrome | false |
| `transparent` | boolean | Background transparency | true |
| `alwaysOnTop` | boolean | Z-order priority | true |
| `skipTaskbar` | boolean | Hide from taskbar/Alt+Tab | true |

**Note**: This is configuration, not runtime state. Defined in `tauri.conf.json`.

---

### 3. HotkeyBinding

**Purpose**: Defines the registered global hotkey.

| Field | Type | Description | Value |
|-------|------|-------------|-------|
| `key` | string | Key identifier | "F12" |
| `modifiers` | string[] | Modifier keys | [] (none) |
| `action` | string | Action to trigger | "toggle-overlay" |

**Validation Rules**:
- Hotkey must be registered on app startup
- Only one hotkey binding for this feature
- Must work regardless of window focus (global)

---

## State Management

### Frontend (React)

```typescript
// src/types/overlay.ts
interface OverlayState {
  visible: boolean;
  initialized: boolean;
}

// Initial state
const initialState: OverlayState = {
  visible: false,
  initialized: false,
};
```

### Backend (Rust)

```rust
// src-tauri/src/state.rs
use std::sync::atomic::{AtomicBool, Ordering};

pub struct OverlayState {
    pub visible: AtomicBool,
    pub initialized: AtomicBool,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self {
            visible: AtomicBool::new(false),
            initialized: AtomicBool::new(false),
        }
    }
}
```

---

## Relationships

```
┌─────────────────┐
│  HotkeyBinding  │
│    (F12)        │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐       ┌─────────────────────┐
│  OverlayState   │──────▶│ WindowConfiguration │
│  (runtime)      │ uses  │ (static config)     │
└─────────────────┘       └─────────────────────┘
```

---

## Data Flow

1. **App Startup**:
   - Load WindowConfiguration from tauri.conf.json
   - Initialize OverlayState (visible=false, initialized=false)
   - Register HotkeyBinding (F12)
   - Set initialized=true

2. **F12 Press**:
   - HotkeyHandler detects F12
   - Toggle OverlayState.visible
   - Update window visibility via Tauri API
   - Update click-through state (ignore cursor events)

3. **No Persistence**:
   - All state is runtime-only
   - App always starts with panel hidden
   - No user preferences stored (future feature)

---

## Notes

- This feature requires no database or file storage
- State is ephemeral and resets on app restart
- Future features may add persistent preferences (hotkey customization, panel position)
