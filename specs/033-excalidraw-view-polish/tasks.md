# Tasks: Excalidraw View Mode Polish

**Input**: Design documents from `/specs/033-excalidraw-view-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Integration tests included per constitution Testing Standards (Principle II).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `app/`, `tests/` at repository root (Tauri + Next.js)

---

## Phase 1: Setup (No Setup Required)

**Purpose**: This feature modifies existing files only. No new project setup needed.

> **Note**: All infrastructure already exists. Proceeding directly to User Story implementation.

---

## Phase 2: Foundational (Prop Passing Infrastructure)

**Purpose**: Enable `backgroundTransparent` prop to flow from Window to content components

**⚠️ CRITICAL**: User Story 2 depends on this. User Story 1 (CSS-only) can proceed in parallel.

- [x] T001 Pass `backgroundTransparent` prop to content component in `src/components/windows/Window.tsx`

**Implementation Details (T001)**:
- Modify line ~283 where content component is rendered
- Change: `<Component {...(componentProps ?? {})} isInteractive={isInteractive} />`
- To: `<Component {...(componentProps ?? {})} isInteractive={isInteractive} backgroundTransparent={backgroundTransparent} />`

**Checkpoint**: Foundation ready - both user stories can now proceed

---

## Phase 3: User Story 1 - Clean Drawing View in Passive Mode (Priority: P1) 🎯 MVP

**Goal**: Hide Excalidraw UI controls (menu, zoom, help) in non-interactive/view mode

**Independent Test**: Toggle F3 between interactive and passive mode. In passive mode, no Excalidraw controls (hamburger menu, zoom buttons, help icon) should be visible.

### Implementation for User Story 1

- [x] T002 [P] [US1] Add CSS rules to hide Excalidraw UI controls in view mode in `app/globals.css`

**Implementation Details (T002)**:
Add after existing window styles (around line 185):
```css
/* Excalidraw view mode - hide UI controls (033-excalidraw-view-polish) */
.excalidraw.excalidraw--view-mode .App-menu,
.excalidraw.excalidraw--view-mode .zoom-actions,
.excalidraw.excalidraw--view-mode .help-icon {
  display: none !important;
}
```

- [x] T008 [US1] Add integration test for UI controls hiding in `tests/react/DrawContent.test.tsx`

**Implementation Details (T008)**:
Add test case verifying `.excalidraw--view-mode` class behavior:
```typescript
describe('DrawContent view mode', () => {
  it('should have view-mode class when isInteractive is false', () => {
    render(<DrawContent isInteractive={false} />);
    const excalidraw = document.querySelector('.excalidraw');
    expect(excalidraw).toHaveClass('excalidraw--view-mode');
  });
});
```

**Checkpoint**: User Story 1 complete. Draw window shows clean view without UI controls in passive mode.

---

## Phase 4: User Story 2 - Transparent Background in Passive Mode (Priority: P2)

**Goal**: Enable Excalidraw background transparency integration with window system toggle

**Independent Test**:
1. In interactive mode, toggle background transparency in window header
2. Switch to passive mode (F3)
3. Drawing canvas should show content behind (game/app) through non-drawn areas
4. Toggle back to solid → canvas background returns to dark color

**Dependencies**: T001 must be complete (backgroundTransparent prop must flow to DrawContent)

### Implementation for User Story 2

- [x] T003 [US2] Add `backgroundTransparent` prop to DrawContentProps interface in `src/components/windows/DrawContent.tsx`
- [x] T004 [US2] Compute effective `viewBackgroundColor` based on props in `src/components/windows/DrawContent.tsx`
- [x] T005 [US2] Apply computed background color to Excalidraw initialData.appState in `src/components/windows/DrawContent.tsx`

**Implementation Details (T003)**:
Add to `DrawContentProps` interface:
```typescript
/** Whether window background should be transparent (only applies in non-interactive mode) */
backgroundTransparent?: boolean;
```

**Implementation Details (T004)**:
Add to function body after destructuring props:
```typescript
// Compute effective background color for Excalidraw
const effectiveViewBackgroundColor = (backgroundTransparent && !isInteractive)
  ? "transparent"
  : (initialAppState?.viewBackgroundColor ?? "#1e1e1e");
