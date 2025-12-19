# Tasks: Excalidraw Draw Component

**Input**: Design documents from `/specs/009-excalidraw-draw-component/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Integration tests for core user journeys per Constitution Principle II.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: Next.js frontend in `src/`, Tauri backend unchanged
- File locations based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Excalidraw dependency

- [X] T001 Install @excalidraw/excalidraw package with --force flag for React 19 compatibility

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required - existing windows system (007) and MainMenu (006/008) are already in place

**Note**: This feature builds on existing infrastructure. No foundational tasks needed.

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Open Draw Window from Menu (Priority: P1) 🎯 MVP

**Goal**: User can click "Draw" button in main menu to open a new Draw window containing Excalidraw canvas

**Independent Test**: Click "Draw" button in interaction mode → new window opens with Excalidraw canvas and drawing tools visible

### Tests for User Story 1

- [X] T002 [US1] Create integration test for DrawContent component in src/components/windows/__tests__/DrawContent.test.tsx

### Implementation for User Story 1

- [X] T003 [US1] Create DrawContent component with Excalidraw wrapper in src/components/windows/DrawContent.tsx
- [X] T004 [US1] Add DrawContent import and handleOpenDraw handler in src/components/MainMenu.tsx
- [X] T005 [US1] Add Draw button between Notes and Test Windows buttons in src/components/MainMenu.tsx ButtonGroup

**Checkpoint**: User Story 1 complete - Draw button in menu opens Excalidraw window

---

## Phase 4: User Story 2 - Draw Using Excalidraw Tools (Priority: P2)

**Goal**: User can access all Excalidraw drawing tools (shapes, lines, text, freehand) in interaction mode

**Independent Test**: Open Draw window → toolbar visible with selection, rectangle, ellipse, diamond, arrow, line, pencil, text tools → can draw and manipulate shapes

**Note**: This functionality is provided by Excalidraw out-of-the-box when viewModeEnabled=false. Task T003 already configures this.

### Implementation for User Story 2

- [X] T006 [US2] Verify Excalidraw toolbar displays all standard tools in src/components/windows/DrawContent.tsx
- [X] T007 [US2] Configure UIOptions to disable non-essential actions (load/save/export) in src/components/windows/DrawContent.tsx

**Checkpoint**: User Story 2 complete - full drawing toolkit available

---

## Phase 5: User Story 3 - View Drawings in Non-Interaction Mode (Priority: P3)

**Goal**: Toolbar hides and canvas becomes read-only when system exits interaction mode (F5)

**Independent Test**: Draw content → press F5 → toolbar disappears, canvas view-only → press F5 again → toolbar reappears, can edit

### Implementation for User Story 3

- [X] T008 [US3] Ensure viewModeEnabled prop correctly syncs with isInteractive in src/components/windows/DrawContent.tsx
- [X] T009 [US3] Verify mode toggle updates all open Draw windows via props in src/components/windows/DrawContent.tsx

**Checkpoint**: User Story 3 complete - mode-aware toolbar visibility working

---

## Phase 6: User Story 4 - Drawing Content Lost on Window Close (Priority: P4)

**Goal**: Drawings are ephemeral - closing window permanently discards content

**Independent Test**: Draw content → close window → open new Draw window → canvas is empty

**Note**: This is default Excalidraw behavior (no persistence configured). Each component mount creates fresh instance.

### Implementation for User Story 4

- [X] T010 [US4] Verify no initialData or persistence is configured in DrawContent component in src/components/windows/DrawContent.tsx
- [X] T011 [US4] Verify multiple Draw windows maintain independent state (close one, others unaffected)

**Checkpoint**: User Story 4 complete - ephemeral state verified

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and validation

- [ ] T012 Apply THEME.DARK to Excalidraw with toggleTheme disabled in src/components/windows/DrawContent.tsx
- [ ] T013 Run quickstart.md testing checklist to validate all acceptance scenarios
- [ ] T014 Verify performance targets: <1s window open, <100ms mode toggle, <50ms drawing operations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - install package first
- **Foundational (Phase 2)**: N/A - existing infrastructure sufficient
- **User Stories (Phase 3-6)**: Sequential by priority, each builds on previous
- **Polish (Phase 7)**: After all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Setup (T001) - Creates the component and menu button
- **User Story 2 (P2)**: Depends on US1 - Verifies/configures toolbar options
- **User Story 3 (P3)**: Depends on US1 - Configures mode-aware behavior
- **User Story 4 (P4)**: Depends on US1 - Verifies ephemeral state

### Task Dependencies Within Stories

```
T001 (Install) → T002 (Test) → T003 (Create component) → T004, T005 (Menu integration)
                                                       ↓
                                     T006, T007 (US2: Toolbar config)
                                                       ↓
                                     T008, T009 (US3: Mode-aware behavior)
                                                       ↓
                                     T010, T011 (US4: Ephemeral verification)
                                                       ↓
                                     T012, T013, T014 (Polish)
```

### Parallel Opportunities

Limited parallelism due to feature simplicity (2 files):

- T006 and T007 can be done together (same component, different aspects)
- T008 and T009 can be done together (verifying mode behavior)
- T010 and T011 can be done together (verifying ephemeral state)

---

## Parallel Example: User Story 1

```bash
# T002 (test) should be written first, then T003 (implementation)
# T004, T005 must follow T003 (component before menu integration)
# Within US2/US3/US4, verification tasks can run together
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 - install Excalidraw)
2. Complete Phase 3: User Story 1 (T002-T005 - test + component + menu button)
3. **STOP and VALIDATE**: Run test and verify Draw window opens from menu
4. Basic drawing should work immediately (Excalidraw provides tools)

### Incremental Delivery

1. T001 → Install Excalidraw
2. T002 → Write integration test (should fail initially)
3. T003-T005 → MVP! Draw button works, window opens with canvas, test passes
4. T006-T007 → Toolbar refinement (hide save/export buttons)
5. T008-T009 → Mode-aware behavior (F5 toggle)
6. T010-T011 → Verify ephemeral state
7. T012-T014 → Polish and validation

### Estimated Effort

- **Phase 1**: 1 task (package install)
- **Phase 3 (US1)**: 4 tasks (test + core functionality)
- **Phase 4 (US2)**: 2 tasks (toolbar config)
- **Phase 5 (US3)**: 2 tasks (mode awareness)
- **Phase 6 (US4)**: 2 tasks (verification)
- **Phase 7**: 3 tasks (polish)

**Total**: 14 tasks

---

## Test Specification (T002)

The integration test in `src/components/windows/__tests__/DrawContent.test.tsx` should verify:

```typescript
// Test scenarios to cover:
// 1. DrawContent renders without crashing
// 2. Excalidraw canvas is present in the DOM
// 3. Toolbar visible when isInteractive=true
// 4. Toolbar hidden when isInteractive=false (viewModeEnabled)
// 5. Dark theme applied (THEME.DARK)
// 6. Component mounts with empty canvas (no initialData)
```

---

## Notes

- This feature closely mirrors 008-tiptap-notes-component in structure
- DrawContent.tsx follows NotesContent.tsx pattern exactly
- Most Excalidraw functionality works out-of-the-box
- Tasks T006-T011 are primarily verification/configuration, not new code
- Excalidraw CSS must be imported: `import "@excalidraw/excalidraw/index.css"`
- Use `"use client"` directive for SSR compatibility
- Container must have explicit dimensions (h-full w-full)
- FR-008 through FR-011 (drawing tools, color picker, undo/redo, pan/zoom) are Excalidraw built-in features covered implicitly by T003
