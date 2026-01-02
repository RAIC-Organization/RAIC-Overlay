# Tasks: Chronometer Widget with Configurable Hotkeys

**Input**: Design documents from `/specs/045-chronometer-widget/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual testing only (no automated tests specified in requirements)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` at repository root (TypeScript/React)
- **Backend**: `src-tauri/src/` (Rust/Tauri)

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Extend type definitions to support chronometer widget and hotkeys

- [X] T001 [P] Add 'chronometer' to WidgetType union in src/types/widgets.ts
- [X] T002 [P] Add chronometerStartPause and chronometerReset HotkeyBinding fields to HotkeySettings interface in src/types/user-settings.ts
- [X] T003 [P] Add DEFAULT_USER_SETTINGS defaults for chronometer hotkeys (Ctrl+T, Ctrl+Y) in src/types/user-settings.ts
- [X] T004 [P] Add chronometer_start_pause and chronometer_reset fields to HotkeySettings struct in src-tauri/src/user_settings_types.rs
- [X] T005 [P] Add Default impl for new chronometer hotkey fields with VK codes (0x54, 0x59) in src-tauri/src/user_settings_types.rs

---

## Phase 2: Foundational (Backend Hotkey System)

**Purpose**: Extend low-level keyboard hook and user settings to support chronometer hotkeys

**CRITICAL**: Must complete before user story implementation - hotkeys are the core interaction method

- [X] T006 Add ChronometerStartPause and ChronometerReset variants to HotkeyAction enum in src-tauri/src/keyboard_hook.rs
- [X] T007 Add last_chrono_toggle and last_chrono_reset AtomicU64 fields to KeyboardHookState in src-tauri/src/keyboard_hook.rs
- [X] T008 Add hotkey check logic for chronometer_start_pause in keyboard_hook_callback function in src-tauri/src/keyboard_hook.rs
- [X] T009 Add hotkey check logic for chronometer_reset in keyboard_hook_callback function in src-tauri/src/keyboard_hook.rs
- [X] T010 Extend event emission match to include chronometer-start-pause and chronometer-reset events in src-tauri/src/keyboard_hook.rs
- [X] T011 Add get_chronometer_hotkey_settings cache accessor function in src-tauri/src/user_settings.rs
- [X] T012 Register chronometer_start_pause and chronometer_reset Tauri commands in src-tauri/src/lib.rs

**Checkpoint**: Backend hotkey system ready - Ctrl+T and Ctrl+Y will emit events when pressed

---

## Phase 3: User Story 1 - Start/Pause Chronometer via Hotkey (Priority: P1)

**Goal**: Enable users to start and pause a chronometer using Ctrl+T hotkey

**Independent Test**: Press Ctrl+T when chronometer widget is visible - verify time starts counting. Press Ctrl+T again - verify time pauses.

### Implementation for User Story 1

- [X] T013 [P] [US1] Create chronometerEvents.ts event emitter with toggle and reset events in src/lib/chronometerEvents.ts
- [X] T014 [P] [US1] Create useChronometer.ts hook with singleton state (isRunning, elapsedMs, lastTickTimestamp) in src/hooks/useChronometer.ts
- [X] T015 [US1] Add toggle function to useChronometer hook that starts/pauses the interval timer in src/hooks/useChronometer.ts
- [X] T016 [US1] Add Tauri event listener for 'chronometer-start-pause' that calls toggle in src/hooks/useChronometer.ts
- [X] T017 [US1] Add chronometerStartPause matching and debounce logic to handleKeyDown in src/hooks/useHotkeyCapture.ts
- [X] T018 [US1] Add lastChronoToggleRef for debouncing in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Ctrl+T toggles chronometer start/pause in both interactive and non-interactive modes

---

## Phase 4: User Story 2 - Reset Chronometer via Hotkey (Priority: P1)

**Goal**: Enable users to reset chronometer to 00:00:00 using Ctrl+Y hotkey

**Independent Test**: Run chronometer to any time, press Ctrl+Y - verify display resets to 00:00:00 and stops.

### Implementation for User Story 2

- [X] T019 [US2] Add reset function to useChronometer hook that sets elapsedMs to 0 and stops timer in src/hooks/useChronometer.ts
- [X] T020 [US2] Add Tauri event listener for 'chronometer-reset' that calls reset in src/hooks/useChronometer.ts
- [X] T021 [US2] Add chronometerReset matching and debounce logic to handleKeyDown in src/hooks/useHotkeyCapture.ts
- [X] T022 [US2] Add lastChronoResetRef for debouncing in src/hooks/useHotkeyCapture.ts

**Checkpoint**: Ctrl+Y resets chronometer to 00:00:00 in both interactive and non-interactive modes

---

## Phase 5: User Story 3 - Configure Chronometer Hotkeys (Priority: P2)

**Goal**: Allow users to customize chronometer hotkeys from widget settings panel

**Independent Test**: Open widget settings, change start/pause hotkey to Ctrl+Shift+T, save - verify new hotkey works while old one doesn't.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create ChronometerWidgetSettings.tsx component with hotkey input fields in src/components/widgets/ChronometerWidgetSettings.tsx
- [ ] T024 [US3] Add HotkeyInput component for start/pause hotkey configuration in src/components/widgets/ChronometerWidgetSettings.tsx
- [ ] T025 [US3] Add HotkeyInput component for reset hotkey configuration in src/components/widgets/ChronometerWidgetSettings.tsx
- [ ] T026 [US3] Add conflict validation against F3/F5 system hotkeys in src/components/widgets/ChronometerWidgetSettings.tsx
- [ ] T027 [US3] Add save handler that invokes update_chronometer_hotkeys command in src/components/widgets/ChronometerWidgetSettings.tsx
- [ ] T028 [US3] Implement update_chronometer_hotkeys command in src-tauri/src/user_settings.rs
- [ ] T029 [US3] Emit hotkeys-updated event after saving new configuration in src-tauri/src/user_settings.rs

