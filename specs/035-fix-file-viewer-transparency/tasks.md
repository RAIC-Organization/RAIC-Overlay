# Tasks: Fix File Viewer Window Transparency

**Input**: Design documents from `/specs/035-fix-file-viewer-transparency/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: No automated tests required - this is a visual bug fix that can be manually verified per quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths use the existing project structure:
- **Components**: `src/components/windows/`
- **Renderers**: `src/components/windows/renderers/`

---

## Phase 1: Setup (N/A)

**Purpose**: Project initialization and basic structure

No setup tasks required - this is a bug fix modifying existing files only.

---

## Phase 2: Foundational (FileViewerContent)

**Purpose**: Core component that MUST be modified first before renderers can receive the prop

**⚠️ CRITICAL**: Renderer modifications depend on FileViewerContent passing the prop

- [X] T001 Add `backgroundTransparent?: boolean` prop to `FileViewerContentProps` interface in `src/components/windows/FileViewerContent.tsx`
- [X] T002 Calculate `isEffectivelyTransparent = backgroundTransparent === true && !isInteractive` in FileViewerContent component in `src/components/windows/FileViewerContent.tsx`
- [X] T003 Pass `backgroundTransparent` and `isInteractive` props to PDFRenderer, MarkdownRenderer, and ImageRenderer calls in `src/components/windows/FileViewerContent.tsx`
- [X] T004 Apply transparency to empty state ("No file selected" div) in `src/components/windows/FileViewerContent.tsx`
- [X] T005 Apply transparency to error state ("File Not Found" div) in `src/components/windows/FileViewerContent.tsx`
- [X] T006 Apply transparency to unsupported file type error div in `src/components/windows/FileViewerContent.tsx`

**Checkpoint**: FileViewerContent now accepts and propagates backgroundTransparent prop

---

## Phase 3: User Story 1 - View Documents with Transparent Background (Priority: P1) 🎯 MVP

**Goal**: Make the File Viewer window respect the "background transparent" setting in non-interactive mode for all file types

**Independent Test**: Open a File Viewer, load any supported file, enable background transparency, press F3 to enter non-interactive mode, verify window background is see-through

### Implementation for User Story 1

- [X] T007 [P] [US1] Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` props to `PDFRendererProps` interface in `src/components/windows/renderers/PDFRenderer.tsx`
- [X] T008 [P] [US1] Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` props to `MarkdownRendererProps` interface in `src/components/windows/renderers/MarkdownRenderer.tsx`
- [X] T009 [P] [US1] Add `backgroundTransparent?: boolean` and `isInteractive?: boolean` props to `ImageRendererProps` interface in `src/components/windows/renderers/ImageRenderer.tsx`
- [X] T010 [US1] Calculate `isEffectivelyTransparent` and replace hard-coded `bg-muted/30` with conditional class on PDF canvas container in `src/components/windows/renderers/PDFRenderer.tsx`
- [X] T011 [US1] Conditionally remove `border-b border-border` from PDF page navigation bar when transparent in `src/components/windows/renderers/PDFRenderer.tsx`
- [X] T012 [US1] Calculate `isEffectivelyTransparent` and apply conditional background to outer container in `src/components/windows/renderers/MarkdownRenderer.tsx`
- [X] T013 [US1] Calculate `isEffectivelyTransparent` and replace hard-coded `bg-muted/30` with conditional class on image container in `src/components/windows/renderers/ImageRenderer.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional - PDF, Markdown, and Image files all respect transparency setting in non-interactive mode

---

## Phase 4: User Story 2 - Consistent Transparency Behavior (Priority: P2)

**Goal**: Ensure identical transparency behavior across all file types

**Independent Test**: Open three File Viewer windows (PDF, Markdown, Image), enable transparency on all, enter non-interactive mode, verify all behave identically

### Implementation for User Story 2

- [X] T014 [US2] Verify all three renderers use the same `isEffectivelyTransparent` calculation pattern: `backgroundTransparent === true && !isInteractive` (code review task)
- [X] T015 [US2] Test and verify consistent transparency behavior across PDF, Markdown, and Image renderers (manual verification per quickstart.md)

