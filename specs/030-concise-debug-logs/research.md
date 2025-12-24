# Research: Concise Debug Logs

**Branch**: `030-concise-debug-logs`
**Date**: 2025-12-24

## Current State Analysis

### Log Infrastructure (No Changes Needed)

The existing logging infrastructure uses:
- **`log` crate (0.4)**: Standard Rust logging facade with macros (`log::trace!`, `log::debug!`, `log::info!`, `log::warn!`, `log::error!`)
- **`tauri-plugin-log` (2.x)**: Tauri integration with file rotation, JSON formatting, and configurable log levels
- **Configuration**: Log level is configurable via `settings.toml` (`log_level = "DEBUG"`) with runtime parsing

### Current Problematic Log Statements

#### 1. `target_window.rs` - Window Detection (MAJOR SOURCE)

| Location | Current Level | Issue |
|----------|---------------|-------|
| Line 160-163 | `log::debug!` | Logs search criteria on EVERY `find_target_window_verified()` call |
| Line 204-210 | `log::debug!` | Logs EVERY window candidate (hundreds per detection) |
| Line 237-240 | `log::info!` | Detection summary - OK to keep |
| Line 363-369 | `log::debug!` | Logs focus state on EVERY `is_target_focused()` call |

**Impact**: With process monitor polling every 1000ms, this generates thousands of lines per hour.

#### 2. `focus_monitor.rs` - Focus Monitoring (MAJOR SOURCE)

| Location | Current Level | Issue |
|----------|---------------|-------|
| Called from `handle_focus_check()` | N/A | Calls `is_target_focused()` every 100ms which logs via target_window.rs |

**Impact**: 36,000 log entries per hour just from focus polling.

#### 3. `process_monitor.rs` - Process Monitoring (MINOR)

| Location | Current Level | Issue |
|----------|---------------|-------|
| Line 122 | `log::debug!` | "Already running" - one-time, OK |
| Line 130-133 | `log::info!` | "Starting monitor" - one-time, OK |
| Line 141 | `log::info!` | "Monitor stopped" - one-time, OK |
| Line 150 | `log::info!` | "Process detected" - event-based, OK |
| Line 177 | `log::debug!` | "User manually hidden" - event-based, OK |
| Line 185 | `log::info!` | "Process terminated" - event-based, OK |

**Impact**: Process monitor itself is already event-based. Issues come from calling `find_target_window_verified()`.

## Solution Design

### Decision 1: Log Level Strategy

**Decision**: Use `log::trace!` for per-poll diagnostic information, `log::debug!` for state transitions only.

**Rationale**: 
- TRACE is the lowest level, typically disabled in production
- DEBUG should contain actionable information for common debugging
- This follows the log crate's intended semantics

**Alternatives Considered**:
1. Remove debug logs entirely - Rejected: loses diagnostic capability
2. Add conditional logging based on state change - Rejected: adds complexity vs simple level change

### Decision 2: Focus Deduplication

**Decision**: Track last focus log timestamp; skip logging if same state within 500ms.

**Rationale**:
- Rapid focus oscillation can occur during window transitions
- 500ms window prevents spam while still logging distinct events
- Uses `std::time::Instant` for monotonic timing

**Alternatives Considered**:
1. Count-based deduplication (every Nth log) - Rejected: doesn't handle burst scenarios
2. Remove focus logging entirely - Rejected: focus events are valuable for debugging

### Decision 3: Detection Summary

**Decision**: Keep INFO-level summary for successful detection, single WARN for failures.

**Rationale**:
- Detection events are infrequent and meaningful
- Summary provides useful context without per-candidate noise

## Implementation Approach

### Phase 1: Change Log Levels (target_window.rs)

1. `find_target_window_verified()`:
   - Line 160-163: Change `log::debug!` → `log::trace!` for search criteria
   - Line 204-210: Change `log::debug!` → `log::trace!` for each candidate
   - Line 237-240: Keep `log::info!` for detection summary

2. `is_target_focused()`:
   - Line 362-369: Change `log::debug!` → `log::trace!` for focus state

### Phase 2: Add Focus Deduplication (focus_monitor.rs)

1. Add module-level state:
   ```rust
   static LAST_FOCUS_LOG: Mutex<Option<(bool, Instant)>> = Mutex::new(None);
   ```

2. Before logging focus transitions in `handle_focus_lost/gained`:
   - Check if same state was logged within 500ms
   - Skip if duplicate, log if new or expired

### Phase 3: Review Other Modules

1. `lib.rs` - Startup logging: Already event-based, no changes needed
2. `settings.rs` - Settings logging: Already one-time on init, no changes needed
3. `process_monitor.rs` - Already event-based, no changes needed

## Testing Strategy

### Unit Tests

1. **Deduplication Logic**:
   - Test that same state within 500ms is deduplicated
   - Test that different state logs immediately
   - Test that same state after 500ms logs again

### Integration Tests

1. **Log Output Verification** (manual):
   - Run app for 5 minutes with target process
   - Verify log file size < 10KB
   - Verify state transitions are logged

### Performance Validation

1. Run with `log_level = "TRACE"` to verify verbose output still works
2. Run with `log_level = "DEBUG"` to verify concise output
3. Compare log file sizes before/after refactoring

## References

- [log crate documentation](https://docs.rs/log/latest/log/)
- [tauri-plugin-log documentation](https://docs.rs/tauri-plugin-log/latest/tauri_plugin_log/)
- Existing implementation in `src-tauri/src/logging.rs`
