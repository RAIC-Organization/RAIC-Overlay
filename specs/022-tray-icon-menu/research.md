# Research: Windows System Tray Icon

**Feature**: 022-tray-icon-menu
**Date**: 2025-12-22
**Status**: Complete

## Research Questions

### 1. How to implement system tray icon in Tauri 2.x?

**Decision**: Use Tauri's built-in `TrayIconBuilder` from `tauri::tray` module

**Rationale**:
- Tauri 2.x has native tray icon support via the `tray-icon` feature
- No external crates needed beyond enabling the feature in Cargo.toml
- Provides cross-platform abstraction (Windows, macOS, Linux)
- Integrates seamlessly with Tauri's event system

**Alternatives Considered**:
- `tray-icon` crate directly: Rejected - Tauri wraps this internally, using Tauri's API is cleaner
- Windows API directly: Rejected - Unnecessary complexity, not cross-platform

**Implementation Pattern**:
```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

// In setup function:
let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;
let menu = Menu::with_items(app, &[&quit_item])?;

TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .tooltip("RAICOverlay")
    .on_menu_event(|app, event| {
        if event.id.as_ref() == "quit" {
            app.exit(0);
        }
    })
    .build(app)?;
```

### 2. How to enable tray-icon feature in Tauri?

**Decision**: Add `tray-icon` to Tauri features in Cargo.toml

**Rationale**:
- Required per official Tauri 2.x documentation
- Feature flag keeps binary size minimal when not needed

**Implementation**:
```toml
# In src-tauri/Cargo.toml
tauri = { version = "2", features = ["tray-icon"] }
```

### 3. How to handle graceful exit with state persistence?

**Decision**: Emit frontend event before calling `app.exit(0)` to trigger state save

**Rationale**:
- Existing persistence system (feature 010) handles state saving via frontend
- Need to give frontend time to persist before backend exits
- Using Tauri's event system maintains existing architecture

**Alternatives Considered**:
- Call persistence directly from Rust: Rejected - would bypass frontend state management
- Synchronous save: Rejected - existing system is async

**Implementation Pattern**:
```rust
.on_menu_event(|app, event| {
    if event.id.as_ref() == "quit" {
        // Emit event to frontend to trigger state save
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.emit("app-exit-requested", ());
        }
        // Small delay to allow persistence, then exit
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(500));
            app.exit(0);
        });
    }
})
```

### 4. What icon format/size for Windows tray?

**Decision**: Reuse existing `icon.ico` from `src-tauri/icons/`

**Rationale**:
- Already exists and is branded for RAICOverlay (feature 011/012)
- `.ico` format supports multiple sizes, Windows selects appropriate one
- Tauri's `default_window_icon()` method loads this automatically

**Implementation**:
```rust
.icon(app.default_window_icon().unwrap().clone())
```

### 5. Menu behavior - left click vs right click?

**Decision**: Menu on right-click only (default Windows behavior)

**Rationale**:
- Standard Windows tray icon convention
- Left-click can remain undefined or do nothing (per spec assumptions)
- Setting `menu_on_left_click(false)` is the default

**Implementation**:
```rust
TrayIconBuilder::new()
    .menu(&menu)
    // menu_on_left_click defaults to false, no need to set explicitly
```

## Dependencies Summary

| Dependency | Version | Purpose |
|------------|---------|---------|
| tauri | 2.x | Core framework with `tray-icon` feature |
| tauri::tray | built-in | TrayIconBuilder API |
| tauri::menu | built-in | Menu and MenuItem creation |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Icon not showing | Low | Medium | Use existing tested icon.ico, verify feature enabled |
| Exit without persistence | Medium | High | Add exit event + delay pattern |
| Menu not responding | Low | Low | Standard Tauri pattern, well-documented |

## Conclusion

All research questions resolved. Implementation uses Tauri 2.x built-in tray icon support with minimal code changes:
1. Enable `tray-icon` feature in Cargo.toml
2. Create new `tray.rs` module with setup function
3. Call tray setup from `lib.rs` during app initialization
4. Handle exit with event emission for persistence
