# IPC Events Contract: RAIC Overlay

**Branch**: `001-rust-overlay-init` | **Date**: 2025-12-12

## Overview

This document defines the Inter-Process Communication (IPC) events between the Rust backend and React frontend in the Tauri application. Since this is a desktop overlay (not a web API), we use Tauri's event system rather than REST/GraphQL.

---

## Events (Rust → Frontend)

### 1. `toggle-overlay`

**Direction**: Backend → Frontend
**Trigger**: F12 global hotkey pressed
**Purpose**: Signal the frontend to toggle panel visibility

```typescript
// Event Name
"toggle-overlay"

// Payload
null  // No payload needed - frontend manages toggle state

// Frontend Listener
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('toggle-overlay', (event) => {
  // Toggle visibility state
  setVisible(prev => !prev);
});
```

**Rust Emission**:
```rust
use tauri::Manager;

// In hotkey handler
app.emit("toggle-overlay", ()).unwrap();
```

---

### 2. `overlay-ready`

**Direction**: Backend → Frontend
**Trigger**: App initialization complete
**Purpose**: Signal that overlay window is ready for display

```typescript
// Event Name
"overlay-ready"

// Payload
{
  "windowId": string,  // Tauri window label
  "position": { "x": number, "y": number }
}

// Frontend Listener
const unlisten = await listen<{ windowId: string; position: { x: number; y: number } }>(
  'overlay-ready',
  (event) => {
    console.log('Overlay initialized at:', event.payload.position);
    setInitialized(true);
  }
);
```

---

## Events (Frontend → Backend)

### 3. `set-visibility`

**Direction**: Frontend → Backend
**Trigger**: Frontend needs to update window properties based on visibility
**Purpose**: Sync window state (cursor events, actual visibility)

```typescript
// Event Name (Tauri Command)
"set_visibility"

// Payload
{
  "visible": boolean
}

// Frontend Invocation
import { invoke } from '@tauri-apps/api/core';

await invoke('set_visibility', { visible: true });
```

**Rust Command**:
```rust
#[tauri::command]
async fn set_visibility(window: tauri::Window, visible: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(!visible)
        .map_err(|e| e.to_string())?;

    if visible {
        window.show().map_err(|e| e.to_string())?;
    }
    // Note: We don't hide the window, just make it click-through

    Ok(())
}
```

---

## Command Reference

### Tauri Commands (invoke-able from frontend)

| Command | Parameters | Returns | Purpose |
|---------|------------|---------|---------|
| `set_visibility` | `{ visible: bool }` | `Result<(), String>` | Update window visibility state |
| `get_overlay_state` | none | `{ visible: bool, initialized: bool }` | Get current state |

### Event Reference

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `toggle-overlay` | Backend → Frontend | `null` | F12 hotkey signal |
| `overlay-ready` | Backend → Frontend | `{ windowId, position }` | Init complete |

---

## Type Definitions

### TypeScript Types (src/types/ipc.ts)

```typescript
// Event payloads
export interface OverlayReadyPayload {
  windowId: string;
  position: {
    x: number;
    y: number;
  };
}

// Command parameters
export interface SetVisibilityParams {
  visible: boolean;
}

// Command responses
export interface OverlayStateResponse {
  visible: boolean;
  initialized: boolean;
}
```

### Rust Types (src-tauri/src/types.rs)

```rust
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
pub struct OverlayReadyPayload {
    pub window_id: String,
    pub position: Position,
}

#[derive(Clone, Serialize)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Deserialize)]
pub struct SetVisibilityParams {
    pub visible: bool,
}

#[derive(Serialize)]
pub struct OverlayStateResponse {
    pub visible: bool,
    pub initialized: bool,
}
```

---

## Error Handling

All commands return `Result<T, String>` where errors are human-readable messages.

**Error Scenarios**:
| Scenario | Error Message |
|----------|---------------|
| Window not found | "Window not found" |
| Failed to set cursor events | "Failed to update cursor events: {details}" |
| Hotkey registration failed | "Failed to register F12 hotkey: {details}" |

---

## Permissions

Required Tauri capabilities (src-tauri/capabilities/default.json):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for RAIC Overlay",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-set-position",
    "core:window:allow-set-always-on-top",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```
