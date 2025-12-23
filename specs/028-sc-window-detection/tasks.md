# Tasks: Star Citizen Window Detection Enhancement

**Input**: Design documents from `/specs/028-sc-window-detection/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Unit tests included for validation logic (T053, T054). Integration testing uses manual validation via quickstart.md because window detection requires a live Star Citizen instance with specific window states (launcher vs game) that cannot be reliably mocked in automated tests. This follows Constitution Principle II which allows manual integration testing when automated tests are impractical for external system dependencies.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend (Rust)**: `src-tauri/src/`
- **Frontend (TypeScript)**: `src/` (no changes needed for this feature)

---

## Phase 1: Setup

**Purpose**: Add required Windows API dependencies and configure project

- [X] T001 Update Cargo.toml to add `Win32_System_Threading` feature in `src-tauri/Cargo.toml`
- [X] T002 Update Cargo.toml to add `Win32_System_ProcessStatus` feature in `src-tauri/Cargo.toml`
- [X] T003 Verify build compiles with new windows-rs features by running `cargo build` in src-tauri/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and settings that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add `WindowCandidate` struct to `src-tauri/src/types.rs` with fields: hwnd, process_name, window_class, window_title, is_top_level
- [ ] T005 Add `SearchCriteria` struct to `src-tauri/src/types.rs` with fields: process_name, window_class, window_title
- [ ] T006 Add `DetectionResult` struct to `src-tauri/src/types.rs` with fields: success, matched_window, candidates_evaluated, search_criteria, detection_time_ms
- [ ] T007 [P] Add new error variants to `TargetWindowError` enum in `src-tauri/src/types.rs`: ProcessNotRunning, WindowNotReady, ClassMismatch
- [ ] T008 [P] Add `target_process_name` optional field to `FileSettings` struct in `src-tauri/src/settings.rs`
- [ ] T009 [P] Add `target_window_class` optional field to `FileSettings` struct in `src-tauri/src/settings.rs`
- [ ] T010 [P] Add `process_monitor_interval_ms` optional field to `FileSettings` struct in `src-tauri/src/settings.rs`
- [ ] T011 Add default constants for Star Citizen: `DEFAULT_PROCESS_NAME`, `DEFAULT_WINDOW_CLASS` in `src-tauri/src/settings.rs`
- [ ] T012 Add accessor functions `get_target_process_name()`, `get_target_window_class()`, `get_process_monitor_interval()` in `src-tauri/src/settings.rs`

**Checkpoint**: Foundation ready - types and settings configured. User story implementation can now begin.

---

## Phase 3: User Story 1 - Reliable Game Detection (Priority: P1) 🎯 MVP

**Goal**: Implement three-point window verification (process + class + title) so overlay correctly identifies Star Citizen game window

**Independent Test**: Launch Star Citizen with RSI Launcher open, press F3, verify overlay appears over game window (not launcher)

### Implementation for User Story 1

- [ ] T013 [US1] Add `get_window_class(hwnd: HWND) -> String` function in `src-tauri/src/target_window.rs` using `GetClassNameW`
- [ ] T014 [US1] Add `get_process_name(hwnd: HWND) -> Option<String>` function in `src-tauri/src/target_window.rs` using `GetWindowThreadProcessId` + `OpenProcess` + `QueryFullProcessImageNameW`
- [ ] T015 [US1] Add `is_top_level_window(hwnd: HWND) -> bool` function in `src-tauri/src/target_window.rs` using `GetAncestor(hwnd, GA_ROOT)`
- [ ] T016 [US1] Create `build_window_candidate(hwnd: HWND) -> WindowCandidate` helper function in `src-tauri/src/target_window.rs` that populates all fields
- [ ] T017 [US1] Modify `find_target_window()` in `src-tauri/src/target_window.rs` to use three-point verification: check process name matches, check window class matches, check title contains pattern
- [ ] T018 [US1] Add `validate_candidate(candidate: &WindowCandidate, criteria: &SearchCriteria) -> bool` function in `src-tauri/src/target_window.rs`
- [ ] T019 [US1] Modify `find_target_window()` to return `DetectionResult` instead of just `Result<HWND, TargetWindowError>` in `src-tauri/src/target_window.rs`
- [ ] T020 [US1] Update `toggle_visibility()` in `src-tauri/src/lib.rs` to handle new `DetectionResult` return type and show appropriate error modals for ClassMismatch and WindowNotReady (FR-007: "Game process running but window not ready")
- [ ] T021 [US1] Add case-insensitive matching for window title (FR-008) in `validate_candidate()` function in `src-tauri/src/target_window.rs`
- [ ] T022 [US1] Add prioritization logic for CryENGINE class matches (FR-009) when multiple candidates exist in `src-tauri/src/target_window.rs`

**Checkpoint**: User Story 1 complete - Three-point verification working. Overlay correctly identifies Star Citizen vs RSI Launcher.

---

## Phase 4: User Story 2 - Hotkey Event Logging (Priority: P2)

**Goal**: Log all F3/F5 key presses with timestamps and outcomes for debugging

**Independent Test**: Press F3/F5 in various states, review log file for corresponding entries

### Implementation for User Story 2

- [ ] T023 [US2] Add `HotkeyEvent` struct to `src-tauri/src/types.rs` with fields: key_code, timestamp, overlay_visible_before, overlay_mode_before, action_taken, outcome
- [ ] T024 [US2] Add `log_hotkey_event(event: &HotkeyEvent)` helper function in `src-tauri/src/hotkey.rs`
- [ ] T025 [US2] Add `log::info!()` call at start of F3 handler in `src-tauri/src/hotkey.rs` with format: "F3 pressed: visible={}, mode={:?}"
- [ ] T026 [US2] Add `log::info!()` call at start of F5 handler in `src-tauri/src/hotkey.rs` with format: "F5 pressed: mode_before={:?}"
- [ ] T027 [US2] Add outcome logging at end of `toggle_visibility()` in `src-tauri/src/lib.rs` with format: "F3 outcome: {}"
- [ ] T028 [US2] Add outcome logging at end of `toggle_mode()` in `src-tauri/src/lib.rs` with format: "F5 outcome: mode_after={:?}"

**Checkpoint**: User Story 2 complete - All hotkey presses logged with timestamps and outcomes.

---

## Phase 5: User Story 3 - Window Detection Logging (Priority: P2)

**Goal**: Log detailed window detection information including all candidates evaluated

**Independent Test**: Trigger window detection, examine logs for process name, window class, title of all candidates

### Implementation for User Story 3

- [ ] T029 [US3] Add `log::debug!()` calls in `find_target_window()` enum callback to log each candidate: "Window candidate: process={}, class={}, title={}, valid={}" in `src-tauri/src/target_window.rs`
- [ ] T030 [US3] Add timing measurement using `std::time::Instant` at start/end of `find_target_window()` in `src-tauri/src/target_window.rs`
- [ ] T031 [US3] Add `log::info!()` at end of detection with summary: "Detection complete: {} candidates evaluated, matched={}, time={}ms" in `src-tauri/src/target_window.rs`
- [ ] T032 [US3] Add `log::warn!()` when no matching window found: "No matching window found for pattern: {}" in `src-tauri/src/target_window.rs`
- [ ] T033 [US3] Add `log::debug!()` at start of detection with search criteria: "Starting window detection: process={}, class={}, title={}" in `src-tauri/src/target_window.rs`

**Checkpoint**: User Story 3 complete - Window detection provides detailed diagnostic logs.

---

## Phase 6: User Story 4 - Focus State Logging (Priority: P3)

**Goal**: Log why overlay didn't appear when target window exists but isn't focused

**Independent Test**: Press F3 while Star Citizen is running but Alt-Tabbed away, check logs show focus issue

### Implementation for User Story 4

- [ ] T034 [US4] Add `get_foreground_window_info() -> (String, String)` function in `src-tauri/src/target_window.rs` returning (process_name, window_title) of current foreground window
- [ ] T035 [US4] Modify `is_target_focused()` to also log focus state in `src-tauri/src/target_window.rs`
- [ ] T036 [US4] Add `log::warn!()` in `toggle_visibility()` when target found but not focused: "Target detected but not focused - overlay not shown. Foreground: process={}, title={}" in `src-tauri/src/lib.rs`
- [ ] T037 [US4] Add `log::info!()` when target is focused and showing overlay: "Target focused - showing overlay" in `src-tauri/src/lib.rs`

**Checkpoint**: User Story 4 complete - Users can diagnose focus issues from logs.

---

## Phase 7: User Story 5 - Automatic Game Launch Detection (Priority: P2)

**Goal**: Automatically detect when Star Citizen launches/exits and show/hide overlay accordingly

**Independent Test**: Start overlay first, launch Star Citizen, verify overlay detects game without F3 press

### Implementation for User Story 5

- [ ] T038 [US5] Create new module `src-tauri/src/process_monitor.rs` with module declaration
- [ ] T039 [US5] Add `ProcessMonitorState` struct in `src-tauri/src/process_monitor.rs` with fields: is_monitoring, target_process_found, target_hwnd, last_check_time, user_manually_hidden, polling_interval_ms
- [ ] T040 [US5] Implement `is_process_running(target_process: &str) -> bool` function in `src-tauri/src/process_monitor.rs` using EnumProcesses or window enumeration
- [ ] T041 [US5] Implement `start_process_monitor(app_handle: AppHandle)` function in `src-tauri/src/process_monitor.rs` that spawns monitoring thread
- [ ] T042 [US5] Implement polling loop in process monitor that checks for target process every `polling_interval_ms` in `src-tauri/src/process_monitor.rs`
- [ ] T043 [US5] Add `log::info!()` when target process detected: "Target process detected: {}" in `src-tauri/src/process_monitor.rs`
- [ ] T044 [US5] Add `log::info!()` when target process terminated: "Target process terminated" in `src-tauri/src/process_monitor.rs`
- [ ] T045 [US5] Emit Tauri event "target-process-detected" when process starts in `src-tauri/src/process_monitor.rs`
- [ ] T046 [US5] Emit Tauri event "target-process-terminated" when process exits in `src-tauri/src/process_monitor.rs`
- [ ] T047 [US5] Add `mod process_monitor;` to `src-tauri/src/lib.rs`
- [ ] T048 [US5] Call `process_monitor::start_process_monitor()` from app setup in `src-tauri/src/lib.rs`
- [ ] T049 [US5] Add logic to auto-show overlay when game window detected and focused (unless user_manually_hidden) in `src-tauri/src/process_monitor.rs`
- [ ] T050 [US5] Update `toggle_visibility()` to set `user_manually_hidden` flag when user presses F3 to hide in `src-tauri/src/lib.rs`
- [ ] T051 [US5] Reset `user_manually_hidden` flag on fresh game launch (process was not running, now detected) in `src-tauri/src/process_monitor.rs`

**Checkpoint**: User Story 5 complete - Overlay automatically detects game launch/exit.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T052 Verify all log levels follow FR-010 convention (DEBUG for routine, INFO for events, WARN for failures) across all modified files
- [ ] T053 Add unit tests for `validate_candidate()` function in `src-tauri/src/target_window.rs`
- [ ] T054 Add unit tests for `is_top_level_window()` function in `src-tauri/src/target_window.rs`
- [ ] T055 Run `cargo clippy` and fix any warnings in `src-tauri/`
- [ ] T056 Run `cargo test` and verify all tests pass in `src-tauri/`
- [ ] T057 Manual validation: Follow quickstart.md test scenarios with Star Citizen
- [ ] T058 Update README or documentation if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Must complete first - provides core detection
  - US2, US3, US5 (P2): Can proceed after US1 completes
  - US4 (P3): Can proceed after US1 completes
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - No dependencies on other stories (MVP)
- **User Story 2 (P2)**: Foundational only - Can integrate with US1 detection results
- **User Story 3 (P2)**: Depends on US1 (uses detection infrastructure)
- **User Story 4 (P3)**: Depends on US1 (uses detection infrastructure)
- **User Story 5 (P2)**: Depends on US1 (uses detection for auto-show)

### Within Each User Story

- Types/structs before functions that use them
- Helper functions before main functions
- Core implementation before logging
- Logging before integration

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T007, T008, T009, T010 can run in parallel (different sections of different files)

**Phase 3 (US1)**:
- T013, T014, T015 can run in parallel (independent helper functions)

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch these tasks together (different files/sections):
Task: "T007 - Add new error variants to TargetWindowError"
Task: "T008 - Add target_process_name field to FileSettings"
Task: "T009 - Add target_window_class field to FileSettings"
Task: "T010 - Add process_monitor_interval_ms field to FileSettings"
```

## Parallel Example: User Story 1 Helper Functions

```bash
# Launch these tasks together (independent functions):
Task: "T013 - Add get_window_class() function"
Task: "T014 - Add get_process_name() function"
Task: "T015 - Add is_top_level_window() function"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T012)
3. Complete Phase 3: User Story 1 (T013-T022)
4. **STOP and VALIDATE**: Test with Star Citizen + RSI Launcher
5. Deploy if ready - core detection working

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Three-point detection working (MVP!)
3. Add User Story 2 → Hotkey logging enabled
4. Add User Story 3 → Detection logging enabled
5. Add User Story 4 → Focus logging enabled
6. Add User Story 5 → Auto-detection enabled
7. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Primary files modified: `target_window.rs`, `settings.rs`, `hotkey.rs`, `lib.rs`, `types.rs`
- One new file: `process_monitor.rs`
