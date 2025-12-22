//! Persistence Module for State Persistence System
//!
//! Provides Tauri commands for loading, saving, and deleting persisted state.
//! All file operations use atomic writes (temp file + rename) to prevent corruption.
//!
//! @feature 010-state-persistence-system

use crate::persistence_types::*;
use log::{error, info};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

const STATE_FILE: &str = "state.json";
const WINDOW_FILE_PREFIX: &str = "window-";

/// Get the application data directory path.
fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

/// Atomically write content to a file using temp file + rename pattern.
/// This prevents corruption if the process crashes during write.
fn atomic_write(path: &PathBuf, content: &[u8]) -> Result<(), String> {
    let temp_path = path.with_extension("json.tmp");

    // Write to temp file
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(content)
        .map_err(|e| format!("Failed to write to temp file: {}", e))?;

    // Ensure data is flushed to disk
    file.sync_all()
        .map_err(|e| format!("Failed to sync file: {}", e))?;

    // Atomic rename (atomic on POSIX and Windows NTFS)
    fs::rename(&temp_path, path)
        .map_err(|e| format!("Failed to rename temp file: {}", e))?;

    Ok(())
}

/// Load the persisted state from disk on application startup.
///
/// Returns the main state file and all window content files.
/// If no state file exists, returns empty result (not an error).
#[tauri::command]
pub async fn load_state(app: tauri::AppHandle) -> Result<LoadStateResult, String> {
    let data_dir = get_app_data_dir(&app)?;
    let state_path = data_dir.join(STATE_FILE);

    // If no state file exists, return empty result
    if !state_path.exists() {
        return Ok(LoadStateResult {
            success: true,
            state: None,
            window_contents: vec![],
            error: None,
        });
    }

    // Read and parse state file
    let mut file = match File::open(&state_path) {
        Ok(f) => f,
        Err(e) => {
            error!("Failed to open state file: {}", e);
            return Ok(LoadStateResult {
                success: false,
                state: None,
                window_contents: vec![],
                error: Some(format!("Failed to open state file: {}", e)),
            });
        }
    };

    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        error!("Failed to read state file: {}", e);
        return Ok(LoadStateResult {
            success: false,
            state: None,
            window_contents: vec![],
            error: Some(format!("Failed to read state file: {}", e)),
        });
    }

    let state: PersistedState = match serde_json::from_str(&contents) {
        Ok(s) => s,
        Err(e) => {
            error!("Invalid state JSON: {}", e);
            return Ok(LoadStateResult {
                success: false,
                state: None,
                window_contents: vec![],
                error: Some(format!("Invalid state JSON: {}", e)),
            });
        }
    };

    // Load window content files for each window in state
    let mut window_contents = Vec::new();
    for window in &state.windows {
        let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window.id));
        if content_path.exists() {
            if let Ok(mut file) = File::open(&content_path) {
                let mut content_str = String::new();
                if file.read_to_string(&mut content_str).is_ok() {
                    if let Ok(content) = serde_json::from_str::<WindowContentFile>(&content_str) {
                        window_contents.push(content);
                    } else {
                        log::warn!("Failed to parse window content file: {}", content_path.display());
                    }
                }
            }
        }
    }

    // Cleanup: delete orphaned window content files not referenced in state
    if let Ok(entries) = fs::read_dir(&data_dir) {
        let valid_ids: std::collections::HashSet<_> = state.windows.iter().map(|w| w.id.as_str()).collect();

        for entry in entries.flatten() {
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();

            // Check for orphaned window-*.json files
            if file_name_str.starts_with(WINDOW_FILE_PREFIX) && file_name_str.ends_with(".json") && !file_name_str.ends_with(".json.tmp") {
                // Extract window ID from filename
                let id = file_name_str
                    .strip_prefix(WINDOW_FILE_PREFIX)
                    .and_then(|s| s.strip_suffix(".json"));

                if let Some(id) = id {
                    if !valid_ids.contains(id) {
                        // Orphaned file - delete it
                        let orphan_path = entry.path();
                        if let Err(e) = fs::remove_file(&orphan_path) {
                            log::warn!("Failed to delete orphaned file {}: {}", orphan_path.display(), e);
                        }
                    }
                }
            }

            // Clean up temp files from failed atomic writes
            if file_name_str.ends_with(".json.tmp") {
                let temp_path = entry.path();
                if let Err(e) = fs::remove_file(&temp_path) {
                    log::warn!("Failed to delete temp file {}: {}", temp_path.display(), e);
                }
            }
        }
    }

    Ok(LoadStateResult {
        success: true,
        state: Some(state),
        window_contents,
        error: None,
    })
}

