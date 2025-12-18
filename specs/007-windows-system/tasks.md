# Tasks: Decoupled Windows System

**Input**: Design documents from `/specs/007-windows-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual testing for Phase 1 (per plan.md). No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web application (Tauri + Next.js static export)
- **Frontend**: `src/` for components, `app/` for Next.js pages
- Paths based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and type definitions

- [X] T001 Create windows component directory at src/components/windows/
- [X] T002 Create contexts directory at src/contexts/
- [X] T003 Create hooks directory at src/hooks/
- [X] T004 [P] Create window system types in src/types/windows.ts (copy from contracts/window-events.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement WindowEventEmitter class in src/lib/windowEvents.ts
- [X] T006 Implement WindowsContext with useReducer in src/contexts/WindowsContext.tsx
- [X] T007 Implement useWindowEvents hook in src/hooks/useWindowEvents.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Open Window via Event (Priority: P1) MVP

**Goal**: Users can click "Test Windows" button in MainMenu to open a centered window with a test component

**Independent Test**: Click "Test Windows" button in MainMenu while in interaction mode (F5), verify centered window appears with title "Test Windows"

### Implementation for User Story 1

- [X] T008 [P] [US1] Create TestWindowContent component in src/components/windows/TestWindowContent.tsx
- [X] T009 [P] [US1] Create basic WindowHeader component in src/components/windows/WindowHeader.tsx (title display only, no drag/close yet)
- [X] T010 [US1] Create Window component with basic structure in src/components/windows/Window.tsx (positioned, sized, renders content)
- [X] T011 [US1] Create WindowsContainer component in src/components/windows/WindowsContainer.tsx (subscribes to events, renders windows)
- [X] T012 [US1] Add "Test Windows" button to MainMenu in src/components/MainMenu.tsx (emits window:open event)
- [X] T013 [US1] Integrate WindowsContainer into main page in app/page.tsx (wrap with WindowsProvider)
- [X] T014 [US1] Add window open animation using motion.js in src/components/windows/Window.tsx

**Checkpoint**: User Story 1 complete - can open windows via event with centered positioning and animation

---

## Phase 4: User Story 2 - Window Manipulation (Priority: P2)

**Goal**: Users can drag windows by header, resize from edges/corners, reorder by clicking, and close via header button

**Independent Test**: Open a window, drag header to move, drag corner to resize, click close button to dismiss

**Dependencies**: Requires US1 completion (Window and WindowHeader components exist)

### Implementation for User Story 2

- [X] T015 [US2] Add drag functionality to WindowHeader in src/components/windows/WindowHeader.tsx (pointer events, position updates)
- [X] T016 [US2] Add resize functionality to Window edges/corners in src/components/windows/Window.tsx (cursor changes, size updates)
- [X] T017 [US2] Add close button to WindowHeader in src/components/windows/WindowHeader.tsx
- [X] T018 [US2] Implement z-order focus on window click in src/components/windows/Window.tsx (bring to front)
- [X] T019 [US2] Add position constraints to prevent windows going off-screen in src/contexts/WindowsContext.tsx
- [X] T020 [US2] Add size constraints (min 150x100) to resize logic in src/contexts/WindowsContext.tsx
- [X] T021 [US2] Add window close animation using motion.js in src/components/windows/Window.tsx

**Checkpoint**: User Story 2 complete - full window manipulation available in interaction mode

---

## Phase 5: User Story 3 - Visual Mode Switching (Priority: P3)

**Goal**: Windows change appearance based on F5 interaction mode (header visible/hidden, border on/off, transparency)

**Independent Test**: Open window, press F5 to toggle mode, verify header hides, border disappears, transparency changes to 60%

**Dependencies**: Requires US1 (Window exists), benefits from US2 (header fully implemented)

### Implementation for User Story 3

- [ ] T022 [US3] Pass interaction mode prop from overlay state to WindowsContainer in app/page.tsx
- [ ] T023 [US3] Implement mode-aware styling in Window component in src/components/windows/Window.tsx (border, opacity)
- [ ] T024 [US3] Implement mode-aware header visibility in WindowHeader in src/components/windows/WindowHeader.tsx
- [ ] T025 [US3] Disable drag/resize pointer events in passive mode in src/components/windows/Window.tsx
- [ ] T026 [US3] Add smooth mode transition animations (100ms) in src/components/windows/Window.tsx

**Checkpoint**: User Story 3 complete - windows respond correctly to F5 mode toggle

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T027 Add window styles to globals.css in app/globals.css (resize cursors, transitions)
- [ ] T028 Verify 10+ concurrent windows performance in WindowsContainer
- [ ] T029 Run manual validation per quickstart.md scenarios
- [ ] T030 Code cleanup: remove console.logs, verify TypeScript strict compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓
    ├── Phase 3: US1 - Open Window (P1) ← MVP
    │       ↓
    ├── Phase 4: US2 - Manipulation (P2) ← Requires US1 Window/Header
    │       ↓
    └── Phase 5: US3 - Mode Switching (P3) ← Requires US1, benefits from US2
            ↓
Phase 6: Polish
```

### Within Each User Story

- Components before integration
- Core implementation before enhancements
- Animation/polish last within story

### Parallel Opportunities

**Phase 1 (all parallel):**
- T001, T002, T003, T004 can all run in parallel

**Phase 2 (sequential):**
- T005 → T006 → T007 (dependencies between them)

**Phase 3 - US1 (partial parallel):**
- T008, T009 can run in parallel
- T010, T011 depend on T008, T009
- T012 depends on T005 (windowEvents)
- T013 depends on T006, T011
- T014 depends on T010

**Phase 4 - US2 (sequential within story):**
- Most tasks modify same files, run sequentially

**Phase 5 - US3 (sequential within story):**
- Most tasks modify same files, run sequentially

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Create windows component directory at src/components/windows/"
Task: "Create contexts directory at src/contexts/"
Task: "Create hooks directory at src/hooks/"
Task: "Create window system types in src/types/windows.ts"
```

## Parallel Example: User Story 1 Components

```bash
# Launch initial US1 components together:
Task: "Create TestWindowContent component in src/components/windows/TestWindowContent.tsx"
Task: "Create basic WindowHeader component in src/components/windows/WindowHeader.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Click "Test Windows" button, verify window opens centered
5. Deploy/demo if ready - basic window opening works!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Can open windows → **MVP!**
3. Add User Story 2 → Can move/resize/close windows → Enhanced
4. Add User Story 3 → Mode-aware appearance → Complete feature

### Sequential Recommendation

Due to component overlap (Window.tsx modified in all stories), recommend sequential implementation:
1. US1 → US2 → US3 → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after completion
- Manual testing per plan.md (automated tests deferred)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Window.tsx is touched by multiple stories - coordinate carefully
