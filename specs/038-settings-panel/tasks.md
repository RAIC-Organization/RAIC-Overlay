# Tasks: Settings Panel Window

**Input**: Design documents from `/specs/038-settings-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - manual integration testing only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend (Rust)**: `src-tauri/src/`
- **Frontend (React)**: `src/components/`, `src/types/`, `src/utils/`
- **App Routes**: `app/`
- **Config**: `src-tauri/capabilities/`, `src-tauri/Cargo.toml`, `package.json`

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Add required dependencies and permissions for Settings Panel feature

- [x] T001 Add `tauri-plugin-autostart = "2"` to `[target.'cfg(desktop)'.dependencies]` in src-tauri/Cargo.toml
- [x] T002 Run `npm install @tauri-apps/plugin-autostart` to add frontend autostart dependency
- [x] T003 Add window permissions (core:window:allow-show, core:window:allow-hide, core:window:allow-set-focus, core:window:allow-start-dragging) to src-tauri/capabilities/default.json
- [x] T004 Add autostart permissions (autostart:allow-enable, autostart:allow-disable, autostart:allow-is-enabled) to src-tauri/capabilities/default.json

---

## Phase 2: Foundational (Backend Core Types & Persistence)

**Purpose**: Create core data types and persistence infrastructure required by ALL user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create user settings types file with UserSettings, HotkeySettings, HotkeyBinding structs in src-tauri/src/user_settings_types.rs
- [x] T006 Add LoadUserSettingsResult and SaveUserSettingsResult types to src-tauri/src/user_settings_types.rs
- [x] T007 Create user settings persistence module with load/save commands in src-tauri/src/user_settings.rs
- [x] T008 Add get_hotkey_settings() accessor function for keyboard hook integration in src-tauri/src/user_settings.rs
- [x] T009 Create settings window module with open_settings_window command in src-tauri/src/settings_window.rs
- [x] T010 Add module declarations for user_settings, user_settings_types, and settings_window to src-tauri/src/lib.rs
- [x] T011 Register load_user_settings, save_user_settings, and open_settings_window in invoke_handler in src-tauri/src/lib.rs
- [x] T012 Initialize tauri-plugin-autostart in app setup block in src-tauri/src/lib.rs
- [x] T013 [P] Create TypeScript user-settings types file with interfaces in src/types/user-settings.ts
- [x] T014 [P] Create VK code mapping utility with keyToVkCode function in src/utils/vk-codes.ts
- [x] T015 [P] Create hotkey validation utility with validateHotkeyBinding, formatHotkey, hotkeyEquals in src/utils/hotkey-validation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Hotkeys (Priority: P1) - MVP

**Goal**: Users can customize keyboard shortcuts (F3/F5) for overlay control through the Settings panel

**Independent Test**: Open Settings panel, change a hotkey binding to Ctrl+Shift+O, press the new combination, verify overlay responds

### Implementation for User Story 1

- [x] T016 [US1] Create HotkeyInput component with key capture logic in src/components/settings/HotkeyInput.tsx
- [x] T017 [US1] Add keyboard event handler for capturing key combinations in src/components/settings/HotkeyInput.tsx
- [x] T018 [US1] Add duplicate key validation display in HotkeyInput component in src/components/settings/HotkeyInput.tsx
- [x] T019 [US1] Add reserved key rejection with user feedback in src/components/settings/HotkeyInput.tsx
- [x] T020 [US1] Create SettingsPanel component with hotkeys section in src/components/settings/SettingsPanel.tsx
- [x] T021 [US1] Add settings load on mount and save handler in src/components/settings/SettingsPanel.tsx
- [x] T022 [US1] Create settings page route in app/settings/page.tsx
- [x] T023 [US1] Add update_hotkeys command for applying hotkey changes in src-tauri/src/user_settings.rs
- [x] T024 [US1] Register update_hotkeys command in invoke_handler in src-tauri/src/lib.rs
- [x] T025 [US1] Modify keyboard_hook.rs to use configurable hotkey bindings from user settings in src-tauri/src/keyboard_hook.rs
- [x] T026 [US1] Add load_user_settings call during app startup to initialize cached settings in src-tauri/src/lib.rs
- [x] T027 [US1] Add hotkeys-updated event emission after hotkey changes applied in src-tauri/src/user_settings.rs

**Checkpoint**: Users can open Settings, configure custom hotkeys, and have them work immediately

---

## Phase 4: User Story 2 - Access Settings via Tray Icon (Priority: P2)

**Goal**: Users can open Settings panel from system tray menu; window is draggable and visible in taskbar

**Independent Test**: Right-click tray icon, click "Settings", verify window opens in taskbar and can be dragged

### Implementation for User Story 2

- [x] T028 [US2] Add "Settings" MenuItem above "Exit" in tray menu creation in src-tauri/src/tray.rs
- [x] T029 [US2] Add menu event handler for "settings" item that calls open_settings_window in src-tauri/src/tray.rs
- [x] T030 [US2] Add draggable header with data-tauri-drag-region attribute in src/components/settings/SettingsPanel.tsx
- [x] T031 [US2] Apply liquid glass styling (bg-background/80 backdrop-blur-xl) matching ErrorModal in src/components/settings/SettingsPanel.tsx
- [x] T032 [US2] Add SC theme glow effects (sc-glow-transition sc-corner-accents shadow-glow-sm) to SettingsPanel in src/components/settings/SettingsPanel.tsx
- [x] T033 [US2] Add window focus logic in open_settings_window for existing window case (FR-017) in src-tauri/src/settings_window.rs

**Checkpoint**: Settings opens from tray, window appears in taskbar, can be dragged, matches app styling

---

## Phase 5: User Story 3 - Enable Auto-Start on Windows Startup (Priority: P2)

**Goal**: Users can enable/disable Windows startup auto-launch through Settings panel

**Independent Test**: Enable auto-start toggle, restart Windows, verify application launches automatically

### Implementation for User Story 3

- [x] T034 [US3] Create AutoStartToggle component with toggle UI in src/components/settings/AutoStartToggle.tsx
- [x] T035 [US3] Add autostart status check using @tauri-apps/plugin-autostart isEnabled in src/components/settings/AutoStartToggle.tsx
- [x] T036 [US3] Add enable/disable handlers using @tauri-apps/plugin-autostart enable/disable in src/components/settings/AutoStartToggle.tsx
- [x] T037 [US3] Add get_autostart_status command for querying Windows Registry state in src-tauri/src/user_settings.rs (N/A - plugin provides JS API directly)
- [x] T038 [US3] Add set_autostart command for enabling/disabling startup registration in src-tauri/src/user_settings.rs (N/A - plugin provides JS API directly)
- [x] T039 [US3] Register get_autostart_status and set_autostart commands in invoke_handler in src-tauri/src/lib.rs (N/A - plugin provides JS API directly)
- [x] T040 [US3] Add Startup section with AutoStartToggle to SettingsPanel in src/components/settings/SettingsPanel.tsx
- [x] T041 [US3] Sync autoStart toggle state with actual Windows Registry on panel open in src/components/settings/SettingsPanel.tsx

**Checkpoint**: Auto-start toggle correctly registers/unregisters app from Windows startup

---

## Phase 6: User Story 4 - Close Settings Without Exiting App (Priority: P3)

**Goal**: X button closes Settings window but keeps overlay and tray icon active

**Independent Test**: Open Settings, click X button, verify overlay remains active and tray icon present

### Implementation for User Story 4

- [x] T042 [US4] Add X button with close handler using window.hide() in Settings header in src/components/settings/SettingsPanel.tsx
- [x] T043 [US4] Style X button with SC theme (sc-glow-transition hover:bg-muted/50) in src/components/settings/SettingsPanel.tsx
- [x] T044 [US4] Verify window.hide() behavior preserves main application state in src/components/settings/SettingsPanel.tsx

**Checkpoint**: X button hides Settings window without affecting main overlay functionality

---

## Phase 7: Polish & Edge Cases

**Purpose**: Handle error conditions and edge cases from spec

- [x] T045 [P] Add fallback to default hotkeys when settings file is corrupted or missing in src-tauri/src/user_settings.rs
- [x] T046 [P] Add error handling for Registry write failures with user-friendly message in src/components/settings/AutoStartToggle.tsx
- [x] T047 [P] Add loading state indicator while settings are being loaded in src/components/settings/SettingsPanel.tsx
- [x] T048 [P] Add saving state indicator with disabled save button while persisting in src/components/settings/SettingsPanel.tsx
- [x] T049 [P] Add modifier-only key rejection with informative message in src/components/settings/HotkeyInput.tsx
- [x] T050 Verify settings file written atomically (temp file + rename pattern) in src-tauri/src/user_settings.rs
- [ ] T051 Run manual integration tests from quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Can start immediately after
- **User Story 2 (Phase 4)**: Depends on Foundational - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational - Can run in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US2 (needs Settings window to exist)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - core hotkey configuration
- **User Story 2 (P2)**: Independent - tray menu and window creation
- **User Story 3 (P2)**: Independent - auto-start functionality
- **User Story 4 (P3)**: Depends on US2 (requires SettingsPanel component to exist)

### Within Each User Story

- Backend commands before frontend components that use them
- Types before components that use them
- Core functionality before styling

### Parallel Opportunities

**Setup (Phase 1)**:
- T001-T004 can run sequentially or split (T001-T002 Rust, T003-T004 config)

**Foundational (Phase 2)**:
- T005-T012 must be sequential (Rust module dependencies)
- T013, T014, T015 can run in parallel (different TypeScript files)

**User Stories (after Foundational)**:
- US1, US2, US3 can all start in parallel (different files)
- US4 should wait for US2 to create the base SettingsPanel

---

## Parallel Example: After Foundational Complete

```bash
# All user stories can start simultaneously:

