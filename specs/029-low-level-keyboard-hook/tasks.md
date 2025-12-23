# Tasks: Low-Level Keyboard Hook

**Input**: Design documents from `/specs/029-low-level-keyboard-hook/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Unit test for debounce logic. Manual integration testing via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri backend**: `src-tauri/src/` for Rust code
- **Tauri config**: `src-tauri/Cargo.toml` for dependencies

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project configuration and dependency setup

- [ ] T001 Add `Win32_UI_Input_KeyboardAndMouse` and `Win32_System_LibraryLoader` features to `src-tauri/Cargo.toml`
- [ ] T002 Add `lazy_static` crate dependency to `src-tauri/Cargo.toml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core keyboard hook module structure that MUST be complete before ANY user story can be implemented

**Warning**: No user story work can begin until this phase is complete

- [ ] T003 Create new module file `src-tauri/src/keyboard_hook.rs` with module structure and imports
- [ ] T004 [P] Define `KeyboardHookState` struct with atomic fields (`is_active`, `hook_handle`, `thread_id`, `use_fallback`) in `src-tauri/src/keyboard_hook.rs`
- [ ] T005 [P] Define `HotkeyAction` enum with `ToggleVisibility` and `ToggleMode` variants in `src-tauri/src/keyboard_hook.rs`
- [ ] T006 [P] Define constants for virtual key codes (`VK_F3`, `VK_F5`), Windows messages, and debounce in `src-tauri/src/keyboard_hook.rs`
- [ ] T007 Initialize global static `KEYBOARD_HOOK_STATE` using `lazy_static` in `src-tauri/src/keyboard_hook.rs`
- [ ] T008 Add `mod keyboard_hook;` declaration to `src-tauri/src/lib.rs`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Reliable Hotkey Detection During Gameplay (Priority: P1) - MVP

**Goal**: F3/F5 hotkeys work reliably when Star Citizen is in fullscreen mode, intercepting keyboard events at the kernel level

**Independent Test**: Launch Star Citizen in fullscreen mode, press F3, verify overlay toggles within 100ms

### Implementation for User Story 1

- [ ] T009 [US1] Implement `keyboard_hook_callback` extern function with `WM_KEYDOWN` detection for F3/F5 keys using `GetAsyncKeyState` in `src-tauri/src/keyboard_hook.rs`
- [ ] T010 [US1] Implement debounce logic using timestamp comparison (200ms) in callback in `src-tauri/src/keyboard_hook.rs`
- [ ] T011 [US1] Implement `CallNextHookEx` call to pass events to other hooks (non-blocking) in `src-tauri/src/keyboard_hook.rs`
- [ ] T012 [US1] Implement `start_keyboard_hook()` function that spawns dedicated thread in `src-tauri/src/keyboard_hook.rs`
- [ ] T013 [US1] Implement Windows message loop (`GetMessageW`/`TranslateMessage`/`DispatchMessageW`) in hook thread in `src-tauri/src/keyboard_hook.rs`
- [ ] T014 [US1] Implement `SetWindowsHookExW` call with `WH_KEYBOARD_LL` in hook thread in `src-tauri/src/keyboard_hook.rs`
- [ ] T015 [US1] Implement Tauri event emission for hotkey actions (reuse pattern from existing `hotkey.rs`) in `src-tauri/src/keyboard_hook.rs`
- [ ] T016 [US1] Store `AppHandle` in thread-safe global state for event emission in `src-tauri/src/keyboard_hook.rs`
- [ ] T017 [US1] Implement `stop_keyboard_hook()` function with `PostQuitMessage` and `UnhookWindowsHookEx` in `src-tauri/src/keyboard_hook.rs`
- [ ] T018 [US1] Modify `src-tauri/src/lib.rs` to call `start_keyboard_hook()` at application startup instead of global shortcut registration
- [ ] T019 [US1] Modify `src-tauri/src/lib.rs` to call `stop_keyboard_hook()` at application shutdown

**Checkpoint**: User Story 1 complete - F3/F5 hotkeys work with Star Citizen via low-level hook

---

## Phase 4: User Story 2 - Hotkey Registration Feedback (Priority: P2)

**Goal**: Provide diagnostic logging for hook installation status so users and developers can troubleshoot issues

**Independent Test**: Start overlay, check logs for "Low-level keyboard hook installed successfully" message

### Implementation for User Story 2

