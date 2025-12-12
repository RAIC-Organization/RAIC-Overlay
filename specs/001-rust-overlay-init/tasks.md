# Tasks: RAIC Overlay Project Initialization

**Input**: Design documents from `/specs/001-rust-overlay-init/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Constitution Testing Standards, integration/component tests are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Rust backend**: `src-tauri/src/`
- **React frontend**: `src/`
- **Configuration**: `src-tauri/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Tauri project with Rust 1.92 and React 19.2

- [X] T001 Initialize Tauri project using `npm create tauri-app@latest` with react-ts template
- [X] T002 Update package.json to use React 19.2 and React DOM 19.2
- [X] T003 [P] Add @tauri-apps/plugin-global-shortcut dependency to package.json
- [X] T004 [P] Add tauri-plugin-global-shortcut = "2.0.0" to src-tauri/Cargo.toml
- [X] T005 [P] Configure ESLint for TypeScript in eslint.config.js
- [X] T006 [P] Configure Clippy for Rust (default with cargo)
- [X] T007 Verify project builds with `npm run tauri dev`

---

## Phase 2: Foundational (Window Configuration)

**Purpose**: Configure the overlay window properties that ALL user stories depend on

**⚠️ CRITICAL**: User story implementation cannot begin until window is properly configured

- [X] T008 Configure transparent overlay window in src-tauri/tauri.conf.json with settings: width=400, height=60, decorations=false, transparent=true, alwaysOnTop=true, visible=false, skipTaskbar=true
- [X] T009 Create capabilities file src-tauri/capabilities/default.json with permissions: core:default, core:window:allow-show, core:window:allow-hide, core:window:allow-set-ignore-cursor-events, core:window:allow-set-position, core:window:allow-set-always-on-top, global-shortcut:allow-register
- [X] T010 Create TypeScript types file src/types/overlay.ts with OverlayState interface (visible, initialized booleans)
- [X] T011 [P] Create TypeScript IPC types file src/types/ipc.ts with OverlayReadyPayload and SetVisibilityParams interfaces
- [X] T012 [P] Create Rust types file src-tauri/src/types.rs with OverlayReadyPayload, Position, and OverlayStateResponse structs
- [X] T013 Create base CSS file src/styles/overlay.css with transparent html/body background

**Checkpoint**: Foundation ready - overlay window configured, types defined

---

## Phase 3: User Story 1 - Launch Overlay Application (Priority: P1) 🎯 MVP

**Goal**: Application launches and creates an invisible transparent window that functions as standalone

**Independent Test**: Launch the application and verify:
1. Window exists but is not visible (check process running)
2. Game inputs are not blocked (click-through works)
3. Application appears in running processes

### Tests for User Story 1

- [ ] T044 [P] [US1] Create integration test for app launch verifying process starts and window initializes in tests/rust/launch_test.rs
- [ ] T045 [P] [US1] Create integration test for click-through behavior verifying mouse events pass through in tests/rust/clickthrough_test.rs

### Implementation for User Story 1

- [X] T014 [US1] Create Rust state module src-tauri/src/state.rs with OverlayState struct using AtomicBool for visible and initialized fields
- [X] T015 [US1] Create Rust window module src-tauri/src/window.rs with position_at_top_center function to calculate window position
- [X] T016 [US1] Update src-tauri/src/main.rs to initialize OverlayState and configure transparent window on startup
- [X] T017 [US1] Implement window click-through on startup by calling set_ignore_cursor_events(true) in src-tauri/src/main.rs
- [X] T018 [US1] Emit overlay-ready event from Rust after window initialization in src-tauri/src/main.rs
- [X] T019 [US1] Create React entry point src/main.tsx that renders App component with transparent background
- [X] T020 [US1] Create src/App.tsx with OverlayState (visible=false, initialized=false) and listener for overlay-ready event
- [X] T021 [US1] Add lib.rs exports in src-tauri/src/lib.rs for state, window, and types modules

**Checkpoint**: Application launches with invisible overlay window, click-through enabled, process visible

---

## Phase 4: User Story 2 - Toggle Overlay Visibility with F3 (Priority: P1)

**Goal**: F3 global hotkey toggles the overlay panel visibility with <100ms response

**Independent Test**: Press F3 while application is running and verify:
1. Panel becomes visible on first press
2. Panel hides on second press
3. Response time is under 100ms
4. Works regardless of which window has focus

### Tests for User Story 2

- [ ] T046 [P] [US2] Create integration test for F3 hotkey registration and toggle event emission in tests/rust/hotkey_test.rs
- [ ] T047 [P] [US2] Create integration test verifying toggle response time <100ms in tests/rust/performance_test.rs

### Implementation for User Story 2

- [X] T022 [US2] Create Rust hotkey module src-tauri/src/hotkey.rs with F3 registration using tauri-plugin-global-shortcut Builder pattern
- [X] T023 [US2] Implement hotkey handler in src-tauri/src/hotkey.rs that emits toggle-overlay event when F3 pressed
- [X] T024 [US2] Register global-shortcut plugin in src-tauri/src/main.rs with the hotkey handler
- [X] T025 [US2] Register F3 shortcut in Tauri setup hook using app.global_shortcut().register("F3") in src-tauri/src/main.rs
- [X] T026 [US2] Create Rust command set_visibility in src-tauri/src/main.rs that toggles ignore_cursor_events and window visibility
- [X] T027 [US2] Add toggle-overlay event listener in src/App.tsx that toggles visible state
- [X] T028 [US2] Call invoke('set_visibility', { visible }) from src/App.tsx when visibility state changes
- [X] T029 [US2] Add debouncing (50ms) for rapid F3 presses in src-tauri/src/hotkey.rs to prevent glitches

