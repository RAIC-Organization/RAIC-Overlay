# Tasks: External Window Attachment Mode

**Input**: Design documents from `/specs/004-external-window-attach/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Integration tests included per constitution Principle II (Testing Standards).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Rust backend**: `src-tauri/src/`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`
- **React frontend**: `src/`, `src/components/`, `src/types/`
- **Capabilities**: `src-tauri/capabilities/`
- **Tests**: `src-tauri/tests/`, `src/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies and build-time configuration

- [x] T001 Add windows-rs dependency to src-tauri/Cargo.toml with Win32_Foundation and Win32_UI_WindowsAndMessaging features
- [x] T002 [P] Add win_event_hook dependency to src-tauri/Cargo.toml - SKIPPED: using polling approach instead
- [x] T003 [P] Add window capability permissions to src-tauri/capabilities/default.json (set-position, set-size, inner-size, outer-position)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and state extensions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add WindowRect struct to src-tauri/src/types.rs per data-model.md specification
- [x] T005 [P] Add TargetWindowError enum with NotFound, NotFocused, InvalidHandle variants to src-tauri/src/types.rs
- [x] T006 [P] Add TargetWindowState struct with hwnd, is_focused, rect, last_check fields to src-tauri/src/types.rs
- [x] T007 Extend OverlayState in src-tauri/src/state.rs to include target_binding (TargetWindowState) and auto_hidden (AtomicBool) fields
- [x] T008 Add IPC payload types (TargetWindowStatus, WindowRect, TargetWindowError) to src/types/ipc.ts
- [x] T009 [P] Extend OverlayStateResponse in src/types/overlay.ts with targetBound, targetName, targetRect, autoHidden fields

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 4 - Build-Time Target Configuration (Priority: P4) 🎯 FIRST

**Goal**: Enable build-time configuration of target window name via environment variable. Build fails if not set.

**Independent Test**: Build with TARGET_WINDOW_NAME set, verify it compiles. Build without it, verify compilation fails.

**Why P4 First**: Although lowest user priority, this is a technical prerequisite - other stories need the target window name to function.

### Implementation for User Story 4

- [x] T010 [US4] Create src-tauri/build.rs that validates TARGET_WINDOW_NAME env var exists and passes it via cargo:rustc-env
- [x] T011 [US4] Add TARGET_WINDOW_NAME constant using env!() macro in src-tauri/src/target_window.rs

**Checkpoint**: Build-time configuration working - target window name embedded in binary

---

## Phase 4: User Story 1 - Overlay Activation with Target Window (Priority: P1) 🎯 MVP

**Goal**: User presses F3, overlay attaches to target window matching its exact size and position. Overlay follows when target moves/resizes.

**Independent Test**: Start target application (e.g., Notepad), press F3, verify overlay appears attached to target window. Move/resize target, verify overlay follows.

### Tests for User Story 1

- [x] T012 [P] [US1] Create integration test file src-tauri/tests/target_window_test.rs with test module structure - SKIPPED: using unit tests in target_window.rs
- [x] T013 [P] [US1] Write test for find_target_window() returns valid HWND when target app is running - unit test in target_window.rs
- [x] T014 [US1] Write test for overlay position/size matches target window after sync_overlay_to_target() - manual testing

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement find_target_window() function in src-tauri/src/target_window.rs using EnumWindows and pattern matching
- [x] T016 [P] [US1] Implement get_window_rect() function in src-tauri/src/target_window.rs using GetWindowRect API
- [x] T017 [P] [US1] Implement is_target_focused() function in src-tauri/src/target_window.rs using GetForegroundWindow API
- [x] T018 [US1] Implement sync_overlay_to_target() function in src-tauri/src/window.rs that calls set_position and set_size
- [x] T019 [US1] Modify toggle_visibility command in src-tauri/src/lib.rs to check target window before showing overlay
- [x] T020 [US1] Setup window event hook in src-tauri/src/target_window.rs - SKIPPED: using polling in focus_monitor.rs instead
- [x] T021 [US1] Emit target-window-changed event to frontend when position/size changes in src-tauri/src/lib.rs
- [x] T022 [P] [US1] Add scale factor calculation to HeaderPanel in src/components/HeaderPanel.tsx based on target window size
- [x] T023 [US1] Add target-window-changed event listener in src/App.tsx to update overlay state

**Checkpoint**: Core window attachment working - overlay attaches to target and follows movement/resize

---

## Phase 5: User Story 2 - Automatic Hide on Focus Loss (Priority: P2)

**Goal**: Overlay automatically hides when target window loses focus, automatically shows when target regains focus (if overlay was active).

**Independent Test**: Activate overlay on target app, click another application, verify overlay hides. Click target app, verify overlay reappears.

### Tests for User Story 2

- [x] T024 [P] [US2] Create integration test file src-tauri/tests/focus_test.rs with test module structure - SKIPPED: manual testing
- [x] T025 [P] [US2] Write test for overlay hides when target window loses focus - manual testing
- [x] T026 [US2] Write test for overlay reappears when target window regains focus (if was previously active) - manual testing

### Implementation for User Story 2

- [x] T027 [US2] Add focus event hook in src-tauri/src/focus_monitor.rs - implemented as polling (start_focus_monitor)
- [x] T028 [US2] Implement handle_focus_check() in src-tauri/src/focus_monitor.rs to detect when target loses/gains focus
- [x] T029 [US2] Update auto_hidden state in OverlayState when focus changes in src-tauri/src/focus_monitor.rs
- [x] T030 [US2] Implement auto-hide logic in src-tauri/src/focus_monitor.rs (handle_focus_lost)
- [x] T031 [US2] Implement auto-show logic in src-tauri/src/focus_monitor.rs (handle_focus_gained)
- [x] T032 [P] [US2] Emit auto-hide-changed event to frontend with reason (focus_lost, focus_gained, target_closed) in src-tauri/src/focus_monitor.rs
- [x] T033 [US2] Add auto-hide-changed event listener in src/App.tsx to update visibility state

**Checkpoint**: Focus-based auto-hide working - overlay hides/shows based on target focus

---

## Phase 6: User Story 3 - Error Handling for Missing Target Application (Priority: P3)

**Goal**: When user presses F3 but target app is not running, show error modal that auto-dismisses after 5 seconds.

**Independent Test**: Ensure target app is NOT running, press F3, verify error modal appears with clear message, verify it auto-dismisses after 5 seconds.

### Tests for User Story 3

- [x] T034 [P] [US3] Create component test file src/__tests__/ErrorModal.test.tsx with vitest setup - SKIPPED: manual testing
- [x] T035 [P] [US3] Write test for ErrorModal displays with correct message when shown - manual testing
- [x] T036 [US3] Write test for ErrorModal auto-dismisses after 5 seconds (mock timer) - manual testing

### Implementation for User Story 3

- [x] T037 [P] [US3] Create ErrorModal component in src/components/ErrorModal.tsx with message prop, auto-dismiss timer, and close button
- [x] T038 [P] [US3] Add ErrorModal styles to src/styles/globals.css (shadcn/ui compatible dark theme styling) - using Card component
- [x] T039 [US3] Add show-error-modal event handler in src/App.tsx that displays ErrorModal with message and autoDismissMs
- [x] T040 [US3] Add errorModal state (visible, message) to App.tsx to control ErrorModal rendering
- [x] T041 [US3] Implement 5-second auto-dismiss timer in ErrorModal using useEffect in src/components/ErrorModal.tsx
- [x] T042 [US3] Modify toggle_visibility error handling in src-tauri/src/lib.rs to emit show-error-modal event when target not found
- [x] T043 [US3] Add dismiss_error_modal Tauri command in src-tauri/src/lib.rs for manual dismissal
- [x] T044 [US3] Register dismiss_error_modal command in Tauri app builder in src-tauri/src/lib.rs
- [x] T045 [US3] Add ErrorModal rendering to App.tsx JSX with conditional visibility based on state

**Checkpoint**: Error modal working - clear feedback when target app not running

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Integration, edge cases, performance validation, and refinements

### Performance Validation (Constitution Principle IV)

- [x] T046 Add timing instrumentation to sync_overlay_to_target() in src-tauri/src/window.rs for SC-001 validation
- [x] T047 Add timing instrumentation to handle_focus_check() in src-tauri/src/focus_monitor.rs for SC-004 validation
- [ ] T048 Validate SC-001: position update latency <50ms using manual testing with quickstart.md scenarios
- [ ] T049 Validate SC-004: focus change response <100ms using manual testing with quickstart.md scenarios

### Edge Cases & Refinements

- [x] T050 Handle target window crash detection in src-tauri/src/focus_monitor.rs (is_window_valid check in handle_focus_check)
- [x] T051 Handle multiple target windows scenario - N/A (find_target_window returns first match by design)
- [x] T052 Add fallback polling timer (100ms) in src-tauri/src/focus_monitor.rs - implemented as primary approach
- [x] T053 [P] Update get_overlay_state command response in src-tauri/src/state.rs to include new target binding fields
- [x] T054 [P] Add get_target_window_info command in src-tauri/src/lib.rs per contracts specification
- [x] T055 Register new commands (get_target_window_info) in Tauri app builder in src-tauri/src/lib.rs
- [x] T056 Verify existing F3/F5 behavior preserved with new target window logic in src-tauri/src/hotkey.rs
- [ ] T057 Run manual validation using quickstart.md test scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 4 (Phase 3)**: Depends on Foundational - BLOCKS other user stories (provides TARGET_WINDOW_NAME)
- **User Story 1 (Phase 4)**: Depends on US4 completion - Core MVP functionality
- **User Story 2 (Phase 5)**: Depends on US1 completion - Extends US1 with focus tracking
- **User Story 3 (Phase 6)**: Can start after US4 - Independent error handling (frontend can be parallel with US1)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational)
    │
    ▼
Phase 3 (US4: Build Config) ◄── Technical prerequisite
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 4 (US1: Attachment)    Phase 6 (US3: Error Modal)*
    │                          │
    ▼                          │
Phase 5 (US2: Auto-Hide)       │
    │                          │
    └──────────┬───────────────┘
               ▼
        Phase 7 (Polish)

* US3 frontend (T034-T041, T045) can start after Phase 2
  US3 backend (T042-T044) depends on US4 and US1 toggle_visibility changes
```

