# Tasks: Concise Debug Logs

**Input**: Design documents from `/specs/030-concise-debug-logs/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Unit tests for deduplication logic requested in plan.md - included below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri Desktop App**: `src-tauri/src/` for Rust backend
- Paths follow existing project structure from plan.md

---

## Phase 1: Setup

**Purpose**: No new project setup needed - this is a refactoring of existing code

- [X] T001 Review current log output by running app with DEBUG level for baseline comparison

**Note**: This feature modifies existing files only; no new project initialization required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add deduplication infrastructure that US1 depends on

**⚠️ CRITICAL**: Focus deduplication logic must be in place before US1 can fully validate

- [X] T002 Add focus log deduplication state and helper function in `src-tauri/src/focus_monitor.rs`
- [X] T003 Add unit tests for deduplication logic in `src-tauri/src/focus_monitor.rs`
- [X] T003.5 Add unit test verifying errors are logged immediately without deduplication in `src-tauri/src/focus_monitor.rs`

**Checkpoint**: Deduplication infrastructure ready - user story implementation can begin

---

## Phase 3: User Story 1 - Developer Reads Log File for Debugging (Priority: P1) 🎯 MVP

**Goal**: Make log files readable by eliminating continuous polling output; only event-based logging at DEBUG level

**Independent Test**: Run app for 5 minutes with target process, verify log file contains only distinct events (startup, detection, focus changes), not thousands of per-poll entries

### Implementation for User Story 1

- [X] T004 [P] [US1] Change `log::debug!` to `log::trace!` for search criteria logging in `find_target_window_verified()` at line ~160-163 in `src-tauri/src/target_window.rs`
- [X] T005 [P] [US1] Change `log::debug!` to `log::trace!` for per-candidate logging in `find_target_window_verified()` at line ~204-210 in `src-tauri/src/target_window.rs`
- [X] T006 [P] [US1] Change `log::debug!` to `log::trace!` for focus state logging in `is_target_focused()` at line ~362-369 in `src-tauri/src/target_window.rs`
- [X] T007 [US1] Integrate focus deduplication into `handle_focus_lost()` and `handle_focus_gained()` in `src-tauri/src/focus_monitor.rs`
- [X] T007.5 [US1] Verify process_monitor.rs logs state changes only (detected/terminated) not per-poll in `src-tauri/src/process_monitor.rs`
- [X] T008 [US1] Verify DEBUG-level detection summary is logged in `find_target_window_verified()` at line ~237-240 in `src-tauri/src/target_window.rs` (per FR-009)
- [X] T009 [US1] Run `cargo build` and `cargo clippy` to verify no warnings in `src-tauri/`
- [ ] T010 [US1] Manual test: Run app for 5 minutes with stable target, verify log file is less than 10KB

**Checkpoint**: User Story 1 complete - logs are now concise at DEBUG level

---

## Phase 4: User Story 2 - Developer Troubleshoots Detection Failure (Priority: P2)

**Goal**: Ensure TRACE level still provides detailed per-poll diagnostic information for deep debugging

**Independent Test**: Set `log_level = "TRACE"` in settings.toml, run app briefly, verify detailed candidate information appears

### Implementation for User Story 2

- [X] T011 [US2] Verify search criteria appears in TRACE output by testing with `log_level = "TRACE"` in `settings.toml`
- [X] T012 [US2] Verify per-candidate details appear in TRACE output (process, class, title, match result)
- [X] T013 [US2] Verify detection failure WARN is logged with search criteria at DEBUG level in `find_target_window_verified()` at line ~243-248 in `src-tauri/src/target_window.rs`
- [X] T014 [US2] Restore settings.toml to DEBUG level after verification

**Checkpoint**: User Story 2 complete - TRACE level provides verbose debugging capability

---

## Phase 5: User Story 3 - Developer Monitors Application Startup (Priority: P3)

**Goal**: Verify startup logging is clear and not interleaved with polling noise

**Independent Test**: Start app and review startup logs, verify each subsystem logs exactly one "started" message

### Implementation for User Story 3

- [X] T015 [US3] Review startup logging in `src-tauri/src/lib.rs` to confirm event-based (not per-poll)
- [X] T016 [US3] Review settings logging in `src-tauri/src/settings.rs` to confirm one-time init logging
- [X] T017 [US3] Verify process monitor logs "Starting process monitor" exactly once in `src-tauri/src/process_monitor.rs` at line ~130-133
- [X] T018 [US3] Verify focus monitor initialization is logged appropriately (add if missing) in `src-tauri/src/focus_monitor.rs`
- [X] T018.5 [US3] Verify graceful shutdown events are logged even during polling cycle (edge case from spec.md L61)
- [ ] T019 [US3] Manual test: Start app, verify startup messages are visible and not buried in polling noise

**Checkpoint**: User Story 3 complete - startup logging is clear and distinct

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T020 [P] Run full `cargo test` to ensure all unit tests pass in `src-tauri/`
- [X] T021 [P] Run `cargo clippy` with no warnings in `src-tauri/`
- [X] T022 Validate against quickstart.md scenarios in `specs/030-concise-debug-logs/quickstart.md`
- [X] T023 Update any inline documentation or comments if log level semantics changed
- [ ] T024 Final test: Run app for 30 minutes stable, verify SC-001 (less than 1KB log growth)

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - baseline capture only
- **Foundational (Phase 2)**: Depends on Setup - adds deduplication infrastructure
- **User Story 1 (Phase 3)**: Depends on Foundational - uses deduplication
- **User Story 2 (Phase 4)**: Can run after US1 or in parallel (independent verification)
- **User Story 3 (Phase 5)**: Can run after US1 or in parallel (independent verification)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T002, T003 (deduplication) - Core MVP
- **User Story 2 (P2)**: No dependencies on US1 - independent TRACE verification
- **User Story 3 (P3)**: No dependencies on US1/US2 - independent startup verification

### Within User Story 1

- T004, T005, T006 can run in parallel (different locations in same file)
- T007 depends on T002 (uses deduplication helper)
- T008 is verification only (no code change)
- T009, T010 are validation after implementation

### Parallel Opportunities

- T004, T005, T006 marked [P] - different code locations
- T011-T014 (US2) can run parallel with T015-T019 (US3) after US1
- T020, T021 marked [P] - independent validation commands

---

## Parallel Example: User Story 1 Implementation

```text
# Launch all log level changes in parallel (different line ranges):
Task: "T004 - Change debug! to trace! for search criteria (~line 160-163)"
Task: "T005 - Change debug! to trace! for candidates (~line 204-210)"
Task: "T006 - Change debug! to trace! for focus state (~line 362-369)"

# Then sequentially:
Task: "T007 - Integrate deduplication into focus handlers"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline capture
2. Complete Phase 2: Add deduplication infrastructure + tests
3. Complete Phase 3: User Story 1 (log level changes + integration)
4. **STOP and VALIDATE**: Run app 5+ minutes, check log size
5. If logs are concise, MVP is complete

### Incremental Delivery

1. Setup + Foundational - Deduplication ready
2. Add User Story 1 - Test log conciseness - **MVP Complete!**
3. Add User Story 2 - Verify TRACE still works - Enhanced
4. Add User Story 3 - Verify startup clarity - Polished
5. Each story adds confidence without breaking previous stories

---

## Notes

- [P] tasks = different file locations, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a refactoring feature - no new files created
- Focus on changing `log::debug!` to `log::trace!` for per-poll logs
- Preserve all `log::info!`, `log::warn!`, `log::error!` statements
- Test with both DEBUG and TRACE levels to verify behavior
