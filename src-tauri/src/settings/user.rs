//! User settings persistence module
//! @feature 038-settings-panel

use crate::user_settings_types::*;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::RwLock;
use tauri::Emitter;
use tauri::Manager;

const USER_SETTINGS_FILE: &str = "user-settings.json";

/// Cached user settings for quick access by keyboard hook
static USER_SETTINGS: RwLock<Option<UserSettings>> = RwLock::new(None);

/// Get the path to the user settings file
fn get_user_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join(USER_SETTINGS_FILE))
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

/// Load user settings from disk
#[tauri::command]
pub async fn load_user_settings(app: tauri::AppHandle) -> Result<LoadUserSettingsResult, String> {
    let path = get_user_settings_path(&app)?;

    if !path.exists() {
        log::debug!("User settings file not found, using defaults");
        return Ok(LoadUserSettingsResult {
            success: true,
            settings: None,
            error: None,
        });
    }

    let mut file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            log::warn!("Failed to open user settings: {}", e);
            return Ok(LoadUserSettingsResult {
                success: false,
                settings: None,
                error: Some(format!("Failed to open settings: {}", e)),
            });
        }
    };

    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        log::warn!("Failed to read user settings: {}", e);
        return Ok(LoadUserSettingsResult {
            success: false,
            settings: None,
            error: Some(format!("Failed to read settings: {}", e)),
        });
    }

    let settings: UserSettings = match serde_json::from_str(&contents) {
        Ok(s) => s,
        Err(e) => {
            log::warn!("Failed to parse user settings: {}", e);
            return Ok(LoadUserSettingsResult {
                success: false,
                settings: None,
                error: Some(format!("Failed to parse settings: {}", e)),
            });
        }
    };

    // Cache settings for keyboard hook access
    if let Ok(mut cache) = USER_SETTINGS.write() {
        *cache = Some(settings.clone());
    }

    log::info!("User settings loaded successfully");
    Ok(LoadUserSettingsResult {
        success: true,
        settings: Some(settings),
        error: None,
    })
}

/// Save user settings to disk (atomic write via temp file)
#[tauri::command]
pub async fn save_user_settings(
    app: tauri::AppHandle,
    settings: UserSettings,
) -> Result<SaveUserSettingsResult, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    // Ensure directory exists
    fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create directory: {}", e))?;

    let path = data_dir.join(USER_SETTINGS_FILE);
    let temp_path = path.with_extension("json.tmp");

    // Serialize settings
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Serialization failed: {}", e))?;

    // Write to temp file first (atomic write pattern)
    let mut file =
        File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write: {}", e))?;

    file.sync_all()
        .map_err(|e| format!("Failed to sync: {}", e))?;

    // Atomic rename
    fs::rename(&temp_path, &path).map_err(|e| format!("Failed to rename: {}", e))?;

    // Update cache
    if let Ok(mut cache) = USER_SETTINGS.write() {
        *cache = Some(settings);
    }

    log::info!("User settings saved successfully");
    Ok(SaveUserSettingsResult {
        success: true,
        error: None,
    })
}

/// T008: Get cached hotkey settings for keyboard hook integration
/// Returns default settings if none cached
pub fn get_hotkey_settings() -> HotkeySettings {
    USER_SETTINGS
        .read()
        .ok()
        .and_then(|s| s.as_ref().map(|s| s.hotkeys.clone()))
        .unwrap_or_default()
}

/// Get the start_minimized preference from cached settings
/// @feature 054-settings-panel-startup
/// Returns false (show Settings on startup) if not set or on error
pub fn get_start_minimized() -> bool {
    USER_SETTINGS
        .read()
        .ok()
        .and_then(|s| s.as_ref().map(|s| s.start_minimized))
        .unwrap_or(false)
}

/// Initialize user settings cache on startup
pub fn init_user_settings(app: &tauri::AppHandle) {
    let path = match get_user_settings_path(app) {
        Ok(p) => p,
        Err(e) => {
            log::warn!("Could not get user settings path: {}", e);
            return;
        }
    };

    if !path.exists() {
        log::debug!("No user settings file, using defaults");
        if let Ok(mut cache) = USER_SETTINGS.write() {
            *cache = Some(UserSettings::default());
        }
        return;
    }

    match File::open(&path) {
        Ok(mut file) => {
            let mut contents = String::new();
            if file.read_to_string(&mut contents).is_ok() {
                if let Ok(settings) = serde_json::from_str::<UserSettings>(&contents) {
                    if let Ok(mut cache) = USER_SETTINGS.write() {
                        *cache = Some(settings);
                    }
                    log::info!("User settings cached on startup");
                    return;
                }
            }
        }
        Err(e) => {
            log::warn!("Failed to open user settings on startup: {}", e);
        }
    }

    // Fall back to defaults
    if let Ok(mut cache) = USER_SETTINGS.write() {
        *cache = Some(UserSettings::default());
    }
}

/// T023-T024: Update hotkey bindings at runtime
/// This updates the cached settings so the keyboard hook uses the new bindings
/// @feature 042-sync-webview-hotkeys: Now emits hotkeys-updated event for frontend sync
#[tauri::command]
pub fn update_hotkeys(app: tauri::AppHandle, hotkeys: HotkeySettings) -> Result<(), String> {
    if let Ok(mut cache) = USER_SETTINGS.write() {
        if let Some(ref mut settings) = *cache {
            settings.hotkeys = hotkeys.clone();
            log::info!(
                "Hotkeys updated: visibility={}/{}, mode={}/{}",
                settings.hotkeys.toggle_visibility.key,
                settings.hotkeys.toggle_visibility.key_code,
                settings.hotkeys.toggle_mode.key,
                settings.hotkeys.toggle_mode.key_code
            );
        } else {
            // No settings cached, create with new hotkeys
            let mut new_settings = UserSettings::default();
            new_settings.hotkeys = hotkeys.clone();
            *cache = Some(new_settings);
            log::info!("Hotkeys initialized with new bindings");
        }
    } else {
        return Err("Failed to acquire settings lock".to_string());
    }

    // Emit event to frontend for real-time sync
    // @feature 042-sync-webview-hotkeys
    app.emit("hotkeys-updated", &hotkeys)
        .map_err(|e| format!("Failed to emit hotkeys-updated event: {}", e))?;

    log::info!("Hotkeys update event emitted to frontend");
    Ok(())
}
