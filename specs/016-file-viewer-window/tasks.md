# Tasks: File Viewer Window

**Input**: Design documents from `/specs/016-file-viewer-window/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Integration tests included per Constitution II requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md project structure: Tauri + Next.js desktop application
- Source code: `src/` at repository root
- Components: `src/components/windows/`
- Types: `src/types/`
- Contexts: `src/contexts/`
- Hooks: `src/hooks/`
- Lib: `src/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure PDF.js worker

- [X] T001 Install pdfjs-dist and react-markdown packages via npm
- [X] T002 Configure PDF.js worker path in application (copy worker to public folder or configure bundler)
- [X] T003 [P] Create renderers directory at src/components/windows/renderers/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and persistence infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add 'fileviewer' to WindowContentType union in src/types/windows.ts
- [ ] T005 [P] Add 'fileviewer' to WindowType union in src/types/persistence.ts
- [ ] T006 [P] Add FileType enum and FileViewerPersistedContent interface in src/types/persistence.ts
- [ ] T007 [P] Add FILE_VIEWER_DEFAULTS constants in src/types/persistence.ts
- [ ] T008 [P] Add clampFileViewerZoom helper function in src/types/persistence.ts
- [ ] T009 [P] Add detectFileType helper function in src/types/persistence.ts
- [ ] T010 [P] Add normalizeFileViewerContent helper function in src/types/persistence.ts
- [ ] T011 [P] Add isFileViewerContent type guard in src/types/persistence.ts
- [ ] T012 Add FileViewerPersistedContent to WindowContentFile content union in src/types/persistence.ts
- [ ] T013 Add serializeFileViewerContent function in src/lib/serialization.ts
- [ ] T014 Add saveFileViewerContentDebounced function in src/hooks/usePersistence.ts
- [ ] T015 Add onFileViewerContentChange to PersistenceContextValue interface in src/contexts/PersistenceContext.tsx
- [ ] T016 Implement onFileViewerContentChange callback in PersistenceProvider in src/contexts/PersistenceContext.tsx
- [ ] T017 Handle 'fileviewer' case in window creation effect in src/contexts/PersistenceContext.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View PDF Files (Priority: P1) 🎯 MVP

**Goal**: Users can open PDF files via file dialog and view them with zoom controls in a continuous scrollable view

**Independent Test**: Open any PDF file, verify all pages render in scrollable container, test zoom in/out functionality

### Tests for User Story 1

- [ ] T018a [P] [US1] Create integration test for PDF file opening and rendering in tests/integration/file-viewer-pdf.test.ts

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create ErrorRenderer component in src/components/windows/renderers/ErrorRenderer.tsx
- [ ] T019 [P] [US1] Create PlaceholderRenderer component in src/components/windows/renderers/PlaceholderRenderer.tsx
- [ ] T020 [US1] Create PDFRenderer component with PDF.js canvas rendering in src/components/windows/renderers/PDFRenderer.tsx
- [ ] T021 [US1] Implement continuous scroll multi-page rendering in PDFRenderer
- [ ] T022 [US1] Add zoom scaling via CSS transform to PDFRenderer
- [ ] T023 [US1] Create FileViewerToolbar component in src/components/windows/FileViewerToolbar.tsx
- [ ] T024 [US1] Implement Open File button with Tauri file dialog in FileViewerToolbar
- [ ] T025 [US1] Implement zoom controls (in/out buttons, percentage display) in FileViewerToolbar
- [ ] T026 [US1] Create FileViewerContent component in src/components/windows/FileViewerContent.tsx
- [ ] T027 [US1] Implement file dialog integration using @tauri-apps/plugin-dialog in FileViewerContent
- [ ] T028 [US1] Implement PDF file reading using @tauri-apps/plugin-fs in FileViewerContent
- [ ] T029 [US1] Add renderer selection logic (PDFRenderer for pdf type) in FileViewerContent
- [ ] T030 [US1] Add File Viewer option to MainMenu in src/components/MainMenu.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - PDF files can be opened and viewed with zoom

---

## Phase 4: User Story 2 - View Markdown Files (Priority: P2)

**Goal**: Users can open Markdown files and view them with proper formatting and zoom controls

**Independent Test**: Open any .md file, verify headings/bold/italic/lists/code blocks render correctly, test zoom

### Tests for User Story 2

- [ ] T031a [P] [US2] Create integration test for Markdown file opening and rendering in tests/integration/file-viewer-markdown.test.ts

### Implementation for User Story 2

- [ ] T031 [US2] Create MarkdownRenderer component with react-markdown in src/components/windows/renderers/MarkdownRenderer.tsx
- [ ] T032 [US2] Style Markdown output with Tailwind prose classes in MarkdownRenderer
- [ ] T033 [US2] Add zoom scaling via CSS transform to MarkdownRenderer
- [ ] T034 [US2] Implement Markdown file reading (text decode) in FileViewerContent
- [ ] T035 [US2] Add MarkdownRenderer to renderer selection logic in FileViewerContent

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - PDF and Markdown files can be viewed

