# Tasks: System Clock Window

**Input**: Design documents from `/specs/023-system-clock-window/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual testing only (no automated tests requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Add clock window type to frontend and backend type systems

- [x] T001 [P] Add 'clock' to WindowContentType union in src/types/windows.ts
- [x] T002 [P] Add 'clock' to WindowType union in src/types/persistence.ts
- [x] T003 [P] Add Clock variant to WindowType enum in src-tauri/src/persistence_types.rs

**Checkpoint**: Type system ready - clock window type recognized by frontend and backend

---

## Phase 2: Foundational (Core Component)

**Purpose**: Create the ClockContent component that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create ClockContent component skeleton in src/components/windows/ClockContent.tsx
- [x] T005 Implement time state with useState and 1-second interval update in src/components/windows/ClockContent.tsx
- [x] T006 Implement 24-hour time formatting (HH:MM:SS) using toLocaleTimeString in src/components/windows/ClockContent.tsx
- [x] T007 Add interval cleanup in useEffect return function in src/components/windows/ClockContent.tsx

**Checkpoint**: Foundation ready - ClockContent displays and updates time every second

---

## Phase 3: User Story 1 + 4 - View Current Time & Transparent Background (Priority: P1) 🎯 MVP

**Goal**: Display system time in 24-hour format with white text, blue border, and transparent background

**Independent Test**: Create clock window from menu, verify time displays as HH:MM:SS with white text/blue border on transparent background

### Implementation for User Story 1 + 4

- [ ] T008 [US1] Add white text color styling to time display in src/components/windows/ClockContent.tsx
- [ ] T009 [US1] Add -webkit-text-stroke blue border (2px #3b82f6) with paint-order in src/components/windows/ClockContent.tsx
- [ ] T010 [US1] Add system-ui font-family stack to time display in src/components/windows/ClockContent.tsx
- [ ] T011 [US4] Add pointer-events: none to container div for click-through in src/components/windows/ClockContent.tsx
- [ ] T012 [US4] Add pointer-events: auto to text span for drag interaction in src/components/windows/ClockContent.tsx
- [ ] T013 Import ClockContent and add handleOpenClock function in src/components/MainMenu.tsx
- [ ] T014 Add Clock button to MainMenu JSX with initialBackgroundTransparent: true in src/components/MainMenu.tsx

**Checkpoint**: Clock window can be created from menu with correct visual styling and transparent background

---

## Phase 4: User Story 2 - Position Clock Window (Priority: P2)

**Goal**: Enable dragging clock window to any screen position

**Independent Test**: Drag clock window to different positions, verify it stays where placed

### Implementation for User Story 2

- [ ] T015 [US2] Verify cursor: move style on text span for drag affordance in src/components/windows/ClockContent.tsx
- [ ] T016 [US2] Test window drag behavior (handled by existing Window wrapper) - no code changes needed

**Checkpoint**: Clock window can be dragged and positioned anywhere on screen

---

## Phase 5: User Story 3 - Resize Clock for Readability (Priority: P2)

**Goal**: Auto-scale time text when window is resized

**Independent Test**: Resize clock window larger/smaller, verify text scales proportionally

### Implementation for User Story 3

- [ ] T017 [US3] Add containerRef useRef for ResizeObserver in src/components/windows/ClockContent.tsx
- [ ] T018 [US3] Add fontSize state with initial value in src/components/windows/ClockContent.tsx
- [ ] T019 [US3] Implement ResizeObserver to calculate fontSize from container dimensions in src/components/windows/ClockContent.tsx
- [ ] T020 [US3] Apply dynamic fontSize to text span style in src/components/windows/ClockContent.tsx
- [ ] T021 [US3] Add minimum font size constraint (12px) to prevent illegibility in src/components/windows/ClockContent.tsx

**Checkpoint**: Clock text scales automatically when window is resized

---

## Phase 6: Persistence Integration

**Purpose**: Enable clock window state persistence across app restarts

- [ ] T022 Import ClockContent in app/page.tsx for window restoration
- [ ] T023 Add 'clock' case to WindowRestorer switch statement in app/page.tsx
- [ ] T024 [P] Optional: Add serializeClockContent function in src/lib/serialization.ts for consistency

**Checkpoint**: Clock window position/size persists across app restarts

---

## Phase 7: Polish & Verification

**Purpose**: Final testing and edge case handling

- [ ] T025 Verify midnight display (00:00:00) works correctly
- [ ] T026 Verify timezone change updates clock immediately
- [ ] T027 Verify minimum window size constraints work with text scaling
- [ ] T028 Run full quickstart.md validation checklist
- [ ] T029 Verify no TypeScript or linting errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **User Stories 1+4 (Phase 3)**: Depends on Phase 2 - Core visual implementation
- **User Story 2 (Phase 4)**: Can start after Phase 3 (mostly verification, no new code)
- **User Story 3 (Phase 5)**: Can start after Phase 2 (independent of US1+4 styling)
- **Persistence (Phase 6)**: Depends on Phase 3 (need component to import)
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 + 4 (P1)**: Combined as they're both core visual requirements
- **User Story 2 (P2)**: Independent - uses existing Window wrapper drag functionality
- **User Story 3 (P2)**: Independent - adds resize text scaling

### Parallel Opportunities

Phase 1 - All type definition tasks can run in parallel:
```
T001 (windows.ts) || T002 (persistence.ts) || T003 (persistence_types.rs)
```

Phase 3/5 - User Story 3 (resize) can start after Phase 2 in parallel with User Story 1+4:
```
After T007: T008-T014 (US1+4) || T017-T021 (US3)
```

---

## Parallel Example: Phase 1

```bash
# Launch all type definition tasks in parallel:
Task: "Add 'clock' to WindowContentType union in src/types/windows.ts"
Task: "Add 'clock' to WindowType union in src/types/persistence.ts"
Task: "Add Clock variant to WindowType enum in src-tauri/src/persistence_types.rs"
```

## Parallel Example: User Story 1+4 and User Story 3

```bash
# After Foundational phase, launch styling and resize tasks in parallel:
# Stream 1 (US1+4 styling):
Task: "Add white text color styling in src/components/windows/ClockContent.tsx"
Task: "Add -webkit-text-stroke blue border in src/components/windows/ClockContent.tsx"

# Stream 2 (US3 resize) - can run simultaneously:
Task: "Add containerRef useRef in src/components/windows/ClockContent.tsx"
Task: "Implement ResizeObserver in src/components/windows/ClockContent.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 4 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (core component)
3. Complete Phase 3: User Story 1 + 4 (visual styling + transparency)
4. **STOP and VALIDATE**: Create clock, verify display works
5. Deploy/demo if ready - basic clock is functional

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Add Phase 3 (US1+4) → Test display → Deploy (MVP!)
3. Add Phase 5 (US3) → Test resize → Deploy
4. Add Phase 6 → Test persistence → Deploy
5. Phase 7 polish → Final release

### Single Developer Flow

Recommended execution order for one developer:
1. T001, T002, T003 (parallel if fast, sequential if thorough)
2. T004 → T005 → T006 → T007 (sequential, building component)
3. T008 → T009 → T010 → T011 → T012 (sequential, styling)
4. T013 → T014 (menu integration)
5. T017 → T018 → T019 → T020 → T021 (resize feature)
6. T022 → T023 (persistence)
7. T025-T029 (verification)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Stories 1 and 4 combined in Phase 3 (both P1, tightly coupled visual requirements)
- User Story 2 (positioning) requires minimal code - Window wrapper handles drag
- No automated tests in scope - spec requires manual testing only
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