/// Save the main state file (global settings + window structure).
///
/// Does not save window content - use save_window_content for that.
#[tauri::command]
pub async fn save_state(
    app: tauri::AppHandle,
    state: PersistedState,
) -> Result<SaveResult, String> {
    let data_dir = get_app_data_dir(&app)?;

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&data_dir) {
        error!("Failed to create state directory: {}", e);
        return Ok(SaveResult {
            success: false,
            error: Some(format!("Failed to create directory: {}", e)),
        });
    }

    let state_path = data_dir.join(STATE_FILE);

    let json = match serde_json::to_string_pretty(&state) {
        Ok(j) => j,
        Err(e) => {
            error!("Failed to serialize state: {}", e);
            return Ok(SaveResult {
                success: false,
                error: Some(format!("Serialization failed: {}", e)),
            });
        }
    };

    if let Err(e) = atomic_write(&state_path, json.as_bytes()) {
        error!("Failed to write state file: {}", e);
        return Ok(SaveResult {
            success: false,
            error: Some(e),
        });
    }

    info!("State saved successfully");
    Ok(SaveResult {
        success: true,
        error: None,
    })
}

/// Save content for a specific window to its individual file.
#[tauri::command]
pub async fn save_window_content(
    app: tauri::AppHandle,
    window_id: String,
    content: WindowContentFile,
) -> Result<SaveResult, String> {
    // Validate window_id matches content
    if window_id != content.window_id {
        return Ok(SaveResult {
            success: false,
            error: Some("Window ID mismatch".to_string()),
        });
    }

    let data_dir = get_app_data_dir(&app)?;

    // Ensure directory exists
    if let Err(e) = fs::create_dir_all(&data_dir) {
        return Ok(SaveResult {
            success: false,
            error: Some(format!("Failed to create directory: {}", e)),
        });
    }

    let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window_id));

    let json = match serde_json::to_string_pretty(&content) {
        Ok(j) => j,
        Err(e) => {
            return Ok(SaveResult {
                success: false,
                error: Some(format!("Serialization failed: {}", e)),
            });
        }
    };

    if let Err(e) = atomic_write(&content_path, json.as_bytes()) {
        return Ok(SaveResult {
            success: false,
            error: Some(e),
        });
    }

    Ok(SaveResult {
        success: true,
        error: None,
    })
}

/// Delete the content file for a closed window.
#[tauri::command]
pub async fn delete_window_content(
    app: tauri::AppHandle,
    window_id: String,
) -> Result<DeleteResult, String> {
    let data_dir = get_app_data_dir(&app)?;
    let content_path = data_dir.join(format!("{}{}.json", WINDOW_FILE_PREFIX, window_id));

    if !content_path.exists() {
        return Ok(DeleteResult {
            success: true,
            existed: false,
            error: None,
        });
    }

    if let Err(e) = fs::remove_file(&content_path) {
        return Ok(DeleteResult {
            success: false,
            existed: true,
            error: Some(format!("Failed to delete: {}", e)),
        });
    }

    Ok(DeleteResult {
        success: true,
        existed: true,
        error: None,
    })
}