**Checkpoint**: Custom hotkeys can be configured, saved, and take effect immediately

---

## Phase 6: User Story 4 - Visual Chronometer Display (Priority: P2)

**Goal**: Display elapsed time in HH:MM:SS format with liquid-glass theme styling

**Independent Test**: View chronometer widget - verify time is displayed in HH:MM:SS format with readable typography matching theme.

### Implementation for User Story 4

- [ ] T030 [P] [US4] Create ChronometerWidgetContent.tsx component skeleton in src/components/widgets/ChronometerWidgetContent.tsx
- [ ] T031 [US4] Add useChronometer hook integration for formattedTime display in src/components/widgets/ChronometerWidgetContent.tsx
- [ ] T032 [US4] Add ResizeObserver for auto-scaling font size in src/components/widgets/ChronometerWidgetContent.tsx
- [ ] T033 [US4] Add font-orbitron and liquid-glass-text styling in src/components/widgets/ChronometerWidgetContent.tsx
- [ ] T034 [US4] Add formatElapsedTime function (HH:MM:SS format) to useChronometer hook in src/hooks/useChronometer.ts
- [ ] T035 [US4] Add 'chronometer' case to renderWidgetContent switch in src/components/widgets/WidgetsContainer.tsx
- [ ] T036 [US4] Export ChronometerWidgetContent and ChronometerWidgetSettings from src/components/widgets/index.ts

**Checkpoint**: Chronometer widget displays time in HH:MM:SS format with proper styling

---

## Phase 7: User Story 5 - Chronometer Widget Lifecycle (Priority: P3)

**Goal**: Persist chronometer state when widget is closed and restore on reopen

**Independent Test**: Start chronometer, close widget, reopen - verify time is preserved and widget is paused.

### Implementation for User Story 5

- [ ] T037 [US5] Add elapsedMs persistence to widget data in useChronometer hook in src/hooks/useChronometer.ts
- [ ] T038 [US5] Add loadPersistedState function to restore elapsedMs on widget mount in src/hooks/useChronometer.ts
- [ ] T039 [US5] Add pauseAndSave function called on widget close in src/hooks/useChronometer.ts
- [ ] T040 [US5] Add chronometer widget defaults (width, height, opacity) to WidgetsContext in src/contexts/WidgetsContext.tsx
- [ ] T041 [US5] Wire widget close event to trigger pauseAndSave in src/components/widgets/ChronometerWidgetContent.tsx

**Checkpoint**: Chronometer state persists across widget close/reopen - always reopens paused

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge cases, and validation

- [ ] T042 Add chronometer widget to main menu widget options in src/components/MainMenu.tsx
- [ ] T043 Add edge case handling for rapid hotkey presses (verify 200ms debouncing) in src/hooks/useChronometer.ts
- [ ] T044 Add edge case handling for 99:59:59 max display time in src/hooks/useChronometer.ts
- [ ] T045 Add conditional hotkey processing - only when chronometer widget exists and overlay visible in src-tauri/src/keyboard_hook.rs
- [ ] T046 Run manual validation per quickstart.md testing checklist
- [ ] T047 Verify build passes with cargo build --release and npm run build
- [ ] T048 Document manual test results for all acceptance scenarios from spec.md
- [ ] T049 Verify hotkey response time <200ms using manual timing test (press hotkey, observe immediate response) in both overlay modes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 (P1): Can proceed in parallel after Foundational
  - US3 and US4 (P2): Can proceed in parallel, may start after Foundational
  - US5 (P3): Depends on US4 (needs widget component to exist)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Shares useChronometer.ts with US1 but independent functions
- **User Story 3 (P2)**: Can start after Foundational - Settings component is independent
- **User Story 4 (P2)**: Can start after Foundational - Needs useChronometer.ts from US1/US2
- **User Story 5 (P3)**: Depends on US4 - Needs ChronometerWidgetContent.tsx to exist

### Within Each User Story

- Files marked [P] can be created in parallel
- Hook additions before component integrations
- Backend changes before frontend consumption

### Parallel Opportunities

- All Setup tasks (T001-T005) can run in parallel
- T013-T014 (US1 core files) can run in parallel
- T023 (US3 settings component) can run in parallel with US1/US2 work
- T030 (US4 content component) can run in parallel with US1/US2 work

---

## Parallel Example: Setup Phase

```bash
# Launch all type definition tasks together:
Task: "Add 'chronometer' to WidgetType union in src/types/widgets.ts"
Task: "Add chronometerStartPause and chronometerReset to HotkeySettings in src/types/user-settings.ts"
Task: "Add chronometer fields to HotkeySettings struct in src-tauri/src/user_settings_types.rs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Start/Pause)
4. Complete Phase 4: User Story 2 (Reset)
5. **STOP and VALIDATE**: Test Ctrl+T and Ctrl+Y hotkeys work
6. Deploy/demo if ready - core timing functionality complete

### Incremental Delivery

1. Complete Setup + Foundational → Hotkey infrastructure ready
2. Add User Story 1 + 2 → Test hotkeys → Deploy/Demo (Core MVP!)
3. Add User Story 3 → Test settings → Deploy/Demo (Customization)
4. Add User Story 4 → Test display → Deploy/Demo (Visual Polish)
5. Add User Story 5 → Test persistence → Deploy/Demo (Full Feature)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 + US2 are both P1 priority - complete both for minimal viable chronometer
- Total tasks: 49 (T001-T049)
