# Data Model: Concise Debug Logs

**Branch**: `030-concise-debug-logs`
**Date**: 2025-12-24

## Overview

This feature is a logging refactoring with no new persistent data models. The only new state is ephemeral runtime tracking for deduplication.

## New Runtime State

### Focus Deduplication State

**Purpose**: Track last focus log to prevent rapid oscillation spam.

**Location**: `src-tauri/src/focus_monitor.rs` (module-level static)

```rust
/// Tracks the last logged focus state for deduplication
/// Tuple: (was_focused: bool, timestamp: Instant)
static LAST_FOCUS_LOG: Mutex<Option<(bool, Instant)>> = Mutex::new(None);

/// Deduplication window in milliseconds
const FOCUS_LOG_DEDUP_MS: u64 = 500;
```

**Lifecycle**:
- Initialized to `None` on module load
- Updated on each focus transition log
- Checked before logging to skip duplicates within 500ms

**Thread Safety**: Protected by `Mutex` since focus monitoring runs in a separate thread.

## Existing Entities (No Changes)

The following existing entities are referenced but not modified:

- **WindowCandidate**: Window detection candidate (target_window.rs)
- **DetectionResult**: Window detection result (target_window.rs)
- **ProcessMonitorState**: Process monitor state (process_monitor.rs)
- **RuntimeSettings**: Application settings including log_level (settings.rs)

## Log Level Semantics (Clarification)

This feature establishes the following semantic meanings for log levels in this codebase:

| Level | Usage |
|-------|-------|
| ERROR | Unrecoverable errors requiring user attention |
| WARN | Recoverable issues, configuration problems |
| INFO | Significant state changes (startup, detection events, shutdown) |
| DEBUG | State transitions useful for debugging (focus gained/lost after dedup) |
| TRACE | Per-poll diagnostic details (candidate evaluation, focus check results) |
