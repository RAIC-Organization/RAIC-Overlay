pub mod hotkey;
pub mod state;
pub mod types;
pub mod window;

use state::OverlayState;
use tauri::{Emitter, Manager};
use types::{ModeChangePayload, OverlayMode, OverlayReadyPayload, Position};

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

// T013: Updated to use to_response() method which includes mode field
#[tauri::command]
fn get_overlay_state(state: tauri::State<'_, OverlayState>) -> types::OverlayStateResponse {
    state.to_response()
}

// T018-T021: Toggle mode command (windowed <-> fullscreen)
#[tauri::command]
async fn toggle_mode(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<types::OverlayStateResponse, String> {
    let current_mode = state.get_mode();
    let previous_mode_str = match current_mode {
        OverlayMode::Windowed => "windowed",
        OverlayMode::Fullscreen => "fullscreen",
    };

    match current_mode {
        // T018: Windowed -> Fullscreen transition
        OverlayMode::Windowed => {
            // Save current window state for later restoration
            let current_state = window::get_current_window_state(&window)?;
            state.save_window_state(current_state);

            // T036: Show window when entering fullscreen mode
            window
                .show()
                .map_err(|e| format!("Failed to show window: {}", e))?;

            // Expand to fullscreen
            window::expand_to_fullscreen(&window)?;

            // T033: Enable click-through in fullscreen mode
            window
                .set_ignore_cursor_events(true)
                .map_err(|e| format!("Failed to set cursor events: {}", e))?;

            // Update state
            state.set_mode(OverlayMode::Fullscreen);
            state.set_visible(true);
        }
        // T019: Fullscreen -> Windowed transition
        OverlayMode::Fullscreen => {
            // Restore saved window state or use default
            if let Some(saved_state) = state.get_saved_window_state() {
                window::restore_window_state(&window, &saved_state)?;
            } else {
                // Fallback to default windowed state
                let default_state = window::get_default_windowed_state(&window)?;
                window::restore_window_state(&window, &default_state)?;
            }

            // T034: Disable click-through in windowed mode (header is interactive)
            window
                .set_ignore_cursor_events(false)
                .map_err(|e| format!("Failed to set cursor events: {}", e))?;

            // Update state
            state.set_mode(OverlayMode::Windowed);
        }
    }

    let new_mode = state.get_mode();
    let current_mode_str = match new_mode {
        OverlayMode::Windowed => "windowed",
        OverlayMode::Fullscreen => "fullscreen",
    };

    // T021: Emit mode-changed event
    let payload = ModeChangePayload {
        previous_mode: previous_mode_str.to_string(),
        current_mode: current_mode_str.to_string(),
    };
    window
        .emit("mode-changed", payload)
        .map_err(|e| format!("Failed to emit mode-changed event: {}", e))?;

    Ok(state.to_response())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(hotkey::build_shortcut_plugin().build())
        .manage(OverlayState::default())
        // T020: Register toggle_mode command in invoke_handler
        .invoke_handler(tauri::generate_handler![
            set_visibility,
            get_overlay_state,
            toggle_mode
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Register F3 global shortcut
            if let Err(e) = hotkey::register_f3_shortcut(&handle) {
                eprintln!("Warning: {}", e);
            }

            // Get main window
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // Position window at top center
            if let Err(e) = window::set_window_top_center(&window) {
                eprintln!("Warning: Failed to position window: {}", e);
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
                eprintln!("Failed to emit overlay-ready: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
