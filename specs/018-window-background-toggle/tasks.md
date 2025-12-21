# Tasks: Window Background Toggle

**Input**: Design documents from `/specs/018-window-background-toggle/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested - using manual testing consistent with existing window system approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Extend type definitions to support backgroundTransparent property

- [X] T001 [P] Add `backgroundTransparent: boolean` property to `WindowInstance` interface in src/types/windows.ts
- [X] T002 [P] Add `initialBackgroundTransparent?: boolean` to `WindowOpenPayload` interface in src/types/windows.ts
- [X] T003 [P] Add `backgroundTransparent: boolean` property to `WindowStructure` interface in src/types/persistence.ts

---

## Phase 2: Foundational (State Management)

**Purpose**: Core state management that MUST be complete before UI can function

**⚠️ CRITICAL**: User Story 1 cannot function until this phase is complete

- [X] T004 Add `SET_WINDOW_BACKGROUND_TRANSPARENT` to `WindowsAction` union type in src/contexts/WindowsContext.tsx
- [X] T005 Add reducer case for `SET_WINDOW_BACKGROUND_TRANSPARENT` action in src/contexts/WindowsContext.tsx
- [X] T006 Update `OPEN_WINDOW` reducer case to handle `initialBackgroundTransparent` in src/contexts/WindowsContext.tsx
- [X] T007 Add `setWindowBackgroundTransparent` method to `ExtendedWindowsContextValue` interface in src/contexts/WindowsContext.tsx
- [X] T008 Implement `setWindowBackgroundTransparent` callback in WindowsProvider in src/contexts/WindowsContext.tsx

**Checkpoint**: State management ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Toggle Window Background Transparency (Priority: P1) 🎯 MVP

**Goal**: Users can toggle between solid and transparent content area backgrounds via a control in the window header

**Independent Test**: Enter interaction mode (F5), open a window, click the background toggle in the header, observe the content area background change from solid to transparent (and vice versa)

### Implementation for User Story 1

- [X] T009 [US1] Create BackgroundToggle component with PanelTop icon in src/components/windows/BackgroundToggle.tsx
- [X] T010 [US1] Add BackgroundToggle props: value (boolean), onChange, onCommit in src/components/windows/BackgroundToggle.tsx
- [X] T011 [US1] Implement toggle click handler that inverts value and calls onChange + onCommit in src/components/windows/BackgroundToggle.tsx
- [X] T012 [US1] Add visual state styling (full opacity = solid, reduced = transparent) in src/components/windows/BackgroundToggle.tsx
- [X] T013 [US1] Add backgroundTransparent prop to WindowHeaderProps interface in src/components/windows/WindowHeader.tsx
- [X] T014 [US1] Add onBackgroundTransparentChange and onBackgroundTransparentCommit callbacks to WindowHeaderProps in src/components/windows/WindowHeader.tsx
- [X] T015 [US1] Import and render BackgroundToggle next to OpacitySlider in src/components/windows/WindowHeader.tsx
- [X] T016 [US1] Pass backgroundTransparent prop from Window to WindowHeader in src/components/windows/Window.tsx
- [X] T017 [US1] Add setWindowBackgroundTransparent handler passed to WindowHeader in src/components/windows/Window.tsx
- [X] T018 [US1] Apply conditional bg-transparent class to content area div based on backgroundTransparent prop in src/components/windows/Window.tsx

**Checkpoint**: User Story 1 complete - background toggle is functional in interaction mode

---

## Phase 4: User Story 2 - Persist Background Toggle Setting (Priority: P2)

**Goal**: Background transparency setting is saved per-window and restored on application restart

**Independent Test**: Toggle a window background to transparent, close the application, reopen it, verify the window appears with transparent background

### Implementation for User Story 2

- [X] T019 [US2] Add `backgroundTransparent` field to serializeWindow output in src/lib/serialization.ts
- [X] T020 [US2] Update app restoration logic to pass initialBackgroundTransparent when opening restored windows in src/app/page.tsx
- [X] T021 [US2] Connect onBackgroundTransparentCommit to persistence?.onWindowMoved() in src/components/windows/Window.tsx

**Checkpoint**: User Story 2 complete - background settings persist across sessions

---

## Phase 5: User Story 3 - Consistent Background Across Modes (Priority: P3)

**Goal**: Background transparency remains consistent when switching between interaction and non-interaction modes (F5)

**Independent Test**: Set a window background to transparent, toggle F5 between modes, verify background stays transparent in both modes

### Implementation for User Story 3

- [X] T022 [US3] Verify Window.tsx applies backgroundTransparent to content area regardless of isInteractive prop in src/components/windows/Window.tsx
- [X] T023 [US3] Verify no mode-specific background overrides exist in Window.tsx styling in src/components/windows/Window.tsx

**Checkpoint**: User Story 3 complete - background mode is consistent across interaction modes

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T024 Verify default solid background (false) is applied to newly created windows
- [ ] T025 Verify invalid/missing backgroundTransparent values default to false (solid)
- [ ] T026 Run TypeScript type check to ensure no type errors
- [ ] T027 Run ESLint to ensure code quality
- [ ] T028 Manual testing: verify all acceptance scenarios from spec.md (include performance check: background change must be visually instant, <50ms per SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories should be done sequentially (P1 → P2 → P3) as they build on each other
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (state management) - Core toggle functionality
- **User Story 2 (P2)**: Depends on US1 - Adds persistence to working toggle
- **User Story 3 (P3)**: Depends on US1 - Verifies mode consistency (may already work from US1 implementation)

### Within Each User Story

- Component creation before integration
- Props/interfaces before implementation
- Core functionality before handlers

### Parallel Opportunities

Within Phase 1:
```
T001 (windows.ts WindowInstance) | T002 (windows.ts WindowOpenPayload) | T003 (persistence.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (state management)
3. Complete Phase 3: User Story 1 (toggle UI)
4. **STOP and VALIDATE**: Test toggle functionality manually
5. Background toggle works in interaction mode

### Incremental Delivery

1. Complete Setup + Foundational → State ready
2. Add User Story 1 → Toggle works → MVP!
3. Add User Story 2 → Settings persist
4. Add User Story 3 → Mode consistency verified
5. Polish → Full feature complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No automated tests - manual testing per existing project pattern
- Follow OpacitySlider pattern from feature 013 for consistency
- BackgroundToggle uses PanelTop icon from lucide-react (already in project)
- Commit after each phase for easy rollback
