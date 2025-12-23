// T004-T012: Runtime settings module for loading configuration from settings.toml
//
// This module provides runtime configuration from a settings.toml file located next to
// the executable. All settings have graceful fallback to compile-time defaults.

use log::LevelFilter;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::OnceLock;

/// Global settings cache - initialized once at startup
static SETTINGS: OnceLock<RuntimeSettings> = OnceLock::new();

// ============================================================================
// T004: Settings Types
// ============================================================================

/// Settings parsed from settings.toml file.
/// All fields are optional - missing values fall back to compile-time defaults.
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct FileSettings {
    /// Window title pattern for overlay attachment
    pub target_window_name: Option<String>,

    /// Enable debug border around overlay
    pub debug_border: Option<bool>,

    /// Logging verbosity level (TRACE, DEBUG, INFO, WARN, ERROR)
    pub log_level: Option<String>,

    // T008 (028): Target process name for three-point verification (e.g., "StarCitizen.exe")
    pub target_process_name: Option<String>,

    // T009 (028): Target window class for three-point verification (e.g., "CryENGINE")
    pub target_window_class: Option<String>,

    // T010 (028): Polling interval for process monitoring in milliseconds (default: 1000)
    pub process_monitor_interval_ms: Option<u64>,
}

// T011 (028): Default constants for Star Citizen window detection
pub const DEFAULT_PROCESS_NAME: &str = "StarCitizen.exe";
pub const DEFAULT_WINDOW_CLASS: &str = "CryENGINE";
pub const DEFAULT_PROCESS_MONITOR_INTERVAL_MS: u64 = 1000;

/// Fully resolved runtime settings.
/// All fields are guaranteed to have valid values (either from file or defaults).
#[derive(Debug, Clone)]
pub struct RuntimeSettings {
    /// Window title pattern for overlay attachment
    pub target_window_name: String,

    /// Enable debug border around overlay
    pub debug_border: bool,

    /// Logging verbosity level
    pub log_level: LevelFilter,

    // T008 (028): Target process name for three-point verification
    pub target_process_name: String,

    // T009 (028): Target window class for three-point verification
    pub target_window_class: String,

    // T010 (028): Polling interval for process monitoring
    pub process_monitor_interval_ms: u64,

    /// Source of each setting for logging
    pub sources: SettingsSources,
}

/// Tracks where each setting value came from
#[derive(Debug, Clone)]
pub struct SettingsSources {
    pub target_window_name: SettingSource,
    pub debug_border: SettingSource,
    pub log_level: SettingSource,
    pub target_process_name: SettingSource,
    pub target_window_class: SettingSource,
    pub process_monitor_interval_ms: SettingSource,
}

/// Indicates the origin of a setting value
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SettingSource {
    /// Value from settings.toml file
    File,
    /// Value from compile-time default (.env)
    Default,
}

impl std::fmt::Display for SettingSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SettingSource::File => write!(f, "settings.toml"),
            SettingSource::Default => write!(f, "default"),
        }
    }
}

/// Settings configuration exposed to frontend via Tauri command
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsConfig {
    /// Target window name pattern
    pub target_window_name: String,

    /// Debug border enabled
    pub debug_border: bool,

    /// Log level as string
    pub log_level: String,
}

// ============================================================================
// T005: Get settings path
// ============================================================================

/// Get the path to settings.toml next to the executable.
pub fn get_settings_path() -> Option<PathBuf> {
    std::env::current_exe()
        .ok()?
        .parent()?
        .join("settings.toml")
        .into()
}

// ============================================================================
// T006: Load file settings
// ============================================================================

/// Load and parse settings.toml file.
/// Returns FileSettings with all None values if file doesn't exist or can't be parsed.
pub fn load_file_settings() -> FileSettings {
    let Some(path) = get_settings_path() else {
        log::debug!("Could not determine settings.toml path");
        return FileSettings::default();
    };

    // Check if file exists
    if !path.exists() {
        log::debug!("settings.toml not found at {:?}", path);
        return FileSettings::default();
    }

    // Read file contents
    let contents = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            log::warn!("Failed to read settings.toml: {}", e);
            return FileSettings::default();
        }
    };

    // Parse TOML
    match toml::from_str(&contents) {
        Ok(settings) => {
            log::debug!("Successfully parsed settings.toml");
            settings
        }
        Err(e) => {
            log::warn!("Failed to parse settings.toml: {}", e);
            log::warn!("Using default settings");
            FileSettings::default()
        }
    }
}

