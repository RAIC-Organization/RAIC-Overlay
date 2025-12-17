# Research: F3 Fullscreen Transparent Click-Through Overlay

**Feature Branch**: `003-f3-fullscreen-overlay`
**Date**: 2025-12-17
**Status**: Complete

## Research Summary

This document captures research findings for implementing fullscreen transparent click-through overlay functionality using Tauri 2.x on Windows 11.

---

## 1. Window Resize to Fullscreen (Monitor Dimensions)

### Decision
Use `window.current_monitor()` to get monitor dimensions and `window.set_size()` with `LogicalSize` to resize the window to cover the entire screen.

### Rationale
- Tauri 2.x provides direct access to monitor dimensions through the `Monitor` struct
- Using logical pixels (not physical) ensures DPI-aware sizing on Windows 11
- Existing codebase already uses `current_monitor()` for positioning

### Key APIs
```rust
// Rust - Get monitor and resize
if let Ok(Some(monitor)) = window.current_monitor() {
    let size = monitor.size();  // PhysicalSize<u32>
    let scale = monitor.scale_factor();  // f64

    // Convert to logical pixels
    let logical_width = size.width as f64 / scale;
    let logical_height = size.height as f64 / scale;

    window.set_size(LogicalSize::new(logical_width, logical_height))?;
    window.set_position(LogicalPosition::new(0.0, 0.0))?;
}
```

### Alternatives Considered
- **Tauri fullscreen mode**: Rejected - true fullscreen is for media apps, not overlays
- **Manual screen size calculation**: Rejected - Tauri provides direct API

---

## 2. Click-Through Behavior

### Decision
Use `window.set_ignore_cursor_events(true)` to enable click-through for the entire window in fullscreen mode.

### Rationale
- Already used in the existing codebase (`lib.rs:22`)
- Works on Windows 11 with no additional configuration
- Simple boolean toggle for mode switching

### Key APIs
```rust
// Enable click-through (all events pass to background apps)
window.set_ignore_cursor_events(true)?;

// Disable click-through (window receives events)
window.set_ignore_cursor_events(false)?;
```

### Important Notes
- When `true`, ALL mouse events pass through (click, scroll, drag, right-click)
- Desktop only (Windows, macOS, Linux) - not supported on mobile
- Header panel will also be click-through in fullscreen mode (per spec clarification)

### Alternatives Considered
- **CSS pointer-events**: Rejected - doesn't pass events to system
- **Hit testing regions**: Rejected - more complex, not needed

---

## 3. Monitor Dimensions

### Decision
Use existing `window.current_monitor()` API with proper scale factor conversion.

### Rationale
- Already implemented in `window.rs` for positioning
- Returns both physical size and scale factor needed for DPI awareness
- Handles multi-monitor scenarios (returns monitor where window is located)

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| `size()` | `PhysicalSize<u32>` | Monitor resolution in physical pixels |
| `scale_factor()` | `f64` | DPI scaling (1.0 to 2.0+) |
| `position()` | `PhysicalPosition<i32>` | Top-left corner relative to virtual screen |

### Windows 11 Considerations
- Always divide physical pixels by scale_factor for logical coordinates
- Test at 100%, 125%, and 150% DPI scaling

---

## 4. Window Transparency

### Decision
Use existing `transparent: true` config combined with CSS for 60% transparent background.

### Rationale
- Already configured in `tauri.conf.json`
- Alpha channel via `set_background_color()` is ignored on Windows
- CSS provides full control over opacity

### Implementation
```css
/* In React component or global CSS */
.fullscreen-overlay {
  background: rgba(0, 0, 0, 0.4); /* 40% opacity = 60% transparency */
}
```

### Configuration (already set)
```json
{
  "transparent": true,
  "decorations": false
}
```

### Alternatives Considered
- **Tauri set_background_color()**: Rejected - alpha ignored on Windows
- **Window-level opacity**: Rejected - not available in Tauri 2.x

---

## 5. Always-On-Top Behavior

### Decision
Use existing `alwaysOnTop: true` config. This handles overlay visibility above fullscreen apps.

### Rationale
- Already configured in `tauri.conf.json`
- Works over fullscreen applications (games, video players)
- Can be toggled at runtime if needed via `window.set_always_on_top()`

### Key APIs
```rust
// Runtime toggle (if needed)
window.set_always_on_top(true)?;
window.is_always_on_top()?;
```

---

## 6. State Management

### Decision
Extend existing `OverlayState` in `state.rs` to track the current mode (windowed vs fullscreen).

### Rationale
- Existing pattern already manages `visible` and `initialized` states
- Adding `mode` enum follows the same pattern
- Enables clean toggle logic between modes

### Proposed Extension
```rust
pub enum OverlayMode {
    Windowed,
    Fullscreen,
}

pub struct OverlayState {
    visible: AtomicBool,
    initialized: AtomicBool,
    mode: AtomicU8, // 0 = Windowed, 1 = Fullscreen
    saved_position: Mutex<Option<(f64, f64)>>,
    saved_size: Mutex<Option<(f64, f64)>>,
}
```

---

## 7. Window Position Preservation

### Decision
Store the original window position and size before entering fullscreen mode, restore when exiting.

### Rationale
- Requirement FR-008: "System MUST restore the original window state"
- Header panel must return to exact same position (SC-003: zero pixel variance)

### Implementation Pattern
```rust
// Before entering fullscreen
let current_pos = window.outer_position()?;
let current_size = window.outer_size()?;
state.save_window_state(current_pos, current_size);

// When exiting fullscreen
if let Some((pos, size)) = state.get_saved_state() {
    window.set_position(pos)?;
    window.set_size(size)?;
}
```

---

## 8. F3 Toggle Logic Change

### Decision
Change the F3 behavior from show/hide to toggle between windowed and fullscreen modes.

### Current Behavior
```
F3 press → toggle visible state (show/hide overlay)
```

### New Behavior
```
F3 press → toggle mode (windowed ↔ fullscreen)
- Windowed: Header panel visible, window is interactive
- Fullscreen: Full screen overlay, 60% transparent, click-through
```

### Implementation Location
- `hotkey.rs`: Already emits `toggle-overlay` event
- `App.tsx`: Update listener to toggle mode instead of visibility
- `lib.rs`: Add command to switch modes

---

## 9. Frontend Rendering

### Decision
Conditionally render fullscreen transparent container in React based on mode state.

### Rationale
- React state already manages overlay visibility
- Adding mode state follows same pattern
- CSS handles transparency and positioning

### Component Structure
```
App.tsx
├── FullscreenOverlay (conditional, when mode === 'fullscreen')
│   └── TransparentBackground (60% transparent)
└── HeaderPanel (always rendered when visible, positioned absolutely)
```

---

## Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| Fullscreen resize API | `window.set_size()` with `LogicalSize` |
| Click-through on Windows | `set_ignore_cursor_events(true)` - confirmed working |
| Transparency control | CSS-based (config + CSS rgba) |
| Position restoration | Store in state before mode change |
| DPI handling | Use `scale_factor()` for all conversions |

---

## References

- [Tauri 2.x Window API Reference](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [Tauri Rust WebviewWindow Documentation](https://docs.rs/tauri/latest/tauri/struct.WebviewWindow.html)
- [Tauri Configuration Reference](https://v2.tauri.app/reference/config/)
