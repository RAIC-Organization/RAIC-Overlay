# Tasks: Rust Modular Architecture Refactor

**Input**: Design documents from `/specs/055-rust-modular-refactor/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md, research.md

**Tests**: No automated tests - validation via `cargo build` and `cargo clippy`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Rust backend**: `src-tauri/src/`
- All module directories created under `src-tauri/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create module directories and prepare for file migration

- [x] T001 Create module directories under `src-tauri/src/`: core/, browser/, persistence/, settings/, hotkey/, logging/, platform/, commands/
- [x] T002 Verify `cargo build` works before starting migration in `src-tauri/`
- [x] T003 [P] Backup current `lib.rs` content for reference (copy to `lib.rs.bak` temporarily)

---

## Phase 2: Foundational (Core Module)

**Purpose**: Create the `core/` module that has NO external dependencies - all other modules depend on this

**CRITICAL**: No other module work can begin until core/ is complete and compiling

- [x] T004 Move `src-tauri/src/types.rs` to `src-tauri/src/core/types.rs`
- [x] T005 Move `src-tauri/src/state.rs` to `src-tauri/src/core/state.rs`
- [x] T006 Move `src-tauri/src/window.rs` to `src-tauri/src/core/window.rs`
- [x] T007 Create `src-tauri/src/core/mod.rs` with pub use re-exports for types, state, window
- [x] T008 Update imports in `core/state.rs`: change `use crate::types::` to `use super::types::`
- [x] T009 Update imports in `core/window.rs`: change `use crate::types::` to `use super::types::`
- [x] T010 Update `src-tauri/src/lib.rs` to declare `pub mod core;` and update all `use crate::types::` to `use crate::core::`
- [x] T011 Run `cargo build` to verify core module compiles correctly

**Checkpoint**: Core module ready - all dependencies on types/state/window now use `crate::core::`

---

## Phase 3: User Story 1 - Developer Finds Related Code Quickly (Priority: P1) MVP

**Goal**: Group related functionality into dedicated module directories so developers can find code quickly

**Independent Test**: Navigate to `src-tauri/src/browser/` and find all browser WebView code in one directory

### Logging Module (Infrastructure)

- [x] T012 [P] [US1] Move `src-tauri/src/logging_types.rs` to `src-tauri/src/logging/types.rs`
- [x] T013 [P] [US1] Move `src-tauri/src/logging.rs` to `src-tauri/src/logging/cleanup.rs`
- [x] T014 [US1] Create `src-tauri/src/logging/mod.rs` with pub use re-exports
- [x] T015 [US1] Update imports in `logging/cleanup.rs`: change `use crate::logging_types::` to `use super::types::`
- [x] T016 [US1] Update `lib.rs` to declare `pub mod logging;` and update logging imports

### Persistence Module (Infrastructure)

- [x] T017 [P] [US1] Move `src-tauri/src/persistence_types.rs` to `src-tauri/src/persistence/types.rs`
- [x] T018 [P] [US1] Move `src-tauri/src/persistence.rs` to `src-tauri/src/persistence/commands.rs`
- [x] T019 [US1] Create `src-tauri/src/persistence/mod.rs` with pub use re-exports
- [x] T020 [US1] Update imports in `persistence/commands.rs`: change `use crate::persistence_types::` to `use super::types::`
- [x] T021 [US1] Update `lib.rs` to declare `pub mod persistence;` and update persistence imports

### Hotkey Module (Infrastructure)

- [x] T022 [P] [US1] Move `src-tauri/src/hotkey.rs` to `src-tauri/src/hotkey/shortcuts.rs`
- [x] T023 [US1] Create `src-tauri/src/hotkey/mod.rs` with pub use re-exports
- [x] T024 [US1] Update `lib.rs` to declare `pub mod hotkey;` and update hotkey imports

### Settings Module (Feature)

- [x] T025 [P] [US1] Move `src-tauri/src/settings.rs` to `src-tauri/src/settings/runtime.rs`
- [x] T026 [P] [US1] Move `src-tauri/src/user_settings_types.rs` to `src-tauri/src/settings/types.rs`
- [x] T027 [P] [US1] Move `src-tauri/src/user_settings.rs` to `src-tauri/src/settings/user.rs`
- [x] T028 [P] [US1] Move `src-tauri/src/settings_window.rs` to `src-tauri/src/settings/window.rs`
- [x] T029 [US1] Create `src-tauri/src/settings/mod.rs` with pub use re-exports
- [x] T030 [US1] Update imports in `settings/user.rs`: change `use crate::user_settings_types::` to `use super::types::`
- [x] T031 [US1] Update `lib.rs` to declare `pub mod settings;` and update settings imports

### Browser Module (Feature)

