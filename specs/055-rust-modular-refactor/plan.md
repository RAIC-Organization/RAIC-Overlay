# Implementation Plan: Rust Modular Architecture Refactor

**Branch**: `055-rust-modular-refactor` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/055-rust-modular-refactor/spec.md`

## Summary

Refactor the flat `src-tauri/src/` directory (28 `.rs` files at root level, 696-line `lib.rs`) into a modern modular Rust architecture. The approach groups related functionality into dedicated subdirectories with consistent internal patterns (`mod.rs`, `types.rs`, `commands.rs`), reduces `lib.rs` to module declarations only, and ensures zero circular dependencies while maintaining 100% backward compatibility with all existing Tauri commands.

## Technical Context

**Language/Version**: Rust 2021 Edition (1.92+)
**Primary Dependencies**: Tauri 2.x, serde, tokio, windows-rs 0.62, tauri-plugin-* ecosystem
**Storage**: N/A (pure code reorganization - no data model changes)
**Testing**: `cargo build` (compilation), `cargo clippy` (linting), manual functional testing
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (Rust backend + TypeScript/React frontend)
**Performance Goals**: Zero runtime performance impact (pure refactor)
**Constraints**: All 50+ Tauri commands must remain functional, `lib.rs` under 200 lines
**Scale/Scope**: 28 source files reorganized into ~10 top-level modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | PASS | Refactor improves readability by grouping related code; eliminates 696-line lib.rs monolith |
| II. Testing Standards | PASS | Compilation + clippy validates refactor; all Tauri commands tested via manual app testing |
| III. User Experience Consistency | N/A | Backend-only change, no UI impact |
| IV. Performance Requirements | PASS | Zero runtime changes - pure reorganization |
| V. Research-First Development | PASS | Rust 2021 module patterns well-documented; no new dependencies |
| Simplicity Standard | PASS | Uses standard Rust module patterns; no abstractions beyond directory structure |

**Gate Status**: PASSED - Proceed to Phase 0

## Testing Approach Justification

This feature uses compilation-based validation (`cargo build`, `cargo clippy`) rather than automated integration tests because:

1. **Pure Refactor**: No behavioral changes - only file reorganization and import path updates
2. **Compiler as Verifier**: Rust's strict type system and module visibility rules ensure correctness at compile time
3. **Zero Runtime Risk**: Moving files and updating `use` statements cannot introduce runtime bugs if compilation succeeds
4. **Existing Test Coverage**: Application-level functionality is already covered by manual QA; this refactor doesn't add new logic to test

This approach aligns with the constitution's spirit (ensure quality) while being pragmatic for structural-only changes.

## Project Structure

### Documentation (this feature)

```text
specs/055-rust-modular-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output - Rust module best practices
├── data-model.md        # Phase 1 output - Module dependency map
├── quickstart.md        # Phase 1 output - Refactoring guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (target structure after refactor)

```text
src-tauri/src/
├── main.rs                 # Entry point (unchanged)
├── lib.rs                  # Module declarations + run() setup (<200 lines)
│
├── core/                   # Core infrastructure
│   ├── mod.rs             # Re-exports: state, types, window
│   ├── state.rs           # OverlayState (from state.rs)
│   ├── types.rs           # Position, OverlayMode, etc. (from types.rs)
│   └── window.rs          # Window positioning utilities (from window.rs)
│
├── browser/               # Browser WebView feature
│   ├── mod.rs             # Re-exports
│   ├── types.rs           # BrowserWebViewState (from browser_webview_types.rs)
│   ├── commands.rs        # Tauri commands (from browser_webview.rs)
│   └── webview.rs         # WebView lifecycle (from browser_webview.rs)
│
├── persistence/           # State persistence feature
│   ├── mod.rs
│   ├── types.rs           # (from persistence_types.rs)
│   └── commands.rs        # (from persistence.rs)
│
├── settings/              # Settings management
│   ├── mod.rs
│   ├── types.rs           # (from user_settings_types.rs)
│   ├── runtime.rs         # TOML settings (from settings.rs)
│   ├── user.rs            # User settings (from user_settings.rs)
│   └── window.rs          # Settings window (from settings_window.rs)
│
├── update/                # Auto-update feature (already organized - keep as-is)
│   └── [existing structure preserved]
│
├── hotkey/                # Hotkey handling
│   ├── mod.rs
│   └── shortcuts.rs       # (from hotkey.rs)
│
├── logging/               # Logging infrastructure
│   ├── mod.rs
│   ├── types.rs           # (from logging_types.rs)
│   └── cleanup.rs         # (from logging.rs)
│
├── platform/              # Platform-specific code (Windows)
│   ├── mod.rs             # #[cfg(windows)] gated
│   ├── keyboard_hook.rs   # (from keyboard_hook.rs)
│   ├── target_window.rs   # (from target_window.rs)
│   ├── process_monitor.rs # (from process_monitor.rs)
│   ├── focus_monitor.rs   # (from focus_monitor.rs)
│   └── tray.rs            # (from tray.rs)
│
└── commands/              # Top-level Tauri commands
    ├── mod.rs
    └── overlay.rs         # toggle_visibility, toggle_mode, etc. (from lib.rs)
```

**Structure Decision**: Tauri desktop application with modular Rust backend. The `update/` module is already well-organized and will be preserved as-is. All other flat files will be reorganized into feature-based modules.

## Complexity Tracking

> No violations - all changes follow standard Rust module patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
