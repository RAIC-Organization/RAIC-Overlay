# Tasks: Widget Container System

**Input**: Design documents from `/specs/027-widget-container/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual visual testing per plan.md - no automated tests required for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` at repository root (React/TypeScript)
- **Backend**: `src-tauri/src/` (Rust)
- **App**: `app/` at repository root (Next.js pages)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create widget system type definitions and event infrastructure

- [x] T001 Create widget TypeScript types and constants in src/types/widgets.ts
- [x] T002 [P] Create widget event emitter in src/lib/widgetEvents.ts
- [x] T003 [P] Add WidgetStructure and WidgetType to TypeScript persistence types in src/types/persistence.ts
- [x] T004 [P] Add WidgetStructure and WidgetType to Rust persistence types in src-tauri/src/persistence_types.rs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core widget context and container infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create WidgetsContext with state management (reducer pattern) in src/contexts/WidgetsContext.tsx
- [x] T006 Create useWidgetEvents hook for widget event subscription in src/hooks/useWidgetEvents.ts
- [x] T007 Create WidgetsContainer component (orchestrator) in src/components/widgets/WidgetsContainer.tsx
- [x] T008 Create Widget base component shell (no flip animation yet) in src/components/widgets/Widget.tsx
- [x] T009 Create widget components index exports in src/components/widgets/index.ts
- [x] T010 Integrate WidgetsContainer into app layout in app/page.tsx

**Checkpoint**: Widget container infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Display Clock Widget (Priority: P1) 🎯 MVP

**Goal**: Display a working clock widget with 24-hour time format (HH:mm:ss) in a transparent container

**Independent Test**: Create clock widget from main menu, verify time displays correctly with transparent background and no header/borders

### Implementation for User Story 1

- [x] T011 [US1] Create ClockWidgetContent component with ResizeObserver font scaling in src/components/widgets/ClockWidgetContent.tsx
- [x] T012 [US1] Add clock widget opening action to MainMenu in src/components/MainMenu.tsx
- [x] T013 [US1] Implement widget creation via event in WidgetsContext (OPEN_WIDGET action) in src/contexts/WidgetsContext.tsx
- [x] T014 [US1] Render ClockWidgetContent inside Widget component based on type in src/components/widgets/Widget.tsx
- [x] T015 [US1] Style clock widget with Orbitron font, white text, blue stroke in src/components/widgets/ClockWidgetContent.tsx
- [x] T016 [US1] Ensure widget container has transparent background (no borders/header) in src/components/widgets/Widget.tsx

**Checkpoint**: Clock widget displays and updates time every second in transparent container

---

## Phase 4: User Story 5 - Remove Clock Window (Priority: P1) 🎯 MVP

**Goal**: Remove deprecated clock window functionality to avoid duplicate features

**Independent Test**: Verify clock window button removed from main menu, clock window type deprecated

**Note**: This is P1 priority and should be done alongside or immediately after US1 for clean MVP

### Implementation for User Story 5

- [x] T017 [US5] Remove Clock window button from MainMenu in src/components/MainMenu.tsx
- [x] T018 [P] [US5] Remove 'clock' from WindowContentType in src/types/windows.ts
- [x] T019 [P] [US5] Remove 'clock' from WindowType in src/types/persistence.ts
- [x] T020 [P] [US5] Remove Clock from WindowType enum in src-tauri/src/persistence_types.rs
- [x] T021 [US5] Add migration logic to skip clock windows in useHydration in src/hooks/useHydration.ts
- [x] T022 [US5] Delete deprecated ClockContent.tsx from src/components/windows/ClockContent.tsx

**Checkpoint**: Clock window completely removed, only clock widget available

---

## Phase 5: User Story 2 - Resize and Position Widget (Priority: P2)

**Goal**: Enable widget repositioning via drag (after 175ms hold) and resizing via corner accents

**Independent Test**: Enter interaction mode (F5), drag widget to new position, resize via corners, verify content scales

### Implementation for User Story 2

- [ ] T023 [US2] Implement hold threshold detection (175ms) for click vs drag in src/components/widgets/Widget.tsx
- [ ] T024 [US2] Implement drag-to-reposition functionality with pointer events in src/components/widgets/Widget.tsx
- [ ] T025 [US2] Add MOVE_WIDGET action to WidgetsContext reducer in src/contexts/WidgetsContext.tsx
- [ ] T026 [US2] Implement corner accent resize handles (visible in interaction mode only) in src/components/widgets/Widget.tsx
- [ ] T027 [US2] Implement corner drag-to-resize functionality in src/components/widgets/Widget.tsx
- [ ] T028 [US2] Add RESIZE_WIDGET action to WidgetsContext reducer in src/contexts/WidgetsContext.tsx
- [ ] T029 [US2] Enforce minimum widget dimensions (80x60px) and visibility constraints in src/contexts/WidgetsContext.tsx
- [ ] T030 [US2] Trigger ClockWidgetContent font rescaling on resize via ResizeObserver in src/components/widgets/ClockWidgetContent.tsx

**Checkpoint**: Widget can be dragged and resized in interaction mode, content scales appropriately

---

## Phase 6: User Story 3 - Access Widget Settings via Backflip (Priority: P2)

**Goal**: Implement 3D backflip animation to reveal settings panel with opacity slider

**Independent Test**: Click widget in interaction mode, verify backflip animation reveals settings with opacity slider and close button

