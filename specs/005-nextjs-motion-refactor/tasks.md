# Tasks: Next.js Migration with Motion Animations

**Input**: Design documents from `/specs/005-nextjs-motion-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test tasks included (not explicitly requested in feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` → migrates to `app/` and `src/` (Next.js App Router structure)
- **Backend**: `src-tauri/` (unchanged)
- **Config**: Root directory for `next.config.mjs`, `package.json`, `tsconfig.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Next.js migration setup

- [x] T001 Remove Vite dependencies (vite, @vitejs/plugin-react) from package.json
- [x] T002 Install Next.js and motion dependencies in package.json
- [x] T003 [P] Create next.config.mjs with static export configuration at project root
- [x] T004 [P] Update package.json scripts for Next.js (dev, build, tauri:dev, tauri:build)
- [x] T005 [P] Update tsconfig.json for Next.js App Router paths and configuration
- [x] T006 Delete vite.config.ts from project root

**Checkpoint**: Next.js dependencies installed, configuration files ready

---

## Phase 2: Foundational (Framework Migration - US4 Base)

**Purpose**: Core Next.js App Router structure that MUST be complete before animation work

**⚠️ CRITICAL**: No animation tasks can begin until this phase is complete

- [x] T007 Create app/ directory structure at project root
- [x] T008 Create app/layout.tsx with root layout, html/body tags, and globals.css import
- [x] T009 Create app/globals.css by copying from src/styles/globals.css
- [x] T010 Create app/page.tsx as client component with "use client" directive
- [x] T011 Verify src/components/ works with Next.js App Router (update any Vite-specific imports)
- [x] T012 Verify src/lib/utils.ts works with Next.js (no changes expected)
- [x] T013 Verify src/types/ works with Next.js (no changes expected)
- [x] T014 Update tauri.conf.json build configuration in src-tauri/tauri.conf.json
- [x] T015 Re-initialize shadcn/ui for Next.js 15 compatibility
- [x] T016 Verify TypeScript path aliases work with @/ prefix in tsconfig.json

**Checkpoint**: Next.js App Router structure ready, basic app renders

---

## Phase 3: User Story 4 - Framework Migration Preserves Functionality (Priority: P1) 🎯 MVP

**Goal**: Migrate all existing React code to Next.js while preserving 100% of existing functionality

**Independent Test**: Verify F3 toggle, F5 mode switch, window positioning, target attachment, error modal, and click-through all work identically to before

### Implementation for User Story 4

- [x] T017 [US4] Migrate App.tsx state management to app/page.tsx
- [x] T018 [US4] Migrate Tauri event listeners (toggle-visibility, toggle-mode, etc.) to app/page.tsx
- [x] T019 [US4] Migrate Tauri invoke commands to app/page.tsx
- [x] T020 [US4] Migrate window positioning logic (getCurrentWindow, currentMonitor) to app/page.tsx
- [x] T021 [US4] Update HeaderPanel.tsx imports for Next.js compatibility in src/components/HeaderPanel.tsx
- [x] T022 [US4] Update ErrorModal.tsx imports for Next.js compatibility in src/components/ErrorModal.tsx
- [x] T023 [US4] Update Card component imports in src/components/ui/card.tsx
- [x] T024 [US4] Verify debug border functionality works in app/page.tsx
- [x] T025 [US4] Test F3 visibility toggle works correctly
- [x] T026 [US4] Test F5 mode toggle works correctly
- [x] T027 [US4] Test target window attachment positioning works correctly
- [x] T028 [US4] Test click-through mode in fullscreen works correctly
- [x] T029 [US4] Test error modal appears and auto-dismisses correctly
- [x] T030 [US4] Run npm run build and verify static export generates out/ directory
- [x] T031 [US4] Run npm run tauri:dev and verify Tauri app launches with Next.js frontend

**Checkpoint**: All existing functionality works identically after Next.js migration

---

## Phase 4: User Story 1 - Smooth App Show/Hide Transitions (Priority: P1)

**Goal**: Add smooth fade-in/fade-out animations when toggling overlay visibility with F3

**Independent Test**: Press F3 to toggle visibility and observe smooth fade animation (300ms duration)

### Implementation for User Story 1

- [x] T032 [US1] Import motion and AnimatePresence from "motion/react" in src/components/HeaderPanel.tsx
- [x] T033 [US1] Import useReducedMotion hook in src/components/HeaderPanel.tsx
- [x] T034 [US1] Wrap HeaderPanel content with AnimatePresence in src/components/HeaderPanel.tsx
- [x] T035 [US1] Convert HeaderPanel inner content to motion.div with fade animation props in src/components/HeaderPanel.tsx
- [x] T036 [US1] Add initial={{ opacity: 0 }} for fade-in start state in src/components/HeaderPanel.tsx
- [x] T037 [US1] Add animate={{ opacity: 1 }} for visible state in src/components/HeaderPanel.tsx
- [x] T038 [US1] Add exit={{ opacity: 0 }} for fade-out end state in src/components/HeaderPanel.tsx
- [x] T039 [US1] Add transition={{ duration: 0.3, ease: "easeOut" }} in src/components/HeaderPanel.tsx
- [x] T040 [US1] Implement useReducedMotion fallback (duration: 0 when reduced motion) in src/components/HeaderPanel.tsx
- [x] T041 [US1] Add unique key prop to motion component for AnimatePresence tracking in src/components/HeaderPanel.tsx
- [x] T042 [US1] Test fade-in animation when pressing F3 to show overlay
- [x] T043 [US1] Test fade-out animation when pressing F3 to hide overlay
- [x] T044 [US1] Test rapid F3 toggling handles animation interruption gracefully

**Checkpoint**: Show/hide transitions animate smoothly with 300ms fade

---

## Phase 5: User Story 2 - Smooth Opacity Mode Transitions (Priority: P2)

**Goal**: Add smooth opacity animation when toggling between fullscreen (60%) and windowed (100%) modes with F5

**Independent Test**: Press F5 to toggle mode and observe smooth opacity transition (250ms duration)

### Implementation for User Story 2

- [x] T045 [US2] Update HeaderPanel to use motion.div for opacity animation in src/components/HeaderPanel.tsx
- [x] T046 [US2] Add animate={{ opacity: mode === "fullscreen" ? 0.6 : 1 }} for mode-based opacity in src/components/HeaderPanel.tsx
- [x] T047 [US2] Add transition={{ duration: 0.25, ease: "easeOut" }} for opacity changes in src/components/HeaderPanel.tsx
- [x] T048 [US2] Ensure opacity animation works independently of show/hide animation in src/components/HeaderPanel.tsx
- [x] T049 [US2] Update useReducedMotion to also affect opacity transition duration in src/components/HeaderPanel.tsx
- [x] T050 [US2] Remove CSS-based opacity class switching (header-click-through, header-interactive) in src/components/HeaderPanel.tsx
- [x] T051 [US2] Test opacity animates from 100% to 60% when pressing F5 (windowed → fullscreen)
- [x] T052 [US2] Test opacity animates from 60% to 100% when pressing F5 (fullscreen → windowed)
- [x] T053 [US2] Test rapid F5 toggling handles animation interruption gracefully

**Checkpoint**: Mode opacity transitions animate smoothly with 250ms duration

---

## Phase 6: User Story 3 - Error Modal Animation (Priority: P3)

**Goal**: Add smooth entrance and exit animations to the error modal

**Independent Test**: Trigger error condition and observe modal animates in; dismiss and observe modal animates out

### Implementation for User Story 3

- [x] T054 [US3] Import motion and AnimatePresence from "motion/react" in src/components/ErrorModal.tsx
- [x] T055 [US3] Import useReducedMotion hook in src/components/ErrorModal.tsx
- [x] T056 [US3] Wrap ErrorModal content with AnimatePresence in src/components/ErrorModal.tsx
- [x] T057 [US3] Convert ErrorModal outer div to motion.div in src/components/ErrorModal.tsx
- [x] T058 [US3] Add initial={{ opacity: 0, scale: 0.95 }} for entrance start state in src/components/ErrorModal.tsx
- [x] T059 [US3] Add animate={{ opacity: 1, scale: 1 }} for visible state in src/components/ErrorModal.tsx
- [x] T060 [US3] Add exit={{ opacity: 0, scale: 0.95 }} for exit end state in src/components/ErrorModal.tsx
- [x] T061 [US3] Add transition={{ duration: 0.2, ease: "easeOut" }} in src/components/ErrorModal.tsx
- [x] T062 [US3] Implement useReducedMotion fallback in src/components/ErrorModal.tsx
- [x] T063 [US3] Add unique key prop to motion component in src/components/ErrorModal.tsx
- [x] T064 [US3] Test modal entrance animation when error occurs
- [x] T065 [US3] Test modal exit animation when dismiss button clicked
- [x] T066 [US3] Test modal exit animation when auto-dismiss timer expires

**Checkpoint**: Error modal animates smoothly on entrance and exit

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T067 Clean up unused Vite-related files and imports
- [x] T068 [P] Update src/styles/globals.css to remove Vite-specific styles if any
- [x] T069 [P] Verify all TypeScript types compile without errors
- [x] T070 Run full application test: F3, F5, error modal, target attachment
- [x] T071 Verify bundle size increase is under 150KB (check out/ directory size)
- [x] T072 Verify startup time remains under 500ms
- [x] T073 Test application with system reduced motion preference enabled
- [x] T074 Run npm run tauri:build and verify production build succeeds
- [x] T075 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 4 (Phase 3)**: Depends on Foundational - framework migration
- **User Story 1 (Phase 4)**: Depends on US4 completion (needs working Next.js app)
- **User Story 2 (Phase 5)**: Depends on US1 completion (builds on motion setup)
- **User Story 3 (Phase 6)**: Depends on Foundational - can run parallel to US1/US2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US4 - Migration) ← MVP CHECKPOINT
    ↓
Phase 4 (US1 - Show/Hide) ←┐
    ↓                      │
Phase 5 (US2 - Opacity)    │ Phase 6 (US3 - Modal) can start after Phase 2
    ↓                      │
Phase 7 (Polish) ←─────────┘
```