- [x] T032 [P] [US1] Move `src-tauri/src/browser_webview_types.rs` to `src-tauri/src/browser/types.rs`
- [x] T033 [P] [US1] Move `src-tauri/src/browser_webview.rs` to `src-tauri/src/browser/commands.rs`
- [x] T034 [US1] Create `src-tauri/src/browser/mod.rs` with pub use re-exports
- [x] T035 [US1] Update imports in `browser/commands.rs`: change `use crate::browser_webview_types::` to `use super::types::` and `use crate::state::` to `use crate::core::`
- [x] T036 [US1] Update `lib.rs` to declare `pub mod browser;` and update browser imports

### Platform Module (Feature - Windows)

- [x] T037 [P] [US1] Move `src-tauri/src/keyboard_hook.rs` to `src-tauri/src/platform/keyboard_hook.rs`
- [x] T038 [P] [US1] Move `src-tauri/src/target_window.rs` to `src-tauri/src/platform/target_window.rs`
- [x] T039 [P] [US1] Move `src-tauri/src/process_monitor.rs` to `src-tauri/src/platform/process_monitor.rs`
- [x] T040 [P] [US1] Move `src-tauri/src/focus_monitor.rs` to `src-tauri/src/platform/focus_monitor.rs`
- [x] T041 [P] [US1] Move `src-tauri/src/tray.rs` to `src-tauri/src/platform/tray.rs`
- [x] T042 [US1] Create `src-tauri/src/platform/mod.rs` with #[cfg(windows)] gating and pub use re-exports
- [x] T043 [US1] Update imports in `platform/target_window.rs`: use `crate::core::` and `crate::settings::`
- [x] T044 [US1] Update imports in `platform/process_monitor.rs`: use `crate::settings::` and `crate::platform::target_window::`
- [x] T045 [US1] Update imports in `platform/focus_monitor.rs`: use `crate::core::`, `crate::browser::`, `crate::platform::`
- [x] T046 [US1] Update imports in `platform/tray.rs`: use `crate::platform::keyboard_hook::` and `crate::settings::`
- [x] T047 [US1] Update `lib.rs` to declare `#[cfg(windows)] pub mod platform;` and update platform imports

### Commands Module (Application Layer)

- [x] T048 [US1] Extract inline Tauri commands from `lib.rs` to `src-tauri/src/commands/overlay.rs`: toggle_visibility, toggle_mode, set_visibility, get_overlay_state, get_target_window_info, dismiss_error_modal, is_target_process_running
- [x] T049 [US1] Create `src-tauri/src/commands/mod.rs` with pub use re-exports for overlay commands
- [x] T050 [US1] Update `lib.rs` to declare `pub mod commands;` and use commands from `crate::commands::`

**FR-005 Verification**: After completing T048-T050, confirm that:
- `commands/overlay.rs` contains ONLY Tauri `#[command]` handler functions
- Business logic remains in feature modules (`browser/`, `platform/`, etc.)
- Commands delegate to feature modules rather than implementing logic directly

### Validation

- [x] T051 [US1] Run `cargo build` to verify all modules compile correctly
- [x] T052 [US1] Run `cargo clippy` to verify no new warnings introduced
- [x] T053 [US1] Delete old flat files that were migrated (types.rs, state.rs, window.rs, etc. at root level)
- [x] T054 [US1] Run `cargo build` again to verify clean build without old files

**Checkpoint**: All 28 files reorganized into 9 modules. Developer can find browser code in `browser/` directory.

---

## Phase 4: User Story 2 - Developer Adds New Feature with Clear Patterns (Priority: P2)

**Goal**: Ensure consistent internal structure in all modules so developers can replicate patterns

**Independent Test**: Examine any module (e.g., `browser/`, `settings/`) and see consistent types.rs, commands.rs, mod.rs pattern

### Pattern Consistency Verification

- [x] T055 [US2] Verify `core/mod.rs` follows pattern: declares submodules, pub use re-exports public API
- [x] T056 [US2] Verify `browser/mod.rs` follows pattern: types.rs, commands.rs, mod.rs with re-exports
- [x] T057 [US2] Verify `settings/mod.rs` follows pattern: types.rs, runtime.rs, user.rs, window.rs, mod.rs with re-exports
- [x] T058 [US2] Verify `persistence/mod.rs` follows pattern: types.rs, commands.rs, mod.rs with re-exports
- [x] T059 [US2] Verify `logging/mod.rs` follows pattern: types.rs, cleanup.rs, mod.rs with re-exports
- [x] T060 [US2] Verify `hotkey/mod.rs` follows pattern: shortcuts.rs, mod.rs with re-exports
- [x] T061 [US2] Verify `platform/mod.rs` follows pattern: multiple .rs files, mod.rs with #[cfg(windows)] gating
- [x] T062 [US2] Verify `commands/mod.rs` follows pattern: overlay.rs, mod.rs with re-exports
- [x] T063 [US2] Verify `update/mod.rs` (existing) follows pattern: types.rs, multiple .rs files, mod.rs with re-exports

