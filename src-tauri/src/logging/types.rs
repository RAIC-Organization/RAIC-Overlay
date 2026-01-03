use serde::{Deserialize, Serialize};

/// Log level names for serialization to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LogLevelName {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

impl From<log::LevelFilter> for LogLevelName {
    fn from(level: log::LevelFilter) -> Self {
        match level {
            log::LevelFilter::Trace => LogLevelName::Trace,
            log::LevelFilter::Debug => LogLevelName::Debug,
            log::LevelFilter::Info => LogLevelName::Info,
            log::LevelFilter::Warn => LogLevelName::Warn,
            log::LevelFilter::Error => LogLevelName::Error,
            log::LevelFilter::Off => LogLevelName::Error, // Default to Error if Off
        }
    }
}

/// Logging configuration exposed to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub min_level: LogLevelName,
    pub max_file_size: u64,
    pub log_dir: String,
    pub console_output: bool,
}

/// Result of cleanup_old_logs command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub deleted_count: u32,
    pub freed_bytes: u64,
    pub errors: Vec<String>,
}
