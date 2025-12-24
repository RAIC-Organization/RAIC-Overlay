# Implementation Plan: Concise Debug Logs

**Branch**: `030-concise-debug-logs` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-concise-debug-logs/spec.md`

## Summary

Refactor debug logging to be event-based instead of continuous loop logging. The current implementation logs on every polling cycle (every 100ms for focus monitoring, every 1000ms for process detection), making log files unreadable. The solution changes `log::debug!` calls to `log::trace!` for per-poll details, keeps `log::debug!` for state transitions only, and adds focus change deduplication to prevent rapid oscillation spam.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: `log` 0.4, `tauri-plugin-log` 2.x (existing infrastructure)
**Storage**: N/A (log files managed by tauri-plugin-log with rotation)
**Testing**: `cargo test` (unit tests for deduplication logic)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (Rust backend + React frontend)
**Performance Goals**: Log file growth <1KB/30min during stable operation; <1 log entry/min average during stable state
**Constraints**: No changes to log infrastructure; preserve TRACE-level capability for deep debugging
**Scale/Scope**: 3 Rust modules to modify (target_window.rs, focus_monitor.rs, process_monitor.rs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Refactoring existing code, single responsibility maintained |
| II. Testing Standards | ✅ PASS | Will add unit tests for deduplication logic |
| III. User Experience Consistency | ✅ PASS | N/A - backend logging only, no UI changes |
| IV. Performance Requirements | ✅ PASS | Reduces I/O load by eliminating excessive logging |
| V. Research-First Development | ✅ PASS | Using existing log crate; no new dependencies |

**Simplicity Standard Check**:
- ✅ Uses simplest approach: change log level macros, add timestamp tracking for deduplication
- ✅ No new dependencies
- ✅ No new abstractions; uses existing log infrastructure

## Project Structure

### Documentation (this feature)

```text
specs/030-concise-debug-logs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no new data)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── target_window.rs    # Window detection logging (MODIFY)
│   ├── focus_monitor.rs    # Focus change logging (MODIFY)
│   ├── process_monitor.rs  # Process detection logging (MODIFY)
│   ├── lib.rs              # Application startup logging (REVIEW)
│   ├── settings.rs         # Settings loading logging (REVIEW)
│   ├── logging.rs          # Log infrastructure (NO CHANGE)
│   └── logging_types.rs    # Log types (NO CHANGE)
└── Cargo.toml              # Dependencies (NO CHANGE)
```

**Structure Decision**: Existing Tauri desktop app structure. This feature modifies logging statements in 3-5 existing Rust modules; no new files required.

## Complexity Tracking

No violations - this is a straightforward refactoring with no new abstractions or dependencies.
