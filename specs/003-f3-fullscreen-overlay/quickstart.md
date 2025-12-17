# Quickstart: F3 Fullscreen Transparent Click-Through Overlay

**Feature Branch**: `003-f3-fullscreen-overlay`
**Date**: 2025-12-17

## Overview

This guide describes the implementation approach for the F3 fullscreen transparent click-through overlay feature.

---

## Feature Summary

**Current Behavior:** F3 toggles overlay visibility (show/hide)

**New Behavior:** F3 toggles between two modes:
1. **Windowed Mode**: Header panel only (400x60px), interactive
2. **Fullscreen Mode**: Full screen, 60% transparent, all clicks pass through

---

## Key Changes

### Backend (Rust)

1. **Extend `OverlayState`** (`src-tauri/src/state.rs`)
   - Add `mode` field (Windowed/Fullscreen enum)
   - Add `saved_window_state` field for position restoration

2. **Add types** (`src-tauri/src/types.rs`)
   - `OverlayMode` enum
   - `WindowState` struct
   - `ModeChangePayload` struct

3. **Add `toggle_mode` command** (`src-tauri/src/lib.rs`)
   - Save window state before fullscreen
   - Resize window to monitor dimensions
   - Enable click-through with `set_ignore_cursor_events(true)`
   - Emit `mode-changed` event

4. **Extend window utilities** (`src-tauri/src/window.rs`)
   - Add `get_monitor_size()` function
   - Add `save_window_state()` function
   - Add `restore_window_state()` function

### Frontend (React/TypeScript)

1. **Update state types** (`src/types/overlay.ts`)
   - Add `mode` field to `OverlayState`
   - Add `savedWindowState` field

2. **Update IPC types** (`src/types/ipc.ts`)
   - Add `ModeChangePayload` interface
   - Update `OverlayStateResponse` interface

3. **Update `App.tsx`**
   - Change toggle-overlay handler to call `toggle_mode`
   - Listen for `mode-changed` event
   - Render fullscreen overlay when mode is fullscreen

4. **Update `HeaderPanel.tsx`**
   - Remove visibility-based conditional rendering
   - Always visible (parent controls via container)

5. **Add CSS** (`src/index.css` or component)
   - Fullscreen container styles
   - 60% transparent background (`rgba(0, 0, 0, 0.4)`)

---

## Implementation Steps

### Step 1: Backend Types

```rust
// src-tauri/src/types.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct WindowState {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModeChangePayload {
    pub previous_mode: String,
    pub current_mode: String,
}
```

### Step 2: Backend State

```rust
// src-tauri/src/state.rs
pub struct OverlayState {
    visible: AtomicBool,
    initialized: AtomicBool,
    mode: AtomicU8,  // 0 = Windowed, 1 = Fullscreen
    saved_window_state: Mutex<Option<WindowState>>,
}
```

### Step 3: Toggle Command

```rust
// src-tauri/src/lib.rs
#[tauri::command]
async fn toggle_mode(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<OverlayStateResponse, String> {
    let current_mode = state.get_mode();

    match current_mode {
        OverlayMode::Windowed => {
            // Save current state
            let pos = window.outer_position().map_err(|e| e.to_string())?;
            let size = window.outer_size().map_err(|e| e.to_string())?;
            state.save_window_state(pos, size);

            // Go fullscreen
            let monitor = window.current_monitor()
                .map_err(|e| e.to_string())?
                .ok_or("No monitor")?;
            let mon_size = monitor.size();
            let scale = monitor.scale_factor();

            window.set_position(LogicalPosition::new(0.0, 0.0))?;
            window.set_size(LogicalSize::new(
                mon_size.width as f64 / scale,
                mon_size.height as f64 / scale,
            ))?;

            // Enable click-through
            window.set_ignore_cursor_events(true)?;

            state.set_mode(OverlayMode::Fullscreen);
        }
        OverlayMode::Fullscreen => {
            // Restore saved state
            if let Some(saved) = state.get_saved_window_state() {
                window.set_position(LogicalPosition::new(saved.x, saved.y))?;
                window.set_size(LogicalSize::new(saved.width, saved.height))?;
            }

            // Disable click-through
            window.set_ignore_cursor_events(false)?;

            state.set_mode(OverlayMode::Windowed);
        }
    }

    Ok(state.to_response())
}
```

### Step 4: Frontend State

```typescript
// src/types/overlay.ts
export type OverlayMode = 'windowed' | 'fullscreen';

export interface OverlayState {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
}

export const initialState: OverlayState = {
  visible: false,
  initialized: false,
  mode: 'windowed',
};
```

### Step 5: Frontend App Update

```typescript
// src/App.tsx
useEffect(() => {
  const unlistenToggle = listen('toggle-overlay', async () => {
    // Toggle mode instead of visibility
    const result = await invoke<OverlayStateResponse>('toggle_mode');
    setState(prev => ({ ...prev, mode: result.mode, visible: true }));
  });

  return () => { unlistenToggle.then(f => f()); };
}, []);

return (
  <>
    {state.mode === 'fullscreen' && (
      <div className="fullscreen-overlay" />
    )}
    <HeaderPanel />
  </>
);
```

### Step 6: CSS

```css
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4); /* 40% opacity = 60% transparency */
  pointer-events: none; /* CSS-level, but Tauri handles at window level */
}
```

---

## Testing Checklist

- [ ] F3 toggles from windowed to fullscreen mode
- [ ] F3 toggles from fullscreen back to windowed mode
- [ ] Click-through works in fullscreen mode (all mouse events)
- [ ] Header panel visible in fullscreen mode at same position
- [ ] Window restores to original position when exiting fullscreen
- [ ] Overlay stays above fullscreen apps (games)
- [ ] Rapid F3 pressing debounced (no flickering)
- [ ] Works at different DPI scaling (100%, 125%, 150%)

---

## Dependencies

**No new dependencies required.** All functionality uses existing Tauri 2.x APIs:
- `tauri::WebviewWindow::set_size()`
- `tauri::WebviewWindow::set_position()`
- `tauri::WebviewWindow::set_ignore_cursor_events()`
- `tauri::WebviewWindow::current_monitor()`