# User Story 1 (Developer A):
Task: "Create HotkeyInput component in src/components/settings/HotkeyInput.tsx"

# User Story 2 (Developer B):
Task: "Add Settings MenuItem to tray in src-tauri/src/tray.rs"

# User Story 3 (Developer C):
Task: "Create AutoStartToggle component in src/components/settings/AutoStartToggle.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T015)
3. Complete Phase 3: User Story 1 (T016-T027)
4. **STOP and VALIDATE**: Test hotkey configuration independently
5. Deploy/demo if ready - core customization works

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Hotkey configuration works (MVP!)
3. Add User Story 2 → Settings accessible from tray
4. Add User Story 3 → Auto-start functional
5. Add User Story 4 → Window close behavior correct
6. Polish → Edge cases handled

### Single Developer Strategy

1. Complete Setup + Foundational in order
2. Complete User Story 1 fully (highest priority)
3. Complete User Story 2 (tray integration)
4. Complete User Story 4 (depends on US2 being done)
5. Complete User Story 3 (auto-start, independent)
6. Polish phase

---

## Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Phase 1: Setup | 4 | 0 |
| Phase 2: Foundational | 11 | 3 |
| Phase 3: US1 (P1) | 12 | 0 |
| Phase 4: US2 (P2) | 6 | 0 |
| Phase 5: US3 (P2) | 8 | 0 |
| Phase 6: US4 (P3) | 3 | 0 |
| Phase 7: Polish | 7 | 5 |
| **Total** | **51** | **8** |

### MVP Scope (US1 only): 27 tasks (Setup + Foundational + US1)

### Full Feature: 51 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- SettingsPanel.tsx is modified by multiple stories - coordinate carefully
