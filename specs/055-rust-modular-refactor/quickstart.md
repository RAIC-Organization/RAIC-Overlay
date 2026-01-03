# Quickstart: Rust Modular Architecture Refactor

**Feature**: 055-rust-modular-refactor
**Date**: 2026-01-03

## Overview

This guide describes how to refactor the flat `src-tauri/src/` directory into a modular architecture. The refactor is purely organizational - no behavioral changes to any functions.

## Prerequisites

- Rust 2021 Edition (1.92+)
- Working `cargo build` before starting
- All tests passing before starting

## Refactoring Steps

### Step 1: Create Module Directories

```bash
cd src-tauri/src
mkdir -p core browser persistence settings hotkey logging platform commands
```

### Step 2: Core Module (Foundation)

The `core/` module has no dependencies and provides foundational types.

1. Move files:
   - `types.rs` → `core/types.rs`
   - `state.rs` → `core/state.rs`
   - `window.rs` → `core/window.rs`

2. Create `core/mod.rs`:
```rust
pub mod state;
pub mod types;
pub mod window;

// Re-exports for convenient access
pub use state::OverlayState;
pub use types::*;
pub use window::*;
```

3. Update imports in moved files:
   - Replace `use crate::types::` with `use super::types::`
   - Replace `use crate::state::` with `use super::state::`

### Step 3: Logging Module

1. Move files:
   - `logging_types.rs` → `logging/types.rs`
   - `logging.rs` → `logging/cleanup.rs`

2. Create `logging/mod.rs`:
```rust
pub mod types;
mod cleanup;

pub use cleanup::*;
pub use types::*;
```

3. Update imports to use `crate::core::` instead of `crate::types::`

### Step 4: Persistence Module

1. Move files:
   - `persistence_types.rs` → `persistence/types.rs`
   - `persistence.rs` → `persistence/commands.rs`

2. Create `persistence/mod.rs`:
```rust
pub mod types;
mod commands;

pub use commands::*;
pub use types::*;
```

### Step 5: Hotkey Module

1. Move file:
   - `hotkey.rs` → `hotkey/shortcuts.rs`

2. Create `hotkey/mod.rs`:
```rust
mod shortcuts;

pub use shortcuts::*;
```

### Step 6: Settings Module

1. Move files:
   - `settings.rs` → `settings/runtime.rs`
   - `user_settings_types.rs` → `settings/types.rs`
   - `user_settings.rs` → `settings/user.rs`
   - `settings_window.rs` → `settings/window.rs`

2. Create `settings/mod.rs`:
```rust
pub mod types;
mod runtime;
mod user;
mod window;

pub use runtime::*;
pub use user::*;
pub use window::*;
```

### Step 7: Browser Module

1. Move files:
   - `browser_webview_types.rs` → `browser/types.rs`
   - `browser_webview.rs` → split into `browser/commands.rs` and `browser/webview.rs`

2. Create `browser/mod.rs`:
```rust
pub mod types;
mod commands;
mod webview;

pub use types::*;
pub use commands::*;
pub use webview::*;
```

### Step 8: Platform Module (Windows-only)

1. Move files:
   - `keyboard_hook.rs` → `platform/keyboard_hook.rs`
   - `target_window.rs` → `platform/target_window.rs`
   - `process_monitor.rs` → `platform/process_monitor.rs`
   - `focus_monitor.rs` → `platform/focus_monitor.rs`
   - `tray.rs` → `platform/tray.rs`

2. Create `platform/mod.rs`:
```rust
#[cfg(windows)]
mod keyboard_hook;
#[cfg(windows)]
mod target_window;
#[cfg(windows)]
mod process_monitor;
#[cfg(windows)]
mod focus_monitor;
mod tray;

#[cfg(windows)]
pub use keyboard_hook::*;
#[cfg(windows)]
pub use target_window::*;
#[cfg(windows)]
pub use process_monitor::*;
#[cfg(windows)]
pub use focus_monitor::*;
pub use tray::*;
```

### Step 9: Commands Module

1. Extract from `lib.rs`:
   - `toggle_visibility` → `commands/overlay.rs`
   - `toggle_mode` → `commands/overlay.rs`
   - `set_visibility` → `commands/overlay.rs`
   - `get_overlay_state` → `commands/overlay.rs`
   - `get_target_window_info` → `commands/overlay.rs`
   - `dismiss_error_modal` → `commands/overlay.rs`
   - `is_target_process_running` → `commands/overlay.rs`

2. Create `commands/mod.rs`:
```rust
mod overlay;

pub use overlay::*;
```

### Step 10: Update lib.rs

Replace the 696-line `lib.rs` with a lean module orchestrator:

```rust
// Module declarations
pub mod core;
pub mod browser;
pub mod commands;
pub mod hotkey;
pub mod logging;
pub mod persistence;
#[cfg(windows)]
pub mod platform;
pub mod settings;
pub mod update;

// Re-exports for backward compatibility
pub use core::*;
pub use browser::BrowserWebViewState;

// run() function remains here (setup logic)
pub fn run() {
    // ... existing setup code with updated imports
}
```

## Validation Checklist

After each step, run:

```bash
cargo build
cargo clippy
```

Final validation:

- [ ] `lib.rs` is under 200 lines
- [ ] All 28 source files are organized into modules
- [ ] No more than 10 top-level directories
- [ ] Zero circular dependency warnings
- [ ] Application compiles successfully
- [ ] All Tauri commands work (manual testing)

## Import Path Updates

When moving files, update all `use crate::` statements:

| Old Path | New Path |
|----------|----------|
| `crate::types::*` | `crate::core::types::*` or `crate::core::*` |
| `crate::state::*` | `crate::core::state::*` or `crate::core::*` |
| `crate::window::*` | `crate::core::window::*` or `crate::core::*` |
| `crate::browser_webview_types::*` | `crate::browser::types::*` or `crate::browser::*` |
| `crate::browser_webview::*` | `crate::browser::*` |
| `crate::persistence_types::*` | `crate::persistence::types::*` |
| `crate::persistence::*` | `crate::persistence::*` (unchanged) |
| `crate::logging_types::*` | `crate::logging::types::*` |
| `crate::logging::*` | `crate::logging::*` (unchanged) |
| `crate::settings::*` | `crate::settings::*` (unchanged) |
| `crate::user_settings_types::*` | `crate::settings::types::*` |
| `crate::user_settings::*` | `crate::settings::*` |
| `crate::settings_window::*` | `crate::settings::*` |
| `crate::keyboard_hook::*` | `crate::platform::keyboard_hook::*` |
| `crate::target_window::*` | `crate::platform::target_window::*` |
| `crate::process_monitor::*` | `crate::platform::process_monitor::*` |
| `crate::focus_monitor::*` | `crate::platform::focus_monitor::*` |
| `crate::tray::*` | `crate::platform::tray::*` |
| `crate::hotkey::*` | `crate::hotkey::*` (unchanged) |

## Rollback Plan

If issues arise during refactoring:

1. `git stash` or `git checkout -- src-tauri/src/`
2. Review compilation errors
3. Fix import paths one module at a time
4. Re-run `cargo build` after each change
