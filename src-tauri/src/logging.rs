use log::LevelFilter;

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
