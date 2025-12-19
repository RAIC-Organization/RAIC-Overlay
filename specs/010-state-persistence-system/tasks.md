# Tasks: State Persistence System

**Input**: Design documents from `/specs/010-state-persistence-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` (TypeScript/React)
- **Backend**: `src-tauri/src/` (Rust)
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and backend storage infrastructure

- [x] T001 Add `tauri-plugin-single-instance = "2.0.0"` dependency to `src-tauri/Cargo.toml`
- [x] T002 [P] Create persistence types file `src-tauri/src/persistence_types.rs` with Rust structs from data-model.md
- [x] T003 [P] Create TypeScript persistence types `src/types/persistence.ts` with interfaces from data-model.md
- [x] T004 [P] Create TypeScript IPC types `src/types/persistence-ipc.ts` with LoadStateResult, SaveResult, DeleteResult
- [x] T005 [P] Create debounce utility `src/lib/debounce.ts` with cancel and flush support

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend persistence commands and single instance - MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create persistence module `src-tauri/src/persistence.rs` with atomic_write helper function
- [x] T007 Implement `load_state` command in `src-tauri/src/persistence.rs` per contracts/tauri-commands.md
- [x] T008 Implement `save_state` command in `src-tauri/src/persistence.rs` per contracts/tauri-commands.md
- [x] T009 Implement `save_window_content` command in `src-tauri/src/persistence.rs` per contracts/tauri-commands.md
- [x] T010 Implement `delete_window_content` command in `src-tauri/src/persistence.rs` per contracts/tauri-commands.md
- [x] T011 Register single-instance plugin and persistence commands in `src-tauri/src/lib.rs`
- [x] T012 Create persistence service `src/stores/persistenceService.ts` wrapping Tauri invoke calls

**Checkpoint**: Backend storage layer ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Session Restoration on Application Launch (Priority: P1) 🎯 MVP

**Goal**: User opens the app and previous session state is restored - windows appear in their previous positions with their content

**Independent Test**: Arrange windows with content, close app, reopen, verify complete state restored within 2 seconds

### Implementation for User Story 1

- [x] T013 [US1] Create useHydration hook in `src/hooks/useHydration.ts` to load state on startup
- [x] T014 [US1] Create LoadingScreen component in `src/components/LoadingScreen.tsx` for hydration blocking
- [x] T015 [US1] Update `app/page.tsx` to use useHydration and show LoadingScreen until hydrated
- [x] T016 [US1] Extend WindowsContext in `src/contexts/WindowsContext.tsx` to accept initial hydrated state
- [x] T017 [US1] Add version check to useHydration - reset to defaults on version mismatch per spec
- [x] T018 [US1] Handle corrupted state in useHydration - fall back to defaults and log error
- [x] T019 [US1] Implement window content restoration in WindowsContext from hydrated windowContents map
- [x] T020 [US1] Update NotesContent in `src/components/windows/NotesContent.tsx` to accept initial content from persistence
- [x] T021 [US1] Update DrawContent in `src/components/windows/DrawContent.tsx` to accept initial content from persistence

**Checkpoint**: User Story 1 complete - app restores full session state on launch, falls back to defaults gracefully

---

## Phase 4: User Story 2 - Automatic State Persistence During Use (Priority: P2)

**Goal**: System automatically saves state at appropriate moments (window creation, mode changes, drag/resize end) with debouncing

**Independent Test**: Create window, move it, type content, force-terminate app, reopen, verify all changes persisted

### Implementation for User Story 2

- [x] T022 [US2] Create usePersistence hook in `src/hooks/usePersistence.ts` with debounced save logic
- [x] T023 [US2] Add state serialization helper in `src/lib/serialization.ts` to convert WindowsState to PersistedState
- [x] T024 [US2] Wire usePersistence into WindowsContext to trigger saves on state changes
- [x] T025 [US2] Implement immediate persistence trigger for window creation in WindowsContext
- [x] T026 [US2] Implement debounced persistence trigger (500ms) for drag/resize end in Window component
- [x] T027 [US2] Implement debounced persistence trigger (500ms) for content changes in NotesContent
- [x] T028 [US2] Implement debounced persistence trigger (500ms) for content changes in DrawContent
- [x] T029 [US2] Implement immediate persistence trigger for overlay mode changes in `app/page.tsx`
- [x] T030 [US2] Add content extraction callbacks to NotesContent for TipTap JSON serialization
- [x] T031 [US2] Add content extraction callbacks to DrawContent for Excalidraw elements serialization

**Checkpoint**: User Story 2 complete - all changes auto-persist with appropriate debouncing

---

## Phase 5: User Story 3 - Permanent Window Closure (Priority: P2)

**Goal**: When user closes a window, it's completely removed from memory AND disk - cannot be recovered

**Independent Test**: Create window with content, close it, restart app, verify window does not reappear and no orphaned files exist

### Implementation for User Story 3

- [x] T032 [US3] Update window close handler in WindowsContext to call delete_window_content
- [x] T033 [US3] Update window close handler to immediately save updated state.json (window removed)
- [x] T034 [US3] Add orphan cleanup to load_state in `src-tauri/src/persistence.rs` - delete window-*.json files not in state.json
- [x] T035 [US3] Add temp file cleanup to load_state - delete *.json.tmp files on startup

