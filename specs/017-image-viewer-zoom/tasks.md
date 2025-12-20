# Tasks: Image Viewer with Zoom Support

**Input**: Design documents from `/specs/017-image-viewer-zoom/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested - manual testing consistent with existing renderers.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Tauri desktop app**: `src/` for frontend, `src-tauri/` for Rust backend
- All task paths are relative to repository root

---

## Phase 1: Setup

**Purpose**: Install dependency and prepare for implementation

- [x] T001 Install react-zoom-pan-pinch dependency via `npm install react-zoom-pan-pinch`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Extend FileType union to include 'image' in `src/types/persistence.ts`
- [x] T003 Add image extension cases to detectFileType function in `src/types/persistence.ts`
- [x] T004 Update file dialog filters to include image extensions in `src/components/windows/FileViewerContent.tsx`

**Checkpoint**: Foundation ready - ImageRenderer can now be implemented

---

## Phase 3: User Story 1 - View Image Files (Priority: P1) 🎯 MVP

**Goal**: Users can open and view image files (PNG, JPG, GIF, WebP, BMP, SVG, ICO) in the File Viewer window with fit-to-container initial display.

**Independent Test**: Open any supported image file and verify it renders correctly, centered, and scaled to fit within the viewer.

### Implementation for User Story 1

- [x] T005 [US1] Create ImageRenderer component scaffold with props interface in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T006 [US1] Implement image loading via Tauri fs plugin with base64 data URL conversion in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T007 [US1] Add MIME type mapping for all supported image extensions in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T008 [US1] Implement loading state with Loader2 spinner in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T009 [US1] Implement error state for failed image loads in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T010 [US1] Add TransformWrapper with centerOnInit and fit-to-container display in `src/components/windows/renderers/ImageRenderer.tsx`
- [x] T011 [US1] Add ImageRenderer case to renderContent switch statement in `src/components/windows/FileViewerContent.tsx`
- [x] T012 [US1] Add ImageRenderer import to FileViewerContent in `src/components/windows/FileViewerContent.tsx`

**Checkpoint**: User Story 1 complete - Users can open and view image files with fit-to-container display

---

## Phase 4: User Story 2 - Zoom Image with Mouse Wheel (Priority: P2)

**Goal**: Users can zoom in/out on images using mouse wheel scroll, with zoom centered on cursor position and respecting min/max limits.

**Independent Test**: Load an image, use mouse wheel to zoom in/out, verify smooth zoom behavior with min (10%) and max (200%) limits.

### Implementation for User Story 2

- [ ] T013 [US2] Configure minScale (0.1) and maxScale (2.0) on TransformWrapper in `src/components/windows/renderers/ImageRenderer.tsx`
- [ ] T014 [US2] Add onTransformed callback to sync zoom state with parent in `src/components/windows/renderers/ImageRenderer.tsx`
- [ ] T015 [US2] Implement zoom percentage conversion (scale * 100) for toolbar display in `src/components/windows/renderers/ImageRenderer.tsx`

**Checkpoint**: User Story 2 complete - Mouse wheel zoom works with toolbar sync

---

## Phase 5: User Story 3 - Pan Zoomed Image (Priority: P3)

**Goal**: Users can click and drag to pan across zoomed images to view different areas.

**Independent Test**: Zoom into an image, then click and drag to pan around. Verify panning is limited when image fits in container.

### Implementation for User Story 3

- [ ] T016 [US3] Verify TransformWrapper panning is enabled (default behavior) in `src/components/windows/renderers/ImageRenderer.tsx`
- [ ] T017 [US3] Configure panning bounds to prevent moving image out of view in `src/components/windows/renderers/ImageRenderer.tsx`

**Checkpoint**: User Story 3 complete - Pan functionality works on zoomed images

---

## Phase 6: User Story 4 - Double-Click to Reset View (Priority: P4)

**Goal**: Users can double-click to reset the image to default zoom and centered position.

**Independent Test**: Zoom and pan an image, then double-click to verify it resets to initial fit-to-container view.

### Implementation for User Story 4

- [ ] T018 [US4] Configure doubleClick mode to 'reset' on TransformWrapper in `src/components/windows/renderers/ImageRenderer.tsx`

**Checkpoint**: User Story 4 complete - Double-click reset works

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and verification

- [ ] T019 Add JSDoc documentation to ImageRenderer component in `src/components/windows/renderers/ImageRenderer.tsx`
- [ ] T020 Verify zoom persistence between sessions works with existing persistence system
- [ ] T021 Manual testing: Open PNG, JPG, GIF, WebP, BMP, SVG, ICO files and verify rendering
- [ ] T022 Manual testing: Verify animated GIF plays correctly
- [ ] T023 Manual testing: Verify error state displays for corrupted/invalid images

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories should be completed in priority order (P1 → P2 → P3 → P4)
  - Each builds on the ImageRenderer component from previous stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates the base ImageRenderer
- **User Story 2 (P2)**: Depends on US1 - Adds zoom configuration to existing component
- **User Story 3 (P3)**: Depends on US1 - Adds pan configuration to existing component
- **User Story 4 (P4)**: Depends on US1 - Adds reset configuration to existing component

### Within Each User Story

- Complete all tasks in order within each phase
- Commit after each logical group of tasks
- Verify story independently before moving to next

### Parallel Opportunities

- T002, T003 can run in parallel (different changes to same file, but distinct sections)
- T005-T010 must be sequential (building same component)
- User Stories 2, 3, 4 configure TransformWrapper in same file - execute sequentially

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These can run in parallel as they modify different parts of the codebase:
Task T002: "Extend FileType in persistence.ts"
Task T004: "Update file dialog filters in FileViewerContent.tsx"

# T003 should follow T002 as it extends the same function
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependency)
2. Complete Phase 2: Foundational (extend FileType, update filters)
3. Complete Phase 3: User Story 1 (create ImageRenderer with basic display)
4. **STOP and VALIDATE**: Test opening various image files
5. Deploy/demo if ready - images display correctly!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Basic image viewing works (MVP!)
3. Add User Story 2 → Test independently → Zoom works
4. Add User Story 3 → Test independently → Pan works
5. Add User Story 4 → Test independently → Reset works
6. Polish → Final verification → Complete feature

### Single Developer Strategy

Execute phases sequentially:
1. Phase 1 (1 task)
2. Phase 2 (3 tasks)
3. Phase 3 (8 tasks) - MVP checkpoint
4. Phase 4 (3 tasks)
5. Phase 5 (2 tasks)
6. Phase 6 (1 task)
7. Phase 7 (5 tasks)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 23 |
| **Phase 1 (Setup)** | 1 task |
| **Phase 2 (Foundational)** | 3 tasks |
| **Phase 3 (US1 - View Images)** | 8 tasks |
| **Phase 4 (US2 - Zoom)** | 3 tasks |
| **Phase 5 (US3 - Pan)** | 2 tasks |
| **Phase 6 (US4 - Reset)** | 1 task |
| **Phase 7 (Polish)** | 5 tasks |
| **MVP Scope** | Phase 1-3 (12 tasks) |
| **Parallel Opportunities** | Limited - single component development |

---

## Notes

- All tasks modify TypeScript/React code in the frontend
- No Rust backend changes required (uses existing Tauri fs plugin)
- ImageRenderer follows existing pattern from PDFRenderer and MarkdownRenderer
- Persistence already supported via existing FileViewerPersistedContent interface
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
