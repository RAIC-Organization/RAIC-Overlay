# Tasks: Runtime Settings System

**Input**: Design documents from `/specs/025-runtime-settings-toml/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests included as specified in constitution (Testing Standards principle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Rust Backend**: `src-tauri/src/`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`
- **Frontend**: `app/`
- **Config Files**: `src-tauri/` (example TOML)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add TOML dependency and update build system for compile-time defaults

- [X] T001 Add `toml = "0.8"` dependency to src-tauri/Cargo.toml
- [X] T002 Extend build.rs to embed VITE_DEBUG_BORDER and RAIC_LOG_LEVEL at compile time in src-tauri/build.rs
- [X] T003 Add rerun-if-env-changed directives for all three env vars in src-tauri/build.rs

---

## Phase 2: Foundational (Core Settings Module)

**Purpose**: Create the settings module that MUST be complete before any user story can use runtime configuration

**⚠️ CRITICAL**: User story integration cannot begin until this phase is complete

- [ ] T004 Create settings types (FileSettings, RuntimeSettings, SettingSource, SettingsSources) in src-tauri/src/settings.rs
- [ ] T005 Implement get_settings_path() function using std::env::current_exe() in src-tauri/src/settings.rs
- [ ] T006 Implement load_file_settings() to read and parse settings.toml in src-tauri/src/settings.rs
- [ ] T007 Implement RuntimeSettings::from_file_settings() for merging with compile-time defaults in src-tauri/src/settings.rs
- [ ] T008 Implement get_settings() function with OnceLock caching in src-tauri/src/settings.rs
- [ ] T009 Implement log_settings_sources() to log each setting's source at INFO level in src-tauri/src/settings.rs
- [ ] T010 Add settings module declaration in src-tauri/src/lib.rs
- [ ] T011 [P] Create settings.example.toml with documented defaults in src-tauri/settings.example.toml
- [ ] T012 [P] Add unit tests for TOML parsing edge cases in src-tauri/src/settings.rs

**Checkpoint**: Settings module ready - user story integration can now begin

---

## Phase 3: User Story 1 - Configure Target Window at Runtime (Priority: P1) 🎯 MVP

**Goal**: Allow users to change which window the overlay attaches to via settings.toml without rebuilding

**Independent Test**: Create settings.toml with `target_window_name = "Notepad"`, restart app, verify overlay attaches to Notepad windows

### Implementation for User Story 1

- [ ] T013 [US1] Modify TARGET_WINDOW_NAME in target_window.rs to use settings::get_settings() instead of env! macro in src-tauri/src/target_window.rs
- [ ] T014 [US1] Update find_target_window() to use runtime target_window_name in src-tauri/src/target_window.rs
- [ ] T015 [US1] Update error messages in lib.rs to use runtime target_window_name in src-tauri/src/lib.rs

**Checkpoint**: User Story 1 complete - target window can be configured at runtime

---

## Phase 4: User Story 2 - Graceful Fallback to Defaults (Priority: P1)

**Goal**: Ensure application works without settings.toml and uses build-time defaults when settings are missing

**Independent Test**: Remove settings.toml, restart app, verify it uses .env defaults; test partial settings.toml with missing properties

### Implementation for User Story 2

- [ ] T016 [US2] Add graceful error handling for missing settings.toml file in src-tauri/src/settings.rs
- [ ] T017 [US2] Add graceful error handling for malformed TOML syntax with warning log in src-tauri/src/settings.rs
- [ ] T018 [US2] Add graceful error handling for file permission errors in src-tauri/src/settings.rs
- [ ] T019 [US2] Add unit test for missing file fallback in src-tauri/src/settings.rs
- [ ] T020 [US2] Add unit test for partial settings file (missing properties) in src-tauri/src/settings.rs
- [ ] T021 [US2] Add unit test for malformed TOML fallback in src-tauri/src/settings.rs

**Checkpoint**: User Story 2 complete - all error scenarios handled gracefully

---

## Phase 5: User Story 3 - Configure Debug Border at Runtime (Priority: P2)

**Goal**: Allow users to enable/disable debug border via settings.toml without rebuilding

**Independent Test**: Set `debug_border = true` in settings.toml, restart app, verify red debug border appears

### Implementation for User Story 3

- [ ] T022 [US3] Create SettingsConfig struct for Tauri command response in src-tauri/src/settings.rs
- [ ] T023 [US3] Implement get_settings Tauri command in src-tauri/src/settings.rs
- [ ] T024 [US3] Register get_settings command in invoke_handler in src-tauri/src/lib.rs
- [ ] T025 [US3] Replace process.env.NEXT_PUBLIC_DEBUG_BORDER with invoke("get_settings") call in app/page.tsx
- [ ] T026 [US3] Update debug border useEffect to use async settings query in app/page.tsx

