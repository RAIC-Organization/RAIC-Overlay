//! T022 (049): Update downloader
//! Stub - will be implemented in Phase 4

use super::types::DownloadEvent;
use tauri::ipc::Channel;

/// Download an update from the given URL with progress reporting.
#[tauri::command]
pub async fn download_update(
    _app: tauri::AppHandle,
    _url: String,
    on_event: Channel<DownloadEvent>,
) -> Result<String, String> {
    // Stub - will be implemented in Phase 4
    let _ = on_event.send(DownloadEvent::Error {
        message: "Download not yet implemented".to_string(),
    });
    Err("Download not yet implemented".to_string())
}
