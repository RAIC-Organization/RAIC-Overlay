# Tasks: Ko-fi Button Replacement

**Input**: Design documents from `/specs/056-kofi-button/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: No automated tests - manual functional testing specified in plan.md

**Organization**: This is a minimal single-story feature with only 3 tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Single file modification**: `src/components/settings/SettingsPanel.tsx`

---

## Phase 1: Setup

**Purpose**: No setup required - existing infrastructure is sufficient

> No tasks in this phase. The project is already set up with all required dependencies (@tauri-apps/plugin-opener).

---

## Phase 2: Foundational

**Purpose**: No foundational work required

> No tasks in this phase. This feature modifies only a single existing component.

---

## Phase 3: User Story 1 - Support Developer via Ko-fi (Priority: P1) 🎯 MVP

**Goal**: Replace the Buy Me A Coffee button with a Ko-fi button that opens https://ko-fi.com/Y8Y01QVRYF when clicked.

**Independent Test**: Click the Ko-fi button in the settings panel and verify it opens the correct Ko-fi page in the system default browser.

### Implementation for User Story 1

- [x] T001 [US1] Rename `handleOpenBuyMeCoffee` to `handleOpenKofi` and update URL to `https://ko-fi.com/Y8Y01QVRYF` in `src/components/settings/SettingsPanel.tsx`
- [x] T002 [US1] Update button JSX: change image src to `https://storage.ko-fi.com/cdn/kofi3.png?v=6`, alt text to "Buy Me a Coffee at ko-fi.com", height to 36px, and onClick to `handleOpenKofi` in `src/components/settings/SettingsPanel.tsx`
- [x] T003 [US1] Update task reference comment from T053 to T056 in `src/components/settings/SettingsPanel.tsx`

**Checkpoint**: Ko-fi button fully functional - clicking opens https://ko-fi.com/Y8Y01QVRYF in default browser

---

## Phase 4: Polish & Verification

**Purpose**: Final verification

- [x] T004 Run `npm run tauri dev` and verify Ko-fi button displays correctly in settings panel footer
- [x] T005 Click Ko-fi button and verify it opens correct URL in default browser
- [x] T006 Verify hover opacity effect works on the Ko-fi button

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - no setup required
- **Foundational (Phase 2)**: N/A - no foundational work
- **User Story 1 (Phase 3)**: Can start immediately
- **Polish (Phase 4)**: Depends on Phase 3 completion

### Task Dependencies

- **T001**: No dependencies - can start immediately
- **T002**: Depends on T001 (uses renamed handler function)
- **T003**: Can run in parallel with T002 after T001
- **T004-T006**: Depend on T001-T003 completion

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 completes (though they modify the same file, they affect different lines)

---

## Parallel Example: User Story 1

```bash
# Sequential execution (recommended due to same file):
T001 → T002 → T003 → T004 → T005 → T006
```

---

## Implementation Strategy

### MVP (This Feature)

1. Complete T001: Rename handler and update URL
2. Complete T002: Update button JSX
3. Complete T003: Update comment
4. **VALIDATE**: Run T004-T006 verification steps
5. Done - feature complete

### Time Estimate

This is a ~5 minute implementation task with 3 code changes to a single file.

---

## Notes

- All tasks modify `src/components/settings/SettingsPanel.tsx`
- No new dependencies required
- No new files required
- Existing hover styling preserved
- Error handling pattern matches existing implementation
