# Tasks: Check for Update Button in Settings Panel

**Input**: Design documents from `/specs/052-settings-update-button/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Not requested - manual testing per existing project pattern

**Testing Standards Compliance**: Manual testing satisfies Constitution Principle II for this feature because:
- Feature is frontend-only (~80 LOC) with no complex logic
- Reuses existing, tested backend commands (check_for_updates, open_update_window)
- Manual test scenarios fully defined in quickstart.md
- Project follows manual testing pattern for UI-only features per existing convention

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - this feature extends an existing project

- [X] T001 Verify existing Settings panel loads correctly by running `pnpm tauri dev` and opening Settings from tray

**Checkpoint**: Existing infrastructure verified

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the base UpdatesSection component structure that all user stories build upon

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create UpdatesSection component skeleton in src/components/settings/UpdatesSection.tsx with section header following existing pattern (icon + "Updates" title)
- [X] T003 Add version display to UpdatesSection using getVersion() from @tauri-apps/api/app in src/components/settings/UpdatesSection.tsx
- [X] T004 Import and render UpdatesSection in src/components/settings/SettingsPanel.tsx after Startup section

**Checkpoint**: Foundation ready - UpdatesSection visible in Settings with version display

---

## Phase 3: User Story 1 - Manual Update Check from Settings (Priority: P1) 🎯 MVP

**Goal**: User can click "Check for Updates" button and either see the update window (if update available) or an "up to date" message

**Independent Test**: Open Settings panel, click "Check for Updates", verify either update notification window opens or inline "You're running the latest version" message appears

### Implementation for User Story 1

- [X] T005 [US1] Add "Check for Updates" button to UpdatesSection in src/components/settings/UpdatesSection.tsx using shadcn Button with RefreshCw icon from lucide-react
- [X] T006 [US1] Implement handleCheckForUpdates function that invokes check_for_updates Tauri command in src/components/settings/UpdatesSection.tsx
- [X] T007 [US1] Add status state for inline messages with type 'idle' | 'success' | 'error' and message string in src/components/settings/UpdatesSection.tsx
- [X] T008 [US1] Display inline success message "You're running the latest version (vX.X.X)" below button when updateAvailable is false in src/components/settings/UpdatesSection.tsx
- [X] T009 [US1] Clear status message when starting a new check in src/components/settings/UpdatesSection.tsx
- [X] T009a [US1] Verify existing update window is focused (not duplicated) when clicking "Check for Updates" while update window is already open - handled by backend open_update_window logic in src-tauri/src/update/window.rs

**Checkpoint**: User Story 1 complete - core update check functionality works

---

## Phase 4: User Story 2 - Feedback During Update Check (Priority: P2)

**Goal**: User sees loading indicator on button during update check and button is disabled to prevent duplicate clicks

**Independent Test**: Click "Check for Updates" and observe button shows spinner with "Checking..." text and is not clickable until check completes

### Implementation for User Story 2

- [X] T010 [US2] Add isChecking boolean state to track update check in progress in src/components/settings/UpdatesSection.tsx
- [X] T011 [US2] Set isChecking=true before invoking check_for_updates and isChecking=false in finally block in src/components/settings/UpdatesSection.tsx
- [X] T012 [US2] Add disabled={isChecking} prop to Check for Updates button in src/components/settings/UpdatesSection.tsx
- [X] T013 [US2] Conditionally render Loader2 spinner icon with animate-spin when isChecking=true, showing "Checking..." text in src/components/settings/UpdatesSection.tsx

**Checkpoint**: User Story 2 complete - loading feedback works during update check

---

## Phase 5: User Story 3 - Handle Check Failure Gracefully (Priority: P3)

**Goal**: User sees inline error message when update check fails due to network issues or GitHub unreachable

**Independent Test**: Disconnect from network, click "Check for Updates", verify red error message "Unable to check for updates. Please try again later." appears below button

### Implementation for User Story 3

- [X] T014 [US3] Wrap check_for_updates invoke in try-catch block in handleCheckForUpdates function in src/components/settings/UpdatesSection.tsx
- [X] T015 [US3] Set status to error type with user-friendly message when invoke throws in src/components/settings/UpdatesSection.tsx
- [X] T016 [US3] Style error status message with text-red-400 class in src/components/settings/UpdatesSection.tsx

**Checkpoint**: User Story 3 complete - error handling works for network failures

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [X] T017 Run TypeScript check with pnpm tsc --noEmit to verify no type errors
- [X] T018 Run linter with pnpm lint to verify code style
- [X] T019 Run quickstart.md manual test flow to validate all acceptance scenarios
- [X] T020 Build application with pnpm tauri build to verify production build succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: Depends on Setup - creates component structure
- **User Story 1 (Phase 3)**: Depends on Foundational - core button functionality
- **User Story 2 (Phase 4)**: Depends on User Story 1 - loading state (enhances US1)
- **User Story 3 (Phase 5)**: Depends on User Story 1 - error handling (enhances US1)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - implements core check functionality
- **User Story 2 (P2)**: Enhances US1 - adds loading state to existing button
- **User Story 3 (P3)**: Enhances US1 - adds error handling to existing function

Note: All user stories modify the same file (UpdatesSection.tsx), so they should be done sequentially in priority order rather than in parallel.

### Within Each User Story

- Implementation tasks should be done sequentially as each builds on the previous
- Each task is small and focused on a single concern

---

## Parallel Example: Foundational Phase

```bash
# T002 and T003 work on the same file so must be sequential
# T004 can only run after T002/T003 complete

# Sequential execution required:
T002 → T003 → T004
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify existing project)
2. Complete Phase 2: Foundational (create component, add to Settings)
3. Complete Phase 3: User Story 1 (button + success message)
4. **STOP and VALIDATE**: Test button works, shows update window or "up to date" message
5. Ship MVP if acceptable

### Incremental Delivery

1. Setup + Foundational → UpdatesSection visible with version
2. Add User Story 1 → Button triggers check, shows result → Ship MVP
3. Add User Story 2 → Loading indicator during check → Ship enhancement
4. Add User Story 3 → Error handling for failures → Ship final version
5. Polish → Clean build, validated tests → Production ready

---

## Notes

- All user stories modify the same component file (UpdatesSection.tsx)
- Sequential execution recommended due to file overlap
- Each story adds incremental value to the same button
- Manual testing per quickstart.md between stories
- Total estimated: ~80 lines of TypeScript/React code
