# Tasks: Sync Webview Hotkeys with Backend Settings

**Input**: Design documents from `/specs/042-sync-webview-hotkeys/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/events.md, quickstart.md

**Tests**: Manual testing only (per existing project pattern). No automated test tasks generated.

**Organization**: Tasks grouped by user story. This is a focused bug fix with minimal scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Verify existing infrastructure and understand current implementation

- [x] T001 Verify existing types in src/types/user-settings.ts (HotkeySettings, HotkeyBinding, LoadUserSettingsResult, DEFAULT_USER_SETTINGS)
- [x] T002 [P] Verify existing update_hotkeys command in src-tauri/src/user_settings.rs
- [x] T003 [P] Review current useHotkeyCapture implementation in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Understand existing code structure before making changes

---

## Phase 2: Foundational (Backend Event Emission)

**Purpose**: Backend must emit events before frontend can listen to them

**⚠️ CRITICAL**: Frontend cannot receive hotkey updates until this phase is complete

- [x] T004 Add `use tauri::Emitter;` import to src-tauri/src/user_settings.rs
- [x] T005 Modify update_hotkeys command signature to accept `app: tauri::AppHandle` parameter in src-tauri/src/user_settings.rs
- [x] T006 Add `app.emit("hotkeys-updated", &hotkeys)` after cache update in update_hotkeys function in src-tauri/src/user_settings.rs
- [x] T007 Verify Rust compilation with `cargo check` in src-tauri/

**Checkpoint**: Backend now emits `hotkeys-updated` event when settings change

---

## Phase 3: User Story 1 - Configured Hotkeys Work When Focused (Priority: P1) 🎯 MVP

**Goal**: User-configured hotkeys work when overlay webview is focused (replaces hardcoded F3/F5)

**Independent Test**: Configure custom hotkey (e.g., Ctrl+O), focus overlay, press hotkey, verify action triggers

### Implementation for User Story 1

- [x] T008 [US1] Add imports for `listen`, `UnlistenFn` from `@tauri-apps/api/event` in src/hooks/useHotkeyCapture.ts
- [x] T009 [US1] Add imports for `HotkeySettings`, `HotkeyBinding`, `LoadUserSettingsResult`, `DEFAULT_USER_SETTINGS` from `@/types/user-settings` in src/hooks/useHotkeyCapture.ts
- [x] T010 [US1] Add `useState` import and create `hotkeyConfig` state variable in src/hooks/useHotkeyCapture.ts
- [x] T011 [US1] Add `unlistenRef` useRef for event listener cleanup in src/hooks/useHotkeyCapture.ts
- [x] T012 [US1] Implement `matchesHotkey(event, binding)` helper function to compare KeyboardEvent against HotkeyBinding in src/hooks/useHotkeyCapture.ts
- [x] T013 [US1] Add useEffect to load initial settings via `invoke('load_user_settings')` with fallback to DEFAULT_USER_SETTINGS in src/hooks/useHotkeyCapture.ts
- [x] T014 [US1] Replace hardcoded F3/F5 checks with `matchesHotkey(e, hotkeyConfig.toggleVisibility)` and `matchesHotkey(e, hotkeyConfig.toggleMode)` in keydown handler in src/hooks/useHotkeyCapture.ts
- [x] T015 [US1] Rename debounce refs from `lastF3PressRef`/`lastF5PressRef` to `lastVisibilityPressRef`/`lastModePressRef` in src/hooks/useHotkeyCapture.ts
- [x] T016 [US1] Update useEffect dependency array to include `hotkeyConfig` alongside `enabled` in src/hooks/useHotkeyCapture.ts
- [x] T017 [US1] Add early return in capture useEffect if `hotkeyConfig` is null (settings not yet loaded) in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Custom hotkeys work when overlay is focused. Test with Ctrl+O configured as visibility toggle.

---

## Phase 4: User Story 2 - Hotkey Changes Apply Immediately (Priority: P1)

**Goal**: Hotkey changes in Settings Panel take effect immediately without restart

**Independent Test**: Change hotkey in Settings, press new hotkey in focused overlay, verify it works immediately

### Implementation for User Story 2

- [x] T018 [US2] Add useEffect for event listener setup with `listen<HotkeySettings>('hotkeys-updated', ...)` in src/hooks/useHotkeyCapture.ts
- [x] T019 [US2] Update `hotkeyConfig` state when `hotkeys-updated` event is received in src/hooks/useHotkeyCapture.ts
- [x] T020 [US2] Add cleanup function that calls `unlistenRef.current?.()` on unmount in src/hooks/useHotkeyCapture.ts
- [x] T021 [US2] Add info log when hotkeys are updated via event in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Hotkey changes apply immediately. Test by changing visibility toggle from F3 to Ctrl+O and verifying Ctrl+O works and F3 no longer triggers.

---

## Phase 5: User Story 3 & 4 - Defaults and Modifiers (Priority: P2)

**Goal**: US3 - Correct defaults on fresh start; US4 - Modifier keys work correctly

**Independent Test**:
- US3: Delete user-settings.json, launch app, verify F3/F5 work when focused
- US4: Configure Ctrl+Shift+O, verify only Ctrl+Shift+O triggers (not just O)

### Implementation for User Stories 3 & 4

> These are automatically covered by the correct implementation of US1 and US2:
> - US3: `DEFAULT_USER_SETTINGS.hotkeys` provides F3/F5 defaults when no settings exist
> - US4: `matchesHotkey()` checks all modifier flags (ctrl, shift, alt)

- [x] T022 [US3] Verify DEFAULT_USER_SETTINGS fallback works when load_user_settings fails (already implemented in T013) in src/hooks/useHotkeyCapture.ts
- [x] T023 [US4] Verify matchesHotkey checks all modifier flags: ctrl, shift, alt (already implemented in T012) in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Default F3/F5 work on fresh install. Modifier keys are correctly validated.

---

## Phase 6: Polish & Validation

**Purpose**: Final verification and code quality

- [x] T024 Update JSDoc header comment in src/hooks/useHotkeyCapture.ts to reflect new dynamic configuration behavior
- [x] T025 Remove old KEY_F3 and KEY_F5 constants from src/hooks/useHotkeyCapture.ts (no longer needed)
- [x] T026 Run TypeScript compilation check with `npm run type-check`
- [x] T027 Run Rust compilation check with `cd src-tauri && cargo check`
- [ ] T028 Manual test: Default F3/F5 work on fresh install when overlay is focused
- [ ] T029 Manual test: Custom hotkey (Ctrl+O) works when overlay is focused
- [ ] T030 Manual test: Hotkey change in Settings takes effect immediately
- [ ] T031 Manual test: Old hotkey (F3) stops working after changing to Ctrl+O
- [ ] T032 Manual test: Modifier requirements enforced (Ctrl+O requires Ctrl pressed)
- [ ] T033 Manual test: Rapid key presses are debounced (200ms)
- [ ] T034 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: No code dependencies, but MUST complete before Phase 4
- **User Story 1 (Phase 3)**: Depends on Phase 1 understanding
- **User Story 2 (Phase 4)**: Depends on Phase 2 (backend event) AND Phase 3 (hook state)
- **User Story 3 & 4 (Phase 5)**: Verification only - covered by US1/US2 implementation
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - can start after Phase 1
- **User Story 2 (P1)**: Depends on US1 (needs hotkeyConfig state) AND Phase 2 (needs event emission)
- **User Story 3 (P2)**: Covered by US1 implementation
- **User Story 4 (P2)**: Covered by US1 implementation

### Parallel Opportunities

```
Phase 1: T001, T002, T003 can all run in parallel (read-only verification)

