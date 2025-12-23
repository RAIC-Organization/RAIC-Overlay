# Tasks: Fix Duplicate Log File

**Input**: Design documents from `/specs/024-fix-duplicate-log/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested - manual verification only per plan.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: `src-tauri/src/` for Rust backend code
- Single file modification: `src-tauri/src/logging.rs`

---

## Phase 1: Setup

**Purpose**: Verify build environment and understand current state

- [X] T001 Verify project builds successfully with `cargo build` in src-tauri/
- [X] T002 Confirm current log files exist in `%LOCALAPPDATA%\com.raicoverlay.app\logs\` (app.log and RAIC Overlay.log)

---

## Phase 2: User Story 1 - Single Log File Output (Priority: P1) 🎯 MVP

**Goal**: Eliminate duplicate log files by removing custom target configuration

**Independent Test**: Launch application, check logs directory - only "RAIC Overlay.log" should exist

### Implementation for User Story 1

- [X] T003 [US1] Remove unused `Target` and `TargetKind` imports from src-tauri/src/logging.rs line 6 *(imports retained for Stdout target)*
- [X] T004 [US1] Remove custom `.target()` call (lines 52-55) from `build_log_plugin()` in src-tauri/src/logging.rs
- [X] T005 [US1] Update `get_log_file_path()` to return "RAIC Overlay.log" instead of "app.log" in src-tauri/src/logging.rs line 73
- [X] T006 [US1] Update `cleanup_old_logs()` pattern matching from "app.log" to "RAIC Overlay.log" in src-tauri/src/logging.rs (two locations: starts_with check and equality check)

**Checkpoint**: Build succeeds, single log file created on launch

---

## Phase 3: User Story 2 - Consistent Log File Naming (Priority: P2)

**Goal**: Ensure log file is named after the application for easy identification

**Independent Test**: Check log filename matches application's productName

### Implementation for User Story 2

> **Note**: User Story 2 is fully satisfied by User Story 1 implementation - no additional tasks required.
> The default tauri-plugin-log behavior uses the productName ("RAIC Overlay") from tauri.conf.json.

**Checkpoint**: Log file named "RAIC Overlay.log" identifies the source application

---

## Phase 4: Polish & Verification

**Purpose**: Final verification and cleanup

- [X] T007 Build project with `cargo build` and verify no compilation errors
- [X] T008 Delete existing log files from `%LOCALAPPDATA%\com.raicoverlay.app\logs\`
- [ ] T009 Run application and verify only "RAIC Overlay.log" is created (no "app.log") *(requires manual verification)*
- [ ] T010 Verify log entries are written to "RAIC Overlay.log" in JSON format *(requires manual verification)*
- [ ] T010a Verify existing logging features preserved: JSON format, log level filtering (set RAIC_LOG_LEVEL=DEBUG), rotation config unchanged *(requires manual verification)*
- [ ] T011 Run quickstart.md verification steps to confirm all acceptance criteria met *(requires manual verification)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - verify environment first
- **Phase 2 (User Story 1)**: Depends on Phase 1 - core implementation
- **Phase 3 (User Story 2)**: Automatically satisfied by Phase 2
- **Phase 4 (Polish)**: Depends on Phase 2 completion

### Task Dependencies (Within Phase 2)

- T003, T004, T005, T006 all modify `src-tauri/src/logging.rs` - execute sequentially
- Order: T003 (imports) → T004 (remove target) → T005 (get_log_file_path) → T006 (cleanup pattern)

### No Parallel Opportunities

All implementation tasks (T003-T006) modify the same file and must be executed sequentially.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: User Story 1 (all tasks T003-T006)
3. **STOP and VALIDATE**: Build and run application
4. Verify single log file exists

### Single File Change

This feature requires only 4 edits to a single file (`src-tauri/src/logging.rs`):
1. Remove imports (T003)
2. Remove custom target (T004)
3. Update get_log_file_path (T005)
4. Update cleanup pattern (T006)

---

## Notes

- All implementation tasks modify same file - no parallelization possible
- Manual verification per plan.md (no automated tests)
- Low risk change - easy rollback by reverting logging.rs
- Existing log cleanup mechanism will remove orphaned "app.log" files within 7 days
