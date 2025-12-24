# Quickstart: Concise Debug Logs

**Branch**: `030-concise-debug-logs`
**Date**: 2025-12-24

## Overview

This feature refactors debug logging to be event-based instead of continuous loop logging. After implementation, log files will be readable and proportional to actual events rather than elapsed time.

## Prerequisites

- Rust 2021 Edition (already configured)
- No new dependencies required

## Key Changes

### 1. Log Level Changes (target_window.rs)

Change verbose per-poll logging from DEBUG to TRACE:

```rust
// BEFORE:
log::debug!("Starting window detection: process={}, class={}, title={}", ...);
log::debug!("Window candidate: process={}, class={}, title={}, ...", ...);
log::debug!("Target window is focused (hwnd={})", ...);

// AFTER:
log::trace!("Starting window detection: process={}, class={}, title={}", ...);
log::trace!("Window candidate: process={}, class={}, title={}, ...", ...);
log::trace!("Target window is focused (hwnd={})", ...);
```

### 2. Focus Deduplication (focus_monitor.rs)

Add deduplication state and check before logging focus transitions:

```rust
use std::sync::Mutex;
use std::time::Instant;

static LAST_FOCUS_LOG: Mutex<Option<(bool, Instant)>> = Mutex::new(None);
const FOCUS_LOG_DEDUP_MS: u64 = 500;

fn should_log_focus_change(is_focused: bool) -> bool {
    let mut last = LAST_FOCUS_LOG.lock().unwrap();
    let now = Instant::now();
    
    match *last {
        Some((last_state, last_time)) => {
            // Skip if same state within dedup window
            if last_state == is_focused && now.duration_since(last_time).as_millis() < FOCUS_LOG_DEDUP_MS as u128 {
                return false;
            }
            *last = Some((is_focused, now));
            true
        }
        None => {
            *last = Some((is_focused, now));
            true
        }
    }
}
```

### 3. Preserved Logging (No Changes)

These logs are already event-based and remain unchanged:

- `log::info!` for startup/shutdown events
- `log::info!` for detection summary
- `log::warn!` for detection failures
- `log::error!` for all errors

## Testing

### Build and Run

```bash
cd src-tauri
cargo build
cargo test
```

### Verify Log Output

1. Set `log_level = "DEBUG"` in settings.toml
2. Run the application with target process
3. After 5 minutes, check log file size (should be <10KB if stable)

### Verify TRACE Still Works

1. Set `log_level = "TRACE"` in settings.toml
2. Run briefly, verify detailed candidate logs appear
3. Set back to "DEBUG" when done

## Expected Behavior

| Scenario | DEBUG Level | TRACE Level |
|----------|-------------|-------------|
| App startup | Logged | Logged |
| Monitor loop start | Logged | Logged |
| Each poll cycle | Silent | Logged per-candidate |
| Focus gained/lost | Logged (deduplicated) | Logged (all) |
| Process detected | Logged | Logged |
| Detection failure | Warned | Warned + candidates |
