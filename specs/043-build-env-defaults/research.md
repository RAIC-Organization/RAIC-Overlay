# Research: Build-Time Environment Variable Defaults

**Feature**: 043-build-env-defaults
**Date**: 2025-12-31

## Research Summary

This feature uses well-established Rust patterns already present in the codebase. No external research required - the implementation follows the existing pattern for `VITE_DEBUG_BORDER` and `RAIC_LOG_LEVEL`.

## Current Implementation Analysis

### build.rs (Current)

```rust
// TARGET_WINDOW_NAME - REQUIRED (build fails without it)
let target_window_name = std::env::var("TARGET_WINDOW_NAME")
    .expect("TARGET_WINDOW_NAME environment variable must be set at build time");
println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

// VITE_DEBUG_BORDER - OPTIONAL with default "false"
let debug_border = std::env::var("VITE_DEBUG_BORDER").unwrap_or_else(|_| "false".to_string());
println!("cargo:rustc-env=VITE_DEBUG_BORDER={}", debug_border);

// RAIC_LOG_LEVEL - OPTIONAL with default "WARN"
let log_level = std::env::var("RAIC_LOG_LEVEL").unwrap_or_else(|_| "WARN".to_string());
println!("cargo:rustc-env=RAIC_LOG_LEVEL={}", log_level);
```

### settings.rs (Current)

```rust
// Hardcoded constants (not configurable at build time)
pub const DEFAULT_PROCESS_NAME: &str = "StarCitizen.exe";
pub const DEFAULT_WINDOW_CLASS: &str = "CryENGINE";

// TARGET_WINDOW_NAME uses env!() macro
_ => env!("TARGET_WINDOW_NAME").to_string(),

// Process name and window class use hardcoded constants
_ => DEFAULT_PROCESS_NAME.to_string(),
_ => DEFAULT_WINDOW_CLASS.to_string(),
```

## Design Decisions

### Decision 1: Make TARGET_WINDOW_NAME Optional

**Decision**: Change from `.expect()` to `.unwrap_or_else()` with default "Star Citizen"

**Rationale**:
- Enables zero-configuration builds for the default Star Citizen use case
- Follows the same pattern as `VITE_DEBUG_BORDER` and `RAIC_LOG_LEVEL`
- Reduces friction for new contributors

**Alternatives Considered**:
- Keep as required → Rejected because it creates unnecessary build friction
- Use a separate default file → Rejected because over-engineering for a simple string

### Decision 2: Add TARGET_PROCESS_NAME Environment Variable

**Decision**: Add optional env var with default "StarCitizen.exe"

**Rationale**:
- Consistent with the pattern for other configurable values
- Allows building custom overlays for different applications
- No breaking changes - default matches current hardcoded value

**Alternatives Considered**:
- Keep as hardcoded constant → Rejected because it limits flexibility
- Use settings.toml only → Already supported; build-time env provides compile-time customization

### Decision 3: Add TARGET_WINDOW_CLASS Environment Variable

**Decision**: Add optional env var with default "CryENGINE"

**Rationale**:
- Completes the trio of window detection parameters
- Consistent pattern across all three settings
- Useful for targeting non-CryEngine applications

**Alternatives Considered**:
- Keep as hardcoded constant → Rejected for same reasons as process name

### Decision 4: Empty String Handling

**Decision**: Treat empty strings as "not set" and use defaults

**Rationale**:
- Already established in settings.rs for runtime config
- Prevents accidental empty values from breaking detection
- Consistent with Rust Option semantics

**Implementation**:
```rust
// In build.rs
let target_window_name = std::env::var("TARGET_WINDOW_NAME")
    .ok()
    .filter(|s| !s.trim().is_empty())
    .unwrap_or_else(|| "Star Citizen".to_string());
```

## Implementation Pattern

The pattern for all three env vars will be:

```rust
// build.rs
let var_name = std::env::var("VAR_NAME")
    .ok()
    .filter(|s| !s.trim().is_empty())
    .unwrap_or_else(|| "default_value".to_string());
println!("cargo:rustc-env=VAR_NAME={}", var_name);
println!("cargo:rerun-if-env-changed=VAR_NAME");
```

```rust
// settings.rs - replace constant with env!() macro
_ => env!("TARGET_PROCESS_NAME").to_string(),
_ => env!("TARGET_WINDOW_CLASS").to_string(),
```

## Build Logging (FR-009)

Add informative logging during build:

```rust
// In build.rs
println!("cargo:warning=TARGET_WINDOW_NAME: {} (from {})",
    target_window_name,
    if env_set { "env" } else { "default" });
```

Note: `cargo:warning=` is the standard way to output messages during Cargo build that appear in the build output.

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src-tauri/build.rs` | MODIFY | Add optional env vars with defaults, add logging |
| `src-tauri/src/settings.rs` | MODIFY | Replace constants with env!() macros |
| `.env.example` | UPDATE | Document all optional env vars |
| `check-build.ps1` | UPDATE | Remove or make TARGET_WINDOW_NAME optional |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Build breaks for existing users | Low | Medium | Default values match current behavior |
| Settings.toml override stops working | Low | High | Priority chain unchanged: toml > env > default |
| Empty env var causes detection failure | Low | Medium | Filter empty/whitespace strings |

## No External Research Needed

This feature uses only:
- Standard Rust `std::env::var()` function
- Cargo build script patterns (`cargo:rustc-env`, `cargo:warning`)
- The `env!()` macro (standard Rust)

All patterns are well-documented and already used in this codebase.