```

**Implementation Details (T005)**:
Update Excalidraw's `initialData` prop:
```typescript
initialData={{
  elements: initialElements,
  appState: {
    ...initialAppState,
    viewBackgroundColor: effectiveViewBackgroundColor,
  },
}}
```

- [x] T009 [US2] Add integration tests for transparent background in `tests/react/DrawContent.test.tsx`

**Implementation Details (T009)**:
Add test cases verifying background color logic:
```typescript
describe('DrawContent background transparency', () => {
  it('should use transparent background when backgroundTransparent=true and isInteractive=false', () => {
    // Test effectiveViewBackgroundColor logic
  });

  it('should use default background when isInteractive=true regardless of backgroundTransparent', () => {
    // Test that interactive mode ignores transparency toggle
  });
});
```

**Checkpoint**: User Story 2 complete. Draw window background becomes transparent in passive mode when toggle is enabled.

---

## Phase 5: Polish & Verification

**Purpose**: Final validation and documentation

- [ ] T006 Run manual verification per quickstart.md verification steps
- [ ] T007 [P] Add feature tag comment to modified files referencing `@feature 033-excalidraw-view-polish`

**Verification Steps (T006)**:
1. UI Controls Hidden:
   - Open Draw window in interactive mode → controls visible
   - Press F3 to toggle to passive mode → controls hidden
   - Press F3 again → controls visible again

2. Transparent Background:
   - In interactive mode, toggle background transparency in window header
   - Switch to passive mode (F3)
   - Drawing canvas should show content behind (game/app)
   - Toggle back to solid → canvas background returns to dark color

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped - no setup needed
- **Foundational (Phase 2)**: T001 - enables prop passing for US2
- **User Story 1 (Phase 3)**: T002, T008 - can run in parallel with T001 (different files)
- **User Story 2 (Phase 4)**: T003-T005, T009 - depends on T001 completion
- **Polish (Phase 5)**: T006-T007 - depends on all implementation complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - CSS-only change, no dependencies on other tasks
- **User Story 2 (P2)**: Depends on T001 (foundational prop passing)

### Task Dependencies Graph

```
T001 (Window.tsx prop)  ─────────────────────┐
                                              │
T002 (globals.css) → T008 (US1 tests) ────────┤
                                              │
                              ┌───────────────┘
                              ▼
                    T003 → T004 → T005 → T009 (US2 tests)
                    (DrawContent.tsx changes)
                              │
                              ▼
                        T006, T007
                        (Verification)
```

### Parallel Opportunities

```bash
# Can run in parallel immediately:
T001: Pass backgroundTransparent prop in Window.tsx
T002: Add CSS rules in globals.css

# After T001 completes, sequential within DrawContent.tsx:
T003 → T004 → T005 (same file, sequential)
```

---

## Parallel Example: Initial Implementation

```bash
# Launch these two tasks in parallel (different files):
Task T001: "Pass backgroundTransparent prop to content component in src/components/windows/Window.tsx"
Task T002: "Add CSS rules to hide Excalidraw UI controls in view mode in app/globals.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T002: Add CSS rules (single task, completes US1)
2. **STOP and VALIDATE**: Test UI controls hiding in passive mode
3. If MVP sufficient, can skip US2

### Full Implementation

1. Complete T001 + T002 in parallel
2. Complete T003 → T004 → T005 (sequential, same file)
3. Complete T006 verification
4. Complete T007 documentation tags

### Estimated Effort

| Task | Complexity | Lines Changed |
|------|------------|---------------|
| T001 | Trivial | ~1 line |
| T002 | Trivial | ~6 lines |
| T003 | Trivial | ~2 lines |
| T004 | Simple | ~4 lines |
| T005 | Simple | ~5 lines |
| T006 | Verification | N/A |
| T007 | Documentation | ~2 lines |
| T008 | Simple | ~10 lines |
| T009 | Simple | ~15 lines |

**Total**: ~45 lines of code changes across 4 files

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 1 (CSS hiding) is completely independent - can be delivered as MVP
- User Story 2 (transparency) requires foundational prop passing (T001)
- All implementation details are provided inline - tasks are self-contained
- Commit after each task or logical group (e.g., commit after T002 for US1 MVP)
