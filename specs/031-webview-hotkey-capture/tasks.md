# Tasks: Webview Hotkey Capture

**Input**: Design documents from `/specs/031-webview-hotkey-capture/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Manual testing only (per specification). No automated tests requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Frontend**: `app/`, `src/` at repository root
- **Backend**: `src-tauri/src/` (unchanged for this feature)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and prepare for implementation

- [X] T001 Verify existing backend commands `toggle_visibility` and `toggle_mode` work correctly in `src-tauri/src/lib.rs`
- [X] T002 Verify existing logger utilities are available in `src/lib/logger.ts`
- [X] T003 Verify existing type definitions in `src/types/overlay.ts` and `src/types/ipc.ts`

**Checkpoint**: Existing infrastructure verified - implementation can begin

---

## Phase 2: User Story 1 & 2 - F3/F5 Hotkey Capture (Priority: P1) 🎯 MVP

**Goal**: Enable F3 (visibility) and F5 (mode) hotkeys to work when webview is focused in interactive mode

**Note**: US1 (F3) and US2 (F5) are implemented together in a single hook as they share identical logic patterns. US3 (debouncing) is built into this implementation.

**Independent Test**:
- Focus any interactive element (Notes editor, Browser, Draw canvas)
- Press F3 → Overlay should hide
- Press F5 → Mode should toggle (NOT refresh page)

### Implementation

- [X] T004 [US1] [US2] Create `useHotkeyCapture` hook skeleton with TypeScript types in `src/hooks/useHotkeyCapture.ts`
- [X] T005 [US1] [US2] Implement document-level keydown event listener with useEffect cleanup in `src/hooks/useHotkeyCapture.ts`
- [X] T006 [US1] [US2] Add F3/F5 key detection with `e.key` comparison in `src/hooks/useHotkeyCapture.ts`
- [X] T007 [US1] [US2] Implement `e.preventDefault()` and `e.stopPropagation()` for F3/F5 keys in `src/hooks/useHotkeyCapture.ts`
- [X] T008 [US3] Implement timestamp-based 200ms debouncing with `useRef` for F3 in `src/hooks/useHotkeyCapture.ts`
- [X] T009 [US3] Implement timestamp-based 200ms debouncing with `useRef` for F5 in `src/hooks/useHotkeyCapture.ts`
- [X] T010 [US1] Add F3 handler that invokes `toggle_visibility` backend command in `src/hooks/useHotkeyCapture.ts`
- [X] T011 [US2] Add F5 handler that invokes `toggle_mode` backend command in `src/hooks/useHotkeyCapture.ts`
- [X] T012 [US1] [US2] Add logging with source indication "(webview capture)" using `src/lib/logger.ts` in `src/hooks/useHotkeyCapture.ts`
- [X] T013 [US3] Add debug logging for debounced key presses showing elapsed time in `src/hooks/useHotkeyCapture.ts`
- [X] T014 [US1] [US2] Add `enabled` parameter to conditionally activate hook (only in interactive mode) in `src/hooks/useHotkeyCapture.ts`
- [X] T015 [US1] [US2] Integrate `useHotkeyCapture` hook into `app/page.tsx` with `state.mode === 'windowed'` condition

**Checkpoint**: F3/F5 hotkeys work when webview is focused. Debouncing prevents rapid toggling.

---

## Phase 3: Polish & Validation

**Purpose**: Verify all acceptance scenarios and ensure no regressions

- [ ] T016 Manual test: F3 in Notes window (focus editor, press F3, overlay hides)
- [ ] T017 Manual test: F3 in Browser window (focus webview, press F3, overlay hides, no refresh)
- [ ] T018 Manual test: F5 in Draw window (focus canvas, press F5, mode toggles)
- [ ] T019 Manual test: F5 in main menu (focus menu, press F5, mode toggles, no page refresh)
- [ ] T020 Manual test: Debounce verification (rapidly press F3 5x in 0.5s, expect 2-3 toggles max)
- [ ] T021 Manual test: Non-interference with low-level hook (1. Click outside webview on desktop, 2. Press F3 - verify overlay toggles AND backend logs show "keyboard_hook" source, 3. Press F5 - verify mode toggles AND backend logs show "keyboard_hook" source, 4. Confirm NO "webview capture" logs appear for these presses)
- [ ] T022 Verify debug logs show source indication per SC-006
- [ ] T023 Code review: Verify hook follows React best practices from research.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **US1+US2+US3 (Phase 2)**: Depends on Setup verification
- **Polish (Phase 3)**: Depends on Phase 2 completion

### Task Dependencies Within Phase 2

```
T004 (skeleton)
  └── T005 (event listener)
        ├── T006 (key detection)
        │     └── T007 (preventDefault)
        │           ├── T008 (F3 debounce)
        │           │     └── T010 (F3 handler)
        │           └── T009 (F5 debounce)
        │                 └── T011 (F5 handler)
        ├── T012 (logging)
        └── T013 (debug logging)
              └── T014 (enabled param)
                    └── T015 (integration)
```

### User Story Mapping

| Task | US1 (F3 Visibility) | US2 (F5 Mode) | US3 (Debounce) |
|------|---------------------|---------------|----------------|
| T004 | ✓ | ✓ | |
| T005 | ✓ | ✓ | |
| T006 | ✓ | ✓ | |
| T007 | ✓ | ✓ | |
| T008 | | | ✓ |
| T009 | | | ✓ |
| T010 | ✓ | | |
| T011 | | ✓ | |
| T012 | ✓ | ✓ | |
| T013 | | | ✓ |
| T014 | ✓ | ✓ | |
| T015 | ✓ | ✓ | |

---

## Parallel Opportunities

Due to the single-file nature of this feature, parallelization is limited:

```bash
# Phase 1: All verification tasks can run in parallel
Task: T001 (verify backend commands)
Task: T002 (verify logger)
Task: T003 (verify types)

# Phase 3: All manual tests can run in parallel (different windows)
Task: T016 (Notes test)
Task: T017 (Browser test)
Task: T018 (Draw test)
Task: T019 (Menu test)
```

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Implement useHotkeyCapture hook (T004-T015)
3. **STOP and VALIDATE**: Run manual tests T016-T021
4. If all pass → Feature complete

### Single Developer Flow

This is a focused feature that can be completed in one session:
1. Verify infrastructure exists (Phase 1)
2. Create hook file, implement all logic (T004-T014)
3. Integrate into page.tsx (T015)
4. Run all manual tests (T016-T021)
5. Review and finalize (T22-T23)

---

## Notes

- All US1/US2/US3 tasks are in the SAME file (`src/hooks/useHotkeyCapture.ts`)
- No backend changes required - reusing existing commands
- Debouncing (US3) is integral to the core implementation, not a separate concern
- Manual testing is the primary validation method (per spec)
- Single hook handles both F3 and F5 with identical patterns
- The `enabled` parameter allows the hook to be disabled in click-through mode