// ============================================================================
// T007: RuntimeSettings from FileSettings
// ============================================================================

impl RuntimeSettings {
    /// Create RuntimeSettings by merging FileSettings with compile-time defaults.
    pub fn from_file_settings(file: FileSettings) -> Self {
        let mut sources = SettingsSources {
            target_window_name: SettingSource::Default,
            debug_border: SettingSource::Default,
            log_level: SettingSource::Default,
            target_process_name: SettingSource::Default,
            target_window_class: SettingSource::Default,
            process_monitor_interval_ms: SettingSource::Default,
        };

        // target_window_name
        let target_window_name = match file.target_window_name {
            Some(ref name) if !name.is_empty() => {
                sources.target_window_name = SettingSource::File;
                name.clone()
            }
            _ => env!("TARGET_WINDOW_NAME").to_string(),
        };

        // debug_border
        let debug_border = match file.debug_border {
            Some(value) => {
                sources.debug_border = SettingSource::File;
                value
            }
            None => env!("VITE_DEBUG_BORDER") == "true",
        };

        // log_level
        let log_level = match file.log_level {
            Some(ref level) => {
                match parse_log_level(level) {
                    Some(parsed) => {
                        sources.log_level = SettingSource::File;
                        parsed
                    }
                    None => {
                        log::warn!(
                            "Invalid log_level '{}' in settings.toml, using default",
                            level
                        );
                        parse_log_level(env!("RAIC_LOG_LEVEL")).unwrap_or(LevelFilter::Warn)
                    }
                }
            }
            None => parse_log_level(env!("RAIC_LOG_LEVEL")).unwrap_or(LevelFilter::Warn),
        };

        // T008 (028): target_process_name
        let target_process_name = match file.target_process_name {
            Some(ref name) if !name.is_empty() => {
                sources.target_process_name = SettingSource::File;
                name.clone()
            }
            _ => DEFAULT_PROCESS_NAME.to_string(),
        };

        // T009 (028): target_window_class
        let target_window_class = match file.target_window_class {
            Some(ref class) if !class.is_empty() => {
                sources.target_window_class = SettingSource::File;
                class.clone()
            }
            _ => DEFAULT_WINDOW_CLASS.to_string(),
        };

        // T010 (028): process_monitor_interval_ms
        let process_monitor_interval_ms = match file.process_monitor_interval_ms {
            Some(interval) if interval > 0 => {
                sources.process_monitor_interval_ms = SettingSource::File;
                interval
            }
            _ => DEFAULT_PROCESS_MONITOR_INTERVAL_MS,
        };

        Self {
            target_window_name,
            debug_border,
            log_level,
            target_process_name,
            target_window_class,
            process_monitor_interval_ms,
            sources,
        }
    }
}

// ============================================================================
// T008: Get settings with OnceLock caching
// ============================================================================

/// Get the runtime settings (cached after first call).
/// This function initializes settings on first call and returns the cached value on subsequent calls.
pub fn get_settings() -> &'static RuntimeSettings {
    SETTINGS.get_or_init(|| {
        let file_settings = load_file_settings();
        let settings = RuntimeSettings::from_file_settings(file_settings);
        log_settings_sources(&settings);
        settings
    })
}

/// Initialize settings without returning a reference.
/// Call this early in startup to ensure settings are loaded before logging is configured.
pub fn init_settings() {
    let _ = get_settings();
}

// ============================================================================
// T009: Log settings sources
// ============================================================================

/// Log the source of each setting at INFO level.
pub fn log_settings_sources(settings: &RuntimeSettings) {
    log::info!("Settings loaded:");
    log::info!(
        "  target_window_name: '{}' (from {})",
        settings.target_window_name,
        settings.sources.target_window_name
    );
    log::info!(
        "  debug_border: {} (from {})",
        settings.debug_border,
        settings.sources.debug_border
    );
    log::info!(
        "  log_level: {:?} (from {})",
        settings.log_level,
        settings.sources.log_level
    );
    log::info!(
        "  target_process_name: '{}' (from {})",
        settings.target_process_name,
        settings.sources.target_process_name
    );
    log::info!(
        "  target_window_class: '{}' (from {})",
        settings.target_window_class,
        settings.sources.target_window_class
    );
    log::info!(
        "  process_monitor_interval_ms: {} (from {})",
        settings.process_monitor_interval_ms,
        settings.sources.process_monitor_interval_ms
    );
}