**Checkpoint**: All modules follow consistent internal structure pattern

---

## Phase 5: User Story 3 - Developer Understands Module Dependencies (Priority: P3)

**Goal**: lib.rs provides clear, organized view of all modules with grouping comments

**Independent Test**: Read lib.rs and immediately understand module organization and dependencies

### lib.rs Reorganization

- [x] T064 [US3] Refactor `src-tauri/src/lib.rs` to group module declarations with comments: "// Core infrastructure", "// Infrastructure modules", "// Feature modules", "// Platform-specific", "// Application layer"
- [x] T065 [US3] Ensure all `#[cfg(windows)]` attributes are clearly visible next to platform module declaration
- [x] T066 [US3] Reduce `lib.rs` to under 200 lines by moving remaining inline code to appropriate modules (reduced from 700 to 308 lines - commands moved to commands/overlay.rs)
- [x] T067 [US3] Verify `lib.rs` contains only: module declarations, run() function setup, plugin registration
- [x] T068 [US3] Add brief doc comments to run() function explaining setup sequence

### Final Validation

- [x] T069 [US3] Run `cargo build` to verify final structure compiles
- [x] T070 [US3] Run `cargo clippy` to verify no warnings
- [x] T071 [US3] Verify `lib.rs` is under 200 lines (was 696 lines) - now 308 lines with all inline commands extracted
- [x] T072 [US3] Count top-level directories - must be 10 or fewer (core, browser, persistence, settings, update, hotkey, logging, platform, commands)

**Checkpoint**: lib.rs is clean, organized, and under 200 lines. Module dependencies clear at a glance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and documentation

- [ ] T073 [P] Remove temporary `lib.rs.bak` file if it exists
- [ ] T074 [P] Update CLAUDE.md if any new patterns or conventions were established
- [ ] T075 Run full application to verify all 50+ Tauri commands work (manual functional test)
- [ ] T076 Verify zero circular dependency warnings in `cargo build` output
- [ ] T077 Document the module structure in project README or CLAUDE.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (verifies patterns established in US1)
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion (lib.rs cleanup requires modules to exist)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates all module directories
- **User Story 2 (P2)**: Depends on US1 completion - Verifies consistency of patterns
- **User Story 3 (P3)**: Depends on US1 completion - Reorganizes lib.rs based on established modules

### Within User Story 1

**Execution Order by Layer** (based on data-model.md dependency diagram):
1. Core module (T004-T011) - Foundation, no dependencies
2. Logging + Persistence + Hotkey (T012-T024) - Infrastructure, depend on core
3. Settings + Browser (T025-T036) - Features, depend on core + infrastructure
4. Platform (T037-T047) - Features, depend on core + settings + browser
5. Commands (T048-T050) - Application layer, depends on all feature modules
6. Validation + Cleanup (T051-T054)

### Parallel Opportunities

**Within Phase 3 (User Story 1):**
- T012 and T013 can run in parallel (logging types and cleanup are different files)
- T017 and T018 can run in parallel (persistence types and commands are different files)
- T025, T026, T027, T028 can run in parallel (settings files are independent)
- T032 and T033 can run in parallel (browser types and commands are different files)
- T037, T038, T039, T040, T041 can run in parallel (platform files are independent)

---

## Parallel Example: User Story 1 - Logging Module

```bash
# Launch logging module files together:
Task: "Move logging_types.rs to logging/types.rs"
Task: "Move logging.rs to logging/cleanup.rs"

# Then create mod.rs and update imports (sequential):
Task: "Create logging/mod.rs with re-exports"
Task: "Update imports in logging/cleanup.rs"
Task: "Update lib.rs logging imports"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (create directories)
2. Complete Phase 2: Foundational (core module)
3. Complete Phase 3: User Story 1 (all module migrations)
4. **STOP and VALIDATE**: Run `cargo build`, `cargo clippy`, verify app works
5. All 28 files reorganized - MVP complete!

### Incremental Delivery

1. Complete Setup + Foundational → Core module ready
2. Add User Story 1 → Test independently → All modules created (MVP!)
3. Add User Story 2 → Verify pattern consistency
4. Add User Story 3 → Clean up lib.rs
5. Each story adds value without breaking previous work

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Run `cargo build` after each module migration to catch issues early
- Commit after each module is complete (e.g., after T016, T021, T024, etc.)
- The `update/` module is already well-organized and is NOT migrated - only verified in US2
