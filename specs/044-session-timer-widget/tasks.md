# Tasks: Session Timer Widget

**Input**: Design documents from `/specs/044-session-timer-widget/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Manual testing only (per existing widget patterns). No automated test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` at repository root (Next.js/React)
- **Backend**: `src-tauri/src/` (Rust - no changes needed for this feature)

---

## Phase 1: Setup (Type System Foundation)

**Purpose**: Extend the type system to support the new widget type

- [x] T001 Add 'timer' to WidgetType union in src/types/widgets.ts
- [x] T002 Add timer default dimensions (200x80) and opacity (0.8) to getDefaultDimensions and getDefaultOpacity functions in src/contexts/WidgetsContext.tsx

**Checkpoint**: Type system ready - widget instances can now be created with type 'timer'

---

## Phase 2: Foundational (Core Hook & Utilities)

**Purpose**: Create the session timer state management hook that all widget instances will share

**Note**: This is the core logic that ALL user stories depend on

- [x] T003 Create useSessionTimer hook with SessionTimerState interface in src/hooks/useSessionTimer.ts
- [x] T004 Implement Tauri event subscription for target-process-detected and target-process-terminated in src/hooks/useSessionTimer.ts
- [x] T005 Implement 1000ms interval timer update logic when session is running in src/hooks/useSessionTimer.ts
- [x] T006 Add formatElapsedTime utility function (HH:MM:SS with >24h support) in src/hooks/useSessionTimer.ts
- [x] T007 Export useSessionTimer and formatElapsedTime from src/hooks/useSessionTimer.ts

**Checkpoint**: Core hook ready - can track session state and format elapsed time

---

## Phase 3: User Story 1+2 - Track & Reset Session Duration (Priority: P1)

**Goal**: Display elapsed time since target process started, reset on new session

**Independent Test**: Start target process, observe timer counting from 00:00:00. Stop process, start again - timer resets to 00:00:00.

### Implementation for User Stories 1 & 2 (Combined - tightly coupled)

- [x] T008 [US1] Create SessionTimerWidgetContent component skeleton in src/components/widgets/SessionTimerWidgetContent.tsx
- [x] T009 [US1] Integrate useSessionTimer hook into SessionTimerWidgetContent in src/components/widgets/SessionTimerWidgetContent.tsx
- [x] T010 [US1] Add ResizeObserver for responsive font sizing (same pattern as ClockWidgetContent) in src/components/widgets/SessionTimerWidgetContent.tsx
- [x] T011 [US1] Apply liquid-glass-text and font-orbitron styling in src/components/widgets/SessionTimerWidgetContent.tsx
- [x] T012 [US1] Export SessionTimerWidgetContent from src/components/widgets/index.ts
- [x] T013 [US1] Add 'timer' case to renderWidgetContent switch in src/components/widgets/WidgetsContainer.tsx
- [x] T014 [US1] Import SessionTimerWidgetContent in src/components/widgets/WidgetsContainer.tsx

**Checkpoint**: Timer widget displays and counts correctly. Manual test: start/stop target process, verify timer behavior.

---

## Phase 4: User Story 3 - Open Widget from Menu (Priority: P2)

**Goal**: Add session timer widget to overlay from main menu

**Independent Test**: Open main menu, click "Session Timer" button, verify widget appears on overlay.

### Implementation for User Story 3

- [x] T015 [US3] Add "Session Timer" button to Widgets section in src/components/MainMenu.tsx
- [x] T016 [US3] Implement widget:open event emission with type 'timer' on button click in src/components/MainMenu.tsx

**Checkpoint**: Timer widget can be added from menu. Manual test: open menu, add timer, verify it appears.

---

## Phase 5: User Story 4 - Customize Widget (Priority: P3)

**Goal**: Move, resize, and adjust opacity of session timer widget

**Independent Test**: Drag widget to move, use corner handles to resize, double-click for settings panel.

### Implementation for User Story 4

> **NOTE**: This functionality is automatically provided by the existing Widget component wrapper.
> No new implementation tasks needed - the widget system already supports:
> - Drag to move (Widget.tsx)
> - Corner resize handles (Widget.tsx)
> - Double-click for settings (Widget.tsx → WidgetSettings.tsx)
> - Opacity slider (WidgetSettings.tsx)
> - Remove button (WidgetSettings.tsx)
> - Persistence of position/size/opacity (WidgetsContext.tsx + usePersistence.ts)

- [x] T017 [US4] Verify widget interactions work correctly (move, resize, opacity, remove) - manual testing only

**Checkpoint**: Widget fully customizable. Manual test: move, resize, adjust opacity, remove widget.

---

## Phase 6: Polish & Verification

**Purpose**: Final verification and edge case testing

- [x] T018 Verify timer continues counting while overlay is hidden (F3 toggle)
- [x] T019 Verify timer displays correctly beyond 24 hours (e.g., 25:30:15)
- [x] T020 Verify widget position/size/opacity persists across app restart
- [x] T021 Verify multiple timer widgets show same time (shared state via hook)
- [x] T022 Verify timer shows 00:00:00 on first launch with no process running
- [x] T023 Verify timer freezes at last elapsed time when process terminates
- [x] T024 Run full quickstart.md testing checklist

**Checkpoint**: Feature complete and verified against all acceptance scenarios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - creates core hook
- **Phase 3 (US1+2)**: Depends on Phase 2 - uses hook in component
- **Phase 4 (US3)**: Depends on Phase 3 - component must exist to open from menu
- **Phase 5 (US4)**: Depends on Phase 3 - widget must exist to customize
- **Phase 6 (Polish)**: Depends on all phases - final verification

### User Story Dependencies

- **User Story 1+2 (P1)**: Core timer functionality - must complete first
- **User Story 3 (P2)**: Depends on US1+2 (widget component must exist)
- **User Story 4 (P3)**: Depends on US1+2 (widget must exist to customize)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003-T007 must be sequential (same file, incremental changes)
- T008-T014 mostly sequential (same component, incremental features)
- T015-T016 (Phase 4) can run in parallel with Phase 5-6 verification tasks (different files)
- T018-T024 are independent verification steps, can be done in any order

---

## Parallel Example: Phase 1

```bash
# Launch both setup tasks together:
Task: "Add 'timer' to WidgetType union in src/types/widgets.ts"
Task: "Add timer default dimensions in src/contexts/WidgetsContext.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup (type extension)
2. Complete Phase 2: Foundational (useSessionTimer hook)
3. Complete Phase 3: User Stories 1+2 (component + container integration)
4. **STOP and VALIDATE**: Test timer counting and reset behavior
5. Demo core functionality

### Incremental Delivery

1. Complete Setup + Foundational + US1+2 → Timer works (MVP!)
2. Add User Story 3 → Can add from menu
3. Add User Story 4 → Verify customization works
4. Complete Polish → All edge cases verified

### Single Developer Path

Since this is a small feature (~200 lines), a single developer should:
1. Complete all phases sequentially
2. Test after each phase checkpoint
3. Total estimated time: 2-3 hours

---

## Notes

- No backend changes required - events already emitted by process_monitor.rs
- Widget customization (US4) is mostly "verify it works" since existing widget system handles it
- Hook state is shared across all timer widget instances (they all show same time)
- Manual testing follows existing widget feature patterns
- Commit after completing each phase
