# Tasks: MainMenu Component with Grouped Buttons

**Input**: Design documents from `/specs/006-main-menu-component/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Component tests included per Constitution II (Testing Standards) requirement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Components: `src/components/`
- UI Components: `src/components/ui/`
- App: `app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shadcn components required for MainMenu

- [X] T001 Install shadcn Button component via `pnpm dlx shadcn@latest add button`
- [X] T002 Install shadcn ButtonGroup component via `pnpm dlx shadcn@latest add button-group`
- [X] T003 Verify components created in src/components/ui/button.tsx and src/components/ui/button-group.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks needed - this feature uses existing overlay state infrastructure

**⚠️ Note**: This feature has no blocking prerequisites. All required infrastructure (overlay state, mode toggle, motion animations) already exists in the codebase.

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Access Main Menu in Interactive Mode (Priority: P1) 🎯 MVP

**Goal**: Display MainMenu with grouped buttons at top of overlay when user presses F5 to enter interactive mode

**Independent Test**: Press F5 to enter interactive mode → MainMenu appears at top with transparent background and two button groups visible (Group 1: Option 1, Option 2; Group 2: Option 3)

### Tests for User Story 1

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T004 [P] [US1] Create MainMenu component test file at tests/react/MainMenu.test.tsx
- [X] T005 [P] [US1] Add test: MainMenu renders when mode is 'windowed' in tests/react/MainMenu.test.tsx
- [X] T006 [P] [US1] Add test: MainMenu hidden when mode is 'fullscreen' in tests/react/MainMenu.test.tsx
- [X] T007 [P] [US1] Add test: Button click logs button name to console in tests/react/MainMenu.test.tsx

### Implementation for User Story 1

- [X] T008 [US1] Create MainMenu component with props interface in src/components/MainMenu.tsx
- [X] T009 [US1] Add AnimatePresence and motion wrapper with 300ms fade animation in src/components/MainMenu.tsx
- [X] T010 [US1] Add transparent background container with flexbox layout in src/components/MainMenu.tsx
- [X] T011 [US1] Add ButtonGroup 1 with Option 1 and Option 2 buttons in src/components/MainMenu.tsx
- [X] T012 [US1] Add ButtonGroup 2 with Option 3 button in src/components/MainMenu.tsx
- [X] T013 [US1] Implement handleButtonClick function that logs button name to console in src/components/MainMenu.tsx
- [X] T014 [US1] Add useReducedMotion hook for accessibility in src/components/MainMenu.tsx
- [X] T015 [US1] Add visibility logic: show only when mode === 'windowed' in src/components/MainMenu.tsx
- [X] T016 [US1] Import MainMenu component in app/page.tsx
- [X] T017 [US1] Add MainMenu to page.tsx JSX with visible, mode, and targetRect props in app/page.tsx

**Checkpoint**: MainMenu appears in interactive mode with two button groups and console logging works

---

## Phase 4: User Story 2 - View Header at Bottom Position (Priority: P2)

**Goal**: Reposition existing Header panel to bottom of container when in interactive mode

**Independent Test**: Enter interactive mode → Header "RAIC Overlay" appears at bottom of container instead of top

### Implementation for User Story 2

- [X] T018 [US2] Add position prop ('top' | 'bottom') to HeaderPanelProps interface in src/components/HeaderPanel.tsx
- [X] T019 [US2] Add position parameter to HeaderPanel function with default value 'top' in src/components/HeaderPanel.tsx
- [X] T020 [US2] Update container className to use items-end when position is 'bottom' in src/components/HeaderPanel.tsx
- [X] T021 [US2] Update HeaderPanel usage in page.tsx to pass position based on mode in app/page.tsx
- [X] T022 [US2] Wrap page.tsx content in flex container with justify-between for top/bottom layout in app/page.tsx

**Checkpoint**: Header moves to bottom in interactive mode, stays at top in click-through mode

---

## Phase 5: User Story 3 - Menu Hidden in Click-Through Mode (Priority: P3)

**Goal**: Ensure MainMenu is hidden when overlay is in click-through (fullscreen) mode

