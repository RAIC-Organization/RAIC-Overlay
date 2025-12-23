# Research: Runtime Settings System

**Feature**: 025-runtime-settings-toml
**Date**: 2025-12-23

## Research Topics

### 1. TOML Parsing in Rust (2025 Best Practices)

**Decision**: Use the `toml` crate with serde integration

**Rationale**:
- The `toml` crate is the de facto standard for TOML parsing in Rust with 416M+ downloads
- Native serde support allows type-safe deserialization directly into Rust structs
- Provides clear error messages for malformed TOML syntax
- Already aligns with Cargo's configuration format, familiar to Rust developers

**Alternatives Considered**:
- `toml_edit` (354M downloads): Format-preserving editing, but overkill for read-only configuration
- `config` crate: Layered configuration from multiple sources, adds unnecessary complexity for single-file use case
- `figment` crate: Advanced configuration merging, more suitable for complex multi-environment setups

**Implementation Pattern**:
```rust
use serde::Deserialize;

#[derive(Deserialize, Default)]
#[serde(default)]
struct Settings {
    target_window_name: Option<String>,
    debug_border: Option<bool>,
    log_level: Option<String>,
}

// Parse with graceful fallback
let settings: Settings = toml::from_str(&content).unwrap_or_default();
```

**Source**: [toml crate documentation](https://docs.rs/toml)

### 2. Executable Directory Detection

**Decision**: Use `std::env::current_exe()` with `.parent()`

**Rationale**:
- Standard library function, no additional dependencies
- Works reliably on Windows (primary target platform)
- Returns the actual directory containing the executable

**Alternatives Considered**:
- `std::env::current_dir()`: Returns working directory, not executable location
- Tauri's path API: JavaScript-focused, doesn't provide direct Rust access to exe directory
- `dirs` crate: For standard system directories (config, data), not executable location

**Implementation Pattern**:
```rust
fn get_settings_path() -> Option<std::path::PathBuf> {
    std::env::current_exe()
        .ok()?
        .parent()?
        .join("settings.toml")
        .into()
}
```

**Platform Considerations**:
- Windows: Resolves to directory containing `.exe`
- Development mode (`cargo run`): Resolves to `target/debug` or `target/release`
- Packaged app: Resolves to installation directory

**Source**: [std::env::current_exe documentation](https://doc.rust-lang.org/std/env/fn.current_exe.html)

### 3. Build-Time Default Embedding

**Decision**: Extend existing `build.rs` to embed all three environment variables

**Rationale**:
- Current pattern already works for `TARGET_WINDOW_NAME`
- Consistent approach for all build-time defaults
- Uses `cargo:rustc-env` for compile-time embedding

**Current Implementation**:
```rust
// build.rs (existing)
let target_window_name = std::env::var("TARGET_WINDOW_NAME")
    .expect("TARGET_WINDOW_NAME must be set");
println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);
```

**Extended Pattern**:
```rust
// build.rs (new)
// TARGET_WINDOW_NAME (required)
let target_window_name = std::env::var("TARGET_WINDOW_NAME")
    .expect("TARGET_WINDOW_NAME must be set");
println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

// VITE_DEBUG_BORDER (optional, default: false)
let debug_border = std::env::var("VITE_DEBUG_BORDER").unwrap_or_else(|_| "false".to_string());
println!("cargo:rustc-env=VITE_DEBUG_BORDER={}", debug_border);

// RAIC_LOG_LEVEL (optional, default: WARN)
let log_level = std::env::var("RAIC_LOG_LEVEL").unwrap_or_else(|_| "WARN".to_string());
println!("cargo:rustc-env=RAIC_LOG_LEVEL={}", log_level);

// Rerun triggers
println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");
println!("cargo:rerun-if-env-changed=VITE_DEBUG_BORDER");
println!("cargo:rerun-if-env-changed=RAIC_LOG_LEVEL");
```

### 4. Serde Default Values Pattern

**Decision**: Use `Option<T>` with `#[serde(default)]` for per-field fallback

**Rationale**:
- Allows partial TOML files (not all settings required)
- Clean separation between "not present" and "explicitly set"
- Merge with compile-time defaults after deserialization

**Pattern**:
```rust
#[derive(Deserialize)]
#[serde(default)]
struct FileSettings {
    target_window_name: Option<String>,
    debug_border: Option<bool>,
    log_level: Option<String>,
}

impl Default for FileSettings {
    fn default() -> Self {
        Self {
            target_window_name: None,
            debug_border: None,
            log_level: None,
        }
    }
}

// Merge with compile-time defaults
struct RuntimeSettings {
    target_window_name: String,
    debug_border: bool,
    log_level: String,
}

impl RuntimeSettings {
    fn from_file_settings(file: FileSettings) -> Self {
        Self {
            target_window_name: file.target_window_name
                .unwrap_or_else(|| env!("TARGET_WINDOW_NAME").to_string()),
            debug_border: file.debug_border
                .unwrap_or_else(|| env!("VITE_DEBUG_BORDER") == "true"),
            log_level: file.log_level
                .unwrap_or_else(|| env!("RAIC_LOG_LEVEL").to_string()),
        }
    }
}
```

### 5. Debug Border Frontend Integration

**Decision**: Expose debug_border via Tauri command, read at app initialization

**Rationale**:
- Current implementation reads `NEXT_PUBLIC_DEBUG_BORDER` from process.env (build-time only)
- Need to query backend for runtime-configurable value
- Single source of truth in Rust settings module

**Current Frontend Pattern**:
```typescript
// page.tsx (current - build-time only)
const debugBorder = process.env.NEXT_PUBLIC_DEBUG_BORDER === "true";
```

**New Pattern**:
```typescript
// Query backend for runtime setting
const config = await invoke<{ debugBorder: boolean }>("get_settings");
if (config.debugBorder) {
  root.classList.add("debug-border");
}
```

### 6. Logging Integration

**Decision**: Call settings module before logging plugin initialization

**Rationale**:
- Log level must be determined before `tauri_plugin_log::Builder` is constructed
- Settings module must be initialized first in the startup sequence
- Log source information during startup for observability

**Startup Sequence**:
1. Load settings from TOML (or use defaults)
2. Log each setting's source (INFO level)
3. Initialize logging plugin with resolved log level
4. Continue normal application startup

## Dependency Changes

### Cargo.toml Additions

```toml
[dependencies]
toml = "0.8"  # TOML parsing with serde support
```

No other new dependencies required - `serde` is already present.

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src-tauri/Cargo.toml` | Modified | Add `toml` dependency |
| `src-tauri/build.rs` | Modified | Embed all three env vars at compile time |
| `src-tauri/src/settings.rs` | New | Settings loading and resolution module |
| `src-tauri/src/lib.rs` | Modified | Initialize settings, use for log level |
| `src-tauri/src/logging.rs` | Modified | Accept log level from settings |
| `src-tauri/src/target_window.rs` | Modified | Use settings for window name |
| `src-tauri/settings.example.toml` | New | Example configuration file |
| `app/page.tsx` | Modified | Query backend for debug_border setting |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Settings file not found | Graceful fallback to compile-time defaults |
| Malformed TOML syntax | Log warning, use all defaults |
| Invalid setting value | Log warning, use default for that setting |
| File permission error | Log warning, use all defaults |
| Startup performance impact | Synchronous read is fast (<1ms for small file) |
