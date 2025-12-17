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

#[tauri::command]
fn get_overlay_state(state: tauri::State<'_, OverlayState>) -> types::OverlayStateResponse {
    state.to_response()
}

// F3: Toggle visibility - show (click-through mode) / hide
#[tauri::command]
async fn toggle_visibility(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, OverlayState>,
) -> Result<types::OverlayStateResponse, String> {
    let is_visible = state.is_visible();

    if is_visible {
        // Hide the window
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {}", e))?;
        state.set_visible(false);
        // Reset to click-through mode when hiding
        state.set_mode(OverlayMode::Fullscreen);
    } else {
        // Show the window in click-through mode (60% transparent)
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
    // Only toggle mode if window is visible
    if !state.is_visible() {
        return Ok(state.to_response());
    }

    let current_mode = state.get_mode();
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

    Ok(state.to_response())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(hotkey::build_shortcut_plugin().build())
        .manage(OverlayState::default())
        .invoke_handler(tauri::generate_handler![
            set_visibility,
            get_overlay_state,
            toggle_visibility,
            toggle_mode
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Register F3 and F5 global shortcuts
            if let Err(e) = hotkey::register_shortcuts(&handle) {
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
