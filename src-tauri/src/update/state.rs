//! T007 (049): Update state persistence module
//! @see specs/049-auto-update/data-model.md

use super::types::UpdateState;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

const UPDATE_STATE_FILE: &str = "update-state.json";
const DOWNLOADS_DIR: &str = "downloads";

/// Get the application data directory path.
fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

/// Get the downloads directory path (creates if needed).
pub fn get_downloads_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = get_app_data_dir(app)?;
    let downloads_dir = data_dir.join(DOWNLOADS_DIR);

    if !downloads_dir.exists() {
        fs::create_dir_all(&downloads_dir)
            .map_err(|e| format!("Failed to create downloads directory: {}", e))?;
    }

    Ok(downloads_dir)
}

/// Atomically write content to a file using temp file + rename pattern.
fn atomic_write(path: &PathBuf, content: &[u8]) -> Result<(), String> {
    let temp_path = path.with_extension("json.tmp");

    let mut file =
        File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;

    file.sync_all()
        .map_err(|e| format!("Failed to sync file: {}", e))?;

    fs::rename(&temp_path, path).map_err(|e| format!("Failed to rename temp file: {}", e))?;

    Ok(())
}

/// Load the update state from disk.
pub fn load_update_state(app: &tauri::AppHandle) -> Result<UpdateState, String> {
    let data_dir = get_app_data_dir(app)?;
    let state_path = data_dir.join(UPDATE_STATE_FILE);

    if !state_path.exists() {
        return Ok(UpdateState::default());
    }

    let mut file =
        File::open(&state_path).map_err(|e| format!("Failed to open update state file: {}", e))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read update state file: {}", e))?;

    serde_json::from_str(&contents).map_err(|e| format!("Invalid update state JSON: {}", e))
}

/// Save the update state to disk.
pub fn save_update_state(app: &tauri::AppHandle, state: &UpdateState) -> Result<(), String> {
    let data_dir = get_app_data_dir(app)?;

    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Failed to create state directory: {}", e))?;
    }

    let state_path = data_dir.join(UPDATE_STATE_FILE);

    let json = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize update state: {}", e))?;

    atomic_write(&state_path, json.as_bytes())
}

/// T015 (049): Clean up old installer files on startup.
/// Deletes any MSI files in the downloads directory.
#[tauri::command]
pub async fn cleanup_old_installers(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("Cleaning up old installer files");

    // Load current state to get pending installer path
    let mut state = load_update_state(&app)?;

    // Clean up pending installer if it exists
    if let Some(ref pending_path) = state.pending_installer_path {
        let path = PathBuf::from(pending_path);
        if path.exists() {
            if let Err(e) = fs::remove_file(&path) {
                log::warn!("Failed to delete pending installer {}: {}", pending_path, e);
            } else {
                log::info!("Deleted pending installer: {}", pending_path);
            }
        }
        state.pending_installer_path = None;
        save_update_state(&app, &state)?;
    }

    // Clean up any other MSI files in downloads directory
    let downloads_dir = match get_downloads_dir(&app) {
        Ok(d) => d,
        Err(_) => return Ok(()), // No downloads dir, nothing to clean
    };

    if let Ok(entries) = fs::read_dir(&downloads_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy().to_lowercase() == "msi" {
                    if let Err(e) = fs::remove_file(&path) {
                        log::warn!("Failed to delete old installer {:?}: {}", path, e);
                    } else {
                        log::info!("Deleted old installer: {:?}", path);
                    }
                }
            }
        }
    }

    Ok(())
}

/// T029 (049): Dismiss an update notification.
/// Updates last_notified_version so the same version won't show again in this session.
#[tauri::command]
pub async fn dismiss_update(app: tauri::AppHandle, version: String) -> Result<(), String> {
    log::info!("Dismissing update notification for version: {}", version);

    let mut state = load_update_state(&app)?;
    state.last_notified_version = Some(version);
    save_update_state(&app, &state)?;

    Ok(())
}

/// T030 (049): Get current update state for debugging.
#[tauri::command]
pub async fn get_update_state(app: tauri::AppHandle) -> Result<UpdateState, String> {
    load_update_state(&app)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_state_default() {
        let state = UpdateState::default();
        assert!(state.last_check_timestamp.is_none());
        assert!(state.last_notified_version.is_none());
        assert!(state.pending_installer_path.is_none());
    }

    #[test]
    fn test_update_state_serialization() {
        let state = UpdateState {
            last_check_timestamp: Some("2026-01-02T10:00:00Z".to_string()),
            last_notified_version: Some("1.2.0".to_string()),
            pending_installer_path: None,
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("lastCheckTimestamp"));
        assert!(json.contains("2026-01-02T10:00:00Z"));

        let parsed: UpdateState = serde_json::from_str(&json).unwrap();
        assert_eq!(
            parsed.last_check_timestamp,
            Some("2026-01-02T10:00:00Z".to_string())
        );
    }
}
