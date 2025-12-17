# IPC Commands Contract

**Feature Branch**: `003-f3-fullscreen-overlay`
**Date**: 2025-12-17

## Overview

Tauri IPC commands for the fullscreen overlay feature. Commands are invoked from the frontend using `invoke()`.

---

## Commands

### 1. toggle_mode

Toggles the overlay between windowed and fullscreen modes.

**Signature:**
```rust
#[tauri::command]
async fn toggle_mode(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<OverlayStateResponse, String>
```

**Parameters:** None

**Returns:**
```typescript
{
  visible: boolean,
  initialized: boolean,
  mode: 'windowed' | 'fullscreen'
}
```

**Behavior:**
- If in windowed mode:
  - Saves current window position and size
  - Expands window to fullscreen
  - Enables click-through
  - Emits `mode-changed` event
- If in fullscreen mode:
  - Restores saved position and size
  - Disables click-through (in windowed mode, header is interactive)
  - Emits `mode-changed` event

**Frontend Usage:**
```typescript
const result = await invoke<OverlayStateResponse>('toggle_mode');
console.log(`Now in ${result.mode} mode`);
```

---

### 2. get_overlay_state (Updated)

Returns the current overlay state including mode.

**Signature:**
```rust
#[tauri::command]
fn get_overlay_state(state: tauri::State<'_, OverlayState>) -> OverlayStateResponse
```

**Parameters:** None

**Returns:**
```typescript
{
  visible: boolean,
  initialized: boolean,
  mode: 'windowed' | 'fullscreen'
}
```

**Frontend Usage:**
```typescript
const state = await invoke<OverlayStateResponse>('get_overlay_state');
```

---

### 3. set_visibility (Existing, unchanged)

Sets the overlay visibility state.

**Signature:**
```rust
#[tauri::command]
async fn set_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
    visible: bool,
) -> Result<(), String>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `visible` | `bool` | Whether to show or hide the overlay |

**Returns:** `Result<(), String>`

**Frontend Usage:**
```typescript
await invoke('set_visibility', { visible: true });
```

---

## Events

### 1. toggle-overlay (Existing)

Emitted by Rust when F3 is pressed.

**Payload:** None (`()`)

**Frontend Handler:**
```typescript
listen('toggle-overlay', () => {
  // Toggle mode instead of visibility
  invoke('toggle_mode');
});
```

---

### 2. mode-changed (New)

Emitted when the overlay mode changes.

**Payload:**
```typescript
{
  previousMode: 'windowed' | 'fullscreen',
  currentMode: 'windowed' | 'fullscreen'
}
```

**Frontend Handler:**
```typescript
listen<ModeChangePayload>('mode-changed', (event) => {
  console.log(`Mode changed from ${event.payload.previousMode} to ${event.payload.currentMode}`);
  // Update React state
});
```

---

### 3. overlay-ready (Existing, unchanged)

Emitted when the overlay is initialized.

**Payload:**
```typescript
{
  window_id: string,
  position: { x: number, y: number }
}
```

---

## Error Handling

All commands that return `Result<T, String>` use the following error format:

```typescript
try {
  await invoke('toggle_mode');
} catch (error) {
  // error is a string describing the failure
  console.error('Failed to toggle mode:', error);
}
```

**Possible Errors:**
| Command | Error | Cause |
|---------|-------|-------|
| `toggle_mode` | "Failed to get current monitor" | No monitor detected |
| `toggle_mode` | "Failed to get window position" | Window handle invalid |
| `toggle_mode` | "Failed to set window size" | System window error |
| `toggle_mode` | "Failed to set cursor events" | Platform not supported |
