# Tasks: App Icon Branding

**Input**: Design documents from `/specs/011-app-icon-branding/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Tests are included as they follow the existing project testing patterns (Constitution II: Testing Standards).

**Organization**: Tasks grouped by user story. US1 and US2 are both P1 and tightly coupled (icon creation + header removal), so they are implemented together in Phase 3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Asset Preparation)

**Purpose**: Prepare the icon asset and directory structure

- [x] T001 Create assets directory at src/assets/
- [x] T002 Copy icon from temp/Icon.png to src/assets/icon.png
- [x] T003 Verify icon dimensions are appropriate (original may need resizing for 50x50 display)

---

## Phase 2: Foundational (No blocking prerequisites)

**Purpose**: This feature has no foundational blockers - it uses existing infrastructure

**⚠️ NOTE**: This phase is empty because:
- motion/react animation library already installed and configured
- Overlay mode state management already exists in app/page.tsx
- Click-through behavior already implemented via pointer-events

**Checkpoint**: Proceed directly to user story implementation

---

## Phase 3: User Stories 1 & 2 - Icon Display + Header Removal (Priority: P1) 🎯 MVP

**Goal**: Display the app icon in top-left corner and remove the HeaderPanel component

**Independent Test**: Launch overlay with F3, verify icon appears at 50px from top-left edges at 50x50px, and no "RAIC Overlay" text header is visible

### Tests for User Stories 1 & 2

- [x] T004 [P] [US1] Create test file tests/react/AppIcon.test.tsx with describe block for AppIcon component
- [x] T005 [P] [US1] Add test: "renders when visible is true" in tests/react/AppIcon.test.tsx
- [x] T006 [P] [US1] Add test: "does not render when visible is false" in tests/react/AppIcon.test.tsx
- [x] T007 [P] [US1] Add test: "displays at 50x50 pixels dimensions" in tests/react/AppIcon.test.tsx
- [x] T008 [P] [US1] Add test: "has correct positioning (fixed, top-50px, left-50px)" in tests/react/AppIcon.test.tsx

### Implementation for User Stories 1 & 2

- [x] T009 [US1] Create AppIcon component file at src/components/AppIcon.tsx with "use client" directive
- [x] T010 [US1] Define AppIconProps interface with visible and mode props in src/components/AppIcon.tsx
- [x] T011 [US1] Import motion, AnimatePresence, useReducedMotion from "motion/react" in src/components/AppIcon.tsx
- [x] T012 [US1] Import Image from "next/image" in src/components/AppIcon.tsx
- [x] T013 [US1] Import icon asset from "@/assets/icon.png" in src/components/AppIcon.tsx
- [x] T014 [US1] Implement AppIcon function component with fixed positioning (top-[50px] left-[50px]) in src/components/AppIcon.tsx
- [x] T015 [US1] Add Next.js Image component with width=50, height=50, alt="RAIC Overlay", priority=true in src/components/AppIcon.tsx
- [x] T016 [US2] Remove HeaderPanel import from app/page.tsx
- [x] T017 [US2] Remove HeaderPanel JSX usage from app/page.tsx (line ~162-167)
- [x] T018 [US1] Import AppIcon component in app/page.tsx
- [x] T019 [US1] Add AppIcon to OverlayContent passing visible={state.visible} and mode={state.mode} in app/page.tsx
- [x] T020 [US2] Delete src/components/HeaderPanel.tsx file
- [x] T021 [US2] Delete tests/react/HeaderPanel.test.tsx file
- [x] T022 Run tests to verify US1/US2 implementation: npm test -- AppIcon

**Checkpoint**: At this point, the icon should display in top-left corner and no header panel should be visible. Icon may not yet have correct opacity transitions.

---

## Phase 4: User Story 3 - Opacity Mode Transitions (Priority: P2)

**Goal**: Icon opacity transitions smoothly between 100% (windowed) and 40% (fullscreen) modes

**Independent Test**: Toggle F5 between modes and observe icon fades smoothly (or instantly if reduced motion enabled)

### Tests for User Story 3

- [x] T023 [P] [US3] Add test: "has 100% opacity in windowed mode" in tests/react/AppIcon.test.tsx
- [x] T024 [P] [US3] Add test: "has 40% opacity in fullscreen mode" in tests/react/AppIcon.test.tsx
- [x] T025 [P] [US3] Add test: "respects reduced motion preferences" in tests/react/AppIcon.test.tsx

### Implementation for User Story 3

- [x] T026 [US3] Calculate targetOpacity based on mode (fullscreen ? 0.4 : 1) in src/components/AppIcon.tsx
- [x] T027 [US3] Add showHideDuration calculation respecting useReducedMotion in src/components/AppIcon.tsx
- [x] T028 [US3] Add modeChangeDuration calculation respecting useReducedMotion in src/components/AppIcon.tsx
- [x] T029 [US3] Wrap Image with AnimatePresence and motion.div for show/hide animation in src/components/AppIcon.tsx
- [x] T030 [US3] Add initial={{ opacity: 0 }}, animate={{ opacity: targetOpacity }}, exit={{ opacity: 0 }} to outer motion.div in src/components/AppIcon.tsx
- [x] T031 [US3] Add inner motion.div for mode transition with animate={{ opacity: targetOpacity }} in src/components/AppIcon.tsx
- [x] T032 [US3] Add transition={{ duration: modeChangeDuration, ease: "easeOut" }} to inner motion.div in src/components/AppIcon.tsx
- [x] T033 Run tests to verify US3 implementation: npm test -- AppIcon

**Checkpoint**: Icon should now smoothly transition between opacity levels when mode changes

---

## Phase 5: User Story 4 - Click-Through Behavior (Priority: P2)

**Goal**: Icon allows clicks to pass through in fullscreen mode, captures clicks in windowed mode

**Independent Test**: In fullscreen mode, click on icon area - click should pass through to underlying window

### Tests for User Story 4

- [x] T034 [P] [US4] Add test: "has pointer-events-none in fullscreen mode" in tests/react/AppIcon.test.tsx
- [x] T035 [P] [US4] Add test: "has pointer-events-auto in windowed mode" in tests/react/AppIcon.test.tsx

### Implementation for User Story 4

- [x] T036 [US4] Calculate pointerEventsClass based on mode (fullscreen ? "pointer-events-none" : "") in src/components/AppIcon.tsx
- [x] T037 [US4] Apply pointerEventsClass to the outer motion.div className in src/components/AppIcon.tsx
- [x] T038 Run tests to verify US4 implementation: npm test -- AppIcon

**Checkpoint**: All user stories complete - icon displays, animates, and has correct click-through behavior

---

## Phase 6: Polish & Validation

**Purpose**: Final cleanup and verification

- [x] T039 Run full test suite: npm test
- [x] T040 Run linting: npm run lint (if configured) - N/A, no lint script
- [ ] T041 Manual verification per quickstart.md: Launch dev server, test F3 toggle
- [ ] T042 Manual verification: Test F5 mode toggle, observe opacity transition
- [ ] T043 Manual verification: In fullscreen mode, verify click-through works over icon area
- [x] T044 Update README.md if HeaderPanel is mentioned (replace with AppIcon reference)
- [x] T045 Clean up temp/Icon.png and temp/Icon.pdf (no longer needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Empty - no blockers
- **US1+US2 (Phase 3)**: Depends on Setup (asset must be in place)
- **US3 (Phase 4)**: Depends on US1+US2 (component must exist to add animations)
- **US4 (Phase 5)**: Depends on US1+US2 (component must exist to add click-through)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 + US2 (P1)**: Tightly coupled - implement together in same phase
- **US3 (P2)**: Builds on US1/US2 - adds animation behavior to existing component
- **US4 (P2)**: Builds on US1/US2 - adds click-through behavior to existing component
- **US3 and US4**: Can run in parallel (affect different aspects of the component)

### Within Each Phase

- Tests written FIRST (T004-T008, T023-T025, T034-T035)
- Component structure before integration (T009-T015 before T016-T019)
- Integration before cleanup (T019 before T020-T021)

### Parallel Opportunities

**Phase 3 Tests** (all can run in parallel):
```bash
Task: "Create test file tests/react/AppIcon.test.tsx"
Task: "Add test: renders when visible is true"
Task: "Add test: does not render when visible is false"
Task: "Add test: displays at 50x50 pixels dimensions"
Task: "Add test: has correct positioning"
```

**Phase 4 + Phase 5** (can run in parallel after Phase 3):
```bash
# Developer A: US3 (opacity transitions)
Task: T023-T033

# Developer B: US4 (click-through)
Task: T034-T038
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Skip Phase 2: No blockers
3. Complete Phase 3: US1+US2 (T004-T022)
4. **STOP and VALIDATE**: Icon visible, header removed
5. Deploy/demo if ready - basic branding complete

### Full Implementation

1. MVP first (Phases 1-3)
2. Add US3: Smooth opacity transitions (Phase 4)
3. Add US4: Click-through behavior (Phase 5)
4. Polish and validate (Phase 6)

### Single Developer Strategy

Execute phases sequentially: 1 → 3 → 4 → 5 → 6

Total estimated tasks: 45 tasks
- Phase 1: 3 tasks
- Phase 2: 0 tasks
- Phase 3: 19 tasks (MVP)
- Phase 4: 11 tasks
- Phase 5: 5 tasks
- Phase 6: 7 tasks

---

## Notes

- All tests use Vitest + React Testing Library (existing project patterns)
- AppIcon component follows exact motion/react patterns from research.md
- HeaderPanel removal includes cleanup of associated test file
- No backend changes required - frontend only
- Icon asset moved from temp/ to src/assets/ for proper Next.js bundling
