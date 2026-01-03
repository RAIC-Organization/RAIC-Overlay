//! System tray icon module
//!
//! Provides tray icon functionality with "Settings" and "Exit" menu options.
//!
//! @feature 022-tray-icon-menu
//! @feature 038-settings-panel

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};

#[cfg(windows)]
use super::keyboard_hook;

use crate::settings::window as settings_window;

/// Initialize the system tray icon with menu.
///
/// Creates a tray icon using the app's default icon with:
/// - Tooltip showing "RAICOverlay"
/// - Context menu with "Settings" and "Exit" options
/// - Settings handler that opens Settings window
/// - Exit handler that emits event for persistence before terminating
pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // T028 (038): Create MenuItem with id "settings" and text "Settings"
    let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;

    // T010: Create MenuItem with id "quit" and text "Exit"
    let quit_item = MenuItem::with_id(app, "quit", "Exit", true, None::<&str>)?;

    // T011: Create Menu with settings and quit items
    let menu = Menu::with_items(app, &[&settings_item, &quit_item])?;

    // T006, T007, T012: Build tray icon with icon, tooltip, and menu
    let app_handle = app.clone();
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("RAICOverlay")
        .on_menu_event(move |app, event| {
            // T013: Handle menu events
            // T029 (038): Handle "settings" menu click
            if event.id.as_ref() == "settings" {
                log::info!("Settings requested via tray menu");
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = settings_window::open_settings_window(app_clone).await {
                        log::error!("Failed to open settings window: {}", e);
                    }
                });
            } else if event.id.as_ref() == "quit" {
                // T016: Log exit request
                log::info!("Exit requested via tray menu");

                // T019 (029): Stop keyboard hook before exit
                #[cfg(windows)]
                {
                    keyboard_hook::stop_keyboard_hook();
                }

                // T014: Emit event to frontend to trigger state save
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("app-exit-requested", ());
                }

                // T015: Delay exit to allow persistence (500ms)
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    handle.exit(0);
                });
            }
        })
        .build(app)?;

    // T009: Log tray icon initialization
    log::info!("System tray icon initialized");
    Ok(())
}
