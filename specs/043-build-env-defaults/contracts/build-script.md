# Contract: Build Script Environment Variables

**Feature**: 043-build-env-defaults
**Date**: 2025-12-31

## Overview

This contract defines the environment variable interface for the build script (`src-tauri/build.rs`).

## Environment Variable Contract

### TARGET_WINDOW_NAME

| Property | Value |
|----------|-------|
| Name | `TARGET_WINDOW_NAME` |
| Required | No (was: Yes) |
| Default | `"Star Citizen"` |
| Type | String |
| Validation | Non-empty after trimming whitespace |
| Output | `cargo:rustc-env=TARGET_WINDOW_NAME={value}` |

### TARGET_PROCESS_NAME (NEW)

| Property | Value |
|----------|-------|
| Name | `TARGET_PROCESS_NAME` |
| Required | No |
| Default | `"StarCitizen.exe"` |
| Type | String |
| Validation | Non-empty after trimming whitespace |
| Output | `cargo:rustc-env=TARGET_PROCESS_NAME={value}` |

### TARGET_WINDOW_CLASS (NEW)

| Property | Value |
|----------|-------|
| Name | `TARGET_WINDOW_CLASS` |
| Required | No |
| Default | `"CryENGINE"` |
| Type | String |
| Validation | Non-empty after trimming whitespace |
| Output | `cargo:rustc-env=TARGET_WINDOW_CLASS={value}` |

## Build Script Pseudocode

```rust
fn main() {
    // Helper function for optional env vars with defaults
    fn get_env_or_default(name: &str, default: &str) -> (String, bool) {
        match std::env::var(name) {
            Ok(val) if !val.trim().is_empty() => (val, true),
            _ => (default.to_string(), false),
        }
    }

    // TARGET_WINDOW_NAME (CHANGED: now optional)
    let (target_window_name, twn_from_env) =
        get_env_or_default("TARGET_WINDOW_NAME", "Star Citizen");
    println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

    // TARGET_PROCESS_NAME (NEW)
    let (target_process_name, tpn_from_env) =
        get_env_or_default("TARGET_PROCESS_NAME", "StarCitizen.exe");
    println!("cargo:rustc-env=TARGET_PROCESS_NAME={}", target_process_name);

    // TARGET_WINDOW_CLASS (NEW)
    let (target_window_class, twc_from_env) =
        get_env_or_default("TARGET_WINDOW_CLASS", "CryENGINE");
    println!("cargo:rustc-env=TARGET_WINDOW_CLASS={}", target_window_class);

    // Existing env vars (unchanged)
    let debug_border = std::env::var("VITE_DEBUG_BORDER")
        .unwrap_or_else(|_| "false".to_string());
    println!("cargo:rustc-env=VITE_DEBUG_BORDER={}", debug_border);

    let log_level = std::env::var("RAIC_LOG_LEVEL")
        .unwrap_or_else(|_| "WARN".to_string());
    println!("cargo:rustc-env=RAIC_LOG_LEVEL={}", log_level);

    // Rerun triggers for all env vars
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");
    println!("cargo:rerun-if-env-changed=TARGET_PROCESS_NAME");
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_CLASS");
    println!("cargo:rerun-if-env-changed=VITE_DEBUG_BORDER");
    println!("cargo:rerun-if-env-changed=RAIC_LOG_LEVEL");

    // Log configuration summary (FR-009)
    println!("cargo:warning=Build configuration:");
    println!("cargo:warning=  TARGET_WINDOW_NAME: {} ({})",
        target_window_name, if twn_from_env { "env" } else { "default" });
    println!("cargo:warning=  TARGET_PROCESS_NAME: {} ({})",
        target_process_name, if tpn_from_env { "env" } else { "default" });
    println!("cargo:warning=  TARGET_WINDOW_CLASS: {} ({})",
        target_window_class, if twc_from_env { "env" } else { "default" });

    tauri_build::build()
}
```

## Backward Compatibility

| Scenario | Before | After | Breaking? |
|----------|--------|-------|-----------|
| Build without TARGET_WINDOW_NAME | FAIL | SUCCESS (default: "Star Citizen") | No - improves |
| Build with TARGET_WINDOW_NAME set | SUCCESS | SUCCESS (uses env value) | No |
| Build without TARGET_PROCESS_NAME | SUCCESS (hardcoded) | SUCCESS (default: "StarCitizen.exe") | No |
| Build without TARGET_WINDOW_CLASS | SUCCESS (hardcoded) | SUCCESS (default: "CryENGINE") | No |

## Related Existing Commands

These Tauri commands are NOT modified by this feature but consume the env values:

- `get_target_window_info` - Returns current target window configuration
- `get_settings` - Returns all runtime settings including sources

The behavior of these commands is unchanged; they continue to use the priority chain:
`settings.toml` → `env!()` macro → (now uses env var or default at build time)
