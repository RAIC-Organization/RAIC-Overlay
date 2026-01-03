# Research: Fix Update Popup Not Appearing

**Feature**: 051-fix-update-popup
**Date**: 2026-01-03

## Research Topics

### 1. Tauri Window Creation Pattern

**Question**: How should the update window be created to match the settings panel pattern?

**Decision**: Use `WebviewWindowBuilder` with identical configuration to settings_window.rs

**Rationale**: The settings window implementation provides a proven, working pattern:
- Uses `WebviewWindowBuilder::new()` with app handle
- Sets `skip_taskbar(false)` for taskbar visibility
- Uses `decorations(false)` + `transparent(true)` for custom styling
- Loads a Next.js route via `WebviewUrl::App("update".into())`

**Alternatives Considered**:
1. **Native Windows notification**: Rejected - doesn't match app styling, limited interactivity
2. **System tray popup**: Rejected - less discoverable than taskbar window
3. **Modify main overlay window**: Rejected - introduces complexity with visibility state management

**Reference Implementation** (`settings_window.rs:33-42`):
```rust
WebviewWindowBuilder::new(&app, "settings", WebviewUrl::App("settings".into()))
    .title("RAIC Overlay Settings")
    .inner_size(450.0, 400.0)
    .decorations(false)
    .transparent(true)
    .skip_taskbar(false)  // Key: visible in taskbar
    .resizable(false)
    .center()
    .build()
```

### 2. Update Check Trigger Flow

**Question**: When and how should the update window be opened?

**Decision**: Open the window from the backend when `check_for_updates` returns an update

**Rationale**:
- The backend already has access to the `AppHandle` for window creation
- Keeps the logic centralized and ensures window opens even if frontend isn't ready
- Matches the pattern where backend controls window lifecycle

**Flow**:
1. `check_for_updates` detects new version available
2. Backend calls new `open_update_window(app, update_info)` function
3. Window opens with update info passed as query params or via Tauri state
4. Frontend reads info and displays notification

**Alternatives Considered**:
1. **Frontend-initiated**: Rejected - frontend runs in main overlay which may be hidden
2. **Event-based**: Rejected - adds complexity vs direct window creation

### 3. Passing Update Info to Window

**Question**: How should update info be passed to the new window?

**Decision**: Use Tauri's state management with a dedicated update window state

**Rationale**:
- State can be set before window opens, read immediately when window mounts
- No URL encoding/parsing complexity
- Consistent with existing patterns in the codebase

**Implementation**:
```rust
// In update/window.rs
#[derive(Default)]
pub struct UpdateWindowState {
    pub update_info: Mutex<Option<UpdateInfo>>,
}

// Set before opening window
state.update_info.lock().unwrap().replace(info);
```

**Alternatives Considered**:
1. **Query parameters**: Rejected - requires URL encoding, size limits
2. **Tauri events**: Rejected - timing issues (window might not be ready for event)
3. **File-based**: Rejected - unnecessary I/O overhead

### 4. Window Reuse vs Recreation

**Question**: Should we reuse an existing update window or create a new one each time?

**Decision**: Reuse existing window if already open, update state and focus

**Rationale**:
- Matches settings window behavior
- Prevents multiple update windows from stacking
- Better UX - user sees single, focused window

**Implementation**:
```rust
if let Some(window) = app.get_webview_window("update") {
    // Update state with new info
    window.show()?;
    window.set_focus()?;
    return Ok(OpenUpdateWindowResult { created: false, ... });
}
// Create new window
```

### 5. Frontend Integration

**Question**: How should the existing UpdateNotification component be adapted?

**Decision**: Create a new `UpdatePage.tsx` wrapper that uses the existing component

**Rationale**:
- Reuses the well-designed UpdateNotification component
- Adds window-specific logic (close window on dismiss, state from backend)
- Keeps components single-purpose

**Implementation**:
- `app/update/page.tsx` - Next.js route for the window
- `src/components/update/UpdatePage.tsx` - Page wrapper with hooks
- Existing `UpdateNotification.tsx` - Rendered inside, unchanged visually

### 6. Window Close Behavior

**Question**: What should happen when the user closes the update window?

**Decision**: Closing the window (X button or "Ask Again Later") marks the update as dismissed for the session

**Rationale**:
- Consistent with spec FR-008
- Prevents nagging behavior
- User can still check for updates manually later

**Implementation**:
- Window close triggers `dismiss_update` Tauri command
- State persists dismiss flag in memory (session-only, not to disk)
- 24-hour check interval still applies for next app launch

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Window creation | Follow settings_window.rs pattern with WebviewWindowBuilder |
| Trigger | Backend opens window after successful update check |
| Data passing | Tauri managed state (UpdateWindowState) |
| Window reuse | Reuse existing window if open, focus it |
| Frontend | New UpdatePage wrapper using existing UpdateNotification |
| Close behavior | Dismiss for session, don't persist to disk |

## Dependencies Verified

- `tauri::WebviewWindowBuilder` - Available in Tauri 2.x ✅
- `tauri::Manager::get_webview_window` - Available for window lookup ✅
- `WebviewUrl::App` - Loads Next.js routes correctly ✅
- Existing `UpdateInfo` type - Compatible, no changes needed ✅
