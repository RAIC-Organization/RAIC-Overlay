// RAIC Overlay - Rust backend entry point
// Modular architecture organized by feature domain

// ============================================================================
// Core infrastructure - Foundation types and state (no external dependencies)
// ============================================================================
pub mod core;

// ============================================================================
// Infrastructure modules - Shared services used by feature modules
// ============================================================================
pub mod logging;
pub mod persistence;
pub mod hotkey;

// ============================================================================
// Feature modules - Domain-specific functionality
// ============================================================================
pub mod browser;
pub mod settings;
pub mod update;

// ============================================================================
// Platform-specific modules - Windows-only functionality
// ============================================================================
pub mod platform;

// ============================================================================
// Application layer - Tauri command handlers (delegates to feature modules)
// ============================================================================
pub mod commands;

// ============================================================================
// Imports for run() function
// ============================================================================
use core::types::{OverlayReadyPayload, Position};
use core::OverlayState;
use persistence::{delete_window_content, load_state, save_state, save_window_content};
use tauri::{Emitter, Manager};

// T002 (039): Helper function to get prevent-default plugin with conditional debug/release configuration
// Debug builds: Allow DevTools access for development (F12, Ctrl+Shift+I)
// Release builds: Block all browser shortcuts including DevTools
#[cfg(debug_assertions)]
fn get_prevent_default_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;
    // Debug: Allow DevTools for development
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS))
        .build()
}

#[cfg(not(debug_assertions))]
fn get_prevent_default_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    // Release: Block all browser shortcuts
    tauri_plugin_prevent_default::init()
}

