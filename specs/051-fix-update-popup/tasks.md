# Tasks: Fix Update Popup Not Appearing

**Input**: Design documents from `/specs/051-fix-update-popup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks included (not explicitly requested in feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `src-tauri/src/` (Rust/Tauri)
- **Frontend**: `app/` (Next.js routes), `src/` (React components/hooks)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new types and state management infrastructure

- [X] T001 [P] Add `UpdateWindowState` struct with `Mutex<Option<UpdateInfo>>` in `src-tauri/src/update/types.rs`
- [X] T002 [P] Add `OpenUpdateWindowResult` struct with `success`, `created`, `error` fields in `src-tauri/src/update/types.rs`
- [X] T003 Register `UpdateWindowState::default()` in `.manage()` chain in `src-tauri/src/lib.rs`

---

## Phase 2: Foundational (Backend Window Module)

**Purpose**: Core backend infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `src-tauri/src/update/window.rs` with module documentation header
- [X] T005 Implement `open_update_window` command in `src-tauri/src/update/window.rs` following `settings_window.rs` pattern with `skip_taskbar(false)`, add `log::info!` for window creation/focus events
- [X] T006 Implement `get_pending_update` command in `src-tauri/src/update/window.rs` to return `Option<UpdateInfo>` from state
- [X] T007 Implement `close_update_window` command in `src-tauri/src/update/window.rs` with `dismiss` parameter, add `log::info!` for window close and dismiss events
- [X] T008 Export `window` module from `src-tauri/src/update/mod.rs`
- [X] T009 Register `open_update_window`, `get_pending_update`, `close_update_window` commands in `src-tauri/src/lib.rs`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - See Update Notification on App Launch (Priority: P1) 🎯 MVP

**Goal**: When a user launches the app and a new version is available, a separate update window appears in the taskbar within 5 seconds

**Independent Test**: Launch app with newer version on GitHub, verify popup window appears in taskbar within 5 seconds showing version upgrade path

### Implementation for User Story 1

- [X] T010 [US1] Modify `check_for_updates` in `src-tauri/src/update/checker.rs` to set `UpdateWindowState` when update found
- [X] T011 [US1] Modify `check_for_updates` in `src-tauri/src/update/checker.rs` to call `open_update_window` after setting state
- [X] T012 [P] [US1] Create `app/update/page.tsx` Next.js route that renders UpdatePage component
- [X] T013 [P] [US1] Create `src/components/update/UpdatePage.tsx` page wrapper component
- [X] T014 [US1] Implement `useEffect` in `UpdatePage.tsx` to call `get_pending_update` on mount and store result
- [X] T014a [US1] Add event listener in `UpdatePage.tsx` for `update-info-changed` to refresh displayed update info without remounting
- [X] T015 [US1] Render existing `UpdateNotification` component inside `UpdatePage.tsx` with fetched update info
- [X] T016 [US1] Implement `onAccept` handler in `UpdatePage.tsx` to call existing `download_update` command
- [X] T017 [US1] Implement `onLater` handler in `UpdatePage.tsx` to call `close_update_window` with `dismiss: true`
- [X] T018 [US1] Implement `onDismiss` handler in `UpdatePage.tsx` to call `close_update_window` with `dismiss: true`
- [X] T019 [US1] Add logging for window open/close events using existing logger in `UpdatePage.tsx`

**Checkpoint**: User Story 1 complete - update window appears on app launch when update available

---

## Phase 4: User Story 2 - Update Window Visible in Taskbar (Priority: P1)

**Goal**: The update window appears in Windows taskbar so users can locate and interact with it even when covered by other windows

**Independent Test**: Launch app with update available, click update window in taskbar to bring it to focus

### Implementation for User Story 2

- [X] T020 [US2] Verify `open_update_window` in `src-tauri/src/update/window.rs` uses `.skip_taskbar(false)` (should be done in T005)
- [X] T021 [US2] Verify window title is set to "RAIC Overlay Update" for taskbar identification in `src-tauri/src/update/window.rs`
- [X] T022 [US2] Implement window reuse logic in `open_update_window` - if window exists, update `UpdateWindowState` with new info, emit `update-info-changed` event to frontend, call `.show()` and `.set_focus()` instead of creating new

**Checkpoint**: User Story 2 complete - update window appears in taskbar and can be focused via taskbar click

---

## Phase 5: User Story 3 - Update Notification Independent of Overlay State (Priority: P2)

**Goal**: The update window operates independently of the main overlay window visibility state

**Independent Test**: Keep overlay hidden (don't press F3), launch app with update available, verify update window still appears

### Implementation for User Story 3

- [X] T023 [US3] Verify `open_update_window` does not depend on main window visibility state in `src-tauri/src/update/window.rs`
- [X] T024 [US3] Remove `UpdateNotification` component from `app/page.tsx` (overlay main page)
- [X] T025 [US3] Remove `useUpdateChecker` hook usage from `app/page.tsx`
- [X] T026 [US3] Keep `useUpdateChecker.ts` hook but simplify - only export `checkForUpdates` function for manual trigger if needed

**Checkpoint**: All user stories complete - update window fully independent of overlay

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T027 [P] Adapt `UpdateNotification.tsx` styling for full-window layout - remove `fixed top-4 right-4` positioning in `src/components/update/UpdateNotification.tsx`
- [X] T028 [P] Export `UpdatePage` from `src/components/update/index.ts`
- [X] T029 Update feature annotation comments in new files with `@feature 051-fix-update-popup`
- [ ] T030 Run manual test: Launch app with update available, verify window appears in taskbar within 5 seconds
- [ ] T031 Run manual test: Click "Update Now", verify download starts
- [ ] T032 Run manual test: Click "Ask Again Later", verify window closes
- [ ] T033 Run manual test: Toggle overlay (F3), verify update window unaffected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different focus areas)
  - US3 should follow US1 (removes old code from overlay)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core functionality
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Taskbar visibility (partially overlaps with T005)
- **User Story 3 (P2)**: Should start after US1 - Removes old code from overlay page

### Within Each User Story

- Backend commands before frontend usage
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002 can run in parallel (different type definitions)
- T012, T013 can run in parallel (different files)
- T027, T028, T029 can run in parallel (different files)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks in parallel:
Task: "Add UpdateWindowState struct in src-tauri/src/update/types.rs"
Task: "Add OpenUpdateWindowResult struct in src-tauri/src/update/types.rs"
```

## Parallel Example: User Story 1 Frontend

```bash
# Launch frontend scaffolding in parallel:
Task: "Create app/update/page.tsx Next.js route"
Task: "Create src/components/update/UpdatePage.tsx page wrapper"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 (T010-T019)
4. **STOP and VALIDATE**: Test update window appears on app launch
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP ready!
3. Add User Story 2 → Test taskbar visibility → Deploy
4. Add User Story 3 → Test overlay independence → Deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Window configuration follows `settings_window.rs` pattern exactly
- Existing `UpdateNotification` component is reused with minimal styling adjustments
