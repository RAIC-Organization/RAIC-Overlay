# Tasks: Unified Logging System

**Input**: Design documents from `/specs/019-unified-logging-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Rust Backend**: `src-tauri/src/`
- **TypeScript Frontend**: `src/`
- **Config**: `src-tauri/Cargo.toml`, `package.json`, `src-tauri/tauri.conf.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies and project configuration for logging

- [x] T001 Add `tauri-plugin-log = "2"` and `chrono = "0.4"` to src-tauri/Cargo.toml
- [x] T002 Run `npm install @tauri-apps/plugin-log` to add frontend dependency
- [x] T003 [P] Add log plugin configuration to src-tauri/tauri.conf.json plugins section

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core logging infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create TypeScript types for logging in src/types/logging.ts (LogLevel, LogConfig, CleanupResult)
- [x] T005 [P] Create Rust types for logging in src-tauri/src/logging_types.rs (LogLevelName, LogConfig, CleanupResult)
- [x] T006 Create logging module structure in src-tauri/src/logging.rs with get_log_level() function
- [x] T007 Add `pub mod logging;` and `pub mod logging_types;` declarations to src-tauri/src/lib.rs
- [x] T008 Initialize tauri-plugin-log in run() function in src-tauri/src/lib.rs with Builder pattern

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Developer Debugging Issues (Priority: P1) 🎯 MVP

**Goal**: Enable detailed logging during development via environment variable

**Independent Test**: Set `RAIC_LOG_LEVEL=DEBUG`, start app, verify DEBUG/INFO/WARN/ERROR all appear in console and log file

### Implementation for User Story 1

- [ ] T009 [US1] Implement environment variable parsing for RAIC_LOG_LEVEL in src-tauri/src/logging.rs
- [ ] T010 [US1] Configure tauri-plugin-log Builder with dynamic log level from get_log_level() in src-tauri/src/lib.rs
- [ ] T011 [US1] Add Stdout target conditionally when log level is DEBUG or INFO in src-tauri/src/logging.rs
- [ ] T012 [US1] Add sample log statements using log::info!, log::debug! in src-tauri/src/lib.rs setup() to verify logging works
- [ ] T013 [US1] Verify log level filtering: set RAIC_LOG_LEVEL=INFO and confirm DEBUG messages are suppressed

**Checkpoint**: US1 complete - developer can enable DEBUG logging via env var

---

## Phase 4: User Story 2 - Production Error Tracking (Priority: P1)

**Goal**: Default WARN level captures errors/warnings without manual configuration

**Independent Test**: Start app without RAIC_LOG_LEVEL set, trigger error/warning, verify logged to file; trigger INFO, verify NOT logged

### Implementation for User Story 2

- [ ] T014 [US2] Ensure get_log_level() defaults to LevelFilter::Warn when env var is not set in src-tauri/src/logging.rs
- [ ] T015 [US2] Configure LogDir target with file_name "app" in src-tauri/src/logging.rs
- [ ] T016 [US2] Add log::warn! and log::error! calls in existing error handlers in src-tauri/src/lib.rs
- [ ] T017 [US2] Verify production default: start without env var, confirm only WARN/ERROR in log file

**Checkpoint**: US2 complete - production deployments auto-capture WARN/ERROR

---

## Phase 5: User Story 3 - Log File Management (Priority: P2)

**Goal**: Predictable log location with rotation and cleanup

**Independent Test**: Generate logs exceeding 10MB, verify rotation occurs; run cleanup command, verify old files deleted

### Implementation for User Story 3

- [ ] T018 [US3] Configure max_file_size(10_000_000) for 10MB rotation threshold in src-tauri/src/logging.rs
- [ ] T019 [US3] Set rotation_strategy(RotationStrategy::KeepAll) in src-tauri/src/logging.rs
- [ ] T020 [US3] Implement cleanup_old_logs Tauri command in src-tauri/src/logging.rs
- [ ] T021 [US3] Implement get_log_file_path Tauri command in src-tauri/src/logging.rs
- [ ] T022 [US3] Register cleanup_old_logs and get_log_file_path in invoke_handler in src-tauri/src/lib.rs
- [ ] T023 [US3] Call cleanup_old_logs on app startup in setup() in src-tauri/src/lib.rs

