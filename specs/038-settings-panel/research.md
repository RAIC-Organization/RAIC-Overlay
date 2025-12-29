# Research: Settings Panel Window

**Feature Branch**: `038-settings-panel`
**Date**: 2025-12-29

## Research Summary

This document captures the research findings for implementing a Settings panel as a separate Tauri window with hotkey configuration and Windows auto-start functionality.

---

## 1. Tauri Multi-Window Architecture

### Decision: Use WebviewWindowBuilder for Dynamic Window Creation

**Rationale**: Tauri 2.x provides `WebviewWindowBuilder` for creating windows programmatically at runtime. This allows the Settings window to be created on-demand when the user clicks "Settings" in the tray menu, rather than pre-defining it in tauri.conf.json.

**Implementation Pattern**:
```rust
use tauri::{WebviewUrl, WebviewWindowBuilder};

// Create settings window on demand
WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings.html".into()))
    .title("RAIC Overlay Settings")
    .inner_size(450.0, 400.0)
    .decorations(false)  // Custom titlebar
    .transparent(true)   // Match overlay styling
    .skip_taskbar(false) // Visible in taskbar (FR-002)
    .resizable(false)
    .build()?;
```

**Alternatives Considered**:
1. **Pre-define in tauri.conf.json**: Rejected because window would always exist, consuming resources
2. **Modal dialog**: Rejected because spec requires window to be movable and have taskbar presence

---

## 2. Window Visibility and Taskbar Presence

### Decision: Use `skip_taskbar(false)` with Custom Decorations

**Rationale**: The main overlay uses `skipTaskbar: true` to hide from taskbar, but Settings window needs `skip_taskbar(false)` to appear in taskbar per FR-002.

**Key Configuration**:
- `skip_taskbar(false)`: Window appears in Windows taskbar
- `decorations(false)`: Allows custom titlebar with drag region
- `transparent(true)`: Enables liquid glass effect matching error modal

**Implementation**:
- Use `data-tauri-drag-region` attribute on header for drag functionality (FR-003)
- Implement custom X button that calls `window.hide()` instead of `window.close()` (FR-004)

---

## 3. Window Close vs Hide Behavior

### Decision: Hide Window on X Button Click, Destroy on App Exit

**Rationale**: Per FR-004, clicking the X button should close only the Settings window, not the application. Using `hide()` preserves the window instance for quick reopening.

**Implementation Pattern**:
```typescript
// Frontend: Handle X button click
const handleClose = async () => {
  const window = await getCurrentWindow();
  await window.hide();
};
```

**Window Focus on Re-open**:
Per FR-017, if Settings is already open, selecting "Settings" from tray focuses existing window:
```rust
// Check if settings window exists
if let Some(settings_window) = app.get_webview_window("settings") {
    settings_window.show()?;
    settings_window.set_focus()?;
} else {
    // Create new window
}
```

---

## 4. Auto-Start with Windows (tauri-plugin-autostart)

### Decision: Use tauri-plugin-autostart for Cross-Platform Startup Registration

**Rationale**: The official Tauri plugin handles Windows Registry entries (HKCU\Software\Microsoft\Windows\CurrentVersion\Run) automatically, providing a clean API for enable/disable/check operations.

**Dependencies**:
- Rust: `tauri-plugin-autostart`
- JavaScript: `@tauri-apps/plugin-autostart`

**Permissions Required** (capabilities/default.json):
```json
{
  "permissions": [
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled"
  ]
}
```

**Frontend API**:
```typescript
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

// Check current state (FR-016)
const enabled = await isEnabled();

// Enable auto-start (FR-014)
await enable();

// Disable auto-start (FR-015)
await disable();
```

**Alternatives Considered**:
1. **Manual Windows Registry manipulation**: Rejected due to complexity and platform-specific code
2. **Task Scheduler**: Rejected as less standard than Registry Run key

---

## 5. Hotkey Configuration Storage

### Decision: Store in Separate `user-settings.json` File

**Rationale**: Per FR-011, hotkey settings should be stored in the same directory as state.json. Using a separate file (not state.json itself) keeps user preferences isolated from window state, allowing independent versioning and migration.

**File Location**: `{app_data_dir}/user-settings.json`

**Data Structure**:
```json
{
  "version": 1,
  "hotkeys": {
    "toggleVisibility": {
      "key": "F3",
      "modifiers": []
    },
    "toggleMode": {
      "key": "F5",
      "modifiers": []
    }
  },
  "autoStart": false
}
```

**Alternatives Considered**:
1. **Merge into state.json**: Rejected to keep window state and user preferences separate
2. **Use settings.toml**: Rejected because settings.toml is for admin/power-user config (next to exe), while user preferences should be in app_data_dir

---

## 6. Hotkey Input Capture

### Decision: Use KeyboardEvent with Custom Input Component

**Rationale**: Need to capture key combinations including modifiers (Ctrl, Shift, Alt) in a user-friendly way. The input field enters "listening" mode when focused, captures the next keypress, and formats it for display.