**Checkpoint**: User Story 3 complete - debug border configurable at runtime

---

## Phase 6: User Story 4 - Configure Log Level at Runtime (Priority: P2)

**Goal**: Allow users to adjust logging verbosity via settings.toml without rebuilding

**Independent Test**: Set `log_level = "DEBUG"` in settings.toml, restart app, verify detailed log entries appear

### Implementation for User Story 4

- [ ] T027 [US4] Implement parse_log_level() function with validation in src-tauri/src/settings.rs
- [ ] T028 [US4] Add warning log for invalid log_level values with fallback in src-tauri/src/settings.rs
- [ ] T029 [US4] Modify get_log_level() in logging.rs to use settings::get_settings() in src-tauri/src/logging.rs
- [ ] T030 [US4] Call settings initialization before logging plugin in run() in src-tauri/src/lib.rs
- [ ] T031 [US4] Add unit test for valid log level parsing in src-tauri/src/settings.rs
- [ ] T032 [US4] Add unit test for invalid log level fallback in src-tauri/src/settings.rs

**Checkpoint**: User Story 4 complete - log level configurable at runtime

---

## Phase 7: User Story 5 - Configuration File Location Discovery (Priority: P3)

**Goal**: Ensure settings.toml is discoverable next to the executable with example file

**Independent Test**: Verify settings.example.toml exists next to executable, copy to settings.toml and verify it works

### Implementation for User Story 5

- [ ] T033 [US5] Implement get_settings_sources Tauri command for debugging in src-tauri/src/settings.rs
- [ ] T034 [US5] Create SettingsSourcesResponse struct with Serialize in src-tauri/src/settings.rs
- [ ] T035 [US5] Register get_settings_sources command in invoke_handler in src-tauri/src/lib.rs
- [ ] T036 [US5] Update settings.example.toml with comprehensive documentation comments in src-tauri/settings.example.toml

**Checkpoint**: User Story 5 complete - configuration file discoverable with documentation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T037 [P] Run cargo clippy and fix any warnings in src-tauri/
- [ ] T038 [P] Run cargo test to verify all unit tests pass in src-tauri/
- [ ] T039 Verify settings source logging appears at startup with correct INFO format
- [ ] T040 Manual testing: verify quickstart.md scenarios work correctly
- [ ] T041 [P] Update CLAUDE.md if needed with new settings module information
- [ ] T042 Measure settings load time using std::time::Instant and verify < 10ms target in src-tauri/src/settings.rs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in parallel after Foundational
  - US3 and US4 are both P2 and can proceed after or in parallel with P1 stories
  - US5 is P3 and can proceed after or in parallel with other stories
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - modifies target_window.rs
- **User Story 2 (P1)**: Can start after Foundational - adds error handling in settings.rs
- **User Story 3 (P2)**: Requires T022-T024 from settings.rs - modifies frontend
- **User Story 4 (P2)**: Can start after Foundational - modifies logging.rs and lib.rs
- **User Story 5 (P3)**: Can start after T022-T024 - adds get_settings_sources command

### Within Each User Story

- Core settings functions must exist before integration
- Backend changes before frontend changes
- Unit tests alongside implementation

### Parallel Opportunities

**Phase 1 (Setup)**:
```
No parallel opportunities - T002 and T003 modify same file sequentially
```

**Phase 2 (Foundational)**:
```
T011 [P] + T012 [P] - Example file and tests (different files)
```

**Phase 8 (Polish)**:
```
T037 [P] + T038 [P] + T041 [P] - Independent validation tasks
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T012)
3. Complete Phase 3: User Story 1 (T013-T015)
4. Complete Phase 4: User Story 2 (T016-T021)
5. **STOP and VALIDATE**: Test runtime target_window_name and fallback behavior
6. Deploy/demo if ready

### Incremental Delivery

1. MVP (US1 + US2) → Target window runtime configurable with graceful fallback
2. Add US3 → Debug border runtime configurable
3. Add US4 → Log level runtime configurable
4. Add US5 → Settings discovery improvements
5. Each addition works without breaking previous functionality

### Task Count Summary

| Phase | Task Count | Purpose |
|-------|------------|---------|
| Phase 1: Setup | 3 | Dependencies and build system |
| Phase 2: Foundational | 9 | Core settings module |
| Phase 3: US1 (P1) | 3 | Target window runtime config |
| Phase 4: US2 (P1) | 6 | Graceful fallback behavior |
| Phase 5: US3 (P2) | 5 | Debug border runtime config |
| Phase 6: US4 (P2) | 6 | Log level runtime config |
| Phase 7: US5 (P3) | 4 | Settings discovery |
| Phase 8: Polish | 6 | Validation and cleanup |
| **Total** | **42** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
