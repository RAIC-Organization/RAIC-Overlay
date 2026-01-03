use tauri::{LogicalPosition, LogicalSize, WebviewWindow};

use super::types::WindowState;

const WINDOW_WIDTH: f64 = 400.0;
const WINDOW_HEIGHT: f64 = 60.0;

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

/// Position the window at screen center (both horizontally and vertically)
pub fn set_window_screen_center(
    window: &WebviewWindow,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| format!("Failed to get current monitor: {}", e))?
        .ok_or_else(|| "No monitor found".to_string())?;

    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    let logical_monitor_width = monitor_size.width as f64 / scale_factor;
    let logical_monitor_height = monitor_size.height as f64 / scale_factor;

    let x = (logical_monitor_width - width) / 2.0;
    let y = (logical_monitor_height - height) / 2.0;

    window
        .set_size(tauri::Size::Logical(LogicalSize::new(width, height)))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    window
        .set_position(tauri::Position::Logical(LogicalPosition::new(x, y)))
        .map_err(|e| format!("Failed to set window position: {}", e))?;

    Ok(())
}

// T015: Get monitor size in logical pixels
pub fn get_monitor_size(window: &WebviewWindow) -> Result<(f64, f64), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| format!("Failed to get current monitor: {}", e))?
        .ok_or_else(|| "No monitor found".to_string())?;

    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // Convert to logical pixels for DPI-aware sizing
    let logical_width = monitor_size.width as f64 / scale_factor;
    let logical_height = monitor_size.height as f64 / scale_factor;

    Ok((logical_width, logical_height))
}

// T016: Expand window to fullscreen (covers entire monitor)
pub fn expand_to_fullscreen(window: &WebviewWindow) -> Result<(), String> {
    let (width, height) = get_monitor_size(window)?;

    // Position at origin (0, 0)
    window
        .set_position(tauri::Position::Logical(LogicalPosition::new(0.0, 0.0)))
        .map_err(|e| format!("Failed to set window position: {}", e))?;

    // Resize to cover full monitor
    window
        .set_size(tauri::Size::Logical(LogicalSize::new(width, height)))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    Ok(())
}

// T017: Restore window state from saved position and size
pub fn restore_window_state(window: &WebviewWindow, state: &WindowState) -> Result<(), String> {
    // Restore position
    window
        .set_position(tauri::Position::Logical(LogicalPosition::new(
            state.x, state.y,
        )))
        .map_err(|e| format!("Failed to restore window position: {}", e))?;

    // Restore size
    window
        .set_size(tauri::Size::Logical(LogicalSize::new(
            state.width,
            state.height,
        )))
        .map_err(|e| format!("Failed to restore window size: {}", e))?;

    Ok(())
}

/// Get current window state (position and size)
pub fn get_current_window_state(window: &WebviewWindow) -> Result<WindowState, String> {
    let position = window
        .outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;

    let size = window
        .outer_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;

    // Get scale factor for conversion to logical pixels
    let scale_factor = window
        .scale_factor()
        .map_err(|e| format!("Failed to get scale factor: {}", e))?;

    // Convert physical to logical pixels
    Ok(WindowState {
        x: position.x as f64 / scale_factor,
        y: position.y as f64 / scale_factor,
        width: size.width as f64 / scale_factor,
        height: size.height as f64 / scale_factor,
    })
}

/// Get default windowed state (header panel position)
pub fn get_default_windowed_state(window: &WebviewWindow) -> Result<WindowState, String> {
    let position = position_at_top_center(window)?;
    Ok(WindowState {
        x: position.x,
        y: position.y,
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
    })
}

// T018: Sync overlay position and size to target window
#[cfg(windows)]
use super::types::WindowRect;

// T046: Sync overlay position and size to target window with timing instrumentation
#[cfg(windows)]
pub fn sync_overlay_to_target(window: &WebviewWindow, rect: &WindowRect) -> Result<(), String> {
    use std::time::Instant;
    use tauri::PhysicalPosition;
    use tauri::PhysicalSize;

    let start = Instant::now();

    // Use physical pixels since WindowRect comes from Windows API in physical coords
    window
        .set_position(tauri::Position::Physical(PhysicalPosition::new(
            rect.x, rect.y,
        )))
        .map_err(|e| format!("Failed to set overlay position: {}", e))?;

    window
        .set_size(tauri::Size::Physical(PhysicalSize::new(
            rect.width,
            rect.height,
        )))
        .map_err(|e| format!("Failed to set overlay size: {}", e))?;

    // T046: SC-001 validation - position update should be <50ms
    let elapsed = start.elapsed();
    if elapsed.as_millis() > 50 {
        log::warn!(
            "Warning: sync_overlay_to_target took {}ms (target: <50ms)",
            elapsed.as_millis()
        );
    }

    Ok(())
}
