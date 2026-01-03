//! T004-T007 (051): Update window management
//! @feature 051-fix-update-popup
//!
//! This module handles the dedicated update notification window that appears
//! in the Windows taskbar. It follows the same pattern as settings_window.rs.

use super::types::{OpenUpdateWindowResult, UpdateInfo, UpdateWindowState};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// T005: Open or focus the update notification window
///
/// Creates a new window if one doesn't exist, or shows and focuses the existing one.
/// The window is visible in the taskbar (skip_taskbar = false) to ensure users can
/// find it even when other windows are covering it.
#[tauri::command]
pub async fn open_update_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, UpdateWindowState>,
) -> Result<OpenUpdateWindowResult, String> {
    // T022: Check if window already exists - reuse if so
    if let Some(window) = app.get_webview_window("update") {
        // T022: Emit event to refresh displayed update info
        if let Err(e) = app.emit("update-info-changed", ()) {
            log::warn!("Failed to emit update-info-changed event: {}", e);
        }

        // Window exists - show and focus it
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        log::info!("Update window focused");
        return Ok(OpenUpdateWindowResult {
            success: true,
            created: false,
            error: None,
        });
    }

    // Verify we have update info before creating window
    {
        let guard = state
            .update_info
            .lock()
            .map_err(|_| "Internal error: state lock failed")?;
        if guard.is_none() {
            return Err("No pending update info available".to_string());
        }
    }

    // Create new update window following settings_window.rs pattern
    WebviewWindowBuilder::new(&app, "update", WebviewUrl::App("update".into()))
        .title("RAIC Overlay Update")
        .inner_size(350.0, 300.0)
        .decorations(false) // Custom titlebar with drag region
        .transparent(true) // Match overlay styling
        .skip_taskbar(false) // T020, T021: Visible in taskbar
        .resizable(false)
        .center()
        .build()
        .map_err(|e| format!("Failed to create update window: {}", e))?;

    log::info!("Update window created");
    Ok(OpenUpdateWindowResult {
        success: true,
        created: true,
        error: None,
    })
}

/// T006: Get pending update info for the update window
///
/// Called by the frontend when the update window mounts to retrieve
/// the update information stored in the managed state.
#[tauri::command]
pub fn get_pending_update(
    state: tauri::State<'_, UpdateWindowState>,
) -> Option<UpdateInfo> {
    let guard = state.update_info.lock().ok()?;
    guard.clone()
}

/// T007: Close the update window and optionally dismiss the update
///
/// If dismiss is true, clears the pending update state (user chose "Ask Later").
/// The window is closed regardless of the dismiss flag.
#[tauri::command]
pub async fn close_update_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, UpdateWindowState>,
    dismiss: bool,
) -> Result<(), String> {
    // Clear state if dismissing
    if dismiss {
        if let Ok(mut guard) = state.update_info.lock() {
            *guard = None;
            log::info!("Update window dismissed - cleared pending update state");
        }
    }

    // Find and close the window
    if let Some(window) = app.get_webview_window("update") {
        window.close().map_err(|e| e.to_string())?;
        log::info!("Update window closed");
    }
    // Silent success if window doesn't exist (already closed)

    Ok(())
}
