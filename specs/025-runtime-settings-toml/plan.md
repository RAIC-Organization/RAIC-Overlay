# Implementation Plan: Runtime Settings System

**Branch**: `025-runtime-settings-toml` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-runtime-settings-toml/spec.md`

## Summary

Add a runtime settings system that reads configuration from a `settings.toml` file located next to the executable. The system supports three configurable settings (`target_window_name`, `debug_border`, `log_level`) with graceful fallback to build-time defaults from the `.env` file when settings are missing or invalid. Uses a layered configuration approach where runtime values take precedence over compile-time defaults.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: `toml` crate (serde-compatible TOML parser), `serde` (existing), Tauri 2.x (existing)
**Storage**: TOML file (`settings.toml`) in executable directory
**Testing**: `cargo test` (Rust), manual integration testing
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri - Rust backend + Next.js frontend)
**Performance Goals**: Configuration loading < 10ms at startup
**Constraints**: Must not delay application startup; graceful fallback on all error conditions
**Scale/Scope**: Single configuration file with 3 settings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality - PASS
- [x] Single responsibility: New `settings` module handles only configuration loading
- [x] No code duplication: Reuses existing serde patterns from persistence module
- [x] Self-documenting: Clear struct fields with descriptive names
- [x] Build-time validation retained in `build.rs` for defaults

### II. Testing Standards - PASS
- [x] Unit tests for TOML parsing with various edge cases
- [x] Integration test for full settings resolution flow
- [x] Tests cover missing file, partial file, invalid values scenarios

### III. User Experience Consistency - PASS
- [x] Predictable behavior: Always falls back to defaults on error
- [x] Clear error messages logged for configuration issues
- [x] Example file included for discoverability

### IV. Performance Requirements - PASS
- [x] File read and TOML parse is single synchronous operation at startup
- [x] No runtime overhead after initial load
- [x] No external dependencies beyond what's already in use

### V. Research-First Development - PASS
- [x] Context7 used to retrieve current TOML crate documentation
- [x] Web search performed for executable directory patterns in Tauri
- [x] Research findings documented in research.md

## Project Structure

### Documentation (this feature)

```text
specs/025-runtime-settings-toml/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Tauri commands)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src-tauri/
├── build.rs                    # Modified: embed .env defaults at compile time
├── Cargo.toml                  # Modified: add toml crate dependency
├── src/
│   ├── lib.rs                  # Modified: use settings module for initialization
│   ├── settings.rs             # NEW: runtime settings module
│   ├── logging.rs              # Modified: use settings for log level
│   └── target_window.rs        # Modified: use settings for target window name
└── settings.example.toml       # NEW: example configuration file

app/
└── page.tsx                    # Modified: receive debug_border from backend
```

**Structure Decision**: Extends existing Tauri backend structure with a new `settings.rs` module. No new directories required; follows established patterns from `logging.rs` and `persistence.rs`.

## Complexity Tracking

> No violations detected - implementation follows simplicity standard.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| TOML crate choice | `toml` (standard) | Most widely used, serde-compatible, already aligned with Cargo ecosystem |
| Settings location | Executable directory | User-specified requirement; simple to discover and edit |
| Fallback strategy | Per-field defaults | Allows partial configuration; matches spec requirement |
