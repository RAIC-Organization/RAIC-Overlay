# Tasks: README v1.0.0 Release Refactor

**Input**: Design documents from `/specs/059-readme-v1-release/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No automated tests required - manual visual verification on GitHub.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Files to modify:
- `README.md` - Primary documentation file (complete rewrite)
- `package.json` - Version update
- `src-tauri/Cargo.toml` - Version update
- `src-tauri/tauri.conf.json` - Version update

---

## Phase 1: Setup (Version Updates)

**Purpose**: Update version numbers to 1.0.0 across all configuration files

- [X] T001 [P] Update version from "0.1.0" to "1.0.0" in package.json
- [X] T002 [P] Update version from "0.1.0" to "1.0.0" in src-tauri/Cargo.toml
- [X] T003 [P] Update version from "0.1.0" to "1.0.0" in src-tauri/tauri.conf.json

**Checkpoint**: All version numbers updated to 1.0.0

---

## Phase 2: User Story 1 - First-Time User Discovers RAIC Overlay (Priority: P1) 🎯 MVP

**Goal**: Create the core README structure with logo, badges, description, screenshots, and installation link so users can understand and install the overlay immediately.

**Independent Test**: Visit GitHub repository and verify: logo displays, badges render, description is clear, screenshots load, installation link works.

### Implementation for User Story 1

- [ ] T004 [US1] Create README header with centered app logo using src-tauri/icons/icon.png in README.md
- [ ] T005 [US1] Add version badge (v1.0.0) and platform badge (Windows 11) using shields.io in README.md
- [ ] T006 [US1] Write About section with short Star Citizen overlay description in README.md
- [ ] T007 [US1] Add Screenshots section displaying screenshots/overlay.png and screenshots/settings.png in README.md
- [ ] T008 [US1] Add Installation section with link to https://github.com/RAIC-Organization/RAIC-Overlay/releases/latest in README.md

**Checkpoint**: User Story 1 complete - users can discover, understand, and install the overlay

---

## Phase 3: User Story 2 - User Learns Basic Controls (Priority: P2)

**Goal**: Document keyboard shortcuts so users know how to operate the overlay.

**Independent Test**: Read the Controls section and verify F3 (show/hide) and F5 (toggle mode) are documented with clear descriptions.

### Implementation for User Story 2

- [ ] T009 [US2] Add Controls section with F3 (show/hide overlay) and F5 (toggle mode) shortcuts in README.md

**Checkpoint**: User Story 2 complete - controls are documented

---

## Phase 4: User Story 3 - User Explores Available Features (Priority: P2)

**Goal**: List all windows and widgets with brief descriptions so users understand the feature set.

**Independent Test**: Read the Windows & Widgets section and verify all 4 windows and 3 widgets are listed with descriptions.

### Implementation for User Story 3

- [ ] T010 [US3] Add Windows section listing Notes, Draw, Browser, and File Viewer with descriptions in README.md
- [ ] T011 [US3] Add Widgets section listing Clock, Session Timer, and Chronometer with descriptions in README.md

**Checkpoint**: User Story 3 complete - all features are documented

---

## Phase 5: User Story 4 - User Wants to Support the Project (Priority: P3)

**Goal**: Add Ko-fi donation button and in-game tip information so users can support the developer.

**Independent Test**: Verify Ko-fi button is visible and clickable, and "braindaamage" RSI profile link works.

### Implementation for User Story 4

- [ ] T012 [US4] Add Ko-fi donation button using provided HTML in README.md header section
- [ ] T013 [US4] Add in-game tip text with "braindaamage" linked to https://robertsspaceindustries.com/en/citizens/braindaamage in README.md

**Checkpoint**: User Story 4 complete - support options are visible

---

## Phase 6: User Story 5 - User Checks License Information (Priority: P3)

**Goal**: Add MIT license section at the bottom of README.

**Independent Test**: Scroll to bottom and verify MIT license text is present.

### Implementation for User Story 5

- [ ] T014 [US5] Add License section with MIT license summary at bottom of README.md

**Checkpoint**: User Story 5 complete - license is documented

---

## Phase 7: Polish & Validation

**Purpose**: Final cleanup and verification

- [ ] T015 Remove all technical build/dev instructions from README.md (npm/cargo commands)
- [ ] T016 Verify all images load correctly (logo, screenshots) by checking relative paths
- [ ] T017 Verify all external links work (Ko-fi, RSI profile, GitHub releases)
- [ ] T018 Verify Markdown renders correctly on GitHub

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - all version updates can run in parallel
- **Phase 2-6 (User Stories)**: Depend on Phase 1 for consistent version display
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core structure - should be completed first as foundation
- **User Story 2 (P2)**: Can be done after US1 (adds to existing README)
- **User Story 3 (P2)**: Can be done after US1 (adds to existing README)
- **User Story 4 (P3)**: Can be done after US1 (adds to header section)
- **User Story 5 (P3)**: Can be done after US1 (adds to bottom section)

### Parallel Opportunities

- All Phase 1 tasks (T001-T003) can run in parallel (different files)
- User Stories 2-5 can be implemented in parallel after US1 core structure exists
- All tasks marked [P] within a phase can run in parallel

---

## Parallel Example: Phase 1 (Version Updates)

```bash
# Launch all version updates together:
Task: "Update version to 1.0.0 in package.json"
Task: "Update version to 1.0.0 in src-tauri/Cargo.toml"
Task: "Update version to 1.0.0 in src-tauri/tauri.conf.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Version Updates (parallel)
2. Complete Phase 2: User Story 1 (discovery, screenshots, installation)
3. **STOP and VALIDATE**: Push to GitHub and verify README renders correctly
4. Deploy/demo if ready - users can already discover and install

### Incremental Delivery

1. Complete Phase 1 → Versions updated
2. Complete Phase 2 → US1 (discover/install) → Push → Validate
3. Complete Phase 3 → US2 (controls) → Push → Validate
4. Complete Phase 4 → US3 (features) → Push → Validate
5. Complete Phase 5 → US4 (support) → Push → Validate
6. Complete Phase 6 → US5 (license) → Push → Validate
7. Complete Phase 7 → Polish → Push → Final validation

### Recommended Single-Developer Flow

Since all changes are to README.md (single file), execute sequentially:
1. T001-T003 in parallel (different files)
2. T004-T014 sequentially (all modify README.md)
3. T015-T018 sequentially (validation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All README changes are to the same file - avoid merge conflicts by working sequentially
- Each user story adds a section to the README that works independently
- Commit after each story phase for easy rollback
- Test on GitHub after push to verify rendering
