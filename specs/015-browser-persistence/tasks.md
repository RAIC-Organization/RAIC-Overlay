# Tasks: Browser Window Persistence

**Input**: Design documents from `/specs/015-browser-persistence/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Integration tests added per Constitution II (Testing Standards). Manual testing checklist also provided in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type Extensions)

**Purpose**: Extend type definitions to support Browser window persistence

- [X] T001 [P] Add `BrowserPersistedContent` interface to src/types/persistence.ts
- [X] T002 [P] Extend `WindowType` union to include 'browser' in src/types/persistence.ts
- [X] T003 [P] Update `WindowContentFile.content` union to include `BrowserPersistedContent` in src/types/persistence.ts
- [X] T004 [P] Add `Browser` variant to `WindowType` enum in src-tauri/src/persistence_types.rs

**Checkpoint**: Type system extended - implementation can now proceed

---

## Phase 2: Foundational (Serialization & Helpers)

**Purpose**: Core infrastructure for browser content serialization

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Add `clampBrowserZoom` helper function in src/types/persistence.ts
- [X] T006 [P] Add `normalizeBrowserContent` helper function in src/types/persistence.ts
- [X] T007 [P] Add `DEFAULT_BROWSER_CONTENT` constant in src/types/persistence.ts
- [X] T008 [P] Add `isBrowserContent` type guard function in src/types/persistence.ts

> **Note**: T005-T008 marked [P] because they are independent functions within the same file - can be written in parallel then merged.

- [X] T009 Add 'browser' case handling in serialization logic in src/lib/serialization.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browser State Restoration on Launch (Priority: P1) 🎯 MVP

**Goal**: Restore Browser windows with correct URLs and zoom levels when the application launches

**Independent Test**: Open Browser windows, navigate to URLs, adjust zoom, close app, reopen - verify all Browser windows restored with exact states

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Integration test for browser state restoration (save/load cycle) in tests/integration/browser-persistence.test.ts
- [X] T011 [P] [US1] Integration test for invalid zoom clamping in tests/integration/browser-persistence.test.ts

### Implementation for User Story 1

- [X] T012 [US1] Extend `BrowserContentProps` interface with persistence props (windowId, initialUrl, initialZoom, onUrlChange, onZoomChange) in src/components/windows/BrowserContent.tsx
- [X] T013 [US1] Update useState hooks to use initialUrl and initialZoom props as default values in src/components/windows/BrowserContent.tsx
- [X] T014 [US1] Add 'browser' case to window content rendering with initial state props in src/components/windows/WindowsContainer.tsx
- [X] T015 [US1] Handle missing content file by using defaults (example.com, 50% zoom) in src/components/windows/WindowsContainer.tsx
- [X] T016 [US1] Validate restored zoom is clamped to valid range (10-200%) in src/components/windows/BrowserContent.tsx

**Checkpoint**: User Story 1 complete - Browser windows restore correctly on app launch

---

## Phase 4: User Story 2 - Automatic State Persistence During Use (Priority: P2)

**Goal**: Automatically persist URL and zoom changes while user works with Browser windows

**Independent Test**: Change URL and zoom in Browser window, forcefully terminate app, reopen - verify changes were saved

### Implementation for User Story 2

- [X] T017 [US2] Add onUrlChange callback invocation after iframe onLoad event in src/components/windows/BrowserContent.tsx
- [X] T018 [US2] Add onZoomChange callback invocation in zoomIn function in src/components/windows/BrowserContent.tsx
- [X] T019 [US2] Add onZoomChange callback invocation in zoomOut function in src/components/windows/BrowserContent.tsx
- [X] T020 [US2] Wire onUrlChange and onZoomChange callbacks to handleContentChange in src/components/windows/WindowsContainer.tsx
- [X] T021 [US2] Ensure handleContentChange triggers persistence with 500ms debounce for browser content in src/components/windows/WindowsContainer.tsx

**Checkpoint**: User Story 2 complete - URL and zoom changes auto-persist

---

## Phase 5: User Story 3 - Permanent Browser Window Closure (Priority: P2)

**Goal**: When a Browser window is closed, all its persisted data is permanently deleted

**Independent Test**: Create Browser window with custom URL/zoom, close it, restart app - verify window does not reappear

### Implementation for User Story 3

- [ ] T022 [US3] Verify Browser window closure triggers window-{id}.json deletion via existing persistence system
- [ ] T023 [US3] Verify Browser window removal from state.json windows array via existing persistence system
- [ ] T024 [US3] Test orphaned file cleanup for browser content files on app startup

**Checkpoint**: User Story 3 complete - Browser window closure permanently deletes data

---

## Phase 6: Polish & Validation

**Purpose**: Final validation and edge case handling

- [ ] T025 Run manual testing checklist from quickstart.md
- [ ] T026 Verify edge case: persisted URL no longer accessible (should show error page)
- [ ] T027 Verify edge case: multiple Browser windows with same URL work independently
- [ ] T028 Verify edge case: invalid opacity in persisted data is clamped (30-100%)
- [ ] T029 Run linting and type checking (npm run lint, tsc --noEmit)
- [ ] T030 Verify cargo test passes for Rust changes
- [ ] T031 Test app build and startup (npm run tauri build)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Restore - Must be implemented first (MVP)
  - User Story 2 (P2): Persist - Can start after US1, shares same files
  - User Story 3 (P2): Cleanup - Can verify in parallel with US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Restore functionality
- **User Story 2 (P2)**: Builds on US1 by adding change callbacks - Uses same component
- **User Story 3 (P2)**: Mostly verification - Leverages existing persistence deletion

### Within Each User Story

- Props/interfaces before implementations
- State initialization before callbacks
- Component changes before container integration
- Core implementation before edge case handling

### Parallel Opportunities

- **Phase 1**: All T001-T004 can run in parallel (different files)
- **Phase 2**: T005-T008 can run in parallel (same file, independent functions)
- **Phase 3**: T010-T011 integration tests can run in parallel
- **Phase 6**: T026-T028 edge case tests can run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type extension tasks together:
Task: "Add BrowserPersistedContent interface to src/types/persistence.ts"
Task: "Add Browser variant to WindowType enum in src-tauri/src/persistence_types.rs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type extensions)
2. Complete Phase 2: Foundational (serialization)
3. Complete Phase 3: User Story 1 (restoration)
4. **STOP and VALIDATE**: Test Browser window restoration
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Types ready
2. Add User Story 1 → Test restoration → Deploy (MVP!)
3. Add User Story 2 → Test auto-persistence → Deploy
4. Add User Story 3 → Verify cleanup → Deploy
5. Polish phase → Final validation

### Estimated Effort

Per quickstart.md:
- Phase 1-2 (Types + Foundation): ~40 min
- Phase 3 (User Story 1): ~1.5 hours (includes writing integration tests)
- Phase 4 (User Story 2): ~30 min
- Phase 5 (User Story 3): ~15 min (mostly verification)
- Phase 6 (Polish): ~1 hour

**Total**: ~4 hours

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Stories 2 & 3 share P2 priority but US2 modifies same component as US1
- This feature extends existing 010-state-persistence-system - no new files created
- Existing persistence infrastructure handles window create/close/move/resize - only URL/zoom are new
- Manual testing checklist provided in quickstart.md - use for Phase 6 validation
