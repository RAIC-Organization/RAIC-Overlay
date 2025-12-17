# Data Model: External Window Attachment Mode

**Feature**: 004-external-window-attach
**Date**: 2025-12-17

## Entities

### 1. TargetWindowConfig (Compile-time)

Configuration for the target window, embedded at build time.

| Field | Type | Description |
|-------|------|-------------|
| `name_pattern` | `&'static str` | Window title pattern for matching (substring) |

**Source**: `TARGET_WINDOW_NAME` environment variable at compile time.

**Rust Definition**:
```rust
// Compile-time constant from build.rs
const TARGET_WINDOW_NAME: &str = env!("TARGET_WINDOW_NAME");
```

---

### 2. TargetWindowState (Runtime)

Tracks the current state of the target window binding.

| Field | Type | Description |
|-------|------|-------------|
| `hwnd` | `Option<HWND>` | Windows handle to target window (None if not found) |
| `is_focused` | `bool` | Whether target window currently has focus |
| `rect` | `Option<WindowRect>` | Current position and size of target window |
| `last_check` | `Instant` | Timestamp of last state validation |

**Rust Definition**:
```rust
pub struct TargetWindowState {
    hwnd: AtomicU64,              // Store HWND as u64 for atomic ops
    is_focused: AtomicBool,
    rect: Mutex<Option<WindowRect>>,
    last_check: Mutex<Instant>,
}
```

---

### 3. WindowRect

Position and size of a window in physical pixels.

| Field | Type | Description |
|-------|------|-------------|
| `x` | `i32` | Left edge X coordinate (screen pixels) |
| `y` | `i32` | Top edge Y coordinate (screen pixels) |
| `width` | `u32` | Window width in pixels |
| `height` | `u32` | Window height in pixels |

**Rust Definition**:
```rust
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}
```

---

### 4. OverlayState (Extended)

Extends existing `OverlayState` with target window binding.

| Field | Type | Description | New? |
|-------|------|-------------|------|
| `visible` | `AtomicBool` | Overlay visibility toggle | Existing |
| `initialized` | `AtomicBool` | App initialization complete | Existing |
| `mode` | `AtomicU8` | 0=Windowed, 1=Fullscreen | Existing |
| `saved_window_state` | `Mutex<Option<WindowState>>` | Saved position for mode switch | Existing |
| `target_binding` | `TargetWindowState` | Target window tracking | **NEW** |
| `auto_hidden` | `AtomicBool` | Hidden due to focus loss (not user toggle) | **NEW** |

---

### 5. TargetWindowError

Error states for target window operations.

| Variant | Description |
|---------|-------------|
| `NotFound` | Target window not found (app not running) |
| `NotFocused` | Target window exists but not focused |
| `InvalidHandle` | Window handle became invalid (app closed) |

**Rust Definition**:
```rust
#[derive(Debug, Clone, Serialize)]
pub enum TargetWindowError {
    NotFound { pattern: String },
    NotFocused,
    InvalidHandle,
}
```

---

### 6. InteractionMode (Existing - No Change)

| Variant | Value | Description |
|---------|-------|-------------|
| `Windowed` | 0 | Interactive mode, 0% transparent, clicks captured |
| `Fullscreen` | 1 | Click-through mode, 60% transparent |

---

## State Transitions

### Overlay Visibility State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌─────────┐  F3 + target focused  ┌─────────┐           │
│ Hidden  │ ────────────────────► │ Visible │           │
│         │                       │         │           │
└─────────┘ ◄──────────────────── └─────────┘           │
     ▲        F3 or focus lost         │                │
     │                                 │                │
     │         target closed           │                │
     └─────────────────────────────────┘
```

### Focus-Based Auto-Hide

```
┌──────────────────┐    target loses focus    ┌──────────────────┐
│ Visible          │ ───────────────────────► │ Auto-Hidden      │
│ (auto_hidden=F)  │                          │ (auto_hidden=T)  │
└──────────────────┘ ◄─────────────────────── └──────────────────┘
                       target gains focus
```

### Target Window Detection

```
F3 pressed
    │
    ▼
Find window by pattern
    │
    ├── Found & Focused ──► Show overlay, bind to window
    │
    ├── Found & Not Focused ──► Do nothing (wait for focus)
    │
    └── Not Found ──► Show error modal (5s auto-dismiss)
```

---

## Validation Rules

1. **Window Handle Validity**: Must call `IsWindow(hwnd)` before any operation on stored handle
2. **Pattern Matching**: Case-insensitive substring match on window title
3. **Position Bounds**: Overlay position must stay within monitor bounds
4. **Size Constraints**: Overlay size must be at least 100x100 pixels

---

## Relationships

```
OverlayState
    │
    ├── has one ──► TargetWindowState
    │                   │
    │                   ├── references ──► WindowRect
    │                   │
    │                   └── may have ──► TargetWindowError
    │
    └── uses ──► InteractionMode (enum)
```

---

## IPC Payloads (Frontend)

### TargetWindowStatus

Sent to frontend when target window state changes.

```typescript
interface TargetWindowStatus {
  bound: boolean;           // True if successfully bound to target
  targetName: string;       // Window title (or pattern if not found)
  rect: WindowRect | null;  // Position/size (null if not bound)
  error: TargetWindowError | null;
}

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type TargetWindowError =
  | { type: 'NotFound'; pattern: string }
  | { type: 'NotFocused' }
  | { type: 'InvalidHandle' };
```

### ErrorModalPayload

Sent to frontend to display error modal.

```typescript
interface ErrorModalPayload {
  message: string;
  autoDismissMs: number;  // 5000ms per spec
}
```
