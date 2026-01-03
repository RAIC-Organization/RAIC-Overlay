//! Settings window management
//! @feature 038-settings-panel

use serde::Serialize;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Result of opening settings window
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenSettingsResult {
    pub success: bool,
    pub created: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// T009: Open or focus the settings window
#[tauri::command]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<OpenSettingsResult, String> {
    // Check if window already exists
    if let Some(window) = app.get_webview_window("settings") {
        // Window exists - show and focus it (FR-017)
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        log::debug!("Settings window focused");
        return Ok(OpenSettingsResult {
            success: true,
            created: false,
            error: None,
        });
    }

    // Create new settings window
    WebviewWindowBuilder::new(&app, "settings", WebviewUrl::App("settings".into()))
        .title("RAIC Overlay Settings")
        .inner_size(450.0, 640.0)
        .decorations(false) // Custom titlebar with drag region
        .transparent(true) // Match overlay styling
        .skip_taskbar(false) // FR-002: Visible in taskbar
        .resizable(false)
        .center()
        .build()
        .map_err(|e| format!("Failed to create window: {}", e))?;

    log::info!("Settings window created");
    Ok(OpenSettingsResult {
        success: true,
        created: true,
        error: None,
    })
}