Phase 2: T004, T005, T006 must be sequential (same file, same function)

Phase 3-4: All tasks in same file, should be sequential

Phase 6: T026, T027 can run in parallel (different toolchains)
         T028-T033 can be batched as single test session
```

---

## Parallel Example: Setup Phase

```bash
# Launch verification tasks in parallel:
Task T001: "Verify existing types in src/types/user-settings.ts"
Task T002: "Verify existing update_hotkeys command in src-tauri/src/user_settings.rs"
Task T003: "Review current useHotkeyCapture implementation in src/hooks/useHotkeyCapture.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (verification)
2. Complete Phase 2: Foundational (backend event emission)
3. Complete Phase 3: User Story 1 (dynamic hotkey loading)
4. Complete Phase 4: User Story 2 (real-time event listening)
5. **STOP and VALIDATE**: Test with custom hotkey + setting change
6. Complete Phase 5: Verify US3/US4 are covered
7. Complete Phase 6: Polish and final validation

### Incremental Delivery

1. After Phase 2: Backend emits events (invisible to users)
2. After Phase 3 (MVP): Custom hotkeys work when focused
3. After Phase 4: Settings changes apply immediately
4. After Phase 6: Feature complete and validated

### Single Developer Strategy

This is a small, focused feature. Recommended approach:

1. Complete Phases 1-4 in one session (< 1 hour)
2. Run all manual tests from Phase 6
3. Fix any issues found during testing
4. Commit and mark complete

---

## Notes

- Total tasks: 34
- Files modified: 2 (src/hooks/useHotkeyCapture.ts, src-tauri/src/user_settings.rs)
- No new files created
- No new dependencies added
- Tests are manual per project convention
- US3 and US4 are verification tasks - core logic is in US1/US2
