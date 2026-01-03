# Data Model: Module Dependency Map

**Feature**: 055-rust-modular-refactor
**Date**: 2026-01-03

## Current File Dependencies

Analysis of `use crate::*` statements in the current flat structure:

### File → Dependencies Matrix

| Current File | Depends On |
|--------------|------------|
| `state.rs` | `types` |
| `window.rs` | `types` |
| `logging.rs` | `logging_types`, `settings` |
| `persistence.rs` | `persistence_types` |
| `user_settings.rs` | `user_settings_types` |
| `browser_webview.rs` | `browser_webview_types`, `state` |
| `target_window.rs` | `settings`, `types` |
| `process_monitor.rs` | `settings`, `target_window` |
| `focus_monitor.rs` | `browser_webview_types`, `state`, `target_window`, `types`, `window` |
| `tray.rs` | `keyboard_hook`, `settings_window` |
| `hotkey.rs` | (standalone) |
| `keyboard_hook.rs` | (standalone - uses Windows API) |
| `settings.rs` | (standalone) |
| `settings_window.rs` | (standalone) |

## Target Module Architecture

### Layered Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         lib.rs                               │
│              (orchestration + run() function)                │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                        commands/                             │
│            (Tauri command handlers from lib.rs)              │
│     toggle_visibility, toggle_mode, get_overlay_state        │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────┬───────────────┬───────────────┬───────────────┐
│  browser/   │   settings/   │    update/    │   platform/   │
│  WebView    │  User prefs   │  Auto-update  │  Windows API  │
│  feature    │  TOML config  │  (as-is)      │  integration  │
└─────────────┴───────────────┴───────────────┴───────────────┘
        ↑             ↑              ↑               ↑
┌─────────────┬───────────────┬───────────────────────────────┐
│persistence/ │   logging/    │           hotkey/             │
│State files  │  Log config   │      Shortcut handling        │
└─────────────┴───────────────┴───────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                          core/                               │
│            state.rs, types.rs, window.rs                     │
│        (NO external module dependencies)                     │
└─────────────────────────────────────────────────────────────┘
```

### Module Definitions

#### core/ (Foundation Layer)
- **Purpose**: Core types, state management, window utilities
- **Files**: `mod.rs`, `state.rs`, `types.rs`, `window.rs`
- **Dependencies**: None (leaf module)
- **Exports**: `OverlayState`, `OverlayMode`, `Position`, `WindowRect`, `WindowState`, window utility functions

#### logging/ (Infrastructure Layer)
- **Purpose**: Logging configuration and cleanup
- **Files**: `mod.rs`, `types.rs`, `cleanup.rs`
- **Dependencies**: `core` (for types)
- **Exports**: `get_log_level`, `build_log_plugin`, `cleanup_old_logs`, `CleanupResult`

#### persistence/ (Infrastructure Layer)
- **Purpose**: State file read/write operations
- **Files**: `mod.rs`, `types.rs`, `commands.rs`
- **Dependencies**: `core` (for types)
- **Exports**: `load_state`, `save_state`, `save_window_content`, `delete_window_content`

#### hotkey/ (Infrastructure Layer)
- **Purpose**: Global shortcut registration
- **Files**: `mod.rs`, `shortcuts.rs`
- **Dependencies**: `core` (for types)
- **Exports**: `build_shortcut_plugin`, `register_shortcuts`

#### settings/ (Feature Layer)
- **Purpose**: User settings and runtime configuration
- **Files**: `mod.rs`, `types.rs`, `runtime.rs`, `user.rs`, `window.rs`
- **Dependencies**: `core`, `persistence`
- **Exports**: `init_settings`, `get_settings_command`, `load_user_settings`, `save_user_settings`, `open_settings_window`

#### platform/ (Feature Layer - Windows only)
- **Purpose**: Windows-specific functionality
- **Files**: `mod.rs`, `keyboard_hook.rs`, `target_window.rs`, `process_monitor.rs`, `focus_monitor.rs`, `tray.rs`
- **Dependencies**: `core`, `settings`, `browser` (for state access)
- **Exports**: `start_keyboard_hook`, `find_target_window`, `start_process_monitor`, `start_focus_monitor`, `setup_tray`
- **Gate**: `#[cfg(windows)]`

#### browser/ (Feature Layer)
- **Purpose**: Browser WebView management
- **Files**: `mod.rs`, `types.rs`, `commands.rs`, `webview.rs`
- **Dependencies**: `core`
- **Exports**: `BrowserWebViewState`, all browser Tauri commands

#### update/ (Feature Layer - Existing)
- **Purpose**: Auto-update functionality
- **Files**: Existing structure preserved
- **Dependencies**: `core`, `logging`
- **Exports**: Existing exports preserved

#### commands/ (Application Layer)
- **Purpose**: Top-level Tauri command handlers extracted from lib.rs
- **Files**: `mod.rs`, `overlay.rs`
- **Dependencies**: `core`, `browser`, `platform`, `settings`
- **Exports**: `toggle_visibility`, `toggle_mode`, `get_overlay_state`, `get_target_window_info`

## File Migration Map

| Current Location | Target Location |
|------------------|-----------------|
| `types.rs` | `core/types.rs` |
| `state.rs` | `core/state.rs` |
| `window.rs` | `core/window.rs` |
| `logging_types.rs` | `logging/types.rs` |
| `logging.rs` | `logging/cleanup.rs` |
| `persistence_types.rs` | `persistence/types.rs` |
| `persistence.rs` | `persistence/commands.rs` |
| `hotkey.rs` | `hotkey/shortcuts.rs` |
| `settings.rs` | `settings/runtime.rs` |
| `user_settings_types.rs` | `settings/types.rs` |
| `user_settings.rs` | `settings/user.rs` |
| `settings_window.rs` | `settings/window.rs` |
| `browser_webview_types.rs` | `browser/types.rs` |
| `browser_webview.rs` | `browser/commands.rs` + `browser/webview.rs` |
| `keyboard_hook.rs` | `platform/keyboard_hook.rs` |
| `target_window.rs` | `platform/target_window.rs` |
| `process_monitor.rs` | `platform/process_monitor.rs` |
| `focus_monitor.rs` | `platform/focus_monitor.rs` |
| `tray.rs` | `platform/tray.rs` |
| Inline commands in `lib.rs` | `commands/overlay.rs` |
| `update/` | `update/` (unchanged) |

## Circular Dependency Analysis

**Potential cycle detected**: `focus_monitor` → `browser_webview_types` → (none)

**Resolution**: No actual cycle. `focus_monitor` reads `BrowserWebViewState` but doesn't create a dependency loop. The `browser/` module will be at the same level as `platform/`, both depending on `core/`.

**Verified**: All dependencies flow upward in the layer hierarchy. No circular dependencies in target architecture.
