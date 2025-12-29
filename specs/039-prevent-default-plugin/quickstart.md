# Quickstart: Prevent Default Webview Hotkeys

**Feature**: 039-prevent-default-plugin
**Estimated Effort**: ~30 minutes

## Prerequisites

- RAICOverlay project cloned and building successfully
- Rust toolchain installed
- Tauri 2.x environment configured

## Implementation Steps

### Step 1: Add Dependency

Add to `src-tauri/Cargo.toml` in the `[dependencies]` section:

```toml
tauri-plugin-prevent-default = "4"
```

### Step 2: Register Plugin

Update `src-tauri/src/lib.rs`:

1. Add the plugin registration in the `run()` function's `tauri::Builder::default()` chain.

2. Use conditional compilation for debug/release behavior:

```rust
// Add near top of lib.rs, after existing imports:
// Helper function to get prevent-default plugin with debug/release configuration
#[cfg(debug_assertions)]
fn get_prevent_default_plugin() -> tauri_plugin_prevent_default::Plugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;
    // Debug: Allow DevTools access for development
    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS))
        .build()
}

#[cfg(not(debug_assertions))]
fn get_prevent_default_plugin() -> tauri_plugin_prevent_default::Plugin<tauri::Wry> {
    // Release: Block all browser shortcuts
    tauri_plugin_prevent_default::init()
}
```

3. Add plugin to builder chain (after other plugins):

```rust
tauri::Builder::default()
    .plugin(log_builder)
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    // ... existing plugins ...
    .plugin(get_prevent_default_plugin())  // Add this line
    // ... rest of builder chain ...
```

### Step 3: Verify Build

```bash
cd src-tauri
cargo build
```

### Step 4: Test

1. **Debug Build** (`cargo tauri dev`):
   - Press F12 → DevTools should open
   - Press F3 → No Find dialog (overlay toggle works)
   - Press Ctrl+P → No print dialog
   - Right-click → No browser context menu

2. **Release Build** (`cargo tauri build`):
   - Press F12 → No DevTools
   - All other shortcuts remain blocked

## Verification Checklist

- [ ] F3 no longer opens Find in Page dialog
- [ ] F3 overlay toggle still works
- [ ] F5 mode toggle still works
- [ ] Ctrl+P does not open print dialog
- [ ] Ctrl+J does not open downloads panel
- [ ] Ctrl+R does not reload the page
- [ ] Ctrl+U does not show source
- [ ] Right-click shows no browser context menu
- [ ] F12 opens DevTools (debug only)
- [ ] Text input in editors works normally
- [ ] TipTap formatting shortcuts (Ctrl+B, Ctrl+I) work

## Troubleshooting

**Issue**: Cargo build fails with version mismatch
**Solution**: Ensure `tauri-plugin-prevent-default = "4"` is compatible with your Tauri 2.x version. Run `cargo update` to fetch latest compatible version.

**Issue**: F3/F5 overlay shortcuts stop working
**Solution**: The low-level keyboard hook should capture these before the webview. If broken, verify `keyboard_hook.rs` is still functioning.

**Issue**: DevTools still accessible in release build
**Solution**: Verify you're running a release build (`cargo tauri build`), not dev mode.
