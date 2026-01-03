# Tasks: Timer Menu Button Rename and Reorder

**Input**: Design documents from `/specs/058-timer-menu-rename/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Not requested - manual visual verification per plan.md

**Organization**: Due to the minimal scope (single file change), both user stories are combined into one implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Tauri + Next.js frontend
- **Source**: `src/components/` at repository root

---

## Phase 1: Setup

**Purpose**: No setup required - single file modification

*No tasks - existing project structure is sufficient*

---

## Phase 2: Foundational

**Purpose**: No foundational work required - direct UI change

*No tasks - no infrastructure changes needed*

---

## Phase 3: User Stories 1 & 2 - Button Labels and Order (Priority: P1) 🎯 MVP

**Goal**: Rename widget buttons ("Stopwatch" → "Timer", "Timer" → "Session Timer") and reorder them so Timer appears before Session Timer

**Independent Test**: Open overlay in windowed mode, verify button order is Clock, Timer, Session Timer; click each button to verify correct widget opens

### Implementation

- [X] T001 [US1] [US2] Update widget button labels and order in src/components/MainMenu.tsx lines 153-163

**Task Details for T001**:

1. Locate the ButtonGroup containing widget buttons (lines 153-163)
2. Change the chronometer button's label from "Stopwatch" to "Timer" (line 161)
3. Change the session timer button's label from "Timer" to "Session Timer" (line 158)
4. Swap the button order so the chronometer button (with `handleOpenChronometerWidget`) appears BEFORE the session timer button (with `handleOpenTimerWidget`)

**Expected result**:
```tsx
<ButtonGroup>
  <Button variant="secondary" onClick={handleOpenClockWidget}>
    Clock
  </Button>
  <Button variant="secondary" onClick={handleOpenChronometerWidget}>
    Timer
  </Button>
  <Button variant="secondary" onClick={handleOpenTimerWidget}>
    Session Timer
  </Button>
</ButtonGroup>
```

**Checkpoint**: Feature complete - both user stories satisfied with this single change

---

## Phase 4: Verification

**Purpose**: Confirm all acceptance criteria are met

- [X] T002 Verify button order displays as Clock, Timer, Session Timer in overlay
- [X] T003 Verify clicking Timer button opens chronometer widget
- [X] T004 Verify clicking Session Timer button opens session timer widget

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Skipped - no setup needed
- **Phase 2 (Foundational)**: Skipped - no infrastructure needed
- **Phase 3 (User Stories)**: Can start immediately
- **Phase 4 (Verification)**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1** (Labels): Implemented by T001
- **User Story 2** (Order): Implemented by T001
- Both stories share the same implementation task as they affect the same JSX block

### Parallel Opportunities

None - single file, single change

---

## Implementation Strategy

### MVP (Complete Feature)

1. Execute T001 (modify MainMenu.tsx)
2. Run T002-T004 (visual verification)
3. Complete

### Single Developer Workflow

```bash
# Step 1: Make the change
Edit src/components/MainMenu.tsx lines 153-163

# Step 2: Verify
npm run dev
# Open overlay, check button order and functionality
```

---

## Notes

- Total tasks: 4 (1 implementation + 3 verification)
- This is a minimal change feature - both user stories are satisfied by modifying 6 lines of JSX in a single file
- No tests required per plan.md (visual verification sufficient)
- No build or configuration changes needed
- Handler functions remain unchanged; only button labels and order change
