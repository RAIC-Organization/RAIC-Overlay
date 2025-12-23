# Research: Fix Duplicate Log File

**Feature**: 024-fix-duplicate-log
**Date**: 2025-12-23

## Research Summary

This feature requires minimal research as the root cause and solution were identified through direct code analysis.

## Finding 1: Duplicate Log File Cause

**Decision**: Remove custom `.target()` call and use default tauri-plugin-log behavior

**Rationale**:
- The current code in `logging.rs` lines 52-55 adds a custom `LogDir` target with `file_name: Some("app".to_string())`
- `tauri-plugin-log`'s `.target()` method **adds** a new target rather than **replacing** the default
- The default target creates a log file named after the app's `productName` from `tauri.conf.json`
- Result: Two log files are created - `app.log` (custom) and `RAIC Overlay.log` (default)

**Alternatives considered**:
1. Use `.clear_targets()` before adding custom target - Rejected: More complex, no benefit over using default
2. Keep both files with different purposes - Rejected: Unnecessary duplication, confusing for users

## Finding 2: Default Log File Name

**Decision**: The default log file name is "RAIC Overlay.log"

**Rationale**:
- Verified in `tauri.conf.json` line 3: `"productName": "RAIC Overlay"`
- `tauri-plugin-log` uses this productName to generate the default log filename
- Confirmed by existing `RAIC Overlay.log` file in the logs directory

**Alternatives considered**:
1. Rename productName to avoid spaces - Rejected: Breaking change, unnecessary

## Finding 3: Cleanup Function Update Required

**Decision**: Update `cleanup_old_logs()` to match new filename pattern

**Rationale**:
- Current cleanup function filters for files starting with "app.log"
- After the fix, rotated files will be named "RAIC Overlay.log.1", ".2", etc.
- The cleanup logic must be updated to match the new pattern

**Alternatives considered**:
1. Clean up all .log files - Rejected: Too aggressive, might delete unrelated files

## Finding 4: Import Cleanup

**Decision**: Remove unused `Target` and `TargetKind` imports

**Rationale**:
- After removing the custom target, these imports are no longer needed
- Keeping unused imports violates code quality principles
- Rust compiler will warn about unused imports

**Alternatives considered**: None - this is standard cleanup

## Research Completeness

| Topic | Status | Notes |
|-------|--------|-------|
| Root cause analysis | Complete | Custom target adds to defaults instead of replacing |
| Default filename behavior | Complete | Uses productName from tauri.conf.json |
| Impact on cleanup function | Complete | Pattern matching must be updated |
| Import cleanup | Complete | Remove unused Target/TargetKind |

**All NEEDS CLARIFICATION items resolved**: N/A (none existed)