- [ ] T020 [US2] Add detailed logging for hook installation attempt with thread ID in `src-tauri/src/keyboard_hook.rs`
- [ ] T021 [US2] Add success logging when `SetWindowsHookExW` returns valid handle in `src-tauri/src/keyboard_hook.rs`
- [ ] T022 [US2] Add failure logging with Windows error code and human-readable description using `GetLastError` in `src-tauri/src/keyboard_hook.rs`
- [ ] T023 [US2] Add logging for hook uninstallation during shutdown in `src-tauri/src/keyboard_hook.rs`
- [ ] T024 [US2] Add logging for each F3/F5 key detection event (with timestamp) in `src-tauri/src/keyboard_hook.rs`

**Checkpoint**: User Story 2 complete - All hook lifecycle events are logged

---

## Phase 5: User Story 3 - Graceful Fallback (Priority: P3)

**Goal**: If low-level hook fails, fall back to standard `tauri-plugin-global-shortcut` so basic functionality is preserved

**Independent Test**: Simulate hook failure, verify standard shortcuts still work (via RegisterHotKey)

### Implementation for User Story 3

- [ ] T025 [US3] Implement hook installation success detection and set `use_fallback` flag on failure in `src-tauri/src/keyboard_hook.rs`
- [ ] T026 [US3] Add conditional fallback trigger to existing `tauri-plugin-global-shortcut` registration in `src-tauri/src/lib.rs`
- [ ] T027 [US3] Add logging for fallback activation with reason in `src-tauri/src/keyboard_hook.rs`
- [ ] T028 [US3] Implement `is_using_fallback()` query function for status checking in `src-tauri/src/keyboard_hook.rs`
- [ ] T029 [US3] Handle non-Windows platform gracefully (compile-time feature flag or runtime check) in `src-tauri/src/keyboard_hook.rs`

**Checkpoint**: User Story 3 complete - Application gracefully degrades when hook unavailable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Code quality, validation, and cross-story improvements

- [ ] T030 [P] Run `cargo clippy` and fix all warnings in `src-tauri/`
- [ ] T031 [P] Run `cargo test` to ensure no regressions in `src-tauri/`
- [ ] T031a [P] Add unit test for debounce logic verifying 200ms threshold prevents duplicate triggers in `src-tauri/src/keyboard_hook.rs`
- [ ] T032 Verify hook thread memory usage is under 1MB budget
- [ ] T033 Verify hotkey response time is under 100ms
- [ ] T034 Execute manual testing scenarios from `specs/029-low-level-keyboard-hook/quickstart.md`
- [ ] T035 Verify clean shutdown with no resource leaks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Must complete first (core functionality)
  - User Story 2 (P2): Can start after US1 (adds logging)
  - User Story 3 (P3): Can start after US1 (adds fallback)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core hook implementation
- **User Story 2 (P2)**: Depends on US1 completion - Enhances US1 with logging
- **User Story 3 (P3)**: Depends on US1 completion - Adds fallback to US1

### Within Each User Story

- Hook callback implementation before thread spawning
- Thread spawning before message loop
- Message loop before startup integration
- All logging tasks can run in parallel within US2

### Parallel Opportunities

- Phase 1 tasks can run in parallel
- T004, T005, T006 in Phase 2 can run in parallel (separate concerns)
- T030, T031 in Phase 6 can run in parallel
- US2 (logging) and US3 (fallback) can run in parallel after US1

---

## Parallel Example: Foundational Phase

```bash
# Launch parallel tasks after T003 completes:
Task: "Define KeyboardHookState struct" (T004)
Task: "Define HotkeyAction enum" (T005)
Task: "Define constants for VK codes" (T006)
```

---

## Parallel Example: After User Story 1

```bash
# US2 and US3 can proceed in parallel after US1:
Task: "Add detailed logging for hook installation" (T020)
Task: "Implement hook installation success detection" (T025)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (dependencies)
2. Complete Phase 2: Foundational (module structure)
3. Complete Phase 3: User Story 1 (core hook)
4. **STOP and VALIDATE**: Test F3/F5 with Star Citizen
5. Deploy/demo if ready - MVP complete!

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test with Star Citizen -> Deploy (MVP!)
3. Add User Story 2 -> Test logging output -> Deploy (better diagnostics)
4. Add User Story 3 -> Test fallback scenario -> Deploy (more robust)
5. Each story adds value without breaking previous stories

### File Touch Summary

| File | Phases |
|------|--------|
| `src-tauri/Cargo.toml` | Phase 1 |
| `src-tauri/src/keyboard_hook.rs` | Phase 2, 3, 4, 5 (NEW) |
| `src-tauri/src/lib.rs` | Phase 2, 3, 5 (MODIFY) |

---

## Notes

- [P] tasks = different files or concerns, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Key Reference**: `process_monitor.rs` for existing thread/state patterns
- **Key Reference**: `hotkey.rs` for existing event emission patterns