// ============================================================================
// T012 (028): Accessor functions for new settings
// ============================================================================

/// Get the target process name (e.g., "StarCitizen.exe")
pub fn get_target_process_name() -> &'static str {
    &get_settings().target_process_name
}

/// Get the target window class (e.g., "CryENGINE")
pub fn get_target_window_class() -> &'static str {
    &get_settings().target_window_class
}

/// Get the process monitor polling interval in milliseconds
pub fn get_process_monitor_interval() -> u64 {
    get_settings().process_monitor_interval_ms
}

// ============================================================================
// T022-T023: Tauri commands for frontend settings access
// ============================================================================

/// Get the current settings configuration for frontend access.
#[tauri::command]
pub fn get_settings_command() -> SettingsConfig {
    let settings = get_settings();
    SettingsConfig {
        target_window_name: settings.target_window_name.clone(),
        debug_border: settings.debug_border,
        log_level: format!("{:?}", settings.log_level).to_uppercase(),
    }
}

// ============================================================================
// T033-T034: Settings sources response for debugging
// ============================================================================

/// Response for get_settings_sources command showing where each setting came from.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsSourcesResponse {
    pub target_window_name: String,
    pub debug_border: String,
    pub log_level: String,
    pub settings_path: Option<String>,
}

/// Get information about where each setting value came from (for debugging).
#[tauri::command]
pub fn get_settings_sources() -> SettingsSourcesResponse {
    let settings = get_settings();
    SettingsSourcesResponse {
        target_window_name: settings.sources.target_window_name.to_string(),
        debug_border: settings.sources.debug_border.to_string(),
        log_level: settings.sources.log_level.to_string(),
        settings_path: get_settings_path().map(|p| p.to_string_lossy().to_string()),
    }
}

// ============================================================================
// T027-T028: Log level parsing
// ============================================================================

/// Parse a string to a log level filter.
/// Returns None for invalid values.
pub fn parse_log_level(s: &str) -> Option<LevelFilter> {
    match s.to_uppercase().as_str() {
        "TRACE" => Some(LevelFilter::Trace),
        "DEBUG" => Some(LevelFilter::Debug),
        "INFO" => Some(LevelFilter::Info),
        "WARN" => Some(LevelFilter::Warn),
        "ERROR" => Some(LevelFilter::Error),
        _ => None,
    }
}

