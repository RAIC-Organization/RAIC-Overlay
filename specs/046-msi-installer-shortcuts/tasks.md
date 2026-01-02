# Tasks: MSI Installer Shortcuts

**Input**: Design documents from `/specs/046-msi-installer-shortcuts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md, contracts/

**Tests**: Manual testing only - no automated tests required for installer configuration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature modifies Tauri configuration:
- **Tauri config**: `src-tauri/tauri.conf.json`
- **WiX template**: `src-tauri/windows/installer.wxs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and obtain base WiX template

- [X] T001 Create windows directory in src-tauri/windows/
- [X] T002 Fetch Tauri's default WiX template from https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/msi/main.wxs and save as reference

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the custom WiX template base that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create base custom WiX template in src-tauri/windows/installer.wxs using Tauri's default template as starting point
- [X] T004 Update tauri.conf.json to reference custom template via bundle.windows.wix.template path "./windows/installer.wxs"
- [X] T005 Verify WiX template compiles by running `npm run tauri build` (may fail on first run, fix any syntax errors)

**Checkpoint**: Foundation ready - custom WiX template compiles successfully

---

## Phase 3: User Story 1 - Start Menu Access (Priority: P1) 🎯 MVP

**Goal**: Ensure Start Menu shortcut is always created with correct icon and placement directly in Programs folder

**Independent Test**: Install MSI, search "RAIC Overlay" in Start Menu, verify app appears and launches correctly

### Implementation for User Story 1

- [X] T006 [US1] Verify Start Menu shortcut element exists in src-tauri/windows/installer.wxs (ApplicationStartMenuShortcut component)
- [X] T007 [US1] Ensure shortcut uses ProgramMenuFolder (not a subfolder) in src-tauri/windows/installer.wxs
- [X] T008 [US1] Verify shortcut includes Icon="ProductIcon" and correct target path in src-tauri/windows/installer.wxs
- [X] T009 [US1] Add AppUserModel.ID property to shortcut for Windows taskbar integration in src-tauri/windows/installer.wxs
- [X] T010 [US1] Build MSI and manually test Start Menu shortcut creation

**Checkpoint**: User Story 1 complete - Start Menu shortcut appears and launches app correctly

---

## Phase 4: User Story 2 - Desktop Shortcut Option (Priority: P2)

**Goal**: Add optional desktop shortcut checkbox (default: unchecked) to installer UI

**Independent Test**: Install with checkbox unchecked (no desktop shortcut), reinstall with checkbox selected (desktop shortcut appears)

### Implementation for User Story 2

- [X] T011 [US2] Add INSTALLDESKTOPSHORTCUT property with default value "0" to src-tauri/windows/installer.wxs
- [X] T012 [US2] Add checkbox control to WixUI dialog sequence bound to INSTALLDESKTOPSHORTCUT property in src-tauri/windows/installer.wxs
- [X] T013 [US2] Make ApplicationShortcutDesktop component conditional on INSTALLDESKTOPSHORTCUT="1" in src-tauri/windows/installer.wxs
- [X] T014 [US2] Ensure desktop shortcut uses same Icon and target as Start Menu shortcut in src-tauri/windows/installer.wxs
- [X] T015 [US2] Build MSI and manually test desktop shortcut opt-in behavior

**Checkpoint**: User Story 2 complete - Desktop shortcut checkbox works correctly (default off, opt-in creates shortcut)

---

## Phase 5: User Story 3 - Uninstallation Cleanup (Priority: P3)

**Goal**: Ensure all shortcuts are removed during uninstallation

**Independent Test**: Install with all shortcuts, uninstall via Control Panel, verify no shortcuts remain

### Implementation for User Story 3

- [X] T016 [US3] Verify RemoveShortcuts action exists for Start Menu shortcut component in src-tauri/windows/installer.wxs
- [X] T017 [US3] Verify RemoveShortcuts action exists for Desktop shortcut component in src-tauri/windows/installer.wxs
- [X] T018 [US3] Ensure desktop shortcut component tracks installation state for proper removal in src-tauri/windows/installer.wxs
- [X] T019 [US3] Build MSI and manually test uninstallation removes all shortcuts

**Checkpoint**: User Story 3 complete - Uninstallation removes all created shortcuts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Silent installation support and final validation

- [ ] T020 [P] Test silent installation without desktop shortcut: `msiexec /i app.msi /quiet`
- [ ] T021 [P] Test silent installation with desktop shortcut: `msiexec /i app.msi INSTALLDESKTOPSHORTCUT=1 /quiet`
- [ ] T022 [P] Test silent uninstallation: `msiexec /x app.msi /quiet`
- [ ] T023 Verify upgrade scenario: reinstall without uninstalling first, confirm shortcuts update correctly
- [ ] T024 Run quickstart.md validation checklist (all items should pass)
- [ ] T025 Document Tauri WiX template version used as comment in src-tauri/windows/installer.wxs for future maintenance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run parallel to US1 but builds on same file)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 completion (needs shortcuts to exist for uninstall testing)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Same file as US1, best done sequentially
- **User Story 3 (P3)**: Requires US1 and US2 complete (needs shortcuts to test removal)

### Within Each User Story

- Template modification before testing
- Build MSI to verify each change
- Manual verification at each checkpoint

### Parallel Opportunities

- T020, T021, T022 can run in parallel (independent test scenarios)
- US1 and US2 modify the same file (installer.wxs) - sequential recommended to avoid conflicts

---

## Parallel Example: Phase 6 Testing

```bash
# Launch all silent installation tests together:
Task: "Test silent installation without desktop shortcut"
Task: "Test silent installation with desktop shortcut"
Task: "Test silent uninstallation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (directory, fetch template)
2. Complete Phase 2: Foundational (base template, config reference)
3. Complete Phase 3: User Story 1 (Start Menu shortcut)
4. **STOP and VALIDATE**: Test Start Menu shortcut independently
5. Deploy/demo if ready - basic installer works

### Incremental Delivery

1. Complete Setup + Foundational → Custom template compiles
2. Add User Story 1 → Start Menu shortcut works (MVP!)
3. Add User Story 2 → Desktop shortcut checkbox works
4. Add User Story 3 → Clean uninstallation verified
5. Polish → Silent installation tested, documentation complete

### Sequential Implementation (Recommended)

Since all user stories modify the same WiX template file:

1. Complete Setup + Foundational
2. Complete User Story 1 → Build and test
3. Complete User Story 2 → Build and test
4. Complete User Story 3 → Build and test
5. Complete Polish phase

---

## Notes

- All tasks modify a single WiX template file (src-tauri/windows/installer.wxs)
- Sequential implementation recommended to avoid merge conflicts
- Build MSI after each significant change to catch WiX syntax errors early
- Manual testing required - no automated tests for installer behavior
- Commit after each user story checkpoint
- FR-010 (graceful permission handling) is covered by WiX default behavior - no explicit task required
