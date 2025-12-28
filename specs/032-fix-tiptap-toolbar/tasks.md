# Tasks: Fix TipTap Notes Toolbar

**Input**: Design documents from `/specs/032-fix-tiptap-toolbar/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested - this is a CSS-only fix with manual visual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web (Tauri desktop app with React/Next.js frontend)
- **Paths**: `src/` for source, `app/` for Next.js app directory

---

## Phase 1: Setup (Create Styling Infrastructure)

**Purpose**: Create the TipTap CSS file and import structure

- [x] T001 Create TipTap styles file at src/styles/tiptap.css with base editor styling (focus outline, paragraph spacing)
- [x] T002 Import tiptap.css in app/globals.css after existing imports

---

## Phase 2: User Story 1 & 2 - Heading and Bullet List Styling (Priority: P1) 🎯 MVP

**Goal**: Make H1/H2/H3 headings and bullet lists visually distinct when formatting is applied

**Independent Test**: Open Notes window, type text, click H1 button - text should become larger. Click bullet list - bullet marker should appear.

### Implementation for User Stories 1 & 2 (Combined - Same CSS File)

- [ ] T003 [US1] Add heading styles (.tiptap h1, .tiptap h2, .tiptap h3) with distinct font sizes in src/styles/tiptap.css
- [ ] T004 [US2] Add bullet list styles (.tiptap ul, .tiptap li) with disc markers and indentation in src/styles/tiptap.css
- [ ] T005 [US1] Add first-child margin resets for headings in src/styles/tiptap.css

**Checkpoint**: After T005, headings and bullet lists should be visually functional

---

## Phase 3: User Story 3 - Numbered List Styling (Priority: P2)

**Goal**: Make ordered/numbered lists display visible numbers with proper styling

**Independent Test**: Open Notes window, type text, click ordered list button - "1." should appear before text.

### Implementation for User Story 3

- [ ] T006 [US3] Add ordered list styles (.tiptap ol) with decimal markers and indentation in src/styles/tiptap.css
- [ ] T007 [US3] Add nested list styles for multi-level lists in src/styles/tiptap.css

**Checkpoint**: After T007, all list types should be visually functional

---

## Phase 4: User Story 4 - Visual Feedback Verification (Priority: P3)

**Goal**: Verify toolbar buttons show active state when cursor is in formatted text

**Independent Test**: Place cursor inside H1 text - H1 toolbar button should appear highlighted.

### Verification for User Story 4

- [ ] T008 [US4] **VERIFY** toolbar active states work correctly - place cursor in heading/list and confirm button highlights (existing data-active attribute implementation)

**Note**: This story verifies existing functionality. The toolbar already has `data-active={editor.isActive(...)}` attributes - CSS styling fix should make the active state visible. If not working, investigate NotesToolbar.tsx.

---

## Phase 5: Polish & Cleanup

**Purpose**: Remove unused code and verify full functionality

- [ ] T009 [P] Remove unused `prose` classes from EditorContent in src/components/windows/NotesContent.tsx (line 58)
- [ ] T010 Run quickstart.md validation - verify all acceptance scenarios pass
- [ ] T011 Test persistence - close and reopen Notes window, verify formatted content is restored

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Stories 1 & 2 (Phase 2)**: Depends on Phase 1 completion
- **User Story 3 (Phase 3)**: Depends on Phase 2 completion (same file)
- **User Story 4 (Phase 4)**: Depends on Phase 3 completion
- **Polish (Phase 5)**: Depends on Phase 4 completion

### Task Dependencies

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 (parallel with T010, T011)
```

### Parallel Opportunities

- T009, T010, T011 can run in parallel (different concerns)
- Note: Most tasks edit the same CSS file, so parallelization within phases is limited

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Heading + Bullet List Styling (T003-T005)
3. **STOP and VALIDATE**: Test headings and bullet lists work
4. Proceed to ordered lists if MVP validated

### Quick Fix Path

For fastest resolution:
1. T001: Create tiptap.css with ALL styles (headings, bullets, ordered lists)
2. T002: Import in globals.css
3. T009: Clean up NotesContent.tsx
4. T010-T011: Validate

This collapses the task list for a straightforward CSS fix.

---

## Notes

- This is a CSS-only fix - no JavaScript/TypeScript logic changes required
- The TipTap commands are already working correctly (verified during research)
- Use CSS variables from existing theme for color consistency (hsl(var(--foreground)))
- All styles MUST be scoped under `.tiptap` selector to avoid conflicts
- Manual visual verification is sufficient for this fix (no automated tests needed)