**Checkpoint**: User Story 3 complete - window deletion is permanent, no orphaned files

---

## Phase 6: User Story 4 - State Versioning for Future Compatibility (Priority: P3)

**Goal**: State files include version info, system resets to defaults on version mismatch, code structured for future migrations

**Independent Test**: Create state with version 1, change CURRENT_STATE_VERSION to 2, verify app resets to defaults with user notification

### Implementation for User Story 4

- [ ] T036 [US4] Ensure version field is included in all saved state.json files (verify T023 implementation)
- [ ] T037 [US4] Add migration hooks structure in `src/lib/serialization.ts` with empty migrations map for future use
- [ ] T038 [US4] Add user notification when state reset due to version mismatch (console.warn + optional toast)
- [ ] T039 [US4] Document version migration process in comments for future developers

**Checkpoint**: User Story 4 complete - versioning infrastructure in place for future migrations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, cleanup, and validation

- [ ] T040 [P] Add error handling for disk full scenario - log error, notify user, continue with in-memory state
- [ ] T041 [P] Add error handling for read-only file scenario - log error, notify user, continue with in-memory state
- [ ] T042 Add flush on app close - ensure pending debounced saves complete before app exits
- [ ] T043 [P] Verify single instance behavior - second launch focuses existing window
- [ ] T044 Run manual test checklist from quickstart.md
- [ ] T045 Verify performance targets: measure and log restore time (<2s for 20 windows) and persist time (<500ms) using console.time/timeEnd
- [ ] T045a Validate debounce efficiency: add counter to track raw state changes vs actual persist calls, verify ≥80% reduction during rapid typing test
- [ ] T046 Code cleanup and ensure TypeScript strict mode passes
- [ ] T047 Run cargo clippy on Rust code and fix any warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1) → US2 (P2) → US3 (P2) → US4 (P3) in priority order
  - OR can proceed in parallel if multiple developers
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs hydration infrastructure to persist to)
- **User Story 3 (P2)**: Can start after US1 (deletion needs content to delete, but technically independent)
- **User Story 4 (P3)**: Can start after US1 (versioning built into hydration)

### Within Each User Story

- Frontend types before hooks
- Hooks before components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 - All can run in parallel**:
```
T002 (Rust types) || T003 (TS types) || T004 (IPC types) || T005 (debounce)
```

**Phase 2 - Commands after atomic_write helper**:
```
T006 → T007 || T008 || T009 || T010
Then: T011, T012
```

**Phase 3 (US1) - Some parallelism**:
```
T013 (useHydration) || T014 (LoadingScreen)
Then: T015 → T016 → T017 → T018 → T019
Then: T020 || T021 (Notes and Draw can parallelize)
```

**Phase 4 (US2) - Sequential with some parallelism**:
```
T022 → T023 → T024
Then: T025 || T026 || T027 || T028 || T029 (triggers can parallelize)
Then: T030 || T031 (extraction callbacks can parallelize)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type definitions in parallel:
Task: "Create persistence types file src-tauri/src/persistence_types.rs"
Task: "Create TypeScript persistence types src/types/persistence.ts"
Task: "Create TypeScript IPC types src/types/persistence-ipc.ts"
Task: "Create debounce utility src/lib/debounce.ts"
```

## Parallel Example: Phase 2 Backend Commands

```bash
# After T006 (atomic_write helper) completes, launch commands in parallel:
Task: "Implement load_state command in src-tauri/src/persistence.rs"
Task: "Implement save_state command in src-tauri/src/persistence.rs"
Task: "Implement save_window_content command in src-tauri/src/persistence.rs"
Task: "Implement delete_window_content command in src-tauri/src/persistence.rs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test session restoration independently
5. Deploy/demo if ready - users can now have their state restored!

### Incremental Delivery

1. Complete Setup + Foundational → Storage layer ready
2. Add User Story 1 → Test independently → **MVP: Session restore works!**
3. Add User Story 2 → Test independently → **Auto-save works!**
4. Add User Story 3 → Test independently → **Window deletion cleans up properly!**
5. Add User Story 4 → Test independently → **Future-proofed with versioning!**
6. Each story adds value without breaking previous stories

### Suggested MVP Scope

**Minimum Viable Product = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers the core value proposition: users can close and reopen the app without losing their work. Automatic persistence (US2) can be added incrementally.

---

## Summary

| Phase | Tasks | Parallelizable | Key Deliverable |
|-------|-------|----------------|-----------------|
| Setup | T001-T005 | 4 of 5 | Types and utilities ready |
| Foundational | T006-T012 | 4 of 7 | Backend storage layer |
| US1 (P1) | T013-T021 | 3 of 9 | Session restoration (MVP) |
| US2 (P2) | T022-T031 | 7 of 10 | Auto-persistence |
| US3 (P2) | T032-T035 | 0 of 4 | Window deletion cleanup |
| US4 (P3) | T036-T039 | 0 of 4 | Versioning infrastructure |
| Polish | T040-T047 | 4 of 9 | Quality and validation |

**Total Tasks**: 48
**Tasks per User Story**: US1=9, US2=10, US3=4, US4=4
**Parallel Opportunities**: 22 tasks marked [P]

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend commands are dumb storage - all business logic is in frontend
