# Quickstart: Star Citizen Window Detection Enhancement

**Feature**: 028-sc-window-detection
**Date**: 2025-12-23

## Prerequisites

- Rust 2021 Edition installed
- Windows 11 (64-bit)
- Star Citizen installed (for testing)

## Setup

1. **Checkout the feature branch**:
   ```bash
   git checkout 028-sc-window-detection
   ```

2. **Verify Cargo.toml dependencies** (should already be configured):
   ```toml
   [target.'cfg(windows)'.dependencies]
   windows = { version = "0.62", features = [
       "Win32_Foundation",
       "Win32_UI_WindowsAndMessaging",
       "Win32_System_Threading",
       "Win32_System_ProcessStatus"
   ] }
   ```

3. **Build the backend**:
   ```bash
   cd src-tauri
   cargo build
   ```

## Key Files to Modify

| File | Purpose |
|------|---------|
| `src-tauri/src/target_window.rs` | Three-point window verification |
| `src-tauri/src/settings.rs` | New settings fields |
| `src-tauri/src/hotkey.rs` | Hotkey event logging |
| `src-tauri/src/lib.rs` | Toggle visibility/mode logging |
| `src-tauri/src/process_monitor.rs` | NEW: Process lifecycle monitoring |
| `src-tauri/src/types.rs` | New types and error variants |

## Development Workflow

### 1. Test Window Detection

```bash
# Run with DEBUG logging to see detection details
RAIC_LOG_LEVEL=DEBUG cargo tauri dev
```

Check logs for:
- `"F3 pressed"` entries
- `"Window candidate:"` entries showing process, class, title
- `"Target detected"` or detection failure messages

### 2. Test with Star Citizen

1. Start Star Citizen (to launcher)
2. Start overlay (`cargo tauri dev`)
3. Launch game from RSI Launcher
4. Press F3 when game window appears
5. Verify overlay attaches to game (not launcher)

### 3. Test Auto-Detection

1. Start overlay first
2. Launch Star Citizen
3. Verify log shows `"Target process detected: StarCitizen.exe"`
4. Verify overlay auto-shows when game window appears
5. Close Star Citizen
6. Verify log shows `"Target process terminated"`

## Testing Commands

```bash
# Run Rust unit tests
cd src-tauri
cargo test

# Run with specific log level
RAIC_LOG_LEVEL=DEBUG cargo tauri dev

# Build release
cargo tauri build
```

## Settings Configuration (Optional)

Create/edit `settings.toml` next to executable:

```toml
# Override detection parameters (optional)
target_process_name = "StarCitizen.exe"
target_window_class = "CryENGINE"
target_window_title = "Star Citizen"
process_monitor_interval_ms = 1000

# Set log level to see detection details
log_level = "DEBUG"
```

## Debugging Tips

1. **Window not detected**:
   - Set `log_level = "DEBUG"` in settings.toml
   - Check logs for candidate windows being evaluated
   - Verify process name, window class, title match expectations

2. **Wrong window matched**:
   - Check if RSI Launcher is matching instead of game
   - Verify three-point verification is working (process + class + title)

3. **Auto-detection not working**:
   - Check process monitor is started (look for "Monitoring for target process" log)
   - Verify polling interval setting

4. **Performance issues**:
   - Check CPU usage during idle monitoring
   - Increase `process_monitor_interval_ms` if needed

## Success Criteria Validation

| Criteria | How to Test |
|----------|-------------|
| SC-001: Correct game window | Launch SC with launcher open, press F3, verify overlay on game |
| SC-002: Rejects launcher | With only launcher open, press F3, verify error modal |
| SC-003: Logging <50ms | Check timestamps in DEBUG logs |
| SC-004: Diagnosable logs | Review logs after failed detection |
| SC-005: Detection <100ms | Check `detection_time_ms` in DEBUG output |
| SC-006: Auto-detect <2s | Time from game window appear to overlay show |
| SC-007: Auto-hide <2s | Time from game exit to overlay hide |
| SC-008: CPU <1% idle | Monitor Task Manager during idle state |