---

## Phase 5: User Story 3 - Session Persistence (Priority: P3)

**Goal**: File Viewer state (path, type, zoom) persists across application restarts; missing files show error

**Independent Test**: Open file, adjust zoom, close app, reopen - verify state restored. Delete file, reopen app - verify error shown

### Tests for User Story 3

- [ ] T036a [P] [US3] Create integration test for persistence save/restore in tests/integration/file-viewer-persistence.test.ts

### Implementation for User Story 3

- [ ] T036 [US3] Implement file existence check on component mount in FileViewerContent
- [ ] T037 [US3] Display "File not found" error via ErrorRenderer when persisted file missing
- [ ] T038 [US3] Wire persistence callback to onContentChange in FileViewerContent
- [ ] T039 [US3] Persist state on file open in FileViewerContent
- [ ] T040 [US3] Persist state on zoom change in FileViewerContent
- [ ] T041 [US3] Handle 'fileviewer' in window restoration logic (pass initial props) in app initialization
- [ ] T042 [US3] Add file viewer content cleanup on window close in PersistenceContext

**Checkpoint**: At this point, File Viewer state persists across restarts and handles missing files gracefully

---

## Phase 6: User Story 4 - File Type Detection (Priority: P4)

**Goal**: System automatically detects file type by extension and shows appropriate error for unsupported types

**Independent Test**: Open .pdf → PDF renderer, open .md → Markdown renderer, open .txt → "Unsupported" error

### Implementation for User Story 4

- [ ] T043 [US4] Wire detectFileType helper to file open flow in FileViewerContent
- [ ] T044 [US4] Display "Unsupported file type" error via ErrorRenderer for unknown extensions
- [ ] T045 [US4] Add file filter to dialog (pdf, md, markdown) with descriptive label in FileViewerContent

**Checkpoint**: All user stories complete - full file viewer functionality with automatic type detection

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Add loading spinner/state indicator during file loading in FileViewerContent
- [ ] T047 [P] Add error handling for file read failures in FileViewerContent
- [ ] T048 [P] Add JSDoc comments to all exported components and functions
- [ ] T049 Verify zoom limits (10-200%) are enforced across all renderers
- [ ] T050 Test performance against SC-001 (PDF < 3s) and SC-002 (Markdown < 2s)
- [ ] T051 Run manual validation of all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Reuses FileViewerContent from US1
- **User Story 3 (P3)**: Depends on US1/US2 components existing but adds persistence independently
- **User Story 4 (P4)**: Depends on US1 error renderer but file detection is independent

### Within Each User Story

- Renderers before FileViewerContent (content uses renderers)
- FileViewerToolbar before FileViewerContent (content uses toolbar)
- FileViewerContent before MainMenu integration (menu opens content)
- Core implementation before edge cases

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005-T011 can all run in parallel (different sections of persistence.ts)
- T018-T019 can run in parallel (different renderer files)
- T046-T048 can run in parallel (different concerns)
- User stories can be worked on in parallel after Foundational phase

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all parallel type definition tasks together:
Task: "Add 'fileviewer' to WindowType union in src/types/persistence.ts"
Task: "Add FileType enum and FileViewerPersistedContent interface in src/types/persistence.ts"
Task: "Add FILE_VIEWER_DEFAULTS constants in src/types/persistence.ts"
Task: "Add clampFileViewerZoom helper function in src/types/persistence.ts"
Task: "Add detectFileType helper function in src/types/persistence.ts"
Task: "Add normalizeFileViewerContent helper function in src/types/persistence.ts"
Task: "Add isFileViewerContent type guard in src/types/persistence.ts"
```

## Parallel Example: User Story 1 Renderers

```bash
# Launch error and placeholder renderers in parallel (different files):
Task: "Create ErrorRenderer component in src/components/windows/renderers/ErrorRenderer.tsx"
Task: "Create PlaceholderRenderer component in src/components/windows/renderers/PlaceholderRenderer.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (PDF viewing)
4. **STOP and VALIDATE**: Test PDF viewing independently
5. Deploy/demo if ready - users can view PDFs!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → PDF viewing works → Demo (MVP!)
3. Add User Story 2 → Markdown viewing works → Demo
4. Add User Story 3 → Persistence works → Demo
5. Add User Story 4 → Type detection works → Demo
6. Each story adds value without breaking previous stories

### Single Developer Strategy

1. Complete Setup (T001-T003)
2. Complete Foundational (T004-T017) - use parallel hints for faster completion
3. User Story 1 (T018-T030) - MVP complete!
4. User Story 2 (T031-T035) - quick add, reuses infrastructure
5. User Story 3 (T036-T042) - persistence layer
6. User Story 4 (T043-T045) - refinement
7. Polish (T046-T051) - quality pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Reference research.md for PDF.js and react-markdown implementation patterns
- Reference data-model.md for type definitions
- Reference contracts/file-viewer-api.md for component prop interfaces
