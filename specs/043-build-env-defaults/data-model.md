# Data Model: Build-Time Environment Variable Defaults

**Feature**: 043-build-env-defaults
**Date**: 2025-12-31

## Overview

This feature modifies build-time configuration, not runtime data structures. The data model describes the configuration flow and value precedence.

## Configuration Value Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      BUILD TIME                                 │
├─────────────────────────────────────────────────────────────────┤
│  Environment Variable      →  build.rs  →  Compiled Binary      │
│  (or hardcoded default)                                         │
│                                                                 │
│  TARGET_WINDOW_NAME ───────┬──────────→ env!("TARGET_WINDOW_NAME")
│  TARGET_PROCESS_NAME ──────┼──────────→ env!("TARGET_PROCESS_NAME")
│  TARGET_WINDOW_CLASS ──────┴──────────→ env!("TARGET_WINDOW_CLASS")
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RUNTIME                                    │
├─────────────────────────────────────────────────────────────────┤
│  settings.toml ─────────────→ FileSettings ─────→ RuntimeSettings
│  (optional overrides)              │                    │
│                                    ▼                    ▼
│  target_window_name: Option<String>    target_window_name: String
│  target_process_name: Option<String>   target_process_name: String
│  target_window_class: Option<String>   target_window_class: String
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Precedence Chain

For each setting, the value is determined by (highest to lowest priority):

1. **settings.toml** (runtime) - If present and non-empty
2. **env!() macro** (build-time) - Compiled into binary
3. **Hardcoded default** (build-time) - Fallback in build.rs

```
settings.toml value  ──┐
                       ├──→ Final runtime value
env!() compiled value ─┤
                       │
hardcoded default ─────┘ (used if env not set at build time)
```

## Environment Variables

### Build-Time Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TARGET_WINDOW_NAME` | No | "Star Citizen" | Window title pattern to match |
| `TARGET_PROCESS_NAME` | No | "StarCitizen.exe" | Process executable name |
| `TARGET_WINDOW_CLASS` | No | "CryENGINE" | Window class name |
| `VITE_DEBUG_BORDER` | No | "false" | Enable debug border (existing) |
| `RAIC_LOG_LEVEL` | No | "WARN" | Log level (existing) |

### Value Validation Rules

| Condition | Treatment |
|-----------|-----------|
| Variable not set | Use hardcoded default |
| Variable set to empty string `""` | Use hardcoded default |
| Variable set to whitespace only `"   "` | Use hardcoded default |
| Variable set to any non-empty trimmed value | Use the value |

## Rust Type Mappings

### build.rs Output

```rust
// These are embedded into the binary at compile time
cargo:rustc-env=TARGET_WINDOW_NAME={value}
cargo:rustc-env=TARGET_PROCESS_NAME={value}
cargo:rustc-env=TARGET_WINDOW_CLASS={value}
```

### settings.rs Consumption

```rust
// Access via env!() macro - compile-time constant
env!("TARGET_WINDOW_NAME")    // &'static str
env!("TARGET_PROCESS_NAME")   // &'static str
env!("TARGET_WINDOW_CLASS")   // &'static str
```

## Existing Structures (No Changes)

### FileSettings (settings.toml → Rust)

```rust
#[derive(Debug, Clone, Deserialize, Default)]
pub struct FileSettings {
    pub target_window_name: Option<String>,
    pub target_process_name: Option<String>,
    pub target_window_class: Option<String>,
    // ... other fields unchanged
}
```

### RuntimeSettings (Final resolved values)

```rust
pub struct RuntimeSettings {
    pub target_window_name: String,      // Always has a value
    pub target_process_name: String,     // Always has a value
    pub target_window_class: String,     // Always has a value
    pub sources: SettingsSources,        // Tracks value origin
    // ... other fields unchanged
}
```

### SettingsSources (Audit trail)

```rust
pub struct SettingsSources {
    pub target_window_name: SettingSource,
    pub target_process_name: SettingSource,
    pub target_window_class: SettingSource,
    // ... other fields unchanged
}

pub enum SettingSource {
    File,     // Value from settings.toml
    Default,  // Value from build-time default (env!() macro)
}
```

## Constants Removed

The following constants in `settings.rs` will be removed and replaced with `env!()` macros:

```rust
// BEFORE (to be removed)
pub const DEFAULT_PROCESS_NAME: &str = "StarCitizen.exe";
pub const DEFAULT_WINDOW_CLASS: &str = "CryENGINE";

// AFTER (replacement pattern)
// In from_file_settings():
_ => env!("TARGET_PROCESS_NAME").to_string(),
_ => env!("TARGET_WINDOW_CLASS").to_string(),
```

## Example Configurations

### 1. Zero-Configuration Build (Default)

No environment variables set:
- `TARGET_WINDOW_NAME` → "Star Citizen"
- `TARGET_PROCESS_NAME` → "StarCitizen.exe"
- `TARGET_WINDOW_CLASS` → "CryENGINE"

### 2. Custom Target Application Build

```bash
TARGET_WINDOW_NAME=Notepad TARGET_PROCESS_NAME=notepad.exe TARGET_WINDOW_CLASS=Notepad cargo build
```

Results in:
- `TARGET_WINDOW_NAME` → "Notepad"
- `TARGET_PROCESS_NAME` → "notepad.exe"
- `TARGET_WINDOW_CLASS` → "Notepad"

### 3. Partial Customization

```bash
TARGET_WINDOW_NAME=Calculator cargo build
```

Results in:
- `TARGET_WINDOW_NAME` → "Calculator"
- `TARGET_PROCESS_NAME` → "StarCitizen.exe" (default)
- `TARGET_WINDOW_CLASS` → "CryENGINE" (default)

### 4. Runtime Override (settings.toml)

Build with defaults, then create `settings.toml`:
```toml
target_window_name = "VSCode"
```

Results in:
- `TARGET_WINDOW_NAME` → "VSCode" (from settings.toml, overrides build default)
