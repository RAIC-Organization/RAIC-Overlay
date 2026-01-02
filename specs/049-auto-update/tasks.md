# Tasks: Auto-Update System

**Input**: Design documents from `/specs/049-auto-update/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Integration tests included per constitution II requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [X] T001 Add reqwest, semver, and tokio-stream dependencies to src-tauri/Cargo.toml
- [X] T002 Add @tauri-apps/plugin-process dependency via npm
- [X] T003 [P] Create update module directory structure at src-tauri/src/update/
- [X] T004 [P] Create update component directory structure at src/components/update/
- [X] T005 [P] Create TypeScript update types file at src/types/update.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Critical**: No user story work can begin until this phase is complete

- [X] T006 Create update types module at src-tauri/src/update/types.rs with UpdateState, GitHubRelease, ReleaseAsset, UpdateInfo, UpdateCheckResult, DownloadEvent
- [X] T007 Create update state persistence module at src-tauri/src/update/state.rs with load/save/cleanup functions
- [X] T008 Create update module exports at src-tauri/src/update/mod.rs
- [X] T009 Register tauri_plugin_process in src-tauri/src/lib.rs plugin chain
- [X] T010 Add update module import to src-tauri/src/lib.rs

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Version Check Notification (Priority: P1) MVP

**Goal**: Check GitHub for updates at startup and every 24 hours, display notification when new version available

**Independent Test**: Release a new version on GitHub, launch app, verify notification appears with version number within 5 seconds

### Implementation for User Story 1

- [X] T011 [US1] Implement GitHub API client with reqwest in src-tauri/src/update/checker.rs (fetch latest release, parse response)
- [X] T012 [US1] Implement version comparison logic using semver in src-tauri/src/update/checker.rs (compare current vs latest, strip v prefix)
- [X] T013 [US1] Implement MSI asset finder in src-tauri/src/update/checker.rs (find .msi file in release assets)
- [X] T014 [US1] Implement check_for_updates Tauri command in src-tauri/src/update/checker.rs (combines GitHub fetch, version compare, return UpdateCheckResult)
- [X] T015 [US1] Implement cleanup_old_installers Tauri command in src-tauri/src/update/state.rs (delete pending installer on startup)
- [X] T016 [US1] Register check_for_updates and cleanup_old_installers commands in src-tauri/src/lib.rs invoke_handler
- [X] T017 [P] [US1] Create UpdateNotification component at src/components/update/UpdateNotification.tsx (display version, Accept/Later buttons)
- [X] T018 [P] [US1] Create useUpdateChecker hook at src/hooks/useUpdateChecker.ts (check on mount, 24h interval, manage state)
- [X] T019 [US1] Create update component exports at src/components/update/index.ts
- [X] T020 [US1] Integrate useUpdateChecker hook and UpdateNotification in main app component
- [X] T021 [US1] Call cleanup_old_installers on app startup in useUpdateChecker hook

**Checkpoint**: User Story 1 complete - app checks for updates and shows notification

---

## Phase 4: User Story 2 - Accept Update and Auto-Install (Priority: P2)

**Goal**: Download MSI when user clicks Accept, launch installer, exit app

**Independent Test**: Click Accept on update notification, verify download completes, installer launches, app exits

### Implementation for User Story 2

- [X] T022 [US2] Implement download_update Tauri command in src-tauri/src/update/downloader.rs (streaming download with Channel progress events)
- [X] T023 [US2] Implement installer launcher in src-tauri/src/update/installer.rs (spawn msiexec, wait, exit app)
- [X] T024 [US2] Implement launch_installer_and_exit Tauri command in src-tauri/src/update/installer.rs
- [X] T025 [US2] Register download_update and launch_installer_and_exit commands in src-tauri/src/lib.rs invoke_handler
- [X] T026 [US2] Add Accept button handler in UpdateNotification.tsx that calls download_update
- [X] T027 [US2] Add download complete handler in UpdateNotification.tsx that calls launch_installer_and_exit
- [X] T028 [US2] Add error handling for download failures in UpdateNotification.tsx (show error, retry option)

**Checkpoint**: User Story 2 complete - users can accept updates and auto-install

---

## Phase 5: User Story 3 - Postpone Update (Priority: P3)

**Goal**: Allow user to dismiss notification with "Ask Again Later", re-prompt at next interval

**Independent Test**: Click "Ask Again Later", verify popup closes, restart app or wait 24h, verify notification reappears

### Implementation for User Story 3

- [ ] T029 [US3] Implement dismiss_update Tauri command in src-tauri/src/update/state.rs (update last_notified_version)
- [ ] T030 [US3] Implement get_update_state Tauri command in src-tauri/src/update/state.rs (for debugging)
- [ ] T031 [US3] Register dismiss_update and get_update_state commands in src-tauri/src/lib.rs invoke_handler
- [ ] T032 [US3] Add "Ask Again Later" button handler in UpdateNotification.tsx that calls dismiss_update and closes popup
- [ ] T033 [US3] Add popup dismiss handler (X button/click outside) in UpdateNotification.tsx that behaves like "Ask Again Later"

**Checkpoint**: User Story 3 complete - users can postpone updates

---

## Phase 6: User Story 4 - Background Download with Progress (Priority: P4)

**Goal**: Show download progress indicator during installer download

**Independent Test**: Accept update, verify progress bar shows percentage during download

### Implementation for User Story 4

- [ ] T034 [P] [US4] Create DownloadProgress component at src/components/update/DownloadProgress.tsx (progress bar, percentage, bytes downloaded)
- [ ] T035 [US4] Integrate DownloadProgress in UpdateNotification.tsx (show during download state)
- [ ] T036 [US4] Handle Channel progress events in UpdateNotification.tsx (update DownloadProgress props)
- [ ] T037 [US4] Add cancel/retry buttons to DownloadProgress component
- [ ] T038 [US4] Export DownloadProgress from src/components/update/index.ts

**Checkpoint**: User Story 4 complete - users see download progress

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T039 [P] Add logging for update operations in all src-tauri/src/update/*.rs files
- [ ] T040 [P] Add URL validation (only accept github.com URLs) in src-tauri/src/update/checker.rs
- [ ] T041 [P] Add path validation (installer must be in app data dir) in src-tauri/src/update/installer.rs
- [ ] T042 Style UpdateNotification and DownloadProgress components to match SC HUD theme
- [ ] T043 Add timeout configuration for GitHub API requests (10s) in src-tauri/src/update/checker.rs
- [ ] T044 Run cargo clippy and npm run lint, fix any issues
- [ ] T045 Manual end-to-end test per quickstart.md validation steps

---

## Phase 8: Testing

**Purpose**: Verify feature correctness per constitution II (Testing Standards)

- [ ] T046 [P] Create version comparison unit tests at tests/unit/update/version-compare.test.ts
- [ ] T047 [P] Create update state persistence unit tests at src-tauri/src/update/state.rs (inline #[cfg(test)] module)
- [ ] T048 Create update flow integration test at tests/integration/update/update-flow.test.tsx (mock GitHub API responses)
- [ ] T049 Verify all acceptance scenarios from spec.md User Stories 1-4 pass manual testing

**Checkpoint**: All tests passing, feature ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all user stories being complete
- **Testing (Phase 8)**: Depends on Polish phase - validates complete feature

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP**
- **User Story 2 (P2)**: Depends on US1 (needs notification popup to add Accept behavior)
- **User Story 3 (P3)**: Depends on US1 (needs notification popup to add Later behavior)
- **User Story 4 (P4)**: Depends on US2 (needs download flow to add progress indicator)

### Within Each User Story

- Backend commands before frontend integration
- Types/models before services
- Services before UI components
- Core implementation before polish

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003 Create update module directory
T004 Create update component directory
T005 Create TypeScript types file
```

**Phase 3 (US1)**:
```
T017 Create UpdateNotification component
T018 Create useUpdateChecker hook
```

**Phase 6 (US4)**:
```
T034 Create DownloadProgress component (independent of US1-3)
```

**Phase 7 (Polish)**:
```
T039 Add logging
T040 Add URL validation
T041 Add path validation
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test version check and notification display
5. Deploy if ready - users can now see update availability

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP: users notified of updates)
3. Add User Story 2 → Test → Deploy (users can accept and install)
4. Add User Story 3 → Test → Deploy (users can postpone)
5. Add User Story 4 → Test → Deploy (users see progress)
6. Polish → Final validation
7. Testing → All tests passing → Release

### Task Count by Phase

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 5 | 3 |
| Phase 2: Foundational | 5 | 0 |
| Phase 3: US1 (MVP) | 11 | 2 |
| Phase 4: US2 | 7 | 0 |
| Phase 5: US3 | 5 | 0 |
| Phase 6: US4 | 5 | 1 |
| Phase 7: Polish | 7 | 3 |
| Phase 8: Testing | 4 | 2 |
| **Total** | **49** | **11** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- GitHub API has 60 req/hour limit for unauthenticated requests - sufficient for startup + 24h checks
