# Research: tauri-plugin-prevent-default

**Date**: 2025-12-29
**Feature**: 039-prevent-default-plugin

## Plugin Overview

**Package**: `tauri-plugin-prevent-default`
**Latest Version**: 4.0.3 (released November 27, 2025)
**Tauri Compatibility**: Requires Tauri 2.0 or later
**Platform Support**: Windows (primary), macOS and Linux (supported but less tested)

**Sources**:
- [GitHub Repository](https://github.com/ferreira-tb/tauri-plugin-prevent-default)
- [lib.rs](https://lib.rs/crates/tauri-plugin-prevent-default)
- [crates.io](https://crates.io/crates/tauri-plugin-prevent-default)

## Decision: Plugin Version

**Decision**: Use version 4.0.3 (latest stable)

**Rationale**:
- Explicitly supports Tauri 2.x which RAICOverlay uses
- Released recently (November 2025) indicating active maintenance
- Provides all required blocking capabilities (context menu, find, print, downloads, reload, devtools)

**Alternatives Considered**:
- Version 2.x: Older API, fewer features
- Version 0.x: Legacy, incompatible with Tauri 2.x

## Decision: Flag Configuration

**Decision**: Use `Flags::all()` with conditional DevTools exception for debug builds

**Rationale**:
- Blocks all default browser shortcuts by default (maximum protection)
- Conditionally allows DevTools (F12, Ctrl+Shift+I) only in debug builds
- Simplest configuration that meets all requirements

**Alternatives Considered**:
- Selective flags (e.g., `Flags::FIND | Flags::PRINT | Flags::DOWNLOADS`): More complex, risk of missing shortcuts
- Custom keyboard shortcuts only: Doesn't cover context menu, less maintainable

## Implementation Pattern

### Installation

Add to `Cargo.toml`:
```toml
[dependencies]
tauri-plugin-prevent-default = "4"
```

### Registration (Debug vs Release)

The plugin provides conditional compilation support:

```rust
// Debug builds: Allow DevTools and Reload for development
#[cfg(debug_assertions)]
fn get_prevent_default_plugin() -> tauri_plugin_prevent_default::Plugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS | Flags::RELOAD))
        .build()
}

// Release builds: Block everything
#[cfg(not(debug_assertions))]
fn get_prevent_default_plugin() -> tauri_plugin_prevent_default::Plugin<tauri::Wry> {
    tauri_plugin_prevent_default::init()
}
```

Alternative (simpler): Use the built-in `debug()` function:
```rust
#[cfg(debug_assertions)]
let plugin = tauri_plugin_prevent_default::debug();

#[cfg(not(debug_assertions))]
let plugin = tauri_plugin_prevent_default::init();
```

### Available Flags

| Flag | Purpose | Block in RAICOverlay |
|------|---------|---------------------|
| `CONTEXT_MENU` | Right-click browser menu | Yes |
| `DEV_TOOLS` | F12, Ctrl+Shift+I | Release only |
| `RELOAD` | F5, Ctrl+R | Yes |
| `FIND` | F3, Ctrl+F | Yes |
| `PRINT` | Ctrl+P | Yes |
| `DOWNLOADS` | Ctrl+J | Yes |

### Custom Shortcut Blocking (if needed)

The plugin supports custom shortcuts beyond the predefined flags:

```rust
use tauri_plugin_prevent_default::{KeyboardShortcut, ModifierKey};

tauri_plugin_prevent_default::Builder::new()
    .shortcut(KeyboardShortcut::new("F12"))
    .shortcut(KeyboardShortcut::with_modifiers("U", &[ModifierKey::CtrlKey]))
    .build()
```

## Integration Notes

### Compatibility with Existing Features

1. **F3 Fullscreen Toggle (Feature 003)**: The plugin blocks the webview's F3 "Find in Page" dialog. The existing F3 functionality uses a low-level keyboard hook (`keyboard_hook.rs`) which operates at the OS level, *before* the webview receives the keypress. This means:
   - Plugin blocks: Webview's F3 handling (Find dialog)
   - Hook captures: OS-level F3 for overlay toggle
   - No conflict expected

2. **F5 Mode Toggle**: Same pattern as F3 - the keyboard hook captures F5 at OS level before webview receives it.

3. **Text Input**: The plugin blocks browser-level shortcuts, NOT text input. Typing in TipTap editor, Browser URL bar, etc. will work normally.

### Windows-Specific Features

The plugin offers an optional `platform-windows` feature for additional WebView2 controls:
- Autofill control
- Script dialog handling
- Additional context menu options

**Decision**: Not needed for RAICOverlay requirements. Standard flags are sufficient.

## Testing Strategy

1. **Debug Build Testing**:
   - Verify F12 opens DevTools
   - Verify Ctrl+Shift+I opens DevTools
   - Verify F5 (standalone, not with Ctrl) still works for mode toggle

2. **Release Build Testing**:
   - Verify F12 does NOT open DevTools
   - Verify Ctrl+Shift+I does NOT open DevTools
   - Verify mode toggle still works

3. **Shortcut Blocking (Both Builds)**:
   - F3: No Find dialog (overlay toggle works)
   - Ctrl+P: No print dialog
   - Ctrl+J: No downloads panel
   - Ctrl+R: No page reload
   - Ctrl+U: No view source
   - Right-click: No browser context menu

4. **Text Input Preservation**:
   - Verify typing in Notes editor works
   - Verify typing in Browser URL bar works
   - Verify keyboard shortcuts within TipTap (bold, italic) work
