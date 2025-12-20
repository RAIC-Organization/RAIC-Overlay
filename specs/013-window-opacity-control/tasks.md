# Tasks: Per-Window Opacity Control

**Input**: Design documents from `/specs/013-window-opacity-control/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - manual testing via acceptance scenarios per spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and add base UI component

- [x] T001 Install shadcn/ui Slider component via `npx shadcn@latest add slider`
- [x] T002 Verify slider component created at `src/components/ui/slider.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type extensions and state management that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add opacity constants (MIN_OPACITY, MAX_OPACITY, DEFAULT_OPACITY) to `src/types/windows.ts`
- [x] T004 [P] Add `opacity: number` property to WindowInstance interface in `src/types/windows.ts`
- [x] T005 [P] Add `initialOpacity?: number` property to WindowOpenPayload interface in `src/types/windows.ts`
- [x] T006 [P] Add `opacity: number` property to WindowStructure interface in `src/types/persistence.ts`
- [x] T007 [P] Add `opacity: f32` field with `#[serde(default)]` to WindowStructure in `src-tauri/src/persistence_types.rs`
- [x] T008 [P] Add `default_opacity()` function returning 0.6 in `src-tauri/src/persistence_types.rs`
- [x] T009 Add SET_WINDOW_OPACITY action type to WindowsAction union in `src/contexts/WindowsContext.tsx`
- [x] T010 Implement SET_WINDOW_OPACITY reducer case with opacity clamping in `src/contexts/WindowsContext.tsx`
- [x] T011 Add `setWindowOpacity` method to ExtendedWindowsContextValue interface in `src/contexts/WindowsContext.tsx`
- [x] T012 Implement `setWindowOpacity` callback in WindowsProvider in `src/contexts/WindowsContext.tsx`
- [x] T013 Update OPEN_WINDOW reducer case to set initial opacity (default 0.6) in `src/contexts/WindowsContext.tsx`

**Checkpoint**: Foundation ready - type system and state management support opacity

---

## Phase 3: User Story 1 - Adjust Window Opacity via Slider (Priority: P1) 🎯 MVP

**Goal**: User can adjust window opacity using a slider in the header (interactive mode only)

**Independent Test**: Enter interaction mode (F5), open a window, drag the opacity slider in the header, observe window transparency change in real-time

### Implementation for User Story 1

- [x] T014 [US1] Create OpacitySlider component with Slider, percentage label, onChange, and onCommit props in `src/components/windows/OpacitySlider.tsx`
- [x] T015 [US1] Add opacity, onOpacityChange, onOpacityCommit props to WindowHeaderProps interface in `src/components/windows/WindowHeader.tsx`
- [x] T016 [US1] Import and render OpacitySlider in WindowHeader between title and close button in `src/components/windows/WindowHeader.tsx`
- [x] T017 [US1] Pass opacity prop from windowInstance to WindowHeader in `src/components/windows/Window.tsx`
- [x] T018 [US1] Implement onOpacityChange callback using setWindowOpacity from context in `src/components/windows/Window.tsx`
- [x] T019 [US1] Implement onOpacityCommit callback to trigger persistence via onWindowMoved() in `src/components/windows/Window.tsx`
- [x] T020 [US1] Apply window opacity to motion.div animate prop in `src/components/windows/Window.tsx`
- [x] T021 [US1] Remove hardcoded 0.85 opacity from non-interactive mode animation in `src/components/windows/Window.tsx`

**Checkpoint**: User Story 1 complete - slider visible in header, opacity changes in real-time

---

## Phase 4: User Story 2 - Persist Window Opacity Setting (Priority: P2)

**Goal**: Opacity setting persists across application restarts

**Independent Test**: Adjust window opacity to 40%, close app, reopen, verify window shows 40% opacity

### Implementation for User Story 2

- [x] T022 [US2] Update serializeWindowToStructure to include opacity in `src/lib/serialization.ts`
- [x] T023 [US2] Update deserializeStructureToWindow to read opacity (with fallback to 0.6) in `src/lib/serialization.ts`
- [x] T024 [US2] Add clampOpacity helper function for validating loaded opacity values in `src/lib/serialization.ts`
- [x] T025 [US2] Ensure WindowOpenPayload includes initialOpacity when restoring windows in `app/page.tsx`

