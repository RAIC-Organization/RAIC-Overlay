# Tasks: Fix Browser and File Viewer First-Session Persistence

**Input**: Design documents from `/specs/034-fix-browser-persist/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: No automated tests requested. Manual verification steps provided in plan.md.

**Organization**: This is a minimal bug fix affecting a single file. Tasks are organized by user story but converge on a single implementation since all stories share the same root cause.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: `src/` at repository root (Tauri + Next.js app)
- **Target file**: `src/hooks/useWindowEvents.ts`

---

## Phase 1: Setup

**Purpose**: Preparation and bug confirmation

- [x] T001 Clear app data to create fresh test environment (delete state.json and window-*.json from Tauri app data directory)
- [x] T002 Start app and confirm bug exists: create browser window, navigate to https://google.com, close and restart app, verify URL shows https://example.com (default)

**Checkpoint**: Bug confirmed - proceed with fix

---

## Phase 2: Implementation (All User Stories)

**Purpose**: Single code change that resolves all user stories

**Note**: User Stories 1-4 all share the same root cause and are fixed by the same code change. They are combined here for efficiency but each has its own verification step.

### Core Fix

- [x] T003 Add FileType import to src/hooks/useWindowEvents.ts (add `import type { FileType } from '@/types/persistence';` to imports)
- [x] T004 Add browser window callback injection in src/hooks/useWindowEvents.ts:openWindowWithPersistence() after the draw window handler block, before the return statement
- [x] T005 Add file viewer window callback injection in src/hooks/useWindowEvents.ts:openWindowWithPersistence() immediately after browser handler

**Checkpoint**: Code changes complete - proceed with verification

---

## Phase 3: User Story 1 - Browser URL Persistence (Priority: P1) MVP

**Goal**: Browser windows persist URL changes on first session

**Independent Test**: Create new browser window, navigate to URL, restart app, verify URL restored

### Verification for User Story 1

- [ ] T006 [US1] Clear app data and start fresh
- [ ] T007 [US1] Create browser window, navigate to https://google.com
- [ ] T008 [US1] Close and restart app, verify browser window shows https://google.com (not https://example.com)

**Checkpoint**: User Story 1 verified - browser URL persistence works

---

## Phase 4: User Story 2 - Browser Zoom Persistence (Priority: P1)

**Goal**: Browser windows persist zoom level changes on first session

**Independent Test**: Create new browser window, change zoom, restart app, verify zoom restored

### Verification for User Story 2

- [ ] T009 [US2] Clear app data and start fresh
- [ ] T010 [US2] Create browser window, change zoom to 80%
- [ ] T011 [US2] Close and restart app, verify browser window shows 80% zoom (not 50% default)

**Checkpoint**: User Story 2 verified - browser zoom persistence works

---

## Phase 5: User Story 3 - File Viewer Persistence (Priority: P1)

**Goal**: File viewer windows persist file path, type, and zoom on first session

**Independent Test**: Create new file viewer window, open file, adjust zoom, restart app, verify file and zoom restored

### Verification for User Story 3

- [ ] T012 [US3] Clear app data and start fresh
- [ ] T013 [US3] Create file viewer window, open a PDF or image file, adjust zoom
- [ ] T014 [US3] Close and restart app, verify file viewer shows same file with same zoom

**Checkpoint**: User Story 3 verified - file viewer persistence works

---

## Phase 6: User Story 4 - Consistent Behavior (Priority: P2)

**Goal**: All window types (Notes, Draw, Browser, File Viewer) behave consistently

**Independent Test**: Create all window types, make changes, restart app, verify all persist

### Verification for User Story 4

- [ ] T015 [US4] Clear app data and start fresh
- [ ] T016 [US4] Create one window of each type: Notes, Draw, Browser, File Viewer
- [ ] T017 [US4] Make changes to each: add text to notes, draw shapes, navigate browser, open file in viewer
- [ ] T018 [US4] Close and restart app, verify ALL windows restore with their changes

**Checkpoint**: User Story 4 verified - consistent persistence across all window types

---

## Phase 7: Polish & Regression Check

**Purpose**: Ensure no regressions and code quality

- [x] T019 Run TypeScript type check to verify no type errors in src/hooks/useWindowEvents.ts
- [ ] T020 Verify Notes windows still persist correctly after fix (regression check)
- [ ] T021 Verify Draw windows still persist correctly after fix (regression check)
- [ ] T022 Verify restored windows (after second restart) continue to work correctly
- [x] T023 Update feature doc comment in src/hooks/useWindowEvents.ts to include @feature 034-fix-browser-persist

**Note**: Edge case "rapid app close" is handled by existing `app-exit-requested` event listener in PersistenceContext.tsx which calls `flushPendingSaves()`. No additional task required.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - confirms bug exists
- **Phase 2 (Implementation)**: Depends on Phase 1 - makes the code changes
- **Phases 3-6 (User Story Verification)**: All depend on Phase 2 completion
  - Can run in any order (parallel verification)
  - Recommended: Run sequentially in priority order (US1 → US2 → US3 → US4)
- **Phase 7 (Polish)**: Depends on at least one user story being verified

### Task Dependencies

```text
T001 → T002 (confirm bug first)
T002 → T003 → T004 → T005 (sequential code changes)
T005 → T006-T018 (code must be complete before verification)
T018 → T019-T023 (all stories verified before polish)
```

### Parallel Opportunities

Since all user stories are verified through the same code change:
- User story verification phases (3-6) can technically run in parallel
- However, they all require the same app restart cycle, so sequential execution is more practical
- Polish tasks T019, T020, T021 can run in parallel (different verification targets)

---

## Parallel Example: Verification Phase

```bash
# After code changes are complete, these verifications can run in any order:
# (though they all require fresh app state, so batch them)

# User Story 1: Browser URL
Task: "Create browser window, navigate to https://google.com"
Task: "Close and restart app, verify browser window shows https://google.com"

# User Story 2: Browser Zoom
Task: "Create browser window, change zoom to 80%"
Task: "Close and restart app, verify browser window shows 80% zoom"

# User Story 3: File Viewer
Task: "Create file viewer window, open a PDF or image file, adjust zoom"
Task: "Close and restart app, verify file viewer shows same file with same zoom"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (confirm bug)
2. Complete Phase 2: Implementation (single file change)
3. Complete Phase 3: User Story 1 Verification
4. **STOP and VALIDATE**: Browser URL persistence works
5. Proceed to remaining user stories

### Incremental Verification

1. Complete code changes (T003-T005)
2. Verify User Story 1 (browser URL) → Pass? Continue
3. Verify User Story 2 (browser zoom) → Pass? Continue
4. Verify User Story 3 (file viewer) → Pass? Continue
5. Verify User Story 4 (consistency) → Pass? Complete
6. Run regression checks (T020-T022)

### Estimated Effort

- **Total tasks**: 23
- **Code change tasks**: 3 (T003-T005)
- **Verification tasks**: 13 (T006-T018)
- **Setup/Polish tasks**: 7 (T001-T002, T019-T023)
- **Lines of code changed**: ~25 (1 import + 2 conditional blocks)
- **Files modified**: 1 (`src/hooks/useWindowEvents.ts`)

---

## Notes

- This is a minimal bug fix - all user stories are fixed by the same code change
- Verification is the bulk of the work to ensure all scenarios pass
- No automated tests - manual verification as specified in plan.md
- The fix follows the exact pattern already used for Notes and Draw windows
- TypeScript type checking serves as the compile-time validation
