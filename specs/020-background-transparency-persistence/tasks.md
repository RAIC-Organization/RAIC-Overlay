# Tasks: Background Transparency Persistence Fix

**Input**: Design documents from `/specs/020-background-transparency-persistence/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: No automated tests explicitly requested. Manual verification steps included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Summary

This is a minimal bug fix:
- **1 file changed**: `src/contexts/PersistenceContext.tsx`
- **1 line modified**: The `onWindowMoved` callback
- **Total tasks**: 5

---

## Phase 1: Setup

**Purpose**: No setup needed - this is a bug fix in an existing codebase

*No tasks in this phase.*

---

## Phase 2: Foundational

**Purpose**: No foundational work needed - all infrastructure exists

*No tasks in this phase.*

---

## Phase 3: User Story 1 - Persist Background Transparency Setting (Priority: P1) MVP

**Goal**: Fix the stale closure bug so `backgroundTransparent` is correctly persisted to state.json when the toggle is clicked.

**Independent Test**: Toggle a window background to transparent, wait 1 second, check state.json for `"backgroundTransparent": true`, restart app and verify window restores with transparent background.

### Implementation for User Story 1

- [X] T001 [US1] Modify onWindowMoved callback in src/contexts/PersistenceContext.tsx to use getStateForPersistence() instead of stale windows closure
- [X] T002 [US1] Verify opacity slider still persists correctly after fix in src/contexts/PersistenceContext.tsx (manual test)

**Checkpoint**: Background transparency toggle now persists to state.json. Window restores with correct transparency mode after restart.

---

## Phase 4: User Story 2 - Immediate Persistence on Toggle (Priority: P2)

**Goal**: Ensure concurrent state updates (opacity + background toggle in quick succession) both persist correctly.

**Independent Test**: Toggle background transparency and adjust opacity slider rapidly, wait 1 second, verify state.json contains correct values for both `opacity` and `backgroundTransparent`.

### Implementation for User Story 2

- [X] T003 [US2] Test concurrent opacity and background toggle updates persist correctly (manual test - no code change needed, covered by T001 fix)

**Checkpoint**: Both opacity and backgroundTransparent persist correctly even when changed in quick succession.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T004 Validate fix using quickstart.md manual test steps
- [X] T005 Run existing tests to verify no regression: npm test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty - no dependencies
- **Foundational (Phase 2)**: Empty - no dependencies
- **User Story 1 (Phase 3)**: No dependencies - can start immediately
- **User Story 2 (Phase 4)**: Covered by US1 fix - just verification
- **Polish (Phase 5)**: Depends on US1 completion

### Task Dependencies

```text
T001 (core fix)
  └── T002 (verify opacity not regressed)
  └── T003 (verify concurrent updates)
  └── T004 (quickstart validation)
  └── T005 (run tests)
```

### Parallel Opportunities

All verification tasks (T002, T003, T004, T005) can run in parallel after T001 is complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (the actual fix)
2. Complete T002 (verify no regression)
3. **STOP and VALIDATE**: Test manually per quickstart.md
4. If passing, merge to main

### Time Estimate

- T001: ~5 minutes (1-line code change + dependency array update)
- T002-T005: ~10 minutes (manual verification)
- **Total**: ~15 minutes

---

## The Fix (Reference)

**File**: `src/contexts/PersistenceContext.tsx`

**Before** (lines 170-172):
```typescript
const onWindowMoved = useCallback(() => {
  saveStateDebounced(windows);
}, [windows, saveStateDebounced]);
```

**After**:
```typescript
const onWindowMoved = useCallback(() => {
  const currentState = getStateForPersistence();
  saveStateDebounced(currentState.windows);
}, [getStateForPersistence, saveStateDebounced]);
```

---

## Notes

- This is a minimal 1-line fix (plus dependency array update)
- No new files created
- No new dependencies
- Uses existing `getStateForPersistence()` function from WindowsContext
- Fixes the root cause (stale closure) rather than working around it
