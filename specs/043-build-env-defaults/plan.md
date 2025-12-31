# Implementation Plan: Build-Time Environment Variable Defaults

**Branch**: `043-build-env-defaults` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/043-build-env-defaults/spec.md`

## Summary

Convert `DEFAULT_PROCESS_NAME` and `DEFAULT_WINDOW_CLASS` hardcoded constants to build-time environment variables with fallbacks, and make `TARGET_WINDOW_NAME` optional (no longer required) with a default of "Star Citizen". This enables zero-configuration builds while preserving customization capability.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: Tauri 2.x, existing `build.rs` and `settings.rs` modules
**Storage**: N/A (build-time configuration only)
**Testing**: cargo test (unit tests in settings.rs)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application
**Performance Goals**: No regression in build time
**Constraints**: Backward compatible with existing `settings.toml` runtime overrides
**Scale/Scope**: 2 files modified (`build.rs`, `settings.rs`), 1 file updated (`.env.example`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Simple env var handling with fallbacks, clear responsibility |
| II. Testing Standards | PASS (Exception) | Build-script-only feature with no runtime behavior changes. Existing unit tests in settings.rs cover fallback behavior. No new integration tests required per constitution exemption for non-user-facing infrastructure changes. |
| III. User Experience Consistency | N/A | Build-time only, no user-facing changes |
| IV. Performance Requirements | PASS | No runtime impact, minimal build-time impact |
| V. Research-First Development | PASS | Well-understood Rust patterns, no external deps added |

**Simplicity Standard Check**:
- No new dependencies required
- No new abstractions introduced
- Pattern already established for `VITE_DEBUG_BORDER` and `RAIC_LOG_LEVEL`
- Changes are minimal and localized to 2 files

## Project Structure

### Documentation (this feature)

```text
specs/043-build-env-defaults/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (Tauri commands)
```

### Source Code (repository root)

```text
src-tauri/
├── build.rs             # MODIFY: Add optional env vars with defaults
├── src/
│   └── settings.rs      # MODIFY: Use env!() macros instead of constants
└── Cargo.toml           # NO CHANGE

.env.example             # UPDATE: Document all optional env vars
```

**Structure Decision**: Tauri desktop application with Rust backend. Changes limited to build script and settings module - no new files or architectural changes.

## Complexity Tracking

No violations - feature aligns with existing patterns.