**Independent Test**: Start app → MainMenu not visible; Enter interactive mode → MainMenu visible; Press F5 → MainMenu disappears

### Implementation for User Story 3

- [X] T023 [US3] Verify MainMenu visibility logic correctly hides when mode !== 'windowed' in src/components/MainMenu.tsx
- [X] T024 [US3] Verify exit animation triggers when mode changes from windowed to fullscreen in src/components/MainMenu.tsx
- [X] T025 [US3] Test rapid F5 toggling to ensure AnimatePresence handles state changes gracefully

**Checkpoint**: MainMenu properly shows/hides based on overlay mode with smooth animations

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and edge case handling

- [ ] T026 Verify transparent background allows 60%+ visibility of underlying content (bg-transparent class)
- [ ] T027 Verify animation timing is ~300ms (SC-001 compliance)
- [ ] T028 Test button click logging for all three buttons (SC-006 compliance)
- [ ] T029 Run quickstart.md verification checklist
- [ ] T030 Test with small target window to verify buttons remain readable (min 44x44px touch target)
- [ ] T031 Verify TypeScript compilation passes with no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: No tasks - existing infrastructure sufficient
- **User Story 1 (Phase 3)**: Depends on Setup (Phase 1) completion
- **User Story 2 (Phase 4)**: Can start after Setup; independent of User Story 1
- **User Story 3 (Phase 5)**: Depends on User Story 1 (MainMenu must exist to test hiding)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Phase 1 Setup - creates the MainMenu component
- **User Story 2 (P2)**: Depends only on Phase 1 Setup - modifies HeaderPanel independently
- **User Story 3 (P3)**: Depends on User Story 1 - validates MainMenu hiding behavior

### Within Each User Story

- T004-T007 (US1): Write failing tests for MainMenu
- T008-T015 (US1): Build MainMenu component incrementally
- T016-T017 (US1): Integrate MainMenu into page.tsx
- T018-T020 (US2): Modify HeaderPanel component
- T021-T022 (US2): Integrate HeaderPanel changes into page.tsx
- T023-T025 (US3): Validation tasks for hiding behavior

### Parallel Opportunities

**Setup phase (can run in parallel):**
```bash
# These can be run together but T003 should follow T001/T002:
T001: Install shadcn Button
T002: Install shadcn ButtonGroup
```

**User Story 1 and 2 (can run in parallel after Setup):**
```bash
# Developer A: User Story 1
T004-T017: MainMenu tests + implementation

# Developer B: User Story 2
T018-T022: HeaderPanel position modification
```

---

## Parallel Example: User Story 1

```bash
# T004-T007 are test tasks (can run in parallel - different test cases)
# T008-T015 are sequential within MainMenu.tsx (same file)
# T016-T017 are sequential after MainMenu exists

# If splitting work:
# Developer A: T004-T017 (MainMenu tests + component)
# Developer B: T018-T022 (HeaderPanel - can start in parallel)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install shadcn components)
2. Complete Phase 3: User Story 1 (MainMenu component)
3. **STOP and VALIDATE**: Press F5 → MainMenu visible with buttons
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → Install shadcn Button and ButtonGroup
2. User Story 1 → MainMenu appears in interactive mode → Demo (MVP!)
3. User Story 2 → Header moves to bottom → Demo
4. User Story 3 → Validate hide behavior → Demo
5. Polish → Final verification

### Single Developer Strategy

Execute tasks in order: T001 → T002 → T003 → T004 → ... → T031

Commit checkpoints:
- After T003: "chore: install shadcn button and button-group components"
- After T007: "test: add MainMenu component tests (failing)"
- After T017: "feat: add MainMenu component with grouped buttons"
- After T022: "feat: add header position prop for bottom placement"
- After T025: "feat: complete MainMenu show/hide behavior"
- After T031: "chore: polish and verification complete"

---

## Notes

- [P] tasks = different files, no dependencies (none in this feature due to sequential file edits)
- [Story] label maps task to specific user story for traceability
- User Story 1 and 2 can be implemented in parallel by different developers
- User Story 3 is primarily verification of User Story 1 behavior
- No test tasks included - add if explicitly requested
- Commit after each phase checkpoint
