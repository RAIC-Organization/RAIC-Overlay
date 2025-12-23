# Implementation Plan: Fix Duplicate Log File

**Branch**: `024-fix-duplicate-log` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-fix-duplicate-log/spec.md`

## Summary

Remove the custom `.target()` configuration that creates `app.log` and rely on tauri-plugin-log's default behavior which creates a log file named after the application's `productName` ("RAIC Overlay.log"). This eliminates duplicate log entries and reduces disk usage by ~50%.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: tauri-plugin-log 2.x, tauri 2.x
**Storage**: JSON log files in Tauri app log directory
**Testing**: Manual verification (check log directory after app launch)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: No performance impact (simplification only)
**Constraints**: Must preserve existing logging features (JSON format, rotation, cleanup)
**Scale/Scope**: Single file change (logging.rs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Removing unnecessary code improves maintainability |
| II. Testing Standards | PASS | Manual verification sufficient for config change |
| III. User Experience Consistency | PASS | Single log file improves user experience |
| IV. Performance Requirements | PASS | No performance impact; disk usage reduced |
| V. Research-First Development | PASS | tauri-plugin-log behavior verified in conversation |

**Gate Status**: PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/024-fix-duplicate-log/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A (no data model changes)
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A (no API changes)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/
└── src/
    └── logging.rs       # File to modify (remove .target(), update get_log_file_path)
```

**Structure Decision**: Single file modification in existing Rust backend. No new files or directories required.

## Complexity Tracking

> No Constitution Check violations - this section is not required.

## Implementation Approach

### Changes Required

1. **Remove custom target** in `build_log_plugin()`:
   - Delete lines 52-55 that add custom `LogDir` target with `file_name: Some("app".to_string())`
   - The default tauri-plugin-log behavior will use the app's `productName` ("RAIC Overlay")

2. **Update `get_log_file_path()`**:
   - Change `log_dir.join("app.log")` to `log_dir.join("RAIC Overlay.log")`

3. **Update `cleanup_old_logs()`**:
   - Change `file_name.starts_with("app.log")` to `file_name.starts_with("RAIC Overlay.log")`
   - Change `file_name == "app.log"` to `file_name == "RAIC Overlay.log"`

### Files Affected

| File | Change Type | Description |
|------|-------------|-------------|
| `src-tauri/src/logging.rs` | Modify | Remove custom target, update file path references |

### Risk Assessment

- **Low Risk**: Simple configuration change with well-understood behavior
- **Rollback**: Easy to revert by re-adding the `.target()` call
- **Testing**: Manual verification by checking log directory
