# Tasks: Header Button Group Separation

**Input**: Design documents from `/specs/041-header-button-groups/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested - visual verification only per plan.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (per plan.md)

---

## Phase 1: Setup

**Purpose**: No setup required - this feature modifies existing files only

*No tasks - existing infrastructure is sufficient*

---

## Phase 2: Foundational

**Purpose**: No foundational work required - uses existing ButtonGroup and separator patterns

*No tasks - existing patterns are sufficient*

**Checkpoint**: Ready for user story implementation

---

## Phase 3: User Story 1 - Visual Separation of Window Types (Priority: P1) 🎯 MVP

**Goal**: Reorganize MainMenu buttons into two visually separated groups: Apps (Notes, Draw, Browser, File Viewer) and Widgets (Clock)

**Independent Test**: Open overlay (F3), verify Apps buttons are grouped on left, visible vertical divider exists, and Widgets group (Clock) is on right

### Implementation for User Story 1

- [X] T001 [US1] Split single ButtonGroup into Apps ButtonGroup in src/components/MainMenu.tsx
- [X] T002 [US1] Add Widgets ButtonGroup with separator div wrapper in src/components/MainMenu.tsx
- [X] T003 [US1] Move Clock button from Apps group to Widgets group in src/components/MainMenu.tsx
- [X] T004 [US1] Update comment from "Windows: Notes & Test Windows" to "Apps: Window-based components" in src/components/MainMenu.tsx

**Checkpoint**: Apps and Widgets groups are visually separated with divider - User Story 1 complete

---

## Phase 4: User Story 2 - Test Windows Button Removal (Priority: P1)

**Goal**: Remove the Test Windows button from the UI so users no longer see it

**Independent Test**: Open overlay (F3), confirm no "Test Windows" button exists anywhere in the menu

### Implementation for User Story 2

- [ ] T005 [US2] Remove Test Windows button from ButtonGroup JSX in src/components/MainMenu.tsx
- [ ] T006 [US2] Remove handleTestWindows function in src/components/MainMenu.tsx
- [ ] T007 [US2] Remove TestWindowContent import statement in src/components/MainMenu.tsx

**Checkpoint**: Test Windows button is removed from UI - User Story 2 complete

---

## Phase 5: User Story 3 - Clean Codebase (Priority: P2)

**Goal**: Remove TestWindowContent component file and 'test' content type from codebase

**Independent Test**: Search codebase for "TestWindowContent" and "test" content type - should find zero references

### Implementation for User Story 3

- [ ] T008 [P] [US3] Delete TestWindowContent component file at src/components/windows/TestWindowContent.tsx
- [ ] T009 [P] [US3] Remove 'test' from WindowContentType union in src/types/windows.ts

**Checkpoint**: Codebase has no TestWindowContent references - User Story 3 complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation

- [ ] T010 Run application with `npm run tauri dev` and verify visual layout
- [ ] T011 Verify TypeScript compilation passes with `npx tsc --noEmit`
- [ ] T012 Verify all buttons still function correctly (Notes, Draw, Browser, File Viewer, Clock)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped - no setup needed
- **Foundational (Phase 2)**: Skipped - no foundational work needed
- **User Story 1 (Phase 3)**: Can start immediately
- **User Story 2 (Phase 4)**: Can start in parallel with US1 (modifies same file but different sections)
- **User Story 3 (Phase 5)**: Can start in parallel (different files entirely)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - modifies JSX structure
- **User Story 2 (P1)**: No dependencies - removes button and handler
- **User Story 3 (P2)**: No dependencies on other stories - can run in parallel (different files)

### Within Each User Story

- T001-T004 (US1): Sequential (same JSX block)
- T005-T007 (US2): Sequential (related code in same file)
- T008-T009 (US3): Parallel (different files)

### Parallel Opportunities

- **Cross-story parallelism**: US3 tasks (T008, T009) can run in parallel with US1/US2 tasks
- **Within US3**: T008 and T009 are marked [P] - can run in parallel (different files)

---

## Parallel Example: Optimal Execution

```text
# Maximum parallelism approach:

# Stream 1 (MainMenu.tsx changes):
T001 → T002 → T003 → T004 → T005 → T006 → T007

# Stream 2 (Independent file changes - can run alongside Stream 1):
T008 (delete TestWindowContent.tsx)
T009 (modify windows.ts)

# Final validation (after all above complete):
T010 → T011 → T012
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T004 (User Story 1)
2. **STOP and VALIDATE**: Open overlay, verify visual separation
3. Proceed to User Story 2

### Recommended Execution Order

Since User Stories 1 and 2 both modify MainMenu.tsx, execute them sequentially:

1. **US1**: T001 → T002 → T003 → T004
2. **US2**: T005 → T006 → T007
3. **US3** (parallel): T008, T009
4. **Polish**: T010 → T011 → T012

### Single Developer Strategy

All tasks in a single file (MainMenu.tsx) should be done sequentially:
- T001 through T007 in order
- Then T008 and T009 (can be done in either order)
- Finally T010 through T012 for validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No tests included (visual verification per plan.md)
- Total: 12 tasks across 3 user stories
- Commit after each user story for clean history
