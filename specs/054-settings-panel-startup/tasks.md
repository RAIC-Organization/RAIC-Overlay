# Tasks: Settings Panel Startup Behavior

**Input**: Design documents from `/specs/054-settings-panel-startup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual integration tests included per Constitution II (see Phase 5.1). Tauri desktop UI features use manual verification with formal test steps.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `src-tauri/src/` (Rust)
- **Frontend**: `src/` (TypeScript/React)

---

## Phase 1: Setup

**Purpose**: No setup required - extending existing project structure

This feature extends existing files only. No new project initialization needed.

**Checkpoint**: Proceed directly to Phase 2.

---

## Phase 2: Foundational (Data Model Extension)

**Purpose**: Extend UserSettings entity with `startMinimized` field in both Rust and TypeScript

**⚠️ CRITICAL**: These data model changes must be complete before any user story can be implemented

- [x] T001 [P] Add `start_minimized: bool` field with `#[serde(default)]` attribute to `UserSettings` struct in `src-tauri/src/user_settings_types.rs`
- [x] T002 [P] Update `Default` impl for `UserSettings` to set `start_minimized: false` in `src-tauri/src/user_settings_types.rs`
- [x] T003 [P] Add `startMinimized: boolean` field to `UserSettings` interface in `src/types/user-settings.ts`
- [x] T004 [P] Add `startMinimized: false` to `DEFAULT_USER_SETTINGS` constant in `src/types/user-settings.ts`

**Checkpoint**: Data model extended - user story implementation can now begin

---

## Phase 3: User Story 1 - First-Time User Sees Settings Panel (Priority: P1) 🎯 MVP

**Goal**: When a user launches the application for the first time (or with default settings), the Settings panel opens automatically

**Independent Test**: Launch the application with a fresh/default user-settings.json and verify the Settings panel appears automatically

### Implementation for User Story 1

- [x] T005 [US1] Add `get_start_minimized()` function to read cached preference from `USER_SETTINGS` in `src-tauri/src/user_settings.rs`
- [x] T006 [US1] Add startup logic in `setup()` callback to conditionally open Settings window in `src-tauri/src/lib.rs`
- [x] T007 [US1] Import `settings_window` module in startup logic (if not already) in `src-tauri/src/lib.rs`

**Checkpoint**: At this point, fresh installs should show Settings panel on startup

---

## Phase 4: User Story 2 - Returning User Enables Silent Start (Priority: P2)

**Goal**: User can toggle "Start Minimized" checkbox in Settings to control startup behavior

**Independent Test**: Enable the "Start Minimized" checkbox in Settings, save, restart the app, and verify no Settings panel appears

### Implementation for User Story 2

- [x] T008 [US2] Create `StartMinimizedToggle.tsx` component following `AutoStartToggle.tsx` pattern in `src/components/settings/StartMinimizedToggle.tsx`
- [x] T009 [US2] Export `StartMinimizedToggle` from settings module in `src/components/settings/index.ts` (if exists)
- [x] T010 [US2] Import `StartMinimizedToggle` component in `src/components/settings/SettingsPanel.tsx`
- [x] T011 [US2] Render `StartMinimizedToggle` in Startup section of `src/components/settings/SettingsPanel.tsx`
- [x] T012 [US2] Wire up `settings.startMinimized` state and `onChange` handler in `src/components/settings/SettingsPanel.tsx`

**Checkpoint**: Users can toggle the "Start Minimized" preference in the Settings panel

---

## Phase 5: User Story 3 - Settings Persistence Across Sessions (Priority: P3)

**Goal**: The "Start Minimized" preference persists and is correctly loaded on each app restart

**Independent Test**: Set the preference, close the app completely, reopen it, and verify the saved preference is loaded correctly

### Implementation for User Story 3

> **NOTE**: Persistence is automatically handled by existing infrastructure once the data model is extended (T001-T004) and UI wires up the state (T012). This phase is verification only.

- [ ] T013 [US3] Verify existing `save_user_settings` command serializes `startMinimized` field in `src-tauri/src/user_settings.rs`
- [ ] T014 [US3] Verify existing `load_user_settings` command deserializes `startMinimized` field (with default fallback) in `src-tauri/src/user_settings.rs`
- [ ] T015 [US3] Verify `init_user_settings` caches `startMinimized` field on startup in `src-tauri/src/user_settings.rs`

