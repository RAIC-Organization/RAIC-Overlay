# Tauri Commands Contract: Fix Update Popup Not Appearing

**Feature**: 051-fix-update-popup
**Date**: 2026-01-03

## New Commands

### open_update_window

Opens or focuses the update notification window.

**Signature**:
```rust
#[tauri::command]
pub async fn open_update_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, UpdateWindowState>,
) -> Result<OpenUpdateWindowResult, String>
```

**Behavior**:
1. Check if update window already exists (`app.get_webview_window("update")`)
2. If exists: show and focus existing window, return `{ success: true, created: false }`
3. If not exists: create new window with settings panel pattern, return `{ success: true, created: true }`
4. On error: return `{ success: false, error: "message" }`

**Window Configuration**:
```rust
WebviewWindowBuilder::new(&app, "update", WebviewUrl::App("update".into()))
    .title("RAIC Overlay Update")
    .inner_size(350.0, 300.0)  // Slightly smaller than settings
    .decorations(false)
    .transparent(true)
    .skip_taskbar(false)  // Visible in taskbar
    .resizable(false)
    .center()
    .build()
```

**Response** (JSON):
```json
{
  "success": true,
  "created": true,
  "error": null
}
```

---

### get_pending_update

Retrieves the pending update info for the update window.

**Signature**:
```rust
#[tauri::command]
pub fn get_pending_update(
    state: tauri::State<'_, UpdateWindowState>,
) -> Option<UpdateInfo>
```

**Behavior**:
1. Lock the update window state mutex
2. Clone and return the update info if present
3. Return `None` if no update is pending

**Response** (JSON):
```json
{
  "version": "0.2.0",
  "currentVersion": "0.1.0",
  "downloadUrl": "https://github.com/.../RAIC.Overlay_0.2.0_x64_en-US.msi",
  "downloadSize": 12345678,
  "releaseUrl": "https://github.com/.../releases/tag/v0.2.0"
}
```

---

### close_update_window

Closes the update window and optionally marks the update as dismissed.

**Signature**:
```rust
#[tauri::command]
pub async fn close_update_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, UpdateWindowState>,
    dismiss: bool,
) -> Result<(), String>
```

**Parameters**:
- `dismiss`: If true, clears the pending update state (user chose "Ask Later")

**Behavior**:
1. If `dismiss` is true, clear the update window state
2. Find the update window by label
3. Close the window if it exists
4. Return success

---

## Modified Commands

### check_for_updates

**Change**: After detecting an update, automatically open the update window.

**Modified Flow**:
```rust
// Existing logic...
if update_available {
    // NEW: Set state and open window
    state.update_info.lock().unwrap().replace(update_info.clone());
    open_update_window(app.clone(), state).await?;
}
```

**Note**: The existing `check_for_updates` command signature doesn't change. The window opening is an internal side effect.

---

## Existing Commands (Unchanged)

These commands are used by the update window but require no modifications:

| Command | Purpose |
|---------|---------|
| `download_update` | Download the MSI installer with progress events |
| `launch_installer_and_exit` | Launch the MSI and exit the app |
| `dismiss_update` | Mark a version as dismissed (existing logic) |
| `cleanup_old_installers` | Remove old installer files |

---

## Command Registration

Add to `lib.rs` invoke_handler:

```rust
.invoke_handler(tauri::generate_handler![
    // Existing commands...
    update::open_update_window,
    update::get_pending_update,
    update::close_update_window,
])
```

Add state management:

```rust
.manage(update::UpdateWindowState::default())
```

---

## Error Handling

All commands return `Result<T, String>` where errors are user-friendly messages:

| Error Condition | Message |
|-----------------|---------|
| Window creation fails | "Failed to create update window: {details}" |
| Window not found (close) | Silent success (window already closed) |
| State lock poisoned | "Internal error: state lock failed" |
