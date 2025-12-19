# Tasks: Tauri App Icon Update

**Input**: Design documents from `/specs/012-tauri-app-icon/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Visual verification only - no automated tests required for static asset generation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Source icon**: `src/assets/icon.png` (DO NOT MODIFY)
- **Generated icons**: `src-tauri/icons/`
- **Tauri config**: `src-tauri/tauri.conf.json`

---

## Phase 1: Setup (Prerequisites)

**Purpose**: Verify environment and source icon requirements

- [ ] T001 Verify source icon exists and meets requirements at src/assets/icon.png (1024x1024, PNG with alpha)
- [ ] T002 Verify Tauri CLI is available by running `npm run tauri --version`

---

## Phase 2: User Story 1 - Unified App Icon Branding (Priority: P1) 🎯 MVP

**Goal**: Replace default Tauri icons with branded RAIC icon across all system UI contexts

**Independent Test**: Build the application and verify the branded icon appears in Windows taskbar, title bar, and system tray

### Implementation for User Story 1

- [ ] T003 [US1] Generate all icon formats using `npm run tauri icon src/assets/icon.png` to src-tauri/icons/
- [ ] T004 [US1] Verify icon.ico was generated with correct multi-layer format in src-tauri/icons/icon.ico
- [ ] T005 [US1] Verify icon.icns was generated for macOS compatibility in src-tauri/icons/icon.icns
- [ ] T006 [US1] Verify all PNG sizes were generated (32x32, 64x64, 128x128, 128x128@2x, icon.png) in src-tauri/icons/
- [ ] T007 [US1] Verify all Windows Store icons were generated (Square*.png, StoreLogo.png) in src-tauri/icons/
- [ ] T008 [US1] Build application with `npm run tauri build` to verify icons are included
- [ ] T009 [US1] Visual test: Run built executable and verify taskbar icon shows branded RAIC icon
- [ ] T010 [US1] Visual test: Verify window title bar icon matches branded RAIC icon

**Checkpoint**: At this point, User Story 1 is complete - branded icon appears in all system contexts

---

## Phase 3: User Story 2 - Icon Quality Across Resolutions (Priority: P2)

**Goal**: Ensure crisp, clear icons on both standard and high-DPI displays

**Independent Test**: View application icon at different display scaling levels (100%, 200%) and confirm sharpness

### Implementation for User Story 2

- [ ] T011 [US2] Visual test: Verify icon clarity at 100% DPI (standard display)
- [ ] T012 [US2] Visual test: Verify icon clarity at 200% DPI (high-DPI display)
- [ ] T013 [US2] Verify 128x128@2x.png was generated for high-DPI scaling in src-tauri/icons/128x128@2x.png

**Checkpoint**: At this point, User Story 2 is complete - icons are crisp at all resolutions

---

## Phase 4: Polish & Validation

**Purpose**: Final verification and cleanup

- [ ] T014 Verify src/assets/icon.png was NOT modified (compare to original)
- [ ] T015 Verify Next.js AppIcon component still works by running `npm run dev` and checking in-app icon
- [ ] T016 Run quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify prerequisites
- **User Story 1 (Phase 2)**: Depends on Setup - single command generates all icons
- **User Story 2 (Phase 3)**: Depends on User Story 1 - visual verification of quality
- **Polish (Phase 4)**: Depends on all user stories - final validation

### User Story Dependencies

- **User Story 1 (P1)**: Independent - core icon generation
- **User Story 2 (P2)**: Depends on US1 (icons must exist to test quality)

### Within Each Phase

- Setup tasks are sequential (verify before generate)
- US1 implementation: Generate → Verify → Build → Test
- US2 implementation: Visual testing only (no generation)
- Polish: Validation tasks can run in any order

### Parallel Opportunities

Limited parallelization due to single CLI command execution:
- T004-T007 verification tasks could run in parallel after T003 completes
- T011-T013 quality verification tasks could run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: User Story 1 (T003-T010)
3. **STOP and VALIDATE**: Verify branded icon in taskbar and title bar
4. Deploy/demo if ready

### Full Implementation

1. Complete Setup → Verify prerequisites
2. Complete User Story 1 → Generate and verify icons
3. Complete User Story 2 → Verify quality across DPI settings
4. Complete Polish → Final validation

---

## Notes

- This is a simple feature with minimal parallelization - most tasks are sequential
- The core work is a single CLI command (T003)
- All other tasks are verification/validation
- No code changes required - asset generation only
- Source icon (src/assets/icon.png) must NOT be modified
- Commit generated icons after T007 verification passes
