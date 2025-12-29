# Tasks: Prevent Default Webview Hotkeys

**Input**: Design documents from `/specs/039-prevent-default-plugin/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: Manual testing only - no automated test tasks included per specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Due to the minimal nature of this feature (single plugin integration), all user stories are satisfied by the same core implementation in Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Tauri backend**: `src-tauri/src/`, `src-tauri/Cargo.toml`

---

## Phase 1: Setup (Dependency Installation)

**Purpose**: Add plugin dependency to project

- [X] T001 Add `tauri-plugin-prevent-default = "4"` to dependencies in src-tauri/Cargo.toml

---

## Phase 2: Foundational (Plugin Registration)

**Purpose**: Core plugin integration that satisfies ALL user stories

**⚠️ CRITICAL**: This single plugin registration implements FR-001 through FR-009, covering all user stories simultaneously. FR-010 (text input preservation) and FR-011 (F3 toggle preservation) are verified in Phase 7 as edge case validation.

- [ ] T002 Create `get_prevent_default_plugin()` helper function with conditional debug/release configuration in src-tauri/src/lib.rs
- [ ] T003 Register prevent-default plugin in `tauri::Builder::default()` chain in src-tauri/src/lib.rs

**Checkpoint**: Plugin integrated - all browser shortcuts should now be blocked

---

## Phase 3: User Story 1 - Block Browser Search Shortcut (Priority: P1)

**Goal**: F3 no longer triggers browser "Find in Page" dialog

**Independent Test**: Press F3 while overlay is focused - no Find dialog appears, overlay fullscreen toggle still works

### Verification for User Story 1

- [ ] T004 [US1] Manual test: Run debug build, press F3, verify no Find dialog appears
- [ ] T005 [US1] Manual test: Verify F3 overlay fullscreen toggle functionality still works

**Checkpoint**: US1 complete - F3 browser behavior blocked, app behavior preserved

---

## Phase 4: User Story 2 - Block Common Browser Shortcuts (Priority: P1)

**Goal**: Ctrl+P, Ctrl+J, Ctrl+R, F5, Ctrl+U no longer trigger browser dialogs

**Independent Test**: Press each shortcut while overlay is focused - no browser dialogs or actions occur

### Verification for User Story 2

- [ ] T006 [US2] Manual test: Press Ctrl+P, verify no print dialog appears
- [ ] T007 [US2] Manual test: Press Ctrl+J, verify no downloads panel opens
- [ ] T008 [US2] Manual test: Press Ctrl+R and F5, verify page does not reload
- [ ] T009 [US2] Manual test: Press Ctrl+U, verify no "View Source" window opens

**Checkpoint**: US2 complete - common browser shortcuts blocked

---

## Phase 5: User Story 3 - Preserve DevTools Access in Debug Mode (Priority: P2)

**Goal**: F12/Ctrl+Shift+I opens DevTools in debug builds, blocked in release builds

**Independent Test**: Test both debug and release builds for DevTools access

### Verification for User Story 3

- [ ] T010 [US3] Manual test: Debug build - press F12, verify DevTools opens
- [ ] T011 [US3] Manual test: Debug build - press Ctrl+Shift+I, verify DevTools opens
- [ ] T012 [US3] Manual test: Release build (`cargo tauri build`) - press F12, verify DevTools does NOT open
- [ ] T013 [US3] Manual test: Release build - press Ctrl+Shift+I, verify DevTools does NOT open

**Checkpoint**: US3 complete - DevTools access controlled by build type

---

## Phase 6: User Story 4 - Block Context Menu (Priority: P3)

**Goal**: Right-click no longer shows browser context menu

**Independent Test**: Right-click anywhere in overlay - no browser context menu appears

### Verification for User Story 4

- [ ] T014 [US4] Manual test: Right-click in overlay, verify no browser context menu appears
- [ ] T015 [US4] Manual test: Verify any custom context menus (if implemented) still work

**Checkpoint**: US4 complete - browser context menu blocked

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate edge cases and text input preservation

- [ ] T016 [P] Verify text input in Notes (TipTap) editor works normally
- [ ] T017 [P] Verify text input in Browser URL bar works normally
- [ ] T018 [P] Verify TipTap formatting shortcuts (Ctrl+B, Ctrl+I) still work
- [ ] T019 Verify F5 mode toggle functionality still works (keyboard hook should capture before webview)
- [ ] T020 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - add dependency to Cargo.toml
- **Foundational (Phase 2)**: Depends on Phase 1 - implements all blocking functionality
- **User Stories (Phase 3-6)**: All depend on Phase 2 - verification/testing only
- **Polish (Phase 7)**: Depends on Phase 2 - edge case validation

### User Story Dependencies

All user stories are implemented by the same plugin registration (T002, T003). The user story phases (3-6) are verification-only tasks that can be performed in parallel once Phase 2 is complete.

- **User Story 1 (P1)**: Verification after Phase 2
- **User Story 2 (P1)**: Verification after Phase 2 - can parallel with US1
- **User Story 3 (P2)**: Verification after Phase 2 - requires release build for full test
- **User Story 4 (P3)**: Verification after Phase 2 - can parallel with US1, US2

### Parallel Opportunities

After Phase 2 completion:
- T004-T005 (US1) can run in parallel with T006-T009 (US2)
- T010-T013 (US3) requires separate release build
- T014-T015 (US4) can run in parallel with US1, US2
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: All Debug Build Verification

```bash
# After Phase 2, all debug build tests can run together:
Task: "Manual test: Run debug build, press F3, verify no Find dialog appears"
Task: "Manual test: Press Ctrl+P, verify no print dialog appears"
Task: "Manual test: Press Ctrl+J, verify no downloads panel opens"
Task: "Manual test: Press Ctrl+R and F5, verify page does not reload"
Task: "Manual test: Press Ctrl+U, verify no View Source window opens"
Task: "Manual test: Debug build - press F12, verify DevTools opens"
Task: "Manual test: Right-click in overlay, verify no browser context menu appears"
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2)

1. Complete Phase 1: Add dependency (T001)
2. Complete Phase 2: Register plugin (T002, T003)
3. **STOP and VALIDATE**: Run `cargo tauri dev` and test F3, Ctrl+P, right-click
4. All user stories satisfied by single integration

### Verification Flow

1. Run debug build: `cargo tauri dev`
2. Test all blocked shortcuts (F3, Ctrl+P, Ctrl+J, Ctrl+R, Ctrl+U)
3. Test DevTools access (F12 should work in debug)
4. Test right-click (no browser menu)
5. Test text input preservation (Notes, Browser URL bar)
6. Build release: `cargo tauri build`
7. Test DevTools blocked in release
8. Complete

### Task Metrics

| Metric | Count |
|--------|-------|
| Total Tasks | 20 |
| Implementation Tasks | 3 (T001-T003) |
| Verification Tasks | 17 (T004-T020) |
| Parallelizable | 5 |
| Files Modified | 2 (Cargo.toml, lib.rs) |

---

## Notes

- This is a minimal-footprint feature: 3 implementation tasks, rest is verification
- All user stories satisfied by single plugin integration
- No new modules, no data models, no API contracts needed
- Manual testing specified per spec (no automated tests requested)
- Debug/release differentiation handled by `#[cfg(debug_assertions)]`
