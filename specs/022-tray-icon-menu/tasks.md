# Tasks: Windows System Tray Icon

**Input**: Design documents from `/specs/022-tray-icon-menu/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - manual testing per spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Rust Backend**: `src-tauri/src/`
- **Frontend**: `src/` (no changes required for this feature)

---

## Phase 1: Setup

**Purpose**: Enable Tauri tray icon feature and prepare module structure

- [x] T001 Add `tray-icon` feature to tauri dependency in src-tauri/Cargo.toml
- [x] T002 Create tray module file at src-tauri/src/tray.rs with module skeleton
- [x] T003 Add `pub mod tray;` declaration to src-tauri/src/lib.rs

---

## Phase 2: User Story 1 - View Application Presence in System Tray (Priority: P1) 🎯 MVP

**Goal**: Display RAICOverlay icon in Windows system tray with tooltip showing app name

**Independent Test**: Launch application and verify tray icon appears in Windows notification area with "RAICOverlay" tooltip on hover

### Implementation for User Story 1

- [x] T004 [US1] Import required Tauri tray and menu types in src-tauri/src/tray.rs
- [x] T005 [US1] Implement `setup_tray` function signature accepting `&AppHandle` in src-tauri/src/tray.rs
- [x] T006 [US1] Add TrayIconBuilder with `.icon(app.default_window_icon())` to use existing app icon in src-tauri/src/tray.rs
- [x] T007 [US1] Add `.tooltip("RAICOverlay")` to TrayIconBuilder in src-tauri/src/tray.rs
- [x] T008 [US1] Call `tray::setup_tray(&handle)` from setup closure in src-tauri/src/lib.rs
- [x] T009 [US1] Add logging for tray icon initialization in src-tauri/src/tray.rs

**Checkpoint**: User Story 1 complete - tray icon visible with tooltip, no menu yet

---

## Phase 3: User Story 2 - Exit Application via Tray Menu (Priority: P1)

**Goal**: Add context menu with "Exit" option that gracefully terminates the application with state persistence

**Independent Test**: Right-click tray icon, verify "Exit" menu appears, click Exit, verify app terminates and state is persisted

### Implementation for User Story 2

- [ ] T010 [US2] Create MenuItem with id "quit" and text "Exit" in src-tauri/src/tray.rs
- [ ] T011 [US2] Create Menu with quit_item using `Menu::with_items` in src-tauri/src/tray.rs
- [ ] T012 [US2] Add `.menu(&menu)` to TrayIconBuilder in src-tauri/src/tray.rs
- [ ] T013 [US2] Implement `on_menu_event` handler matching "quit" id in src-tauri/src/tray.rs
- [ ] T014 [US2] Emit "app-exit-requested" event to frontend window in on_menu_event handler in src-tauri/src/tray.rs
- [ ] T015 [US2] Add delayed app.exit(0) after 500ms for state persistence in src-tauri/src/tray.rs
- [ ] T016 [US2] Add logging for exit request in on_menu_event handler in src-tauri/src/tray.rs
- [ ] T017 [P] [US2] Add `app-exit-requested` event listener to trigger saveState in src/contexts/PersistenceContext.tsx

**Checkpoint**: User Story 2 complete - Exit menu works, state persists before termination

---

## Phase 4: Polish & Verification

**Purpose**: Final verification and documentation

- [ ] T018 Build and run application with `npm run tauri dev`
- [ ] T019 Verify tray icon appears within 2 seconds of launch (SC-001)
- [ ] T020 Verify tooltip shows "RAICOverlay" on hover (FR-003)
- [ ] T021 Verify context menu appears on right-click with "Exit" option (FR-004, FR-005)
- [ ] T022 Verify Exit terminates app gracefully with state saved (FR-006, FR-008)
- [ ] T023 Verify tray icon removed after termination (FR-007)
- [ ] T024 Update CLAUDE.md with feature 022 completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **User Story 1 (Phase 2)**: Depends on Setup (Phase 1)
- **User Story 2 (Phase 3)**: Depends on User Story 1 (needs TrayIconBuilder in place)
- **Polish (Phase 4)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Creates the tray icon - MUST complete first
- **User Story 2 (P1)**: Adds menu to existing tray icon - depends on US1

Note: Both stories are P1 but have sequential dependency (menu requires icon to exist first)

### Within Each User Story

- Models/imports before implementation
- Core functionality before logging
- Backend before frontend (for US2 event handling)

### Parallel Opportunities

- T017 (frontend listener) can run in parallel with T010-T016 (backend menu implementation)
- T018-T023 (verification steps) are sequential manual tests

---

## Parallel Example: User Story 2

```bash
# These can run in parallel (different files):
Task: T017 [P] [US2] Add event listener in src/contexts/PersistenceContext.tsx
# While also working on:
Task: T010-T016 [US2] Backend menu implementation in src-tauri/src/tray.rs
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T009)
3. **STOP and VALIDATE**: Verify tray icon appears with tooltip
4. Tray icon visible = MVP achieved

### Full Feature

1. Complete Setup + User Story 1 → Tray icon visible (MVP)
2. Complete User Story 2 → Exit menu functional
3. Complete Polish → Verified against all success criteria

### Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Setup | T001-T003 | Enable feature, create module |
| User Story 1 | T004-T009 | Tray icon with tooltip |
| User Story 2 | T010-T017 | Exit menu with persistence |
| Polish | T018-T024 | Verification and docs |

**Total Tasks**: 24
**Parallel Opportunities**: 1 (T017 with T010-T016)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 2 depends on User Story 1 (menu requires icon)
- No automated tests - feature relies on manual verification
- All implementation in Rust except T017 (TypeScript frontend listener)
- Commit after each phase completion
