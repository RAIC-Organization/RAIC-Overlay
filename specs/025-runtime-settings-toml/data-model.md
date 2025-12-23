# Data Model: Runtime Settings System

**Feature**: 025-runtime-settings-toml
**Date**: 2025-12-23

## Entities

### FileSettings

Represents the optional settings parsed from the `settings.toml` file. All fields are optional to allow partial configuration.

```rust
/// Settings parsed from settings.toml file
/// All fields are optional - missing values fall back to compile-time defaults
#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default)]
pub struct FileSettings {
    /// Window title pattern for overlay attachment
    pub target_window_name: Option<String>,

    /// Enable debug border around overlay
    pub debug_border: Option<bool>,

    /// Logging verbosity level (TRACE, DEBUG, INFO, WARN, ERROR)
    pub log_level: Option<String>,
}
```

**Validation Rules**:
- `target_window_name`: Any non-empty string; empty string treated as missing
- `debug_border`: Boolean (`true` or `false`)
- `log_level`: One of: `"TRACE"`, `"DEBUG"`, `"INFO"`, `"WARN"`, `"ERROR"` (case-insensitive)

### RuntimeSettings

Represents the resolved configuration with all values guaranteed to be present (either from file or defaults).

```rust
/// Fully resolved runtime settings
/// All fields are guaranteed to have valid values
#[derive(Debug, Clone)]
pub struct RuntimeSettings {
    /// Window title pattern for overlay attachment
    pub target_window_name: String,

    /// Enable debug border around overlay
    pub debug_border: bool,

    /// Logging verbosity level
    pub log_level: log::LevelFilter,

    /// Source of each setting for logging
    pub sources: SettingsSources,
}

/// Tracks where each setting value came from
#[derive(Debug, Clone)]
pub struct SettingsSources {
    pub target_window_name: SettingSource,
    pub debug_border: SettingSource,
    pub log_level: SettingSource,
}

/// Indicates the origin of a setting value
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SettingSource {
    /// Value from settings.toml file
    File,
    /// Value from compile-time default (.env)
    Default,
}
```

### SettingsConfig (Tauri Command Response)

Serializable response for frontend queries.

```rust
/// Settings configuration exposed to frontend
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
```

## TOML File Schema

### settings.toml

```toml
# RAIC Overlay Runtime Settings
# Place this file next to the executable to override build-time defaults.
# All settings are optional - omit any to use the default value.

# Target window name pattern for overlay attachment
# The overlay will attach to windows containing this string in their title
# Default: (from build-time .env file)
target_window_name = "Star Citizen"

# Enable debug border to visualize window boundaries
# Set to true to show a red border around the overlay
# Default: false
debug_border = false

# Logging verbosity level
# Values: TRACE, DEBUG, INFO, WARN, ERROR
# DEBUG/INFO also enable console output; WARN/ERROR only log to file
# Default: WARN
log_level = "WARN"
```

## State Transitions

### Settings Loading Flow

```
┌─────────────────┐
│   App Startup   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Get executable directory path   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Check if settings.toml exists │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 EXISTS    NOT EXISTS
    │         │
    ▼         │
┌───────────┐ │
│ Read file │ │
└─────┬─────┘ │
      │       │
      ▼       │
┌───────────────────┐
│ Parse TOML        │
└─────┬─────────────┘
      │
   ┌──┴──┐
   │     │
   ▼     ▼
VALID  INVALID ──────┐
   │                 │
   ▼                 │
┌───────────────┐    │
│ FileSettings  │    │
│ (partial)     │    │
└───────┬───────┘    │
        │            │
        ▼            ▼
┌─────────────────────────────────────┐
│  Merge with compile-time defaults   │
│  (per-field fallback)               │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Log each setting's source (INFO)   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Return RuntimeSettings             │
└─────────────────────────────────────┘
```

## Compile-Time Defaults

Embedded via `build.rs` using `cargo:rustc-env`:

| Setting | Environment Variable | Default Value |
|---------|---------------------|---------------|
| `target_window_name` | `TARGET_WINDOW_NAME` | (required in .env) |
| `debug_border` | `VITE_DEBUG_BORDER` | `false` |
| `log_level` | `RAIC_LOG_LEVEL` | `WARN` |

## Log Level Mapping

| String Value | log::LevelFilter |
|--------------|------------------|
| `"TRACE"` | `LevelFilter::Trace` |
| `"DEBUG"` | `LevelFilter::Debug` |
| `"INFO"` | `LevelFilter::Info` |
| `"WARN"` | `LevelFilter::Warn` |
| `"ERROR"` | `LevelFilter::Error` |
| (invalid) | Falls back to default |

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| `settings.toml` | `{exe_dir}/settings.toml` | User configuration |
| `settings.example.toml` | `{exe_dir}/settings.example.toml` | Documented template |
| `.env` | Project root (build-time) | Default values source |