**Checkpoint**: User Story 2 complete - opacity persists across sessions

---

## Phase 5: User Story 3 - Consistent Opacity Across Modes (Priority: P3)

**Goal**: Opacity remains constant when toggling between interaction and non-interaction modes

**Independent Test**: Set opacity to 80%, press F5 to toggle mode, verify opacity stays at 80%

### Implementation for User Story 3

- [x] T026 [US3] Ensure Window.tsx uses windowInstance.opacity for both interactive and non-interactive modes in `src/components/windows/Window.tsx`
- [x] T027 [US3] Remove any mode-conditional opacity logic (previously 60% in non-interactive) in `src/components/windows/Window.tsx`
- [x] T028 [US3] Verify header opacity handling: fully visible in interactive mode, uses window opacity in non-interactive mode in `src/components/windows/Window.tsx`

**Checkpoint**: User Story 3 complete - opacity consistent across mode toggles

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge case handling

- [x] T029 [P] Add aria-label to OpacitySlider for accessibility in `src/components/windows/OpacitySlider.tsx`
- [x] T030 [P] Ensure opacity slider has proper focus states and keyboard support (inherited from Radix)
- [ ] T031 Run full manual test: create window, adjust opacity, toggle modes, restart app, verify all acceptance scenarios
- [x] T032 Verify TypeScript compilation passes with no errors
- [x] T033 Test edge case: corrupted opacity value in state.json clamps correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - US2 depends on US1 (needs slider to change opacity before persistence matters)
  - US3 depends on US1 (needs opacity state before mode consistency matters)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core slider functionality
- **User Story 2 (P2)**: Depends on US1 - Adds persistence to existing opacity control
- **User Story 3 (P3)**: Depends on US1 - Ensures mode consistency for opacity

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- Foundation tasks T003-T008 are parallel (different files)
- Foundation tasks T009-T013 are sequential (same file: WindowsContext.tsx)

### Parallel Opportunities

**Phase 2 Parallelization**:
```
Parallel Group A (different files):
- T003: src/types/windows.ts (constants)
- T004: src/types/windows.ts (WindowInstance)
- T005: src/types/windows.ts (WindowOpenPayload)
- T006: src/types/persistence.ts
- T007: src-tauri/src/persistence_types.rs
- T008: src-tauri/src/persistence_types.rs (same file as T007, can combine)

Sequential Group B (same file):
- T009 → T010 → T011 → T012 → T013: src/contexts/WindowsContext.tsx
```

**Phase 6 Parallelization**:
```
- T029 || T030 (different concerns)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install slider component)
2. Complete Phase 2: Foundational (types + state management)
3. Complete Phase 3: User Story 1 (slider in header, real-time opacity)
4. **STOP and VALIDATE**: Test slider adjusts window opacity
5. Deploy/demo if ready - MVP delivers core value

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test slider works → **MVP Complete!**
3. Add User Story 2 → Test persistence works → Opacity survives restart
4. Add User Story 3 → Test mode toggle → Opacity consistent across modes
5. Each story adds value without breaking previous stories

### Estimated Task Distribution

| Phase | Tasks | Parallel | Sequential |
|-------|-------|----------|------------|
| Setup | 2 | 0 | 2 |
| Foundational | 11 | 6 | 5 |
| User Story 1 | 8 | 0 | 8 |
| User Story 2 | 4 | 0 | 4 |
| User Story 3 | 3 | 0 | 3 |
| Polish | 5 | 2 | 3 |
| **Total** | **33** | **8** | **25** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 depend on US1 completing first (slider must exist)
- Persistence uses existing onWindowMoved() debounce - no new debounce code needed
- Opacity range: 10%-100% (0.1-1.0) - minimum ensures window visibility
- Default opacity: 60% (0.6) for new windows
- Radix Slider provides onValueCommit for persistence trigger
