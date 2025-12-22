# Tasks: Orbitron Font Integration

**Input**: Design documents from `/specs/021-orbitron-font/`
**Prerequisites**: plan.md (completed), spec.md (completed), research.md (completed), quickstart.md (completed)

**Tests**: Visual verification only - no automated tests required per spec (visual rendering confirmation).

**Organization**: Tasks organized by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `app/` (Next.js), `src/components/` (React components)
- Paths based on existing project structure per plan.md

---

## Phase 1: Setup (Font Configuration)

**Purpose**: Configure Orbitron font loading with next/font/google

- [x] T001 Import Orbitron font from next/font/google and configure with CSS variable in `app/layout.tsx`
- [x] T002 Add Orbitron CSS variable class to html element in `app/layout.tsx`

---

## Phase 2: Foundational (Tailwind Integration)

**Purpose**: Enable font-display utility class for use throughout the application

**⚠️ CRITICAL**: User story implementation cannot begin until Tailwind integration is complete

- [x] T003 Add `--font-display` theme variable to `@theme inline` block in `app/globals.css`

**Checkpoint**: Font utility `font-display` is now available for use in components

---

## Phase 3: User Story 1 - Visual Branding Consistency (Priority: P1) 🎯 MVP

**Goal**: Apply Orbitron font to all UI chrome elements (window titles, menu buttons, headers)

**Independent Test**: Launch application, verify Orbitron font displays on window titles, menu buttons, and headers. Font should render clearly at sizes 14px-48px.

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `font-display` class to window title in `src/components/windows/WindowHeader.tsx`
- [x] T005 [P] [US1] Add `font-display` class to button base styles in `src/components/ui/button.tsx`
- [x] T006 [US1] Verify font renders correctly across all window types (Notes, Draw, Browser, FileViewer)
- [x] T007 [US1] Visual verification: Run `npm run dev` and confirm Orbitron appears on all UI chrome elements

**Checkpoint**: User Story 1 complete - All UI chrome displays Orbitron font. MVP is functional.

---

## Phase 4: User Story 2 - Graceful Font Fallback (Priority: P2)

**Goal**: Ensure fallback fonts display correctly when Orbitron is unavailable

**Independent Test**: Temporarily disable Orbitron loading, verify text remains legible with system sans-serif fallback.

### Implementation for User Story 2

- [x] T008 [US2] Verify fallback font stack includes system sans-serif in `app/globals.css` (`--font-display` definition)
- [x] T009 [US2] Test offline behavior: Build app with `npm run build`, disconnect network, verify font renders (self-hosted)
- [x] T010 [US2] Verify `display: 'swap'` is configured in Orbitron font options in `app/layout.tsx`

**Checkpoint**: User Story 2 complete - Fallback strategy verified, application usable without Orbitron.

---

## Phase 5: Polish & Verification

**Purpose**: Final validation and documentation

- [ ] T011 Run full application in Tauri: `npm run tauri:dev` and verify font rendering in desktop app
- [ ] T012 Verify body text, TipTap editor, and browser content retain system fonts (not Orbitron)
- [ ] T013 Run quickstart.md verification steps to confirm all acceptance criteria met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Can start after Phase 2, independent of US1
- **Polish (Phase 5)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1

### Within Each User Story

- US1: Layout changes → Component updates → Verification
- US2: CSS verification → Offline testing → Swap verification

### Parallel Opportunities

- T004 and T005 can run in parallel (different component files)
- US1 and US2 can proceed in parallel after Phase 2 completes

---

## Parallel Example: User Story 1

```bash
# Launch component updates in parallel:
Task: "Add font-display class to window title in src/components/windows/WindowHeader.tsx"
Task: "Add font-display class to button base styles in src/components/ui/button.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004-T007)
4. **STOP and VALIDATE**: Orbitron font visible on all UI chrome
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Font utility available
2. Add User Story 1 → Verify Orbitron on UI chrome → Deploy/Demo (MVP!)
3. Add User Story 2 → Verify fallback behavior → Deploy/Demo
4. Each story adds robustness without breaking previous functionality

---

## Files Modified Summary

| File | Change |
|------|--------|
| `app/layout.tsx` | Import Orbitron, configure CSS variable, apply to html |
| `app/globals.css` | Add `--font-display` to `@theme inline` block |
| `src/components/windows/WindowHeader.tsx` | Add `font-display` class to title |
| `src/components/ui/button.tsx` | Add `font-display` class to button variants |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Visual verification is primary testing method (no unit tests required)
- Font is self-hosted via next/font/google - no CDN dependency at runtime
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