### Within Each User Story

- Update imports before implementation
- Implement animation props incrementally
- Test each animation behavior before moving on

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003, T004, T005 can run in parallel (different config files)
```

**Phase 2 (Foundational)**:
```
T011, T012, T013 can run in parallel (moving different directories)
```

**After Phase 2 completes**:
```
US3 (Error Modal) can be developed in parallel with US1/US2
by a different developer since it touches different files
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch these tasks in parallel:
Task: "Create next.config.mjs with static export configuration at project root"
Task: "Update package.json scripts for Next.js (dev, build, tauri:dev, tauri:build)"
Task: "Update tsconfig.json for Next.js App Router paths and configuration"
```

## Parallel Example: US1 and US3

```bash
# After Phase 2 completes, these can run in parallel (different files):
# Developer A:
Task: "Import motion and AnimatePresence from motion/react in src/components/HeaderPanel.tsx"

# Developer B:
Task: "Import motion and AnimatePresence from motion/react in src/components/ErrorModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 4 (Framework Migration)
4. **STOP and VALIDATE**: All existing functionality works after migration
5. Deploy/demo if ready - this is a working migration without animations

### Incremental Delivery

1. Setup + Foundational → Next.js infrastructure ready
2. Add US4 → Test migration → **MVP Ready!**
3. Add US1 → Test show/hide animations → Demo smooth transitions
4. Add US2 → Test opacity animations → Demo mode switching
5. Add US3 → Test modal animations → Complete feature
6. Polish → Final validation → Ship it

### Single Developer Strategy

Execute phases sequentially in order:
1. Phase 1 → Phase 2 → Phase 3 (MVP)
2. Phase 4 → Phase 5 → Phase 6
3. Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US4 (Migration) is the foundation - must work before animations
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Motion handles animation interruptions automatically - no extra code needed
