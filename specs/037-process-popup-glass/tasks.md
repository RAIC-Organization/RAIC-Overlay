# Tasks: Process Not Found Popup Liquid Glass Style

**Input**: Design documents from `/specs/037-process-popup-glass/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md, contracts/

**Tests**: Visual testing only (manual screenshot comparison) - no automated test tasks included as per feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `app/` at repository root
- Target file: `src/components/ErrorModal.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and prepare for implementation

- [x] T001 Verify existing CSS utilities are in place (`sc-corner-accents`, `sc-glow-transition` in `src/styles/sc-theme.css`)
- [x] T002 Verify liquid glass styles exist in `app/globals.css` (`.liquid-glass-text` class)
- [x] T003 Verify Orbitron font is configured via `font-display` class in `app/globals.css`
- [x] T004 Read current ErrorModal implementation in `src/components/ErrorModal.tsx` to understand existing structure

**Checkpoint**: Prerequisites verified - component modification can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required - this feature modifies a single existing component with no new infrastructure needed

**Note**: Skip to User Story 1 - no foundational work required for this refactor.

---

## Phase 3: User Story 1 - View Liquid Glass Error Popup (Priority: P1) MVP

**Goal**: Restyle the ErrorModal with window header structure, SC theme border with corner accents, and liquid glass background effect

**Independent Test**: Press F3 when Star Citizen is not running. Verify the error popup displays with: (1) window header containing title and X close button, (2) SC theme border with corner accents and blue glow, (3) frosted glass background effect, (4) Orbitron typography.

### Implementation for User Story 1

- [x] T005 [US1] Update imports in `src/components/ErrorModal.tsx`: add `X` from lucide-react, remove `Card` from ui/card
- [x] T006 [US1] Update JSDoc header in `src/components/ErrorModal.tsx` with feature 037 attribution
- [x] T007 [US1] Replace Card container with SC-themed container in `src/components/ErrorModal.tsx`: apply `border border-border rounded-lg sc-glow-transition sc-corner-accents shadow-glow-sm bg-background/80 backdrop-blur-xl overflow-hidden`
- [x] T008 [US1] Add window header structure in `src/components/ErrorModal.tsx`: flex container with title on left and X close button on right
- [x] T009 [US1] Style header title in `src/components/ErrorModal.tsx`: apply `font-display text-sm font-medium uppercase tracking-wide truncate`
- [x] T010 [US1] Implement X close button in `src/components/ErrorModal.tsx`: apply `p-1 rounded sc-glow-transition hover:bg-muted/50 hover:shadow-glow-sm cursor-pointer` with onClick={onDismiss}
- [x] T011 [US1] Remove old "Dismiss" button from content area in `src/components/ErrorModal.tsx`
- [x] T012 [US1] Restructure content area in `src/components/ErrorModal.tsx`: move icon, message, and countdown below header in p-6 container

**Checkpoint**: User Story 1 complete - modal has window structure with SC theme border and glass effect

---

## Phase 4: User Story 2 - Readable Error Messages (Priority: P2)

**Goal**: Ensure all text (icon, message, countdown) remains readable against the liquid glass background with proper contrast and typography

**Independent Test**: Trigger error popup and verify: (1) warning icon has blue glow effect, (2) message text is clearly readable, (3) countdown text is visible, (4) all text uses Orbitron font.

### Implementation for User Story 2

- [x] T013 [US2] Style warning icon in `src/components/ErrorModal.tsx`: change from red (`text-destructive`) to blue with glow filter (`color: rgba(59, 130, 246, 0.9)`, `filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))`)
- [x] T014 [US2] Update icon container background in `src/components/ErrorModal.tsx`: change from `bg-destructive/10` to `bg-blue-500/10`
- [x] T015 [US2] Apply Orbitron font to message text in `src/components/ErrorModal.tsx`: add `font-display` class to message paragraph
- [x] T016 [US2] Apply Orbitron font to countdown text in `src/components/ErrorModal.tsx`: add `font-display` class to countdown paragraph
- [x] T017 [US2] Verify text contrast in `src/components/ErrorModal.tsx`: ensure `text-muted-foreground` provides sufficient contrast against glass background

**Checkpoint**: User Story 2 complete - all text is readable with proper styling and blue-themed icon

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and accessibility compliance

- [x] T018 Verify ARIA attributes are preserved in `src/components/ErrorModal.tsx`: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- [x] T019 Add `aria-label="Close"` to X button in `src/components/ErrorModal.tsx` if not already present
- [x] T020 Visual validation: Run `npm run tauri dev`, press F3 when SC is not running, capture screenshot for comparison
- [x] T021 Verify entrance/exit animations still work smoothly in `src/components/ErrorModal.tsx`
- [x] T022 Verify X button dismisses modal correctly
- [x] T023 Verify auto-dismiss timer and countdown still function
- [x] T024 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: Skipped - no foundational work needed
- **User Story 1 (Phase 3)**: Can start after Setup verification
- **User Story 2 (Phase 4)**: Can start after User Story 1 (same file, sequential edits)
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - core structure change
- **User Story 2 (P2)**: Depends on US1 completion (styling applied to structure created in US1)

### Within Each User Story

- T005-T006: Imports and JSDoc (no dependencies within story)
- T007-T010: Container and header structure (sequential, same file section)
- T011-T012: Content restructure (depends on header being in place)
- T013-T017: Text and icon styling (sequential within content area)

### Parallel Opportunities

This feature has **limited parallelism** because:
- All tasks modify the same file (`src/components/ErrorModal.tsx`)
- Changes are sequential within the component structure
- User Story 2 builds on User Story 1's structure

However, if desired:
- T005 and T006 can be done in parallel (different sections of file)
- Polish tasks T018-T019 can be done in parallel with T020-T023

---

## Parallel Example: Setup Phase

```bash
# These can be verified in parallel:
Task: "Verify existing CSS utilities in src/styles/sc-theme.css"
Task: "Verify liquid glass styles in app/globals.css"
Task: "Verify Orbitron font configuration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 3: User Story 1 (window structure + SC theme + glass effect)
3. **STOP and VALIDATE**: Press F3, verify visual appearance matches overlay windows
4. Deploy/demo if ready - feature delivers value with just US1

### Incremental Delivery

1. Complete Setup → Verified prerequisites
2. Add User Story 1 → Test visually → Modal has window structure (MVP!)
3. Add User Story 2 → Test visually → Icon and text properly styled
4. Polish → Full validation → Feature complete

### Single Developer Strategy

1. Complete tasks sequentially within each phase
2. Commit after each user story completion
3. Total estimated tasks: 24
4. Primary file: `src/components/ErrorModal.tsx`

---

## Notes

- All tasks modify `src/components/ErrorModal.tsx` - avoid conflicts by working sequentially
- Visual testing via manual inspection (no automated tests)
- Accessibility preserved through existing ARIA attributes
- No new dependencies required - uses existing CSS utilities
- Commit after T012 (US1 complete) and T017 (US2 complete) for logical checkpoints
