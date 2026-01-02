//! T022 (049): Update downloader with streaming and progress
//! @see specs/049-auto-update/research.md

use super::state::{get_downloads_dir, load_update_state, save_update_state};
use super::types::DownloadEvent;
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use std::time::Duration;
use tauri::ipc::Channel;
use tokio_stream::StreamExt;

/// Request timeout for download
const REQUEST_TIMEOUT_SECS: u64 = 300; // 5 minutes for large files

/// Create HTTP client for downloads
fn create_client() -> Result<Client, String> {
    Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(10))
        .user_agent("RAIC-Overlay-Updater")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

/// T022: Download an update from the given URL with progress reporting.
/// Uses streaming to handle large files and reports progress via Channel.
#[tauri::command]
pub async fn download_update(
    app: tauri::AppHandle,
    url: String,
    on_event: Channel<DownloadEvent>,
) -> Result<String, String> {
    log::info!("Starting download from: {}", url);

    // Validate URL is from GitHub
    if !url.starts_with("https://github.com/") {
        log::error!("Invalid download URL: not from github.com");
        let _ = on_event.send(DownloadEvent::Error {
            message: "Invalid download URL: must be from github.com".to_string(),
        });
        return Err("Invalid download URL".to_string());
    }

    // Get downloads directory
    let downloads_dir = get_downloads_dir(&app)?;

    // Extract filename from URL
    let filename = url
        .split('/')
        .last()
        .ok_or_else(|| "Invalid URL: no filename".to_string())?;

    if !filename.ends_with(".msi") {
        log::error!("Invalid filename: not an MSI file");
        let _ = on_event.send(DownloadEvent::Error {
            message: "Invalid download: not an MSI file".to_string(),
        });
        return Err("Invalid filename".to_string());
    }

    let installer_path = downloads_dir.join(filename);
    let installer_path_str = installer_path
        .to_str()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string();

    log::debug!("Download destination: {}", installer_path_str);

    // Create HTTP client and start download
    let client = create_client()?;

    let response = match client.get(&url).send().await {
        Ok(resp) => resp,
        Err(e) => {
            log::error!("Download request failed: {}", e);
            let _ = on_event.send(DownloadEvent::Error {
                message: format!("Download failed: {}", e),
            });
            return Err(format!("Download failed: {}", e));
        }
    };

    // Check response status
    if !response.status().is_success() {
        log::error!("Download failed with status: {}", response.status());
        let _ = on_event.send(DownloadEvent::Error {
            message: format!("Download failed: HTTP {}", response.status()),
        });
        return Err(format!("Download failed: HTTP {}", response.status()));
    }

    // Get content length
    let content_length = response.content_length();
    log::info!("Download started, content length: {:?}", content_length);

    // Send started event
    let _ = on_event.send(DownloadEvent::Started { content_length });

    // Create output file
    let mut file = match File::create(&installer_path) {
        Ok(f) => f,
        Err(e) => {
            log::error!("Failed to create output file: {}", e);
            let _ = on_event.send(DownloadEvent::Error {
                message: format!("Failed to create file: {}", e),
            });
            return Err(format!("Failed to create file: {}", e));
        }
    };

    // Stream download with progress reporting
    let total_bytes = content_length.unwrap_or(0);
    let mut bytes_downloaded: u64 = 0;
    let mut last_progress_percent: u64 = 0;

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
            Ok(c) => c,
            Err(e) => {
                log::error!("Download stream error: {}", e);
                let _ = on_event.send(DownloadEvent::Error {
                    message: format!("Download interrupted: {}", e),
                });
                // Clean up partial file
                let _ = std::fs::remove_file(&installer_path);
                return Err(format!("Download interrupted: {}", e));
            }
        };

        // Write chunk to file
        if let Err(e) = file.write_all(&chunk) {
            log::error!("Failed to write chunk: {}", e);
            let _ = on_event.send(DownloadEvent::Error {
                message: format!("Failed to write file: {}", e),
            });
            // Clean up partial file
            let _ = std::fs::remove_file(&installer_path);
            return Err(format!("Failed to write file: {}", e));
        }

        bytes_downloaded += chunk.len() as u64;

        // Report progress every 1% or at least every 100KB
        let current_percent = if total_bytes > 0 {
            (bytes_downloaded * 100) / total_bytes
        } else {
            0
        };

        if current_percent > last_progress_percent || bytes_downloaded % 102400 < chunk.len() as u64
        {
            last_progress_percent = current_percent;
            let _ = on_event.send(DownloadEvent::Progress {
                bytes_downloaded,
                total_bytes,
            });
        }
    }

    // Flush file
    if let Err(e) = file.sync_all() {
        log::error!("Failed to sync file: {}", e);
        let _ = on_event.send(DownloadEvent::Error {
            message: format!("Failed to save file: {}", e),
        });
        return Err(format!("Failed to save file: {}", e));
    }

    log::info!("Download complete: {} bytes", bytes_downloaded);

    // Update state with pending installer path
    let mut state = load_update_state(&app)?;
    state.pending_installer_path = Some(installer_path_str.clone());
    save_update_state(&app, &state)?;

    // Send finished event
    let _ = on_event.send(DownloadEvent::Finished {
        installer_path: installer_path_str.clone(),
    });

    Ok(installer_path_str)
}
