# Tasks: Buy Me A Coffee Button in Settings Panel

**Input**: Design documents from `/specs/053-buymeacoffee-button/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: No automated tests for this feature. Manual verification tasks (T007-T009) provide sufficient coverage for this trivial UI addition. Constitution II deviation acknowledged - feature scope does not warrant integration test overhead.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Desktop application (Tauri + Next.js)
- **Frontend**: `src/components/settings/SettingsPanel.tsx`

---

## Phase 1: Setup (No Setup Required)

**Purpose**: Project initialization and basic structure

This feature requires no setup tasks - all dependencies are already installed:
- `@tauri-apps/plugin-opener` is already in package.json
- `lucide-react` is already available for icons
- Settings panel component already exists

**Status**: ✅ Ready to proceed directly to implementation

---

## Phase 2: Foundational (No Foundational Tasks)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

This feature has no foundational tasks - it modifies an existing component with existing infrastructure.

**Status**: ✅ Ready to proceed directly to user stories

---

## Phase 3: User Story 1 - Support Developer via Donation (Priority: P1) 🎯 MVP

**Goal**: Enable users to click a Buy Me A Coffee button that opens the donation page in their default external browser.

**Independent Test**: Click the Buy Me A Coffee button in Settings panel and verify https://www.buymeacoffee.com/braindaamage opens in external browser.

### Implementation for User Story 1

- [x] T001 [US1] Add `openUrl` import from `@tauri-apps/plugin-opener` in src/components/settings/SettingsPanel.tsx
- [x] T002 [US1] Add `handleOpenBuyMeCoffee` async click handler function in src/components/settings/SettingsPanel.tsx
- [x] T003 [US1] Add Buy Me A Coffee button JSX in footer section (after Save button, before version) in src/components/settings/SettingsPanel.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - clicking the button opens the donation page in external browser.

---

## Phase 4: User Story 2 - Visual Consistency with Settings Panel (Priority: P2)

**Goal**: Ensure the button integrates visually with the existing Settings panel design using BMC brand colors while maintaining SC HUD theme consistency.

**Independent Test**: Open Settings panel and verify the button has BMC brand colors (#FFDD00 yellow) and proper spacing/alignment with surrounding elements.

### Implementation for User Story 2

- [x] T004 [US2] Apply BMC brand color styling (#FFDD00) with SC HUD theme effects in src/components/settings/SettingsPanel.tsx
- [x] T005 [US2] Ensure proper spacing (mt-3) between Save button and BMC button in src/components/settings/SettingsPanel.tsx
- [x] T006 [US2] Add coffee emoji or icon for visual identification in src/components/settings/SettingsPanel.tsx

**Checkpoint**: At this point, the button should match the Settings panel aesthetic with recognizable BMC branding.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T007 Manual test: Open Settings panel, verify button position (after Save, before version)
- [x] T008 Manual test: Click button, verify external browser opens to correct URL
- [x] T009 Manual test: Verify Settings panel remains responsive after button click
- [x] T010 Build verification: Run `pnpm tauri:build` and verify no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped - no setup needed
- **Foundational (Phase 2)**: Skipped - no foundational work needed
- **User Story 1 (Phase 3)**: Can start immediately
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (same JSX element being styled)
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start immediately
- **User Story 2 (P2)**: Depends on US1 (styles the button created in US1)

### Within User Story 1

Sequential order required (all modify same file, same component):
1. T001: Add import
2. T002: Add handler
3. T003: Add JSX button

### Within User Story 2

Sequential order required (all modify same JSX element):
1. T004: Apply brand colors
2. T005: Adjust spacing
3. T006: Add icon/emoji

### Parallel Opportunities

Due to single-file modification, no parallel opportunities within this feature. All tasks modify `src/components/settings/SettingsPanel.tsx`.

---

## Parallel Example: Not Applicable

All tasks modify the same file (`SettingsPanel.tsx`), so parallel execution is not possible for this feature.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T003 (User Story 1)
2. **STOP and VALIDATE**: Test button opens external browser
3. Feature is functional (basic styling from default button)

### Full Implementation

1. Complete T001-T003 (User Story 1)
2. Complete T004-T006 (User Story 2 - styling)
3. Complete T007-T010 (Polish - verification)

### Estimated Effort

- Total tasks: 10
- User Story 1: 3 tasks (core functionality)
- User Story 2: 3 tasks (visual polish)
- Polish: 4 tasks (verification)
- Estimated time: 15-30 minutes total

---

## Notes

- All tasks modify a single file: `src/components/settings/SettingsPanel.tsx`
- No new files created (inline implementation as per plan.md decision)
- No new dependencies required (plugin-opener already installed)
- URL is hardcoded: `https://www.buymeacoffee.com/braindaamage`
- Error handling: Silent console.error on failure (OS handles missing browser)