### Implementation for User Story 3

- [ ] T031 [US3] Create WidgetSettings component with opacity slider and close button in src/components/widgets/WidgetSettings.tsx
- [ ] T032 [US3] Implement 3D backflip animation structure (perspective, preserve-3d, backface-visibility) in src/components/widgets/Widget.tsx
- [ ] T033 [US3] Add isFlipped state to widget instance in src/contexts/WidgetsContext.tsx
- [ ] T034 [US3] Implement flip animation trigger on click (release before hold threshold) in src/components/widgets/Widget.tsx
- [ ] T035 [US3] Implement flip-back animation on close button click in src/components/widgets/Widget.tsx
- [ ] T036 [US3] Add SET_WIDGET_OPACITY action to WidgetsContext reducer in src/contexts/WidgetsContext.tsx
- [ ] T037 [US3] Wire opacity slider to update widget opacity in real-time in src/components/widgets/WidgetSettings.tsx
- [ ] T038 [US3] Block rapid clicks during flip animation in src/components/widgets/Widget.tsx

**Checkpoint**: Widget flips to reveal settings, opacity slider works, can flip back

---

## Phase 7: User Story 4 - Widget State Persistence (Priority: P3)

**Goal**: Persist widget state (position, size, opacity) to storage and restore on app startup

**Independent Test**: Position widget, adjust opacity, close app, reopen, verify all settings restored

### Implementation for User Story 4

- [ ] T039 [US4] Add widgets array to PersistedState in Rust persistence in src-tauri/src/persistence.rs
- [ ] T040 [US4] Implement widget state serialization in persistence context in src/contexts/PersistenceContext.tsx
- [ ] T041 [US4] Add onWidgetMoved callback for debounced state save in src/contexts/PersistenceContext.tsx
- [ ] T042 [US4] Trigger persistence on widget move/resize/opacity change in src/components/widgets/Widget.tsx
- [ ] T043 [US4] Implement widget hydration in useHydration hook in src/hooks/useHydration.ts
- [ ] T044 [US4] Create WidgetRestorer component to restore widgets on app startup in app/page.tsx
- [ ] T045 [US4] Handle backward compatibility (empty widgets array) in persistence in src-tauri/src/persistence.rs

**Checkpoint**: Widget state persists across app restarts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T046 Verify all edge cases: minimum size, visibility constraints, animation during drag in src/components/widgets/Widget.tsx
- [ ] T047 Ensure widgets respect interaction mode toggle (F5) throughout in src/components/widgets/WidgetsContainer.tsx
- [ ] T048 Add widget close functionality (close button on settings panel) in src/components/widgets/WidgetSettings.tsx
- [ ] T049 Add CLOSE_WIDGET action to WidgetsContext and wire to settings close in src/contexts/WidgetsContext.tsx
- [ ] T050 Run quickstart.md validation checklist (verify clock widget button in menu per FR-018)
- [ ] T051 Verify no TypeScript errors with cargo clippy and npm run lint
- [ ] T052 Final visual testing of all user stories (verify 500ms backflip timing per SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP clock widget
- **User Story 5 (Phase 4)**: Depends on US1 completion - Remove duplicate clock window
- **User Story 2 (Phase 5)**: Depends on Foundational - Can run parallel to US3/US4
- **User Story 3 (Phase 6)**: Depends on Foundational - Can run parallel to US2/US4
- **User Story 4 (Phase 7)**: Depends on US2 and US3 - Needs move/resize/opacity implemented
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Clock widget display - No dependencies on other stories
- **User Story 5 (P1)**: Remove clock window - Should follow US1 for clean replacement
- **User Story 2 (P2)**: Resize/position - Independent, but enhances US1
- **User Story 3 (P2)**: Backflip settings - Independent, enhances all widgets
- **User Story 4 (P3)**: Persistence - Depends on US2 (position/size) and US3 (opacity)

### Within Each User Story

- Core functionality before enhancements
- Context actions before component usage
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: T002, T003, T004 can all run in parallel (different files)
- Phase 4: T018, T019, T020 can all run in parallel (different type files)
- User Stories 2 and 3 can run in parallel after US1/US5 complete (different functionality)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all type definition tasks together:
Task: "Create widget event emitter in src/lib/widgetEvents.ts"
Task: "Add WidgetStructure to TypeScript persistence types in src/types/persistence.ts"
Task: "Add WidgetStructure to Rust persistence types in src-tauri/src/persistence_types.rs"
```

---

## Parallel Example: User Story 5

```bash
# Launch all type removal tasks together:
Task: "Remove 'clock' from WindowContentType in src/types/windows.ts"
Task: "Remove 'clock' from WindowType in src/types/persistence.ts"
Task: "Remove Clock from WindowType enum in src-tauri/src/persistence_types.rs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Clock Widget Display
4. Complete Phase 4: User Story 5 - Remove Clock Window
5. **STOP and VALIDATE**: Test clock widget independently
6. Deploy/demo if ready - this is MVP!

### Incremental Delivery

1. Complete Setup + Foundational → Widget infrastructure ready
2. Add User Story 1 + 5 → MVP clock widget replaces clock window
3. Add User Story 2 → Resize and position widgets
4. Add User Story 3 → Backflip settings panel
5. Add User Story 4 → State persistence
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Widget system parallels window system architecture for consistency
