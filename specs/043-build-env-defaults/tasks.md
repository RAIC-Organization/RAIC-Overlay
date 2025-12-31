# Tasks: Build-Time Environment Variable Defaults

**Input**: Design documents from `/specs/043-build-env-defaults/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in the feature specification. Existing unit tests in settings.rs will be updated as needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri backend**: `src-tauri/` at repository root
- **Documentation**: `.env.example` at repository root

---

## Phase 1: Setup

**Purpose**: No setup required - this feature modifies existing files only

*No tasks in this phase - feature works with existing project structure*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create helper function in build.rs that all user stories will use

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Create `get_env_or_default()` helper function in `src-tauri/build.rs` that returns (value, from_env) tuple with empty/whitespace filtering

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Build Without Environment Variables (Priority: P1) 🎯 MVP

**Goal**: Enable zero-configuration builds with Star Citizen defaults for all three window detection settings

**Independent Test**: Remove all TARGET_WINDOW_NAME, TARGET_PROCESS_NAME, and TARGET_WINDOW_CLASS environment variables, run `cargo build`, verify the application starts and uses defaults ("Star Citizen", "StarCitizen.exe", "CryENGINE")

### Implementation for User Story 1

- [X] T002 [US1] Modify `TARGET_WINDOW_NAME` handling in `src-tauri/build.rs` to use `get_env_or_default()` with default "Star Citizen" (remove `.expect()`)
- [X] T003 [US1] Add `TARGET_PROCESS_NAME` env var handling in `src-tauri/build.rs` using `get_env_or_default()` with default "StarCitizen.exe"
- [X] T004 [US1] Add `TARGET_WINDOW_CLASS` env var handling in `src-tauri/build.rs` using `get_env_or_default()` with default "CryENGINE"
- [X] T005 [US1] Add `cargo:rerun-if-env-changed` for TARGET_PROCESS_NAME and TARGET_WINDOW_CLASS in `src-tauri/build.rs`
- [X] T006 [US1] Add build configuration logging (FR-009) using `cargo:warning=` in `src-tauri/build.rs` to show which values are from env vs default
- [X] T007 [US1] Remove `DEFAULT_PROCESS_NAME` constant from `src-tauri/src/settings.rs`
- [X] T008 [US1] Remove `DEFAULT_WINDOW_CLASS` constant from `src-tauri/src/settings.rs`
- [X] T009 [US1] Replace `DEFAULT_PROCESS_NAME.to_string()` with `env!("TARGET_PROCESS_NAME").to_string()` in `from_file_settings()` in `src-tauri/src/settings.rs`
- [X] T010 [US1] Replace `DEFAULT_WINDOW_CLASS.to_string()` with `env!("TARGET_WINDOW_CLASS").to_string()` in `from_file_settings()` in `src-tauri/src/settings.rs`

**Checkpoint**: At this point, User Story 1 should be fully functional - builds work without any env vars set

---

## Phase 4: User Story 2 - Custom Target Window Name (Priority: P2)

**Goal**: Enable developers to customize TARGET_WINDOW_NAME via environment variable at build time

**Independent Test**: Set `TARGET_WINDOW_NAME=Notepad`, run `cargo build`, verify the built application uses "Notepad" as the target window name

### Implementation for User Story 2

- [X] T011 [US2] Verify TARGET_WINDOW_NAME override works by testing with custom value (manual verification - implementation done in US1)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - default builds and custom TARGET_WINDOW_NAME builds both function correctly

---

## Phase 5: User Story 3 - Custom Process Name and Window Class (Priority: P3)

**Goal**: Enable developers to customize all three detection parameters independently

**Independent Test**: Set `TARGET_PROCESS_NAME=notepad.exe` and `TARGET_WINDOW_CLASS=Notepad`, run `cargo build`, verify the built application uses these custom values

### Implementation for User Story 3

- [X] T012 [US3] Verify TARGET_PROCESS_NAME override works by testing with custom value (manual verification - implementation done in US1)
- [X] T013 [US3] Verify TARGET_WINDOW_CLASS override works by testing with custom value (manual verification - implementation done in US1)
- [X] T014 [US3] Verify mixed configuration works (e.g., custom TARGET_WINDOW_NAME with default process/class)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and final verification

- [X] T015 [P] Update `.env.example` to mark TARGET_WINDOW_NAME as optional and add TARGET_PROCESS_NAME and TARGET_WINDOW_CLASS with documentation
- [X] T016 [P] Update `check-build.ps1` to make TARGET_WINDOW_NAME optional or remove the line that sets it (currently sets `$env:TARGET_WINDOW_NAME = "Star Citizen"` on line 1)
- [X] T017 Run quickstart.md validation - test zero-config build, custom build, and partial customization scenarios
- [X] T018 Verify settings.toml runtime override still works and takes precedence over build-time values

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks - feature uses existing structure
- **Foundational (Phase 2)**: T001 must complete first - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - this is the core implementation
- **User Story 2 (Phase 4)**: Verification only - depends on US1 completion
- **User Story 3 (Phase 5)**: Verification only - depends on US1 completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Contains all implementation tasks
- **User Story 2 (P2)**: Depends on US1 completion - Verification only
- **User Story 3 (P3)**: Depends on US1 completion - Verification only

### Within User Story 1

- T001 (helper function) must complete first
- T002-T006 (build.rs changes) can be done together
- T007-T010 (settings.rs changes) can be done after build.rs changes

### Parallel Opportunities

- T015, T016 can run in parallel (different files)
- T002-T006 are sequential changes to same file (build.rs)
- T007-T010 are sequential changes to same file (settings.rs)

---

## Parallel Example: User Story 1

```bash
# After T001 completes, build.rs and settings.rs can be modified in sequence:

# First: build.rs changes (T002-T006)
Task: "Modify TARGET_WINDOW_NAME handling in src-tauri/build.rs"
Task: "Add TARGET_PROCESS_NAME env var handling in src-tauri/build.rs"
Task: "Add TARGET_WINDOW_CLASS env var handling in src-tauri/build.rs"
Task: "Add cargo:rerun-if-env-changed for new env vars"
Task: "Add build configuration logging"

# Then: settings.rs changes (T007-T010)
Task: "Remove DEFAULT_PROCESS_NAME constant"
Task: "Remove DEFAULT_WINDOW_CLASS constant"
Task: "Replace with env!() macros"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001)
2. Complete Phase 3: User Story 1 (T002-T010)
3. **STOP and VALIDATE**: Test zero-config build
4. Build completes without setting any env vars

### Incremental Delivery

1. Complete Foundational → Helper function ready
2. Add User Story 1 → Test zero-config build → MVP!
3. Verify User Story 2 → Test custom TARGET_WINDOW_NAME
4. Verify User Story 3 → Test custom process/class
5. Polish → Documentation updates

### Single Developer Strategy

This is a small feature - single developer can complete all tasks sequentially:

1. T001 → T002-T010 → T011-T014 → T015-T018
2. Estimated: 1-2 hours total implementation time

---

## Notes

- Most implementation is in User Story 1 (T002-T010)
- User Stories 2 and 3 are verification tasks - the implementation supports all use cases
- No new files created - only modifications to existing files
- No breaking changes - default values match current hardcoded behavior
- settings.toml runtime override functionality is preserved (FR-008)
