# Tasks: TipTap Notes Component

**Input**: Design documents from /specs/008-tiptap-notes-component/

**Tests**: Not explicitly requested - test tasks omitted.

---

## Phase 1: Setup

- [X] T001 Install TipTap: npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-text-align
- [X] T002 Verify packages installed in package.json

---

## Phase 2: Foundational

- [X] T003 Create NotesToolbar skeleton in src/components/windows/NotesToolbar.tsx
- [X] T004 Create NotesContent skeleton in src/components/windows/NotesContent.tsx with useEditor

---

## Phase 3: User Story 1 - Open Notes Window (P1) MVP

- [X] T005 [US1] Remove Option 1,2,3 buttons from MainMenu in src/components/MainMenu.tsx
- [X] T006 [US1] Add Notes and Test Windows buttons in single group in src/components/MainMenu.tsx
- [X] T007 [US1] Import NotesContent in src/components/MainMenu.tsx
- [X] T008 [US1] Add handleOpenNotes with window:open event in src/components/MainMenu.tsx
- [X] T009 [US1] Connect Notes button onClick in src/components/MainMenu.tsx
- [X] T010 [US1] Verify multiple Notes windows open independently

---

## Phase 4: User Story 2 - Toolbar (P2)

- [X] T011 [P] [US2] Add Bold button in src/components/windows/NotesToolbar.tsx
- [X] T012 [P] [US2] Add Italic button in src/components/windows/NotesToolbar.tsx
- [X] T013 [P] [US2] Add Underline button in src/components/windows/NotesToolbar.tsx
- [X] T014 [P] [US2] Add Strikethrough button in src/components/windows/NotesToolbar.tsx
- [X] T015 [P] [US2] Add H1,H2,H3 buttons in src/components/windows/NotesToolbar.tsx
- [X] T016 [P] [US2] Add List buttons in src/components/windows/NotesToolbar.tsx
- [X] T017 [P] [US2] Add Align buttons in src/components/windows/NotesToolbar.tsx
- [X] T018 [US2] Add active state styling in src/components/windows/NotesToolbar.tsx
- [X] T019 [US2] Render toolbar conditionally in src/components/windows/NotesContent.tsx
- [X] T020 [US2] Verify formatting works

---

## Phase 5: User Story 3 - Mode Toggle (P3)

- [X] T021 [US3] Add useEffect for setEditable sync in src/components/windows/NotesContent.tsx
- [X] T022 [US3] Set initial editable state in useEditor options
- [X] T023 [US3] Verify toolbar hides on F5 toggle
- [X] T024 [US3] Verify read-only in non-interaction mode

---

## Phase 6: User Story 4 - Ephemeral (P4)

- [X] T025 [US4] Verify editor destroyed on unmount
- [X] T026 [US4] Verify independent window content
- [X] T027 [US4] Verify new window starts empty

---

## Phase 7: Polish

- [X] T028 [P] Add prose styling in src/components/windows/NotesContent.tsx
- [X] T029 [P] Style toolbar in src/components/windows/NotesToolbar.tsx
- [X] T030 Verify scroll behavior
- [X] T031 Test 10+ concurrent windows
- [X] T032 Run quickstart validation

---

## Summary

- **Total Tasks**: 32
- **US1**: 6 tasks (MVP)
- **US2**: 10 tasks (Toolbar)
- **US3**: 4 tasks (Mode)
- **US4**: 3 tasks (Verify)
- **Parallel**: T011-T017 (toolbar buttons)
- **MVP Scope**: Phase 1-3 (T001-T010)