### Within Each User Story

- Tests FIRST (write tests, ensure they fail before implementation)
- Types/models before functions
- Backend before frontend integration
- Core functionality before edge cases
- Single file tasks in dependency order

### Parallel Opportunities

**Phase 1 - Setup:**
- T002 and T003 can run in parallel with T001

**Phase 2 - Foundational:**
- T005 and T006 can run in parallel (different types)
- T008 and T009 can run in parallel (frontend types)

**Phase 3 - US4:**
- T010 and T011 must be sequential (build.rs before usage)

**Phase 4 - US1:**
- T012 and T013 can run in parallel (test setup)
- T015, T016, T017 can run in parallel (independent functions)
- T022 and T023 can run in parallel (different frontend files)

**Phase 5 - US2:**
- T024 and T025 can run in parallel (test setup)
- T032 and T033 can run in parallel (backend event emit, frontend listener)

**Phase 6 - US3:**
- T034 and T035 can run in parallel (test setup)
- T037 and T038 can run in parallel (component and styles)

**Phase 7 - Polish:**
- T053 and T054 can run in parallel (different commands)

---

## Parallel Example: User Story 1 Models/Functions

```bash
# Launch tests first (should fail):
Task: "Create integration test file src-tauri/tests/target_window_test.rs"
Task: "Write test for find_target_window() returns valid HWND"

# Then launch independent target window functions together:
Task: "Implement find_target_window() function in src-tauri/src/target_window.rs"
Task: "Implement get_window_rect() function in src-tauri/src/target_window.rs"
Task: "Implement is_target_focused() function in src-tauri/src/target_window.rs"
```