**Checkpoint**: All file types exhibit identical transparency behavior

---

## Phase 5: User Story 3 - Preserve Transparency Setting (Priority: P3)

**Goal**: Ensure transparency setting persists across application restarts

**Independent Test**: Set transparency on a File Viewer, close and reopen the application, verify setting is restored

### Implementation for User Story 3

- [X] T016 [US3] Verify existing persistence system already handles `backgroundTransparent` for File Viewer windows (no code change needed - verification only)
- [X] T017 [US3] Test persistence: enable transparency, close app, reopen, verify setting is restored (manual verification per quickstart.md)

**Checkpoint**: Transparency setting persists correctly across sessions

---

## Phase 6: Polish & Edge Cases

**Purpose**: Handle edge cases and final validation

- [X] T018 Test empty file viewer (no file loaded) with transparency enabled - verify no background shows
- [X] T019 Test error state (file not found) with transparency enabled - verify no background shows
- [X] T020 Test rapid F3 toggle - verify no visual glitches during mode transitions
- [X] T021 Run full quickstart.md manual verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Skipped - no new files needed
- **Phase 2 (Foundational)**: No dependencies - start here
- **Phase 3 (US1)**: Depends on Phase 2 completion (FileViewerContent must pass props first)
- **Phase 4 (US2)**: Depends on Phase 3 completion (consistency verification)
- **Phase 5 (US3)**: Can run in parallel with Phase 4 (persistence is independent)
- **Phase 6 (Polish)**: Depends on Phase 3+4+5 completion

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (Foundational) - Core bug fix
- **User Story 2 (P2)**: Depends on US1 - Consistency verification
- **User Story 3 (P3)**: Can start after Phase 2 - Independent persistence check

### Within Each Phase

- Phase 2: Tasks T001-T003 must complete before T004-T006 (props must exist to use)
- Phase 3: T007-T009 can run in parallel (different files), then T010-T013 sequentially

### Parallel Opportunities

- T007, T008, T009 can run in parallel (different renderer files, adding props only)
- T010-T013 could run in parallel after props are added (different files)
- Phase 4 (US2) and Phase 5 (US3) can run in parallel

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all prop additions in parallel:
Task: "T007 [P] [US1] Add props to PDFRendererProps in src/components/windows/renderers/PDFRenderer.tsx"
Task: "T008 [P] [US1] Add props to MarkdownRendererProps in src/components/windows/renderers/MarkdownRenderer.tsx"
Task: "T009 [P] [US1] Add props to ImageRendererProps in src/components/windows/renderers/ImageRenderer.tsx"

# Then implement conditional backgrounds (can also be parallel since different files):
Task: "T010 [US1] Implement conditional bg in PDFRenderer"
Task: "T012 [US1] Implement conditional bg in MarkdownRenderer"
Task: "T013 [US1] Implement conditional bg in ImageRenderer"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (FileViewerContent changes)
2. Complete Phase 3: User Story 1 (all three renderers)
3. **STOP and VALIDATE**: Test with PDF, Markdown, and Image files
4. If US1 works correctly, the core bug is fixed

### Incremental Delivery

1. Complete Phase 2 → FileViewerContent passes prop
2. Complete Phase 3 (US1) → Core fix working → **BUG FIXED** ✓
3. Complete Phase 4 (US2) → Consistency verified
4. Complete Phase 5 (US3) → Persistence verified
5. Complete Phase 6 → All edge cases validated

### Single Developer Strategy

Since this is a small bug fix:
1. T001-T006 sequentially (FileViewerContent)
2. T007-T009 in any order (prop additions)
3. T010-T013 in any order (conditional backgrounds)
4. T014-T021 verification tasks

---

## Notes

- This is a **bug fix** with minimal changes to existing code
- No new files are created - only modifications to 4 existing files
- The pattern follows existing `DrawContent.tsx` transparency implementation
- Manual testing is sufficient - no automated tests needed for this visual change
- Total estimated changes: ~40 lines across 4 files
- [P] tasks = different files, no dependencies
- Commit after completing each phase for easy rollback if needed