**Checkpoint**: F3 toggles overlay visibility, click-through toggles with visibility, <100ms response

---

## Phase 5: User Story 3 - Overlay Panel Display (Priority: P2)

**Goal**: Visible header panel displays with black background, border, and "RAIC Overlay" title at top center

**Independent Test**: Trigger overlay visible and verify:
1. Black background (#000000)
2. Visible border around panel
3. "RAIC Overlay" title displayed
4. Panel positioned at top center of screen
5. Dimensions approximately 400px × 60px

### Tests for User Story 3

- [X] T048 [P] [US3] Create React component test for HeaderPanel rendering with correct props in tests/react/HeaderPanel.test.tsx
- [X] T049 [P] [US3] Create visual test verifying HeaderPanel dimensions (400x60), black background, and border in tests/react/HeaderPanel.test.tsx

### Implementation for User Story 3

- [X] T030 [P] [US3] Create HeaderPanel component src/components/HeaderPanel.tsx that renders div with h1 "RAIC Overlay" when visible prop is true
- [X] T031 [P] [US3] Add panel styles to src/styles/overlay.css: .header-panel with width=400px, height=60px, background=#000000, border=2px solid #444444, border-radius=4px, flexbox centering
- [X] T032 [P] [US3] Add title styles to src/styles/overlay.css: .header-panel h1 with color=#ffffff, font-size=18px, font-weight=600, font-family=system fonts
- [X] T033 [US3] Import and render HeaderPanel in src/App.tsx passing visible state as prop
- [X] T034 [US3] Import overlay.css in src/App.tsx
- [X] T035 [US3] Implement top-center positioning in src/App.tsx using currentMonitor() and setPosition() on app startup
- [X] T050 [US3] Implement WCAG 2.1 AA accessibility in src/components/HeaderPanel.tsx: aria-live region, sufficient color contrast (#ffffff on #000000 = 21:1), keyboard focus handling

**Checkpoint**: Panel displays correctly with all visual specifications met and accessibility requirements

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance, and final validation

- [X] T036 Handle edge case: Star Citizen not running - overlay still launches (no changes needed, standalone by design)
- [X] T037 Handle edge case: Rapid F3 presses - verify debouncing prevents glitches (50ms debounce implemented)
- [X] T038 Handle edge case: Game closes while overlay running - overlay continues (no changes needed)
- [X] T039 [P] Add error handling for hotkey registration failure in src-tauri/src/main.rs with user-friendly error message
- [X] T040 [P] Add error handling for window operations in src-tauri/src/main.rs
- [ ] T041 Verify startup time <3s with release build (npm run tauri build)
- [ ] T042 Verify toggle response <100ms with manual testing
- [ ] T043 Run quickstart.md validation to ensure setup instructions work
- [X] T051 [P] Configure GitHub Actions CI workflow in .github/workflows/ci.yml with cargo test and npm test
- [ ] T052 Add performance benchmark for toggle response time in tests/rust/performance_test.rs to run in CI
- [X] T053 Verify HeaderPanel meets WCAG 2.1 AA: color contrast ratio ≥4.5:1, screen reader announces title, no keyboard traps (verified via tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Creates launchable app
- **User Story 2 (Phase 4)**: Depends on User Story 1 - Adds F3 toggle to existing app
- **User Story 3 (Phase 5)**: Depends on User Story 2 - Adds visual panel to toggle
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (needs running app to toggle)
- **User Story 3 (P2)**: Depends on US2 (needs toggle to show panel)

**Note**: For this feature, user stories are sequential because each builds on the previous. US2 needs US1's window, US3 needs US2's toggle.

### Within Each User Story

- Rust modules before main.rs integration
- Backend before frontend (events must exist before listeners)
- Types before implementation
- Core functionality before edge cases

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003 + T004 + T005 + T006 (all parallel - different files)
```

**Phase 2 (Foundational)**:
```
T011 + T012 (parallel - different files)
```

**Phase 5 (US3)**:
```
T030 + T031 + T032 (parallel - different files/concerns)
```

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch these tasks together:
Task: "Create TypeScript IPC types file src/types/ipc.ts"
Task: "Create Rust types file src-tauri/src/types.rs"
```

## Parallel Example: User Story 3

```bash
# Launch these tasks together:
Task: "Create HeaderPanel component src/components/HeaderPanel.tsx"
Task: "Add panel styles to src/styles/overlay.css"
Task: "Add title styles to src/styles/overlay.css"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (App launches)
4. Complete Phase 4: User Story 2 (F3 toggle works)
5. **STOP and VALIDATE**: F3 now toggles something (even without styled panel)
6. Continue to User Story 3 for styled panel

### Recommended Order

Since user stories are dependent in this feature:
1. **Setup** → Foundation ready
2. **Foundational** → Window configured
3. **US1** → App launches invisibly ✓
4. **US2** → F3 toggles visibility ✓
5. **US3** → Panel looks correct ✓
6. **Polish** → Edge cases handled ✓

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- This feature has sequential user stories (US1 → US2 → US3)
- Commit after each phase completion
- Verify F3 works before investing in panel styling
- Total: 53 tasks across 6 phases (including tests, CI, and accessibility)
