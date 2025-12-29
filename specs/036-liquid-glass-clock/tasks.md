# Tasks: Liquid Glass Clock Widget

**Input**: Design documents from `/specs/036-liquid-glass-clock/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: No automated tests requested for this feature (visual styling - manual verification appropriate)

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web/desktop hybrid (Next.js + Tauri)
- **Primary target**: `src/components/widgets/ClockWidgetContent.tsx`
- **Optional CSS**: `app/globals.css`

---

## Phase 1: Setup

**Purpose**: Prepare development environment and verify existing component

- [X] T001 Verify development environment running with `npm run tauri:dev`
- [X] T002 Verify existing ClockWidgetContent renders correctly in `src/components/widgets/ClockWidgetContent.tsx`

---

## Phase 2: Foundational (CSS Utility Class)

**Purpose**: Create reusable liquid glass CSS class for the effect

**⚠️ CRITICAL**: The CSS class must exist before applying it to the component

- [X] T003 Add `.liquid-glass-text` CSS utility class to `app/globals.css` with blue-tinted glass properties (backdrop-filter, box-shadow, text-shadow, border, color)

**Checkpoint**: CSS class ready - component modification can begin

---

## Phase 3: User Story 1 - View Liquid Glass Clock (Priority: P1) 🎯 MVP

**Goal**: Apply liquid glass effect to clock widget, replacing existing white/blue-stroke styling

**Independent Test**: View clock widget and verify liquid glass visual properties (frosted translucency, blur, blue glow) against various backgrounds

### Implementation for User Story 1

- [X] T004 [US1] Update JSDoc header in `src/components/widgets/ClockWidgetContent.tsx` to reference feature 036-liquid-glass-clock
- [X] T005 [US1] Remove existing white text with blue stroke styling (color, WebkitTextStroke, paintOrder) from span element in `src/components/widgets/ClockWidgetContent.tsx`
- [X] T006 [US1] Add `liquid-glass-text` class to clock span element in `src/components/widgets/ClockWidgetContent.tsx`
- [X] T007 [US1] Verify backdrop-filter blur renders correctly on transparent overlay background
- [X] T008 [US1] Verify text readability against light, dark, and colorful backgrounds
- [X] T009 [US1] Verify time updates (1-second interval) occur without visual stuttering

**Checkpoint**: Liquid glass clock visible and functional - MVP complete

---

## Phase 4: User Story 2 - Responsive Liquid Glass Scaling (Priority: P2)

**Goal**: Ensure liquid glass effect scales appropriately when widget is resized

**Independent Test**: Resize clock widget and verify glass effect maintains visual quality at all sizes

### Implementation for User Story 2

- [X] T010 [US2] Verify existing fontSize auto-scaling (ResizeObserver) still functions correctly with liquid glass styling in `src/components/widgets/ClockWidgetContent.tsx`
- [X] T011 [US2] Test glass effect at minimum widget size - verify effect degrades gracefully
- [X] T012 [US2] Test glass effect at maximum widget size - verify visual properties scale proportionally
- [X] T013 [US2] Adjust padding or border-radius if needed for proper scaling in `src/components/widgets/ClockWidgetContent.tsx`

**Checkpoint**: Liquid glass clock scales correctly at all sizes

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T014 [P] Run ESLint to verify no TypeScript errors (`npm run lint` or equivalent)
- [X] T015 [P] Verify Orbitron font renders correctly with liquid glass effect
- [X] T015b [P] Verify fallback font receives liquid glass styling when Orbitron fails to load (disable font in DevTools Network tab)
- [X] T016 Performance check: Watch clock for 60+ seconds, confirm no stuttering or memory issues
- [X] T017 Run quickstart.md validation checklist
- [X] T018 Mark all tasks in `specs/036-liquid-glass-clock/tasks.md` as complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase (CSS class must exist)
- **User Story 2 (Phase 4)**: Can run after User Story 1 (builds on same component)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T003 (CSS class) - Core liquid glass effect
- **User Story 2 (P2)**: Depends on US1 completion - Scaling verification

### Within Each User Story

- Component documentation update first (T004)
- Remove old styling before adding new (T005 before T006)
- Apply new styling (T006)
- Verification tasks last (T007-T009)

### Parallel Opportunities

- T001 and T002 can run in parallel (Setup verification)
- T014 and T015 can run in parallel (Polish phase checks)
- US2 verification tasks (T010-T013) are sequential within the story

---

## Parallel Example: Setup Phase

```bash
# Launch both setup verification tasks together:
Task: "Verify development environment running"
Task: "Verify existing ClockWidgetContent renders correctly"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify environment)
2. Complete Phase 2: Foundational (add CSS class)
3. Complete Phase 3: User Story 1 (apply liquid glass effect)
4. **STOP and VALIDATE**: Test clock visually on transparent overlay
5. Deploy/demo if ready - liquid glass clock is functional

### Incremental Delivery

1. Complete Setup + Foundational → CSS ready
2. Add User Story 1 → Test visually → MVP complete!
3. Add User Story 2 → Test scaling → Full feature complete
4. Polish → Final validation → Ready for merge

### Single Developer Strategy (Recommended for this feature)

This is a small feature (single component modification):
1. Work through phases sequentially
2. Complete all tasks in order
3. Full feature achievable in one session

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All verification tasks (T007-T009, T010-T013) are manual visual checks
- No automated tests included (visual styling feature)
- Commit after T006 (core implementation) and after T013 (scaling complete)
- Stop at Phase 3 checkpoint if MVP is sufficient