**Checkpoint**: All user stories complete - Settings panel startup behavior fully functional

---

## Phase 5.1: Verification Tests (Manual)

**Purpose**: Formal verification per Constitution II - Testing Standards

> **NOTE**: These are manual integration tests documented as formal acceptance verification.

- [ ] T013a [US1] **TEST**: Fresh install verification - delete user-settings.json, launch app, verify Settings panel opens within 2 seconds
- [ ] T013b [US2] **TEST**: Toggle verification - enable "Start Minimized", save, restart app, verify Settings panel does NOT open
- [ ] T013c [US2] **TEST**: Disable verification - disable "Start Minimized", save, restart app, verify Settings panel opens
- [ ] T013d [US3] **TEST**: Persistence verification - set preference, fully close app (check tray), reopen, verify preference persisted
- [ ] T013e [US3] **TEST**: Corruption recovery - corrupt user-settings.json with invalid JSON, launch app, verify Settings panel opens (default behavior)

**Checkpoint**: All manual tests pass - feature verified per acceptance criteria

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Logging and edge case handling

- [ ] T016 Add debug logging for startup preference read in `src-tauri/src/lib.rs`
- [ ] T017 Add warn logging if Settings window fails to open on startup in `src-tauri/src/lib.rs`
- [ ] T018 Verify duplicate window prevention still works (existing `open_settings_window` handles this)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup needed - proceed to Phase 2
- **Foundational (Phase 2)**: Data model extension - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Phase 2 completion
  - User Story 1 (P1): Backend startup logic
  - User Story 2 (P2): Frontend UI component
  - User Story 3 (P3): Verification of existing persistence
- **Polish (Phase 6)**: After all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T001-T004 (data model) - Backend only
- **User Story 2 (P2)**: Depends on T001-T004 (data model) - Frontend only, can run in parallel with US1
- **User Story 3 (P3)**: Depends on T001-T004 (data model) - Verification only, can run after US1 and US2

### Within Each Phase

- T001-T004 are all [P] - can run in parallel (different files)
- T005-T007 are sequential (depend on each other)
- T008-T012 are mostly sequential within the SettingsPanel integration
- T013-T015 are verification tasks - can run in parallel

### Parallel Opportunities

- All Phase 2 tasks (T001-T004) can run in parallel - they modify different files
- User Story 1 (backend) and User Story 2 (frontend) can run in parallel after Phase 2
- Multiple developers can work on:
  - Developer A: Rust backend (T001-T002, T005-T007)
  - Developer B: TypeScript frontend (T003-T004, T008-T012)

---

## Parallel Example: Phase 2

```bash
# Launch all data model tasks together (4 different files):
Task: "Add start_minimized field to Rust UserSettings struct"
Task: "Update Rust Default impl"
Task: "Add startMinimized to TypeScript interface"
Task: "Add startMinimized to TypeScript defaults"
```

## Parallel Example: User Stories 1 & 2

```bash
# After Phase 2 completes, these can run in parallel:
# US1 (Backend):
Task: "Add get_start_minimized() function in user_settings.rs"
Task: "Add startup logic in lib.rs"

# US2 (Frontend) - simultaneously:
Task: "Create StartMinimizedToggle.tsx component"
Task: "Integrate into SettingsPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Data model extension (T001-T004)
2. Complete Phase 3: User Story 1 - Startup logic (T005-T007)
3. **STOP and VALIDATE**: Fresh install shows Settings panel on startup
4. Deploy if ready (core behavior change complete)

### Incremental Delivery

1. Complete Phase 2 → Data model ready
2. Add User Story 1 → Test startup behavior → **MVP deployed!**
3. Add User Story 2 → User can toggle preference → Deploy
4. Add User Story 3 → Verify persistence → Final deploy
5. Add Polish → Logging and edge cases → Complete

### Single Developer Strategy

1. T001-T004 in parallel (Phase 2)
2. T005-T007 sequentially (User Story 1)
3. T008-T012 sequentially (User Story 2)
4. T013-T015 verification (User Story 3)
5. T016-T018 polish (Phase 6)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This feature uses 100% existing patterns - no new dependencies or infrastructure needed
