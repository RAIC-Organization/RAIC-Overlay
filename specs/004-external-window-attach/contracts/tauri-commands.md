# Tauri Commands Contract: External Window Attachment Mode

**Feature**: 004-external-window-attach
**Date**: 2025-12-17

## Overview

This document defines the Tauri IPC commands and events for the external window attachment feature.

---

## Commands (Frontend → Backend)

### 1. `toggle_visibility` (Modified)

Toggles overlay visibility. Now checks target window availability.

**Signature**:
```rust
#[tauri::command]
async fn toggle_visibility(
    window: WebviewWindow,
    state: State<'_, OverlayState>,
) -> Result<ToggleVisibilityResponse, TargetWindowError>
```

**Request**: None (triggered by F3 hotkey)

**Response**:
```typescript
interface ToggleVisibilityResponse {
  visible: boolean;
  mode: 'windowed' | 'fullscreen';
  targetBound: boolean;
  rect: WindowRect | null;
}
```

**Error Cases**:
- `TargetWindowError::NotFound` - Target app not running
- `TargetWindowError::InvalidHandle` - Target window closed

**Behavior Change**:
- Before showing: Validate target window exists and is focused
- If target not found: Return error (frontend shows error modal)
- If target found: Attach overlay to target position/size

---

### 2. `toggle_mode` (Unchanged)

Toggles between windowed (interactive) and fullscreen (click-through) modes.

**Signature**:
```rust
#[tauri::command]
async fn toggle_mode(
    window: WebviewWindow,
    state: State<'_, OverlayState>,
) -> Result<ToggleModeResponse, String>
```

**Response**:
```typescript
interface ToggleModeResponse {
  visible: boolean;
  mode: 'windowed' | 'fullscreen';
}
```

---

### 3. `get_overlay_state` (Extended)

Returns current overlay state including target binding.

**Signature**:
```rust
#[tauri::command]
fn get_overlay_state(
    state: State<'_, OverlayState>,
) -> OverlayStateResponse
```

**Response**:
```typescript
interface OverlayStateResponse {
  visible: boolean;
  mode: 'windowed' | 'fullscreen';
  initialized: boolean;
  // NEW fields
  targetBound: boolean;
  targetName: string;
  targetRect: WindowRect | null;
  autoHidden: boolean;
}
```

---

### 4. `get_target_window_info` (NEW)

Returns information about the target window configuration and status.

**Signature**:
```rust
#[tauri::command]
fn get_target_window_info(
    state: State<'_, OverlayState>,
) -> TargetWindowInfo
```

**Response**:
```typescript
interface TargetWindowInfo {
  pattern: string;          // Configured window name pattern
  found: boolean;           // Whether target window was found
  focused: boolean;         // Whether target window has focus
  rect: WindowRect | null;  // Position/size if found
}
```

---

### 5. `dismiss_error_modal` (NEW)

Manually dismiss the error modal before auto-dismiss timer.

**Signature**:
```rust
#[tauri::command]
fn dismiss_error_modal(
    window: WebviewWindow,
) -> Result<(), String>
```

**Response**: `()` on success

---

## Events (Backend → Frontend)

### 1. `target-window-changed` (NEW)

Emitted when target window state changes (position, size, focus).

**Payload**:
```typescript
interface TargetWindowChangedPayload {
  bound: boolean;
  focused: boolean;
  rect: WindowRect | null;
}
```

**Triggers**:
- Target window moves
- Target window resizes
- Target window gains/loses focus
- Target window closes

---

### 2. `show-error-modal` (NEW)

Emitted when error modal should be displayed.

**Payload**:
```typescript
interface ShowErrorModalPayload {
  message: string;
  autoDismissMs: number;
}
```

**Triggers**:
- F3 pressed but target app not running
- Target window closes while overlay active

---

### 3. `auto-hide-changed` (NEW)

Emitted when overlay is auto-hidden/shown due to focus changes.

**Payload**:
```typescript
interface AutoHideChangedPayload {
  autoHidden: boolean;
  reason: 'focus_lost' | 'focus_gained' | 'target_closed';
}
```

---

### 4. `overlay-position-sync` (NEW)

Emitted when overlay position is synchronized to target window.

**Payload**:
```typescript
interface OverlayPositionSyncPayload {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}
```

---

### 5. `mode-changed` (Existing)

Emitted when overlay mode changes (F5 toggle).

**Payload**:
```typescript
interface ModeChangePayload {
  mode: 'windowed' | 'fullscreen';
}
```

---

### 6. `toggle-visibility` (Existing)

Emitted when F3 is pressed to trigger visibility toggle.

**Payload**: None (command invocation trigger)

---

### 7. `toggle-mode` (Existing)

Emitted when F5 is pressed to trigger mode toggle.

**Payload**: None (command invocation trigger)

---

## Capability Requirements

Add to `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:window:allow-set-position",
    "core:window:allow-set-size",
    "core:window:allow-inner-size",
    "core:window:allow-outer-position"
  ]
}
```

---

## Error Handling

### Error Response Format

All commands that can fail return a `Result<T, TargetWindowError>`.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum TargetWindowError {
    NotFound { pattern: String },
    NotFocused,
    InvalidHandle,
}
```

### Frontend Error Handling

```typescript
try {
  const result = await invoke<ToggleVisibilityResponse>('toggle_visibility');
  // Handle success
} catch (error) {
  const err = error as TargetWindowError;
  if (err.type === 'NotFound') {
    // Show error modal: "Please start {pattern} first"
  }
}
```

---

## Sequence Diagrams

### F3 Toggle with Target Window

```
User        Frontend       Backend         Windows API
 │            │              │                  │
 │──F3────────┼──────────────┼──────────────────│
 │            │              │                  │
 │            │◄─toggle-visibility event────────│
 │            │              │                  │
 │            │──invoke(toggle_visibility)─────►│
 │            │              │                  │
 │            │              │──FindWindow──────►
 │            │              │◄─────hwnd────────│
 │            │              │                  │
 │            │              │──GetWindowRect───►
 │            │              │◄─────rect────────│
 │            │              │                  │
 │            │              │──GetForeground───►
 │            │              │◄────focused──────│
 │            │              │                  │
 │            │              │──set_position────│
 │            │              │──set_size────────│
 │            │              │                  │
 │            │◄─────Result<Response>───────────│
 │            │              │                  │
 │◄───UI update──────────────│                  │
```

### Auto-Hide on Focus Loss

```
User        Frontend       Backend         EventHook
 │            │              │                  │
 │──click other app──────────┼──────────────────│
 │            │              │                  │
 │            │              │◄─EVENT_FOCUS─────│
 │            │              │                  │
 │            │              │──check target────│
 │            │              │  not focused     │
 │            │              │                  │
 │            │              │──hide overlay────│
 │            │              │                  │
 │            │◄─auto-hide-changed event────────│
 │            │              │                  │
 │◄───overlay hidden─────────│                  │
```