**Key Code Mapping**:
- Store Windows virtual key codes (VK_*) for backend compatibility
- Display human-readable names (e.g., "Ctrl+Shift+O")

**Validation Rules** (FR-009, FR-010):
- Reject single modifier keys (Ctrl, Shift, Alt alone)
- Reject duplicate bindings between the two hotkeys
- Reject known reserved combinations (Ctrl+Alt+Delete, etc.)

**Implementation Pattern**:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault();

  // Build modifier array
  const modifiers = [];
  if (e.ctrlKey) modifiers.push('Ctrl');
  if (e.shiftKey) modifiers.push('Shift');
  if (e.altKey) modifiers.push('Alt');

  // Reject standalone modifiers
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return; // Wait for non-modifier key
  }

  // Format: "Ctrl+Shift+O" or just "F3"
  const keyName = modifiers.length > 0
    ? `${modifiers.join('+')}+${e.key.toUpperCase()}`
    : e.key.toUpperCase();

  setBinding(keyName);
};
```

---

## 7. Hotkey Application at Runtime

### Decision: Restart Keyboard Hook with New Bindings

**Rationale**: Per FR-018, new hotkey bindings must apply immediately. The existing `keyboard_hook.rs` uses hardcoded VK_F3/VK_F5 constants. To support custom hotkeys, these need to be configurable.

**Backend Changes Required**:
1. Add user settings module for loading/saving user-settings.json
2. Modify keyboard_hook.rs to read hotkey bindings from settings
3. Add Tauri command to update hotkeys at runtime
4. Emit event to restart keyboard hook when settings change

**Implementation Approach**:
```rust
// New: Store configurable hotkeys
pub struct HotkeyConfig {
    pub toggle_visibility_key: u32,
    pub toggle_visibility_modifiers: Vec<Modifier>,
    pub toggle_mode_key: u32,
    pub toggle_mode_modifiers: Vec<Modifier>,
}

// Modify hook callback to use configurable keys
unsafe extern "system" fn keyboard_hook_callback(...) {
    let config = get_hotkey_config();
    if matches_hotkey(vk_code, &config.toggle_visibility_key, ...) {
        // Handle toggle visibility
    }
}
```

---

## 8. Settings Window Styling

### Decision: Match Error Modal Liquid Glass Style

**Rationale**: Per FR-005, Settings window uses the same visual styling as ErrorModal component.

**Style Elements to Replicate**:
- `bg-background/80 backdrop-blur-xl` - Semi-transparent background with blur
- `border border-border rounded-lg` - Border styling
- `sc-glow-transition sc-corner-accents shadow-glow-sm` - SC theme glow effects
- Header with `bg-muted/50 border-b border-border`
- `font-display` for headings (Orbitron font)

**Window Structure**:
```
+----------------------------------+
| [Title]              [X] Close   |  <- Draggable header
+----------------------------------+
| Hotkeys Section                  |
|   Toggle Visibility: [F3      ]  |
|   Toggle Mode:       [F5      ]  |
+----------------------------------+
| Startup Section                  |
|   Start with Windows  [Toggle]   |
+----------------------------------+
```

---

## 9. Tray Menu Integration

### Decision: Add "Settings" MenuItem Above "Exit"

**Rationale**: Per User Story 2, Settings should appear in tray menu. Standard convention places Settings above Exit.

**Implementation** (tray.rs):
```rust
let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;

let menu = Menu::with_items(app, &[&settings_item, &quit_item])?;

// Handle menu events
.on_menu_event(move |app, event| {
    match event.id.as_ref() {
        "settings" => {
            // Open or focus settings window
        }
        "quit" => {
            // Existing exit logic
        }
        _ => {}
    }
})
```

---

## 10. Modifier Key Handling

### Decision: Use Windows Virtual Key Codes with Modifier Flags

**Rationale**: The existing keyboard_hook.rs uses Windows VK codes. For modifier combinations, we need to track modifier state alongside the primary key.

**Modifier Detection**:
```rust
// Check modifier state at time of key press
let ctrl_pressed = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
let shift_pressed = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;
let alt_pressed = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
```

**Data Model**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyBinding {
    pub key: u32,           // VK_* code
    pub ctrl: bool,
    pub shift: bool,
    pub alt: bool,
}
```

---

## Dependencies Summary

### New Rust Dependencies
- `tauri-plugin-autostart` - Auto-start functionality

### New JavaScript Dependencies
- `@tauri-apps/plugin-autostart` - Frontend API for auto-start

### New Permissions (capabilities/default.json)
- `autostart:allow-enable`
- `autostart:allow-disable`
- `autostart:allow-is-enabled`
- `core:window:allow-hide` (for Settings window X button)
- `core:window:allow-show`
- `core:window:allow-set-focus`

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Keyboard hook restart may cause brief hotkey unavailability | Keep restart atomic, under 100ms |
| Auto-start registry write may fail (permissions) | Catch errors, show user-friendly message |
| Hotkey conflict with other apps | Document common conflicts, allow any key |
| Settings file corruption | Fall back to defaults, recreate file |