**Checkpoint**: US3 complete - logs auto-rotate at 10MB, old logs cleaned on startup

---

## Phase 6: User Story 4 - Unified Frontend and Backend Logging (Priority: P2)

**Goal**: Frontend logs use same format and persist to same file via IPC

**Independent Test**: Trigger log from frontend, trigger log from backend, verify both in same file with consistent format

### Implementation for User Story 4

- [ ] T024 [P] [US4] Implement custom JSON formatter with chrono timestamps in src-tauri/src/logging.rs
- [ ] T025 [P] [US4] Create frontend logger service with forwardConsole() in src/lib/logger.ts
- [ ] T026 [P] [US4] Create useLogger React hook for component logging in src/hooks/useLogger.ts
- [ ] T027 [US4] Initialize console forwarding in app startup in app/layout.tsx or app/page.tsx
- [ ] T028 [US4] Implement get_log_config Tauri command in src-tauri/src/logging.rs
- [ ] T029 [US4] Register get_log_config in invoke_handler in src-tauri/src/lib.rs
- [ ] T030 [US4] Add info! log on frontend action (e.g., window open) to verify frontend→backend→file flow

**Checkpoint**: US4 complete - frontend and backend logs unified in JSONL format

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T031 [P] Add JSDoc comments to exported functions in src/lib/logger.ts
- [ ] T032 [P] Add Rust doc comments to public functions in src-tauri/src/logging.rs
- [ ] T033 Replace existing eprintln! calls with log::warn! or log::error! throughout src-tauri/src/
- [ ] T034 Run `cargo clippy` and fix any warnings in src-tauri/
- [ ] T035 Run `npm run build` and verify no TypeScript errors
- [ ] T036 Validate quickstart.md instructions work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 (Developer Debug) | P1 | Foundational only | US2 (after T009-T010) |
| US2 (Production Error) | P1 | Foundational only | US1 (after T014-T015) |
| US3 (File Management) | P2 | US1 + US2 (logging must work) | US4 |
| US4 (Unified Frontend) | P2 | US1 + US2 (logging must work) | US3 |

### Within Each User Story

- Configuration tasks before usage tasks
- Rust backend before TypeScript frontend (for IPC commands)
- Command implementation before command registration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001 and T002 can run in parallel (different package managers)

**Phase 2 (Foundational)**:
- T004 and T005 can run in parallel (TypeScript vs Rust types)

**Phase 6 (US4)**:
- T024, T025, T026 can all run in parallel (different files)

---

## Parallel Example: Phase 6 (User Story 4)

```bash
# Launch parallel tasks for frontend utilities:
Task: "Implement custom JSON formatter in src-tauri/src/logging.rs"
Task: "Create frontend logger service in src/lib/logger.ts"
Task: "Create useLogger React hook in src/hooks/useLogger.ts"

# Then sequential: integrate and test
Task: "Initialize console forwarding in app startup"
Task: "Add info! log on frontend action to verify flow"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (5 tasks)
4. Complete Phase 4: User Story 2 (4 tasks)
5. **STOP and VALIDATE**: Test logging with and without env var
6. Can deploy with basic logging working

### Full Feature

1. MVP complete (Phases 1-4)
2. Add Phase 5: User Story 3 - File management (6 tasks)
3. Add Phase 6: User Story 4 - Frontend integration (7 tasks)
4. Complete Phase 7: Polish (6 tasks)
5. Full logging system operational

### Estimated Task Distribution

| Phase | Tasks | Cumulative |
|-------|-------|------------|
| Setup | 3 | 3 |
| Foundational | 5 | 8 |
| US1 (P1) | 5 | 13 |
| US2 (P1) | 4 | 17 |
| US3 (P2) | 6 | 23 |
| US4 (P2) | 7 | 30 |
| Polish | 6 | 36 |

**Total**: 36 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- US1 and US2 are both P1 priority but can be done sequentially (US1 first for dev testing)
- Plugin handles most complexity - focus is on configuration, not implementation
- Avoid: modifying same file in parallel, skipping foundational phase
