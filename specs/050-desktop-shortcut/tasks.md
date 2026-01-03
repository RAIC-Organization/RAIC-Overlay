# Tasks: Fix Windows Desktop Shortcut Creation

**Input**: Design documents from `/specs/050-desktop-shortcut/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/wix-changes.md, quickstart.md

**Tests**: Manual testing only (no automated tests - this is an installer fix)

**Organization**: Tasks are grouped by user story to enable independent verification of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This feature modifies only the WiX installer template:
- `src-tauri/windows/installer.wxs` - WiX template file

---

## Phase 1: Setup

**Purpose**: Verify development environment is ready for the fix

- [X] T001 Verify Windows 11 development environment is set up
- [X] T002 Verify Rust toolchain is installed (`rustc --version`)
- [X] T003 Verify Node.js is installed (`node --version`)
- [X] T004 Verify Tauri CLI is available (`npm run tauri --version`)

---

## Phase 2: Implementation (Single Fix)

**Purpose**: Apply the WiX condition fix - this is the core change

- [X] T005 Fix desktop shortcut condition in `src-tauri/windows/installer.wxs` (line ~191)
  - Find: `<Condition>INSTALLDESKTOPSHORTCUT = "1"</Condition>`
  - Replace with: `<Condition>INSTALLDESKTOPSHORTCUT</Condition>`

---

## Phase 3: User Story 1 - Desktop Shortcut Created When Selected (Priority: P1) 🎯 MVP

**Goal**: Verify that checking the "Create a desktop shortcut" checkbox during interactive installation creates a working shortcut

**Independent Test**: Run MSI installer, check checkbox, verify shortcut appears on desktop and launches application

### Verification for User Story 1

- [ ] T006 [US1] Build the MSI installer (`npm run tauri build`)
- [ ] T007 [US1] Test Case 2: Interactive installation with checkbox checked
  - Run MSI installer
  - Check "Create a desktop shortcut" checkbox
  - Complete installation
  - Verify shortcut appears on desktop
- [ ] T008 [US1] Verify shortcut displays correct RAIC Overlay icon (not generic)
- [ ] T009 [US1] Verify double-clicking shortcut launches RAIC Overlay
- [ ] T010 [US1] Verify shortcut properties show correct target path
- [ ] T011 [US1] Test Case 1: Interactive installation with checkbox unchecked
  - Uninstall previous installation
  - Run MSI installer
  - Leave checkbox unchecked
  - Complete installation
  - Verify NO shortcut on desktop
- [ ] T012 [US1] Test Case 5: Uninstall removes desktop shortcut
  - Install with checkbox checked
  - Verify shortcut exists
  - Uninstall via Windows Settings
  - Verify shortcut is removed

**Checkpoint**: User Story 1 is complete when interactive installation correctly creates/skips shortcut based on checkbox

---

## Phase 4: User Story 2 - Silent Installation Desktop Shortcut (Priority: P2)

**Goal**: Verify that silent installation respects the `INSTALLDESKTOPSHORTCUT` parameter

**Independent Test**: Run silent installation with parameter and verify shortcut is created without UI

### Verification for User Story 2

- [ ] T013 [US2] Test Case 4: Silent installation with `INSTALLDESKTOPSHORTCUT=1`
  - Ensure clean state (no prior installation)
  - Run: `msiexec /i "RAIC Overlay.msi" /quiet INSTALLDESKTOPSHORTCUT=1`
  - Verify shortcut is created on desktop
  - Verify shortcut works correctly
- [ ] T014 [US2] Test Case 3: Silent installation without parameter
  - Uninstall previous installation
  - Run: `msiexec /i "RAIC Overlay.msi" /quiet`
  - Verify NO shortcut on desktop

**Checkpoint**: User Story 2 is complete when silent installation respects the parameter

---

## Phase 5: Polish & Documentation

**Purpose**: Final verification and commit

- [ ] T015 Verify all 5 test cases from contracts/wix-changes.md pass
- [ ] T016 Update installer.wxs header comment with sync date
- [ ] T017 Commit changes with descriptive message:
  - "fix(installer): Fix desktop shortcut creation condition"
  - Reference WiX truthy evaluation pattern in commit body

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify environment first
- **Implementation (Phase 2)**: Depends on Setup - apply the one-line fix
- **User Story 1 (Phase 3)**: Depends on Implementation - test interactive installation
- **User Story 2 (Phase 4)**: Depends on Implementation - test silent installation (can run parallel with US1)
- **Polish (Phase 5)**: Depends on both user stories passing

### User Story Dependencies

- **User Story 1 (P1)**: Requires implementation complete - tests interactive checkbox
- **User Story 2 (P2)**: Requires implementation complete - tests command-line parameter
- **No dependencies between US1 and US2**: They can be verified in parallel

### Within Each User Story

- Build installer before testing
- Test positive case (shortcut created) before negative case (shortcut skipped)
- Verify shortcut functionality before moving to next story

### Parallel Opportunities

- T001-T004: All setup checks can run in parallel
- T007-T012 (US1) and T013-T014 (US2): Can run in parallel after build completes

---

## Parallel Example

```bash
# After T006 (build) completes, both user stories can be verified in parallel:

# Developer A: User Story 1 verification
- T007: Test interactive install with checkbox checked
- T011: Test interactive install with checkbox unchecked

# Developer B: User Story 2 verification
- T013: Test silent install with INSTALLDESKTOPSHORTCUT=1
- T014: Test silent install without parameter
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Apply the one-line fix
3. Complete Phase 3: Verify interactive installation works
4. **STOP and VALIDATE**: If checkbox behavior is correct, MVP is achieved
5. Optionally proceed to User Story 2

### Full Implementation

1. Complete Setup → verify environment
2. Apply fix → single line change
3. Build installer → creates MSI
4. Test User Story 1 → interactive checkbox works
5. Test User Story 2 → silent parameter works
6. Polish → commit with good message

---

## Notes

- This is a minimal fix: 1 line change in 1 file
- Manual testing required (no automated tests for MSI installers)
- Total estimated time: 15-30 minutes including all tests
- The fix uses WiX truthy evaluation instead of string comparison
- Backward compatible: existing installations not affected
