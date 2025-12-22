use crate::logging_types::CleanupResult;
use log::LevelFilter;
use std::fs;
use std::time::{Duration, SystemTime};
use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

/// 10MB max file size before rotation
const MAX_FILE_SIZE: u128 = 10_000_000;

/// 7 days retention period
const RETENTION_DAYS: u64 = 7;

/// Parse log level from RAIC_LOG_LEVEL environment variable.
/// Defaults to Warn if not set or invalid.
pub fn get_log_level() -> LevelFilter {
    std::env::var("RAIC_LOG_LEVEL")
        .ok()
        .and_then(|s| match s.to_uppercase().as_str() {
            "TRACE" => Some(LevelFilter::Trace),
            "DEBUG" => Some(LevelFilter::Debug),
            "INFO" => Some(LevelFilter::Info),
            "WARN" => Some(LevelFilter::Warn),
            "ERROR" => Some(LevelFilter::Error),
            _ => None,
        })
        .unwrap_or(LevelFilter::Warn)
}

/// Build the logging plugin with configured targets.
/// - Always logs to file in app log directory
/// - 10MB max file size with KeepAll rotation strategy
/// - Adds Stdout target when log level is DEBUG or INFO for development visibility
pub fn build_log_plugin(log_level: LevelFilter) -> tauri::plugin::TauriPlugin<tauri::Wry> {
    let mut builder = tauri_plugin_log::Builder::new()
        .level(log_level)
        .max_file_size(MAX_FILE_SIZE)
        .rotation_strategy(RotationStrategy::KeepAll)
        // Always log to file in app log directory
        .target(Target::new(TargetKind::LogDir {
            file_name: Some("app".to_string()),
        }));

    // Add Stdout target for development (DEBUG or INFO levels)
    if log_level <= LevelFilter::Info {
        builder = builder.target(Target::new(TargetKind::Stdout));
    }

    builder.build()
}

/// Get the path to the current active log file.
#[tauri::command]
pub fn get_log_file_path(app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory: {}", e))?;

    let log_path = log_dir.join("app.log");
    Ok(log_path.to_string_lossy().to_string())
}

/// Delete log files older than the retention period (7 days).
/// Called on app startup to clean up old logs.
#[tauri::command]
pub fn cleanup_old_logs(app: tauri::AppHandle) -> Result<CleanupResult, String> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get log directory: {}", e))?;

    // If log directory doesn't exist, nothing to clean up
    if !log_dir.exists() {
        return Ok(CleanupResult {
            deleted_count: 0,
            freed_bytes: 0,
            errors: vec![],
        });
    }

    let cutoff = SystemTime::now() - Duration::from_secs(RETENTION_DAYS * 24 * 60 * 60);

    let mut deleted_count = 0u32;
    let mut freed_bytes = 0u64;
    let mut errors = Vec::new();

    // Read directory entries
    let entries = match fs::read_dir(&log_dir) {
        Ok(e) => e,
        Err(e) => {
            return Err(format!("Failed to read log directory: {}", e));
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();

        // Only process log files (app.log, app.log.1, etc.)
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if !file_name.starts_with("app.log") {
            continue;
        }

        // Skip the current active log file
        if file_name == "app.log" {
            continue;
        }

        // Check file modification time
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(e) => {
                errors.push(format!("Failed to get metadata for {}: {}", file_name, e));
                continue;
            }
        };

        let modified = match metadata.modified() {
            Ok(m) => m,
            Err(e) => {
                errors.push(format!(
                    "Failed to get modification time for {}: {}",
                    file_name, e
                ));
                continue;
            }
        };

        // Delete if older than cutoff
        if modified < cutoff {
            let file_size = metadata.len();
            if let Err(e) = fs::remove_file(&path) {
                errors.push(format!("Failed to delete {}: {}", file_name, e));
            } else {
                deleted_count += 1;
                freed_bytes += file_size;
                log::info!("Deleted old log file: {}", file_name);
            }
        }
    }

    if deleted_count > 0 {
        log::info!(
            "Log cleanup complete: deleted {} files, freed {} bytes",
            deleted_count,
            freed_bytes
        );
    }

    Ok(CleanupResult {
        deleted_count,
        freed_bytes,
        errors,
    })
}
