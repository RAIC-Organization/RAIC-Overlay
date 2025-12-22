use log::LevelFilter;
use tauri_plugin_log::{Target, TargetKind};

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
/// - Adds Stdout target when log level is DEBUG or INFO for development visibility
pub fn build_log_plugin(log_level: LevelFilter) -> tauri::plugin::TauriPlugin<tauri::Wry> {
    let mut builder = tauri_plugin_log::Builder::new()
        .level(log_level)
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
