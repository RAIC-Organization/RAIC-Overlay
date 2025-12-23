# Quickstart: Fix Duplicate Log File

**Feature**: 024-fix-duplicate-log
**Date**: 2025-12-23

## Overview

This fix removes duplicate log file creation by using tauri-plugin-log's default behavior instead of adding a custom target.

## Prerequisites

- Rust toolchain installed
- Project builds successfully (`cargo build`)

## Implementation Steps

### Step 1: Modify logging.rs

File: `src-tauri/src/logging.rs`

#### 1.1 Remove unused imports

Remove `Target` and `TargetKind` from the import statement on line 6:

```rust
// BEFORE
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

// AFTER
use tauri_plugin_log::RotationStrategy;
```

#### 1.2 Remove custom target in build_log_plugin()

Remove lines 52-55 that add the custom LogDir target:

```rust
// REMOVE THESE LINES
        // Always log to file in app log directory
        .target(Target::new(TargetKind::LogDir {
            file_name: Some("app".to_string()),
        }));
```

The builder chain should end after the `.format()` call (add semicolon).

#### 1.3 Update get_log_file_path()

Change the filename from "app.log" to "RAIC Overlay.log":

```rust
// BEFORE
let log_path = log_dir.join("app.log");

// AFTER
let log_path = log_dir.join("RAIC Overlay.log");
```

#### 1.4 Update cleanup_old_logs()

Update the filename pattern matching:

```rust
// BEFORE
if !file_name.starts_with("app.log") {
    continue;
}

// Skip the current active log file
if file_name == "app.log" {
    continue;
}

// AFTER
if !file_name.starts_with("RAIC Overlay.log") {
    continue;
}

// Skip the current active log file
if file_name == "RAIC Overlay.log" {
    continue;
}
```

## Verification

1. Build the project: `cargo build`
2. Delete existing log files in `%LOCALAPPDATA%\com.raicoverlay.app\logs\`
3. Run the application
4. Check the logs directory:
   - `RAIC Overlay.log` should exist
   - `app.log` should NOT exist
5. Verify log entries are written to `RAIC Overlay.log`

## Rollback

If issues arise, revert the changes to `logging.rs` by:
1. Re-adding the `Target` and `TargetKind` imports
2. Re-adding the `.target()` call in `build_log_plugin()`
3. Reverting filename references back to "app.log"
