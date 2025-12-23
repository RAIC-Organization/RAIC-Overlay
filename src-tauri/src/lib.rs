pub mod hotkey;
pub mod logging;
pub mod logging_types;
pub mod persistence;
pub mod persistence_types;
pub mod settings;
pub mod state;
pub mod tray;
#[cfg(windows)]
pub mod focus_monitor;
#[cfg(windows)]
pub mod target_window;
pub mod types;
pub mod window;

use persistence::{delete_window_content, load_state, save_state, save_window_content};
use state::OverlayState;
use tauri::{Emitter, Manager};
use types::{ModeChangePayload, OverlayMode, OverlayReadyPayload, Position, TargetWindowInfo};
#[cfg(windows)]
use types::{ShowErrorModalPayload, TargetWindowChangedPayload};

#[tauri::command]
async fn set_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
    visible: bool,
) -> Result<(), String> {
    // Update state
    state.set_visible(visible);

    // Toggle click-through: when hidden, allow clicks to pass through
    window
        .set_ignore_cursor_events(!visible)
        .map_err(|e| format!("Failed to set cursor events: {}", e))?;

    // Show/hide window
    if visible {
        window.show().map_err(|e| format!("Failed to show window: {}", e))?;
    } else {
        window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn get_overlay_state(state: tauri::State<'_, OverlayState>) -> types::OverlayStateResponse {
    state.to_response()
}

// T019: F3: Toggle visibility with target window validation (Windows)
#[cfg(windows)]
#[tauri::command]
async fn toggle_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<types::OverlayStateResponse, String> {
    let is_visible = state.is_visible();
    let mode_before = state.get_mode();

    // T027 (028): Log visibility toggle start
    log::info!("F3 handler: visible_before={}, mode_before={:?}", is_visible, mode_before);

    if is_visible {
        // Hide the window
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {}", e))?;
        state.set_visible(false);
        state.set_auto_hidden(false);
        // Reset to click-through mode when hiding
        state.set_mode(OverlayMode::Fullscreen);
        // Clear target binding
        state.target_binding.clear();

        // T027 (028): Log outcome
        log::info!("F3 outcome: hidden overlay");
    } else {
        // T019, T020 (028): Check target window using three-point verification
        let detection_result = target_window::find_target_window_verified();

        let target_hwnd = if detection_result.success {
            // Extract the HWND from the matched window
            if let Some(ref matched) = detection_result.matched_window {
                target_window::u64_to_hwnd(matched.hwnd)
            } else {
                // Should not happen if success is true, but handle defensively
                let _ = window::set_window_screen_center(&window, 420.0, 280.0);
                let _ = window.show();
                let _ = window.set_ignore_cursor_events(false);

                let _ = window.emit("show-error-modal", ShowErrorModalPayload {
                    target_name: detection_result.search_criteria.window_title.clone(),
                    message: "Detection succeeded but no window found".to_string(),
                    auto_dismiss_ms: 5000,
                });
                // T027 (028): Log outcome
                log::warn!("F3 outcome: detection anomaly - success but no matched window");
                return Ok(state.to_response());
            }
        } else {
            // Detection failed - determine error type
            let _ = window::set_window_screen_center(&window, 420.0, 280.0);
            let _ = window.show();
            let _ = window.set_ignore_cursor_events(false);

            // Check if we found any candidates at all
            let process_name = &detection_result.search_criteria.process_name;
            let class_name = &detection_result.search_criteria.window_class;
            let title_pattern = &detection_result.search_criteria.window_title;

            // Check if process is running but window not ready
            let process_running = detection_result.candidates_evaluated.iter()
                .any(|c| c.process_name.to_lowercase() == process_name.to_lowercase());

            // Check if class mismatch (process running, but wrong class)
            let class_mismatch = detection_result.candidates_evaluated.iter()
                .any(|c| c.process_name.to_lowercase() == process_name.to_lowercase()
                    && c.window_class.to_lowercase() != class_name.to_lowercase()
                    && c.window_title.to_lowercase().contains(&title_pattern.to_lowercase()));

            let message = if class_mismatch {
                // FR-007: Class mismatch (e.g., RSI Launcher instead of game)
                format!("Game process running but window not ready. Looking for {} with class {}",
                    title_pattern, class_name)
            } else if process_running {
                // Process is running but window not found/ready
"Game process running but main window not detected. Please wait for the game to fully load.".to_string()
            } else {
                // Process not running at all
                format!("Please start {} first", title_pattern)
            };

            // T027 (028): Log outcome
            log::warn!("F3 outcome: detection failed - {}", message);

            let _ = window.emit("show-error-modal", ShowErrorModalPayload {
                target_name: title_pattern.clone(),
                message,
                auto_dismiss_ms: 5000,
            });
            return Ok(state.to_response());
        };

        // Check if target is focused
        if !target_window::is_target_focused(target_hwnd) {
            // Target exists but not focused - don't show overlay
            // T036 (028): Log focus issue with foreground window info
            let (fg_process, fg_title) = target_window::get_foreground_window_info();
            log::warn!(
                "Target detected but not focused - overlay not shown. Foreground: process={}, title={}",
                fg_process, fg_title
            );
            return Ok(state.to_response());
        }

        // T037 (028): Log that target is focused and showing overlay
        log::info!("Target focused - showing overlay");

        // Get target window rect
        let rect = match target_window::get_window_rect(target_hwnd) {
            Ok(r) => r,
            Err(e) => {
                // Show window temporarily for error modal - centered on screen
                let _ = window::set_window_screen_center(&window, 420.0, 280.0);
                let _ = window.show();
                let _ = window.set_ignore_cursor_events(false);

                // T027 (028): Log outcome
                log::warn!("F3 outcome: failed to get target window position: {}", e);

                let _ = window.emit("show-error-modal", ShowErrorModalPayload {
                    target_name: target_window::get_target_window_name().to_string(),
                    message: format!("Failed to get target window position: {}", e),
                    auto_dismiss_ms: 5000,
                });
                return Ok(state.to_response());
            }
        };

        // Store target binding
        state.target_binding.set_hwnd(target_window::hwnd_to_u64(target_hwnd));
        state.target_binding.set_focused(true);
        state.target_binding.set_rect(Some(rect));
        state.target_binding.update_last_check();

        // T018: Sync overlay to target window
        window::sync_overlay_to_target(&window, &rect)
            .map_err(|e| format!("Failed to sync overlay: {}", e))?;

        // Show the window in click-through mode (60% transparent)
        window
            .show()
            .map_err(|e| format!("Failed to show window: {}", e))?;
        window
            .set_ignore_cursor_events(true)
            .map_err(|e| format!("Failed to set cursor events: {}", e))?;
        state.set_visible(true);
        state.set_auto_hidden(false);
        state.set_mode(OverlayMode::Fullscreen);

        // Emit target-window-changed event
        let payload = TargetWindowChangedPayload {
            bound: true,
            focused: true,
            rect: Some(rect),
        };
        let _ = window.emit("target-window-changed", payload);

        // T027 (028): Log outcome
        log::info!("F3 outcome: shown overlay, bound to target at ({}, {}) {}x{}",
            rect.x, rect.y, rect.width, rect.height);
    }

    Ok(state.to_response())
}

// F3: Toggle visibility - non-Windows fallback
#[cfg(not(windows))]
#[tauri::command]
async fn toggle_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<types::OverlayStateResponse, String> {
    let is_visible = state.is_visible();

    if is_visible {
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {}", e))?;
        state.set_visible(false);
        state.set_mode(OverlayMode::Fullscreen);
    } else {
        window
            .show()
            .map_err(|e| format!("Failed to show window: {}", e))?;
        window
            .set_ignore_cursor_events(true)
            .map_err(|e| format!("Failed to set cursor events: {}", e))?;
        state.set_visible(true);
        state.set_mode(OverlayMode::Fullscreen);
    }

    Ok(state.to_response())
}

// F5: Toggle mode - click-through (60% transparent) / interactive (fully visible)
// Only works when window is visible
#[tauri::command]
async fn toggle_mode(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<types::OverlayStateResponse, String> {
    let current_mode = state.get_mode();

    // T028 (028): Log mode toggle start
    log::info!("F5 handler: visible={}, mode_before={:?}", state.is_visible(), current_mode);

    // Only toggle mode if window is visible
    if !state.is_visible() {
        // T028 (028): Log outcome
        log::info!("F5 outcome: ignored (overlay not visible)");
        return Ok(state.to_response());
    }

    let previous_mode_str = match current_mode {
        OverlayMode::Windowed => "windowed",
        OverlayMode::Fullscreen => "fullscreen",
    };

    match current_mode {
        // Windowed (interactive) -> Fullscreen (click-through) transition
        OverlayMode::Windowed => {
            // Enable click-through mode (header at 60% transparency)
            window
                .set_ignore_cursor_events(true)
                .map_err(|e| format!("Failed to set cursor events: {}", e))?;
            state.set_mode(OverlayMode::Fullscreen);
        }
        // Fullscreen (click-through) -> Windowed (interactive) transition
        OverlayMode::Fullscreen => {
            // Disable click-through mode (header fully visible)
            window
                .set_ignore_cursor_events(false)
                .map_err(|e| format!("Failed to set cursor events: {}", e))?;
            state.set_mode(OverlayMode::Windowed);
        }
    }

    let new_mode = state.get_mode();
    let current_mode_str = match new_mode {
        OverlayMode::Windowed => "windowed",
        OverlayMode::Fullscreen => "fullscreen",
    };

    // Emit mode-changed event
    let payload = ModeChangePayload {
        previous_mode: previous_mode_str.to_string(),
        current_mode: current_mode_str.to_string(),
    };
    window
        .emit("mode-changed", payload)
        .map_err(|e| format!("Failed to emit mode-changed event: {}", e))?;

    // T028 (028): Log outcome
    log::info!("F5 outcome: mode_after={:?}", new_mode);

    Ok(state.to_response())
}

// T054: Get target window info command
// T015: Updated to use runtime settings for target window name
#[cfg(windows)]
#[tauri::command]
fn get_target_window_info(_state: tauri::State<'_, OverlayState>) -> TargetWindowInfo {
    let target_name = target_window::get_target_window_name();

    // Try to find target window
    match target_window::find_target_window() {
        Ok(hwnd) => {
            let focused = target_window::is_target_focused(hwnd);
            let rect = target_window::get_window_rect(hwnd).ok();

            TargetWindowInfo {
                pattern: target_name.to_string(),
                found: true,
                focused,
                rect,
            }
        }
        Err(_) => TargetWindowInfo {
            pattern: target_name.to_string(),
            found: false,
            focused: false,
            rect: None,
        },
    }
}

#[cfg(not(windows))]
#[tauri::command]
fn get_target_window_info(_state: tauri::State<'_, OverlayState>) -> TargetWindowInfo {
    TargetWindowInfo {
        pattern: String::new(),
        found: false,
        focused: false,
        rect: None,
    }
}

// T043: Dismiss error modal command
#[tauri::command]
fn dismiss_error_modal(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .emit("dismiss-error-modal", ())
        .map_err(|e| format!("Failed to emit dismiss event: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // T030: Initialize settings before logging plugin
    // Settings are loaded from settings.toml (or defaults) and cached
    settings::init_settings();

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
        .plugin(hotkey::build_shortcut_plugin().build())
        .manage(OverlayState::default())
        .invoke_handler(tauri::generate_handler![
            set_visibility,
            get_overlay_state,
            toggle_visibility,
            toggle_mode,
            get_target_window_info,
            dismiss_error_modal,
            load_state,
            save_state,
            save_window_content,
            delete_window_content,
            logging::cleanup_old_logs,
            logging::get_log_file_path,
            logging::get_log_config,
            settings::get_settings_command,
            settings::get_settings_sources
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

            // Register F3 and F5 global shortcuts
            if let Err(e) = hotkey::register_shortcuts(&handle) {
                log::warn!("Failed to register shortcuts: {}", e);
            }

            // T008: Setup system tray icon
            if let Err(e) = tray::setup_tray(&handle) {
                log::error!("Failed to setup tray icon: {}", e);
            }

            // Get main window
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // Position window at top center
            if let Err(e) = window::set_window_top_center(&window) {
                log::warn!("Failed to position window: {}", e);
            }

            // Set initial click-through state (hidden = click-through)
            let _ = window.set_ignore_cursor_events(true);

            // Get state and mark as initialized
            let state = app.state::<OverlayState>();
            state.set_initialized(true);

            // Emit overlay-ready event
            let (x, y) = match window::position_at_top_center(&window) {
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
            focus_monitor::start_focus_monitor(handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
