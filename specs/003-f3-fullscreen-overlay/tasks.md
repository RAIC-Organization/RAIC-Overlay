# Tasks: F3 Fullscreen Transparent Click-Through Overlay

**Input**: Design documents from `/specs/003-f3-fullscreen-overlay/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, quickstart.md

**Tests**: Integration tests included per Constitution II (Testing Standards).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `src-tauri/src/` (Rust)
- **Frontend**: `src/` (React/TypeScript)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new type definitions and extend existing structures

- [x] T001 [P] Add OverlayMode enum to src-tauri/src/types.rs
- [x] T002 [P] Add WindowState struct to src-tauri/src/types.rs
- [x] T003 [P] Add ModeChangePayload struct to src-tauri/src/types.rs
- [x] T004 [P] Update OverlayStateResponse in src-tauri/src/types.rs to include mode field
- [x] T005 [P] Add OverlayMode type to src/types/overlay.ts
- [x] T006 [P] Add ModeChangePayload interface to src/types/ipc.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend backend state management to support mode tracking

**⚠️ CRITICAL**: User story implementation depends on this phase

- [x] T007 Extend OverlayState struct with mode and saved_window_state fields in src-tauri/src/state.rs
- [x] T008 Add get_mode() method to OverlayState in src-tauri/src/state.rs
- [x] T009 Add set_mode() method to OverlayState in src-tauri/src/state.rs
- [x] T010 Add save_window_state() method to OverlayState in src-tauri/src/state.rs
- [x] T011 Add get_saved_window_state() method to OverlayState in src-tauri/src/state.rs
- [x] T012 Add to_response() method to OverlayState in src-tauri/src/state.rs
- [x] T013 Update get_overlay_state command to include mode in response in src-tauri/src/lib.rs

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Toggle Fullscreen Overlay Mode (Priority: P1) 🎯 MVP

**Goal**: F3 press toggles overlay between windowed and fullscreen transparent mode

**Independent Test**: Press F3 and verify overlay expands to fullscreen with 60% transparency, press F3 again to return to windowed mode

### Tests for User Story 1

> **NOTE**: Write tests FIRST per Constitution Testing Standards principle

- [x] T014 [P] [US1] Create integration test for mode toggle in tests/integration/mode-toggle.test.ts

### Implementation for User Story 1

- [x] T015 [P] [US1] Add get_monitor_size() function to src-tauri/src/window.rs
- [x] T016 [P] [US1] Add expand_to_fullscreen() function to src-tauri/src/window.rs
- [x] T017 [P] [US1] Add restore_window_state() function to src-tauri/src/window.rs
- [x] T018 [US1] Implement toggle_mode command in src-tauri/src/lib.rs (windowed → fullscreen transition)
- [x] T019 [US1] Extend toggle_mode command for fullscreen → windowed transition in src-tauri/src/lib.rs
- [x] T020 [US1] Register toggle_mode command in invoke_handler in src-tauri/src/lib.rs
- [x] T021 [US1] Emit mode-changed event from toggle_mode command in src-tauri/src/lib.rs
- [x] T022 [US1] Update OverlayState interface with mode field in src/types/overlay.ts
- [x] T023 [US1] Update initialState with mode: 'windowed' in src/types/overlay.ts
- [x] T024 [US1] Update toggle-overlay event handler to call toggle_mode command in src/App.tsx
- [x] T025 [US1] Add mode-changed event listener in src/App.tsx
- [x] T026 [US1] Update DEBOUNCE_MS constant from 50 to 200 in src-tauri/src/hotkey.rs

**Checkpoint**: F3 toggles mode and window resizes correctly

---

## Phase 4: User Story 2 - Preserved Header Panel in Fullscreen Mode (Priority: P1)

**Goal**: Header panel remains visible at same position and size in fullscreen mode

**Independent Test**: Activate fullscreen mode and verify header panel appears at same screen position with same dimensions, click on header panel area should pass through

### Tests for User Story 2

- [x] T027 [P] [US2] Create integration test for header position preservation in tests/integration/header-position.test.ts

### Implementation for User Story 2

- [x] T028 [P] [US2] Add fullscreen-overlay CSS class to src/index.css with 60% transparency background
- [x] T029 [US2] Conditionally render fullscreen overlay container in src/App.tsx when mode is fullscreen
- [x] T030 [US2] Update HeaderPanel to remove visibility-based conditional rendering in src/components/HeaderPanel.tsx
- [x] T031 [US2] Position HeaderPanel absolutely within fullscreen container in src/App.tsx

**Checkpoint**: Header panel visible and correctly positioned in fullscreen mode

---

## Phase 5: User Story 3 - Click-Through Behavior (Priority: P1)

**Goal**: All mouse interactions pass through to background applications in fullscreen mode

**Independent Test**: Activate fullscreen mode and verify left-click, right-click, scroll, and drag all pass through to background applications

### Tests for User Story 3

- [ ] T032 [P] [US3] Create integration test for click-through behavior in tests/integration/click-through.test.ts

### Implementation for User Story 3

- [ ] T033 [US3] Ensure set_ignore_cursor_events(true) called when entering fullscreen in src-tauri/src/lib.rs
- [ ] T034 [US3] Ensure set_ignore_cursor_events(false) called when exiting fullscreen in src-tauri/src/lib.rs
- [ ] T035 [US3] Add pointer-events: none to fullscreen-overlay CSS in src/index.css
- [ ] T036 [US3] Verify window.show() is called when entering fullscreen mode in src-tauri/src/lib.rs

**Checkpoint**: All mouse events pass through to background applications

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance validation, and final validation

- [ ] T037 [P] Verify always-on-top behavior in fullscreen mode (already configured in tauri.conf.json)
- [ ] T038 [P] Test multi-monitor behavior: overlay expands to current monitor
- [ ] T039 [P] Test DPI scaling: verify correct sizing at 100%, 125%, 150% scale factors
- [ ] T040 [P] Test rapid F3 toggling: debounce prevents flickering
- [ ] T041 [P] Measure toggle response time and verify <100ms (SC-001) using performance.now()
- [ ] T042 [P] Verify click-through latency <50ms (SC-002) via manual testing with timestamp logging
- [ ] T043 [P] Perform 100+ toggle cycles and monitor memory usage for leaks (SC-005)
- [ ] T044 Run cargo clippy and fix any warnings in src-tauri/src/
- [ ] T045 Run npm run build and fix any TypeScript errors
- [ ] T046 Validate implementation against quickstart.md testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core mode toggle functionality
- **User Story 2 (P1)**: Can start after US1 is partially complete (needs mode state) - Header positioning
- **User Story 3 (P1)**: Can start after US1 is partially complete (needs toggle_mode command) - Click-through behavior

### Within Each User Story

- Tests FIRST (per Constitution II)
- Window utilities (T015-T017) before toggle_mode command (T018-T021)
- Backend changes before frontend changes
- CSS before component updates

### Parallel Opportunities

**Setup Phase (all parallel):**
```
T001, T002, T003, T004  (Rust types - different structs, same file but independent additions)
T005, T006              (TypeScript types - different files)
```

**User Story 1 (partial parallel):**
```
T014                    (Integration test - write first)
T015, T016, T017        (Window utilities - different functions)
```

**User Story 2 (partial parallel):**
```
T027                    (Integration test - write first)
T028                    (CSS - independent)
```

**User Story 3 (partial parallel):**
```
T032                    (Integration test - write first)
```

**Polish Phase (all parallel):**
```
T037, T038, T039, T040, T041, T042, T043  (Testing - independent validation)
```

---

## Parallel Example: Setup Phase

```bash
# Launch all type definitions together:
Task: "Add OverlayMode enum to src-tauri/src/types.rs"
Task: "Add WindowState struct to src-tauri/src/types.rs"
Task: "Add ModeChangePayload struct to src-tauri/src/types.rs"
Task: "Update OverlayStateResponse in src-tauri/src/types.rs"

# Frontend types in parallel:
Task: "Add OverlayMode type to src/types/overlay.ts"
Task: "Add ModeChangePayload interface to src/types/ipc.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (including T014 test)
4. **STOP and VALIDATE**: Test F3 toggles mode correctly
5. Proceed to User Story 2 and 3

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test mode toggle → Core feature working (MVP!)
3. Add User Story 2 → Test header positioning → Visual complete
4. Add User Story 3 → Test click-through → Feature complete
5. Polish → Production ready

---

## Notes

- [P] tasks = different files or independent additions, no dependencies
- [Story] label maps task to specific user story for traceability
- All three user stories are P1 priority but have natural implementation order
- US1 provides foundation for US2 and US3
- US2 and US3 are mostly independent of each other
- No new dependencies required - uses existing Tauri 2.x APIs
- Debounce constant change (T026) from 50ms to 200ms per spec requirement
- Integration tests (T014, T027, T032) should be written FIRST per Constitution II
- Performance validation tasks (T041-T043) verify success criteria SC-001, SC-002, SC-005
