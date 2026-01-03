# Tasks: Disable Text Selection

**Input**: Design documents from `/specs/057-disable-text-select/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested in specification. Manual visual verification will be performed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Primary file**: `app/globals.css`
- This is a CSS-only feature - minimal file changes required

---

## Phase 1: Setup

**Purpose**: Not applicable - no project initialization needed for CSS-only feature

**Note**: This feature modifies an existing codebase; no setup required.

**Checkpoint**: Proceed directly to implementation

---

## Phase 2: Foundational

**Purpose**: Not applicable - no foundational infrastructure needed

**Note**: Global CSS already exists in `app/globals.css`; this feature adds to it.

**Checkpoint**: Proceed directly to user story implementation

---

## Phase 3: User Story 1 - Native Desktop Experience (Priority: P1) 🎯 MVP

**Goal**: Prevent text selection on all UI chrome elements (headers, buttons, labels, menu items) to match native Windows application behavior

**Independent Test**: Attempt to click-and-drag on any window header, button, or label; verify no text selection cursor appears and no text gets highlighted

### Implementation for User Story 1

- [X] T001 [US1] Add `user-select: none` to body rule in `app/globals.css`

**Checkpoint**: At this point, all UI chrome should prevent text selection. Test by:
1. Click and drag on window header text → no selection
2. Click and drag on button labels → no selection
3. Double-click on menu items → no selection

---

## Phase 4: User Story 2 - Content Area Selectability (Priority: P2)

**Goal**: Preserve text selection capability in content areas (Notes editor, input fields) while maintaining the global disable

**Independent Test**: Open Notes window, type text, successfully select and copy that text

### Implementation for User Story 2

- [X] T002 [US2] Add content area opt-in CSS rule for `.tiptap, input, textarea, [contenteditable="true"]` in `app/globals.css`

**Checkpoint**: At this point, text selection should work in:
1. Notes TipTap editor → selection works
2. Browser URL input field → selection works
3. Settings input fields → selection works

---

## Phase 5: Polish & Verification

**Purpose**: Final verification across all window types

- [X] T003 Manual verification: Test all UI chrome elements prevent selection (window headers, buttons, labels, menu items, settings labels)
- [X] T004 Manual verification: Test all content areas allow selection (Notes editor, Browser URL, settings inputs)
- [X] T005 Manual verification: Verify normal interactions still work (clicking buttons, dragging windows, context menus)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Skipped - not needed
- **Phase 2 (Foundational)**: Skipped - not needed
- **Phase 3 (User Story 1)**: Can start immediately
- **Phase 4 (User Story 2)**: Depends on T001 completion (must have global disable before opt-in)
- **Phase 5 (Polish)**: Depends on T001 and T002 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately
- **User Story 2 (P2)**: Depends on User Story 1 (opt-in requires global disable to be in place)

### Parallel Opportunities

- T001 and T002 could technically be combined into a single edit, but are separated for clarity and independent validation
- T003, T004, T005 verification tasks can run in parallel once implementation is complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Add `user-select: none` to body
2. **STOP and VALIDATE**: Test that UI chrome prevents selection
3. If validation passes, proceed to User Story 2

### Incremental Delivery

1. T001 → Validate UI chrome (MVP complete!)
2. T002 → Validate content areas
3. T003-T005 → Full verification

### Estimated Implementation Time

- T001: ~2 minutes
- T002: ~2 minutes
- T003-T005: ~5 minutes manual testing
- **Total**: ~10 minutes

---

## CSS Code Reference

### T001 - Global Disable (User Story 1)

Add to existing `body` rule in `app/globals.css`:

```css
body {
  /* existing rules */
  user-select: none;
}
```

### T002 - Content Opt-in (User Story 2)

Add new rule block after body rules in `app/globals.css`:

```css
/* Content areas where text selection should be allowed */
.tiptap,
input,
textarea,
[contenteditable="true"] {
  user-select: text;
}
```

---

## Notes

- This is the simplest possible implementation: 2 CSS rules, 1 file change
- No JavaScript or component changes required
- Excalidraw uses canvas rendering and is unaffected by CSS `user-select`
- All verification is manual (no automated tests needed for CSS-only change)
- Rollback: Simply remove the two CSS additions if issues occur
