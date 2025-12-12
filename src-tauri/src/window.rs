use tauri::{LogicalPosition, WebviewWindow};

const WINDOW_WIDTH: f64 = 400.0;

/// Calculate the top-center position for the overlay window
pub fn position_at_top_center(window: &WebviewWindow) -> Result<LogicalPosition<f64>, String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| format!("Failed to get current monitor: {}", e))?
        .ok_or_else(|| "No monitor found".to_string())?;

    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // Calculate center position
    let logical_width = monitor_size.width as f64 / scale_factor;
    let x = (logical_width - WINDOW_WIDTH) / 2.0;
    let y = 0.0;

    Ok(LogicalPosition::new(x, y))
}

/// Position the window at top center of the screen
pub fn set_window_top_center(window: &WebviewWindow) -> Result<(), String> {
    let position = position_at_top_center(window)?;
    window
        .set_position(tauri::Position::Logical(position))
        .map_err(|e| format!("Failed to set window position: {}", e))?;
    Ok(())
}