// ============================================================================
// T012: Unit tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_log_level_valid() {
        assert_eq!(parse_log_level("TRACE"), Some(LevelFilter::Trace));
        assert_eq!(parse_log_level("DEBUG"), Some(LevelFilter::Debug));
        assert_eq!(parse_log_level("INFO"), Some(LevelFilter::Info));
        assert_eq!(parse_log_level("WARN"), Some(LevelFilter::Warn));
        assert_eq!(parse_log_level("ERROR"), Some(LevelFilter::Error));
    }

    #[test]
    fn test_parse_log_level_case_insensitive() {
        assert_eq!(parse_log_level("trace"), Some(LevelFilter::Trace));
        assert_eq!(parse_log_level("Debug"), Some(LevelFilter::Debug));
        assert_eq!(parse_log_level("info"), Some(LevelFilter::Info));
        assert_eq!(parse_log_level("WaRn"), Some(LevelFilter::Warn));
        assert_eq!(parse_log_level("error"), Some(LevelFilter::Error));
    }

    #[test]
    fn test_parse_log_level_invalid() {
        assert_eq!(parse_log_level("VERBOSE"), None);
        assert_eq!(parse_log_level(""), None);
        assert_eq!(parse_log_level("invalid"), None);
    }

    #[test]
    fn test_file_settings_default() {
        let settings = FileSettings::default();
        assert!(settings.target_window_name.is_none());
        assert!(settings.debug_border.is_none());
        assert!(settings.log_level.is_none());
    }

    #[test]
    fn test_file_settings_parse_valid_toml() {
        let toml = r#"
target_window_name = "Notepad"
debug_border = true
log_level = "DEBUG"
"#;
        let settings: FileSettings = toml::from_str(toml).unwrap();
        assert_eq!(settings.target_window_name, Some("Notepad".to_string()));
        assert_eq!(settings.debug_border, Some(true));
        assert_eq!(settings.log_level, Some("DEBUG".to_string()));
    }

    #[test]
    fn test_file_settings_parse_partial_toml() {
        let toml = r#"
log_level = "INFO"
"#;
        let settings: FileSettings = toml::from_str(toml).unwrap();
        assert!(settings.target_window_name.is_none());
        assert!(settings.debug_border.is_none());
        assert_eq!(settings.log_level, Some("INFO".to_string()));
    }

    #[test]
    fn test_file_settings_parse_empty_toml() {
        let toml = "";
        let settings: FileSettings = toml::from_str(toml).unwrap();
        assert!(settings.target_window_name.is_none());
        assert!(settings.debug_border.is_none());
        assert!(settings.log_level.is_none());
    }

    #[test]
    fn test_setting_source_display() {
        assert_eq!(format!("{}", SettingSource::File), "settings.toml");
        assert_eq!(format!("{}", SettingSource::Default), "default");
    }

    #[test]
    fn test_runtime_settings_from_file_settings_with_values() {
        let file = FileSettings {
            target_window_name: Some("Test Window".to_string()),
            debug_border: Some(true),
            log_level: Some("DEBUG".to_string()),
            target_process_name: None,
            target_window_class: None,
            process_monitor_interval_ms: None,
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        assert_eq!(runtime.target_window_name, "Test Window");
        assert!(runtime.debug_border);
        assert_eq!(runtime.log_level, LevelFilter::Debug);
        assert_eq!(runtime.sources.target_window_name, SettingSource::File);
        assert_eq!(runtime.sources.debug_border, SettingSource::File);
        assert_eq!(runtime.sources.log_level, SettingSource::File);
    }

    #[test]
    fn test_runtime_settings_from_file_settings_empty() {
        let file = FileSettings::default();
        let runtime = RuntimeSettings::from_file_settings(file);

        // Should use compile-time defaults
        assert!(!runtime.target_window_name.is_empty());
        assert_eq!(runtime.sources.target_window_name, SettingSource::Default);
        assert_eq!(runtime.sources.debug_border, SettingSource::Default);
        assert_eq!(runtime.sources.log_level, SettingSource::Default);
    }

    #[test]
    fn test_runtime_settings_from_file_settings_invalid_log_level() {
        let file = FileSettings {
            log_level: Some("INVALID".to_string()),
            ..Default::default()
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        // Should fall back to default log level
        assert_eq!(runtime.sources.log_level, SettingSource::Default);
    }

    #[test]
    fn test_runtime_settings_from_file_settings_empty_target_window() {
        let file = FileSettings {
            target_window_name: Some("".to_string()),
            ..Default::default()
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        // Empty string should fall back to default
        assert!(!runtime.target_window_name.is_empty());
        assert_eq!(runtime.sources.target_window_name, SettingSource::Default);
    }

    // ========================================================================
    // T019-T021: User Story 2 - Graceful Fallback Tests
    // ========================================================================

    /// T019: Test that missing file results in default settings
    #[test]
    fn test_missing_file_uses_defaults() {
        // FileSettings::default represents the case when no file exists
        let file = FileSettings::default();
        let runtime = RuntimeSettings::from_file_settings(file);

        // All values should come from defaults
        assert!(!runtime.target_window_name.is_empty());
        assert_eq!(runtime.sources.target_window_name, SettingSource::Default);
        assert_eq!(runtime.sources.debug_border, SettingSource::Default);
        assert_eq!(runtime.sources.log_level, SettingSource::Default);
    }

    /// T020: Test partial settings file - only some properties set
    #[test]
    fn test_partial_settings_mixed_sources() {
        let file = FileSettings {
            target_window_name: Some("CustomWindow".to_string()),
            log_level: Some("TRACE".to_string()),
            ..Default::default()
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        // target_window_name from file
        assert_eq!(runtime.target_window_name, "CustomWindow");
        assert_eq!(runtime.sources.target_window_name, SettingSource::File);

        // debug_border from default
        assert_eq!(runtime.sources.debug_border, SettingSource::Default);

        // log_level from file
        assert_eq!(runtime.log_level, LevelFilter::Trace);
        assert_eq!(runtime.sources.log_level, SettingSource::File);
    }

    /// T021: Test malformed TOML falls back to defaults
    #[test]
    fn test_malformed_toml_fallback() {
        // Malformed TOML should fail to parse
        let malformed = r#"
target_window_name = "Missing closing quote
debug_border = not_a_bool
"#;
        let result: Result<FileSettings, _> = toml::from_str(malformed);

        // Parsing should fail
        assert!(result.is_err());

        // When parsing fails, load_file_settings returns default
        // (This simulates what happens in the actual load_file_settings function)
        let fallback = result.unwrap_or_default();
        assert!(fallback.target_window_name.is_none());
        assert!(fallback.debug_border.is_none());
        assert!(fallback.log_level.is_none());
    }

    /// T021: Test TOML with wrong types falls back gracefully
    #[test]
    fn test_toml_wrong_types_fallback() {
        // debug_border should be bool, not string
        let wrong_type = r#"
debug_border = "yes"
"#;
        let result: Result<FileSettings, _> = toml::from_str(wrong_type);

        // Should fail due to type mismatch
        assert!(result.is_err());

        // Fallback to default
        let fallback = result.unwrap_or_default();
        assert!(fallback.debug_border.is_none());
    }

    /// Test that unknown keys are ignored (serde default behavior)
    #[test]
    fn test_unknown_keys_ignored() {
        let toml = r#"
target_window_name = "Test"
unknown_setting = "should be ignored"
another_unknown = 42
"#;
        let settings: FileSettings = toml::from_str(toml).unwrap();
        assert_eq!(settings.target_window_name, Some("Test".to_string()));
        // Should parse successfully, ignoring unknown fields
    }

    // ========================================================================
    // T042: Performance validation
    // ========================================================================

    /// T042: Verify settings loading is fast (< 10ms target)
    #[test]
    fn test_settings_load_performance() {
        use std::time::Instant;

        // Create file settings with all values
        let file = FileSettings {
            target_window_name: Some("Test Window".to_string()),
            debug_border: Some(true),
            log_level: Some("DEBUG".to_string()),
            target_process_name: Some("Test.exe".to_string()),
            target_window_class: Some("TestClass".to_string()),
            process_monitor_interval_ms: Some(500),
        };

        // Measure time to create RuntimeSettings
        let start = Instant::now();
        let _runtime = RuntimeSettings::from_file_settings(file);
        let elapsed = start.elapsed();

        // Should complete in well under 10ms (typically < 1ms)
        assert!(
            elapsed.as_millis() < 10,
            "Settings merge took too long: {:?}",
            elapsed
        );
    }

    // ========================================================================
    // T008-T012 (028): Tests for new window detection settings
    // ========================================================================

    /// Test that new settings fields default correctly
    #[test]
    fn test_new_settings_defaults() {
        let file = FileSettings::default();
        let runtime = RuntimeSettings::from_file_settings(file);

        assert_eq!(runtime.target_process_name, DEFAULT_PROCESS_NAME);
        assert_eq!(runtime.target_window_class, DEFAULT_WINDOW_CLASS);
        assert_eq!(runtime.process_monitor_interval_ms, DEFAULT_PROCESS_MONITOR_INTERVAL_MS);
        assert_eq!(runtime.sources.target_process_name, SettingSource::Default);
        assert_eq!(runtime.sources.target_window_class, SettingSource::Default);
        assert_eq!(runtime.sources.process_monitor_interval_ms, SettingSource::Default);
    }

    /// Test that new settings can be overridden from file
    #[test]
    fn test_new_settings_from_file() {
        let file = FileSettings {
            target_process_name: Some("Custom.exe".to_string()),
            target_window_class: Some("CustomClass".to_string()),
            process_monitor_interval_ms: Some(2000),
            ..Default::default()
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        assert_eq!(runtime.target_process_name, "Custom.exe");
        assert_eq!(runtime.target_window_class, "CustomClass");
        assert_eq!(runtime.process_monitor_interval_ms, 2000);
        assert_eq!(runtime.sources.target_process_name, SettingSource::File);
        assert_eq!(runtime.sources.target_window_class, SettingSource::File);
        assert_eq!(runtime.sources.process_monitor_interval_ms, SettingSource::File);
    }

    /// Test that zero interval falls back to default
    #[test]
    fn test_zero_interval_uses_default() {
        let file = FileSettings {
            process_monitor_interval_ms: Some(0),
            ..Default::default()
        };
        let runtime = RuntimeSettings::from_file_settings(file);

        assert_eq!(runtime.process_monitor_interval_ms, DEFAULT_PROCESS_MONITOR_INTERVAL_MS);
        assert_eq!(runtime.sources.process_monitor_interval_ms, SettingSource::Default);
    }
}