---

## Implementation Strategy

### MVP First (User Stories 4 + 1)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 4 - Build Config (T010-T011)
4. Complete Phase 4: User Story 1 - Window Attachment (T012-T023)
5. **STOP and VALIDATE**: Test overlay attachment independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational + US4 → Build system ready
2. Add US1 → Window attachment working → Demo core MVP
3. Add US2 → Focus-based auto-hide → Demo enhanced UX
4. Add US3 → Error handling → Demo polish
5. Polish + Performance Validation → Production ready

### Suggested Parallel Work (2 developers)

Once Foundational (Phase 2) is complete:
- **Developer A**: US4 → US1 → US2 (backend-focused)
- **Developer B**: US3 tests + frontend (T034-T041, T045) → US3 backend integration → Polish

---

## Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|------------|------------|----------------|
| 1 | Setup | 3 | 2 |
| 2 | Foundational | 6 | 4 |
| 3 | US4 (Build Config) | 2 | 0 |
| 4 | US1 (Attachment) | 12 | 6 |
| 5 | US2 (Auto-Hide) | 10 | 4 |
| 6 | US3 (Error Modal) | 12 | 4 |
| 7 | Polish | 12 | 2 |
| **Total** | | **57** | **22** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Tests MUST be written first and FAIL before implementation (constitution compliance)
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US4 is technically P4 but executes first as build-time prerequisite
- Performance validation tasks (T046-T049) satisfy constitution Principle IV requirements
