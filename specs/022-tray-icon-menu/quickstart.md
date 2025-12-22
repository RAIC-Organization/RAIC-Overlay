# Quickstart: Windows System Tray Icon

**Feature**: 022-tray-icon-menu
**Date**: 2025-12-22

## Prerequisites

- Rust 2021 Edition installed
- Existing RAICOverlay project cloned and buildable
- Windows 10/11 development environment

## Quick Implementation Steps

### Step 1: Enable Tray Icon Feature

Update `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
```

### Step 2: Create Tray Module

Create `src-tauri/src/tray.rs`:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_item])?;

    let app_handle = app.clone();
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("RAICOverlay")
        .on_menu_event(move |app, event| {
            if event.id.as_ref() == "quit" {
                log::info!("Exit requested via tray menu");

                // Emit event for frontend to persist state
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("app-exit-requested", ());
                }

                // Delay exit to allow persistence
                let handle = app.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    handle.exit(0);
                });
            }
        })
        .build(app)?;

    log::info!("System tray icon initialized");
    Ok(())
}
```

### Step 3: Integrate in lib.rs

Add to `src-tauri/src/lib.rs`:

```rust
pub mod tray;  // Add module declaration

// In run() function, inside .setup() closure:
if let Err(e) = tray::setup_tray(&handle) {
    log::error!("Failed to setup tray icon: {}", e);
}
```

### Step 4: Handle Exit Event (Frontend - Optional)

If frontend persistence is needed, add listener in `PersistenceContext.tsx`:

```typescript
useEffect(() => {
    const unlisten = listen('app-exit-requested', async () => {
        await saveState();
    });
    return () => { unlisten.then(fn => fn()); };
}, []);
```

## Verification

1. Build and run: `npm run tauri dev`
2. Check Windows system tray for RAICOverlay icon
3. Hover over icon - should show "RAICOverlay" tooltip
4. Right-click icon - should show menu with "Exit" option
5. Click "Exit" - app should terminate cleanly

## Common Issues

| Issue | Solution |
|-------|----------|
| Icon not appearing | Verify `tray-icon` feature enabled in Cargo.toml |
| Exit not working | Check on_menu_event handler registered |
| State not persisting | Verify frontend listener for `app-exit-requested` |
