// Overlay commands - Tauri command handlers for overlay visibility and mode
// Extracted from lib.rs as part of modular refactor (Feature 055)

use crate::browser;
use crate::core::types::{ModeChangePayload, OverlayMode, OverlayStateResponse, TargetWindowInfo};
use crate::core::OverlayState;
#[cfg(windows)]
use crate::core::types::ShowErrorModalPayload;
#[cfg(windows)]
use crate::core::types::TargetWindowChangedPayload;
use tauri::Emitter;

#[cfg(windows)]
use crate::core::window;
#[cfg(windows)]
use crate::platform::{process_monitor, target_window};

/// Set overlay visibility
#[tauri::command]
pub async fn set_visibility(
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
        window
            .show()
            .map_err(|e| format!("Failed to show window: {}", e))?;
    } else {
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {}", e))?;
    }

    Ok(())
}

/// Get current overlay state
#[tauri::command]
pub fn get_overlay_state(state: tauri::State<'_, OverlayState>) -> OverlayStateResponse {
    state.to_response()
}

/// Check if target process is currently running
/// @feature 044-session-timer-widget
#[tauri::command]
pub fn is_target_process_running() -> bool {
    #[cfg(windows)]
    {
        process_monitor::PROCESS_MONITOR_STATE.is_target_found()
    }
    #[cfg(not(windows))]
    {
        false
    }
}

// T019: F3: Toggle visibility with target window validation (Windows)
#[cfg(windows)]
#[tauri::command]
pub async fn toggle_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<OverlayStateResponse, String> {
    use tauri::Manager;

    let is_visible = state.is_visible();
    let mode_before = state.get_mode();

    // T027 (028): Log visibility toggle start
    log::info!(
        "F3 handler: visible_before={}, mode_before={:?}",
        is_visible,
        mode_before
    );

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

        // T056 (040): Hide all browser WebViews when overlay hides
        let app = window.app_handle();
        let browser_state = app.state::<browser::types::BrowserWebViewState>();
        if let Err(e) = browser::commands::set_all_browser_webviews_visibility_internal(
            &app,
            &browser_state,
            false,
        ) {
            log::warn!("Failed to hide browser WebViews: {}", e);
        }

        // T050 (028): Set user_manually_hidden flag to prevent auto-show
        process_monitor::PROCESS_MONITOR_STATE.set_user_manually_hidden(true);

        // T027 (028): Log outcome
        log::info!("F3 outcome: hidden overlay (user manually hidden)");
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

                let _ = window.emit(
                    "show-error-modal",
                    ShowErrorModalPayload {
                        target_name: detection_result.search_criteria.window_title.clone(),
                        message: "Detection succeeded but no window found".to_string(),
                        auto_dismiss_ms: 5000,
                    },
                );
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
            let process_running = detection_result
                .candidates_evaluated
                .iter()
                .any(|c| c.process_name.to_lowercase() == process_name.to_lowercase());

            // Check if class mismatch (process running, but wrong class)
            let class_mismatch = detection_result.candidates_evaluated.iter().any(|c| {
                c.process_name.to_lowercase() == process_name.to_lowercase()
                    && c.window_class.to_lowercase() != class_name.to_lowercase()
                    && c.window_title
                        .to_lowercase()
                        .contains(&title_pattern.to_lowercase())
            });

            let message = if class_mismatch {
                // FR-007: Class mismatch (e.g., RSI Launcher instead of game)
                format!(
                    "Game process running but window not ready. Looking for {} with class {}",
                    title_pattern, class_name
                )
            } else if process_running {
                // Process is running but window not found/ready
                "Game process running but main window not detected. Please wait for the game to fully load.".to_string()
            } else {
                // Process not running at all
                format!("Please start {} first", title_pattern)
            };

            // T027 (028): Log outcome
            log::warn!("F3 outcome: detection failed - {}", message);

            let _ = window.emit(
                "show-error-modal",
                ShowErrorModalPayload {
                    target_name: title_pattern.clone(),
                    message,
                    auto_dismiss_ms: 5000,
                },
            );
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

                let _ = window.emit(
                    "show-error-modal",
                    ShowErrorModalPayload {
                        target_name: target_window::get_target_window_name().to_string(),
                        message: format!("Failed to get target window position: {}", e),
                        auto_dismiss_ms: 5000,
                    },
                );
                return Ok(state.to_response());
            }
        };

        // Store target binding
        state
            .target_binding
            .set_hwnd(target_window::hwnd_to_u64(target_hwnd));
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

        // T057 (040): Show all browser WebViews when overlay shows
        let app = window.app_handle();
        let browser_state = app.state::<browser::types::BrowserWebViewState>();
        if let Err(e) = browser::commands::set_all_browser_webviews_visibility_internal(
            &app,
            &browser_state,
            true,
        ) {
            log::warn!("Failed to show browser WebViews: {}", e);
        }

        // T027 (028): Log outcome
        log::info!(
            "F3 outcome: shown overlay, bound to target at ({}, {}) {}x{}",
            rect.x,
            rect.y,
            rect.width,
            rect.height
        );
    }

    Ok(state.to_response())
}

// F3: Toggle visibility - non-Windows fallback
#[cfg(not(windows))]
#[tauri::command]
pub async fn toggle_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<OverlayStateResponse, String> {
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
pub async fn toggle_mode(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<OverlayStateResponse, String> {
    let current_mode = state.get_mode();

    // T028 (028): Log mode toggle start
    log::info!(
        "F5 handler: visible={}, mode_before={:?}",
        state.is_visible(),
        current_mode
    );

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
pub fn get_target_window_info(_state: tauri::State<'_, OverlayState>) -> TargetWindowInfo {
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
pub fn get_target_window_info(_state: tauri::State<'_, OverlayState>) -> TargetWindowInfo {
    TargetWindowInfo {
        pattern: String::new(),
        found: false,
        focused: false,
        rect: None,
    }
}

// T043: Dismiss error modal command
#[tauri::command]
pub fn dismiss_error_modal(window: tauri::WebviewWindow) -> Result<(), String> {
    window
        .emit("dismiss-error-modal", ())
        .map_err(|e| format!("Failed to emit dismiss event: {}", e))
}