/// Main application entry point
///
/// Setup sequence:
/// 1. Initialize runtime settings from settings.toml
/// 2. Configure logging with appropriate log level
/// 3. Register Tauri plugins (opener, dialog, fs, single-instance, autostart, etc.)
/// 4. Initialize application state (OverlayState, BrowserWebViewState, UpdateWindowState)
/// 5. Register all Tauri command handlers
/// 6. Setup system tray, keyboard hooks, and monitors
/// 7. Position main window and emit overlay-ready event
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // T030: Initialize settings before logging plugin
    // Settings are loaded from settings.toml (or defaults) and cached
    settings::runtime::init_settings();

    // Initialize logging with configured log level from settings
    let log_level = logging::get_log_level();

    // Build logging plugin with optional Stdout target for development
    let log_builder = logging::build_log_plugin(log_level);

    tauri::Builder::default()
        .plugin(log_builder)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Focus existing window when second instance is launched
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.show();
            }
        }))
        // T012 (038): Initialize autostart plugin
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        // T003 (039): Register prevent-default plugin to block browser shortcuts
        .plugin(get_prevent_default_plugin())
        // T009 (049): Register process plugin for app exit during update
        .plugin(tauri_plugin_process::init())
        // T036 (040): Register browser WebView plugin for navigation events
        .plugin(browser::build_browser_webview_plugin())
        .plugin(hotkey::build_shortcut_plugin().build())
        .manage(OverlayState::default())
        // T008 (040): Initialize BrowserWebViewState for WebView tracking
        .manage(browser::types::BrowserWebViewState::new())
        // T003 (051): Initialize UpdateWindowState for update notification window
        .manage(update::types::UpdateWindowState::default())
        .invoke_handler(tauri::generate_handler![
            // Overlay commands (from commands module)
            commands::set_visibility,
            commands::get_overlay_state,
            commands::is_target_process_running,
            commands::toggle_visibility,
            commands::toggle_mode,
            commands::get_target_window_info,
            commands::dismiss_error_modal,
            // Persistence commands
            load_state,
            save_state,
            save_window_content,
            delete_window_content,
            // Logging commands
            logging::cleanup_old_logs,
            logging::get_log_file_path,
            logging::get_log_config,
            // Settings commands
            settings::runtime::get_settings_command,
            settings::runtime::get_settings_sources,
            // T011 (038): Settings panel commands
            settings::user::load_user_settings,
            settings::user::save_user_settings,
            settings::user::update_hotkeys,
            settings::window::open_settings_window,
            // T007 (040): Browser WebView commands
            browser::create_browser_webview,
            browser::destroy_browser_webview,
            // T022 (040): Browser WebView navigation commands
            browser::browser_navigate,
            browser::browser_go_back,
            browser::browser_go_forward,
            browser::browser_refresh,
            browser::report_browser_url_change,
            browser::set_browser_zoom,
            // T029 (040): Browser WebView positioning command
            browser::sync_browser_webview_bounds,
            // T045 (040): Browser WebView opacity command
            browser::set_browser_webview_opacity,
            // Browser WebView cursor ignore command (for non-interactive mode)
            browser::set_browser_webview_ignore_cursor,
            // Browser WebView bring to front command (for mouse enter)
            browser::bring_browser_webview_to_front,
            // Browser WebView send to back command (for mouse leave)
            browser::send_browser_webview_to_back,
            // T054 (040): Browser WebView visibility commands
            browser::set_browser_webview_visibility,
            browser::set_all_browser_webviews_visibility,
            browser::destroy_all_browser_webviews,
            // T016, T025, T031 (049): Auto-update commands
            update::check_for_updates,
            update::download_update,
            update::launch_installer_and_exit,
            update::cleanup_old_installers,
            update::dismiss_update,
            update::get_update_state,
            // T009 (051): Update window commands
            update::open_update_window,
            update::get_pending_update,
            update::close_update_window
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Log application startup
            log::info!("RAIC Overlay starting up");
            log::debug!("Log level: {:?}", logging::get_log_level());

            // Clean up old log files on startup
            if let Err(e) = logging::cleanup_old_logs(handle.clone()) {
                log::warn!("Failed to cleanup old logs: {}", e);
            }

            // T026 (038): Initialize user settings cache
            settings::user::init_user_settings(&handle);

            // T006 (054): Conditionally open Settings panel on startup
            // If start_minimized is false (default), show Settings panel
            if !settings::user::get_start_minimized() {
                log::debug!("start_minimized=false, opening Settings panel on startup");
                let startup_handle = handle.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = settings::window::open_settings_window(startup_handle).await {
                        log::warn!("Failed to open settings window on startup: {}", e);
                    }
                });
            } else {
                log::debug!("start_minimized=true, skipping Settings panel on startup");
            }

            // T018 (029): Start low-level keyboard hook for F3/F5 hotkeys
            // This replaces global shortcut registration which doesn't work with Star Citizen
            #[cfg(windows)]
            {
                if platform::keyboard_hook::start_keyboard_hook(handle.clone()) {
                    log::info!("Low-level keyboard hook started successfully");
                } else {
                    // Fallback to global shortcuts if hook fails
                    log::warn!("Low-level keyboard hook failed, falling back to global shortcuts");
                    if let Err(e) = hotkey::register_shortcuts(&handle) {
                        log::warn!("Failed to register fallback shortcuts: {}", e);
                    }
                }
            }

            // Non-Windows: use global shortcuts directly
            #[cfg(not(windows))]
            if let Err(e) = hotkey::register_shortcuts(&handle) {
                log::warn!("Failed to register shortcuts: {}", e);
            }

            // T008: Setup system tray icon
            if let Err(e) = platform::tray::setup_tray(&handle) {
                log::error!("Failed to setup tray icon: {}", e);
            }

            // T048 (028): Start process monitor for automatic game detection
            #[cfg(windows)]
            platform::process_monitor::start_process_monitor(handle.clone());

            // Start browser WebView URL polling for tracking navigation changes
            browser::start_browser_url_polling(handle.clone());

            // Get main window
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // Position window at top center
            if let Err(e) = core::window::set_window_top_center(&window) {
                log::warn!("Failed to position window: {}", e);
            }

            // Set initial click-through state (hidden = click-through)
            let _ = window.set_ignore_cursor_events(true);

            // Get state and mark as initialized
            let state = app.state::<OverlayState>();
            state.set_initialized(true);

            // Emit overlay-ready event
            let (x, y) = match core::window::position_at_top_center(&window) {
                Ok(pos) => (pos.x, pos.y),
                Err(_) => (0.0, 0.0),
            };
            let payload = OverlayReadyPayload {
                window_id: "main".to_string(),
                position: Position { x, y },
            };

            if let Err(e) = app.emit("overlay-ready", payload) {
                log::error!("Failed to emit overlay-ready: {}", e);
            }

            log::info!("RAIC Overlay initialized successfully");

            // T026: Start focus monitor (Windows only)
            #[cfg(windows)]
            platform::focus_monitor::start_focus_monitor(handle.clone());

            // T010-T011 (051): Trigger update check after 3 second delay
            // Previously this was done by the frontend useUpdateChecker hook,
            // but now the backend handles it to ensure updates are checked
            // regardless of overlay visibility state.
            let update_handle = handle.clone();
            std::thread::spawn(move || {
                // Wait 3 seconds before checking for updates (gives app time to initialize)
                std::thread::sleep(std::time::Duration::from_secs(3));
                log::info!("Triggering automatic update check...");

                // Use tauri's async runtime to run the async update check
                tauri::async_runtime::block_on(async {
                    // Clean up old installers first
                    if let Err(e) = update::cleanup_old_installers(update_handle.clone()).await {
                        log::warn!("Failed to cleanup old installers: {}", e);
                    }

                    // Check for updates - this will automatically open the update window if found
                    match update::check_for_updates(update_handle).await {
                        Ok(result) => {
                            if result.update_available {
                                log::info!("Update check complete: update available");
                            } else {
                                log::info!("Update check complete: no updates available");
                            }
                        }
                        Err(e) => {
                            log::warn!("Update check failed: {}", e);
                        }
                    }
                });
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
