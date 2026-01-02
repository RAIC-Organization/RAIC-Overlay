# Tasks: GitHub Release Workflow

**Input**: Design documents from `/specs/048-github-release-workflow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Workflow is tested manually via tag push.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Workflow file**: `.github/workflows/release.yml`
- **Release config**: `.github/release.yml` (for changelog categories)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create workflow file skeleton and configure release notes

- [x] T001 Create workflow file skeleton at .github/workflows/release.yml with name, trigger, and permissions sections
- [x] T002 [P] Create release notes configuration at .github/release.yml with changelog categories (features, fixes, docs, other) and exclusion patterns for merge commits and dependency updates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core workflow infrastructure that MUST be complete before build steps

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add checkout step using actions/checkout@v4 in .github/workflows/release.yml
- [x] T004 Add version extraction step with PowerShell to strip 'v' prefix from github.ref_name in .github/workflows/release.yml
- [x] T005 Add Node.js setup step using actions/setup-node@v4 with npm cache in .github/workflows/release.yml
- [x] T006 Add Rust toolchain setup step using dtolnay/rust-toolchain@stable in .github/workflows/release.yml
- [x] T007 Add Rust cache step using swatinem/rust-cache@v2 with workspace configuration in .github/workflows/release.yml

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Tag-Triggered Release Build (Priority: P1) 🎯 MVP

**Goal**: Workflow triggers on semver tags, updates version files, builds Tauri app, creates GitHub release with MSI

**Independent Test**: Push a tag like `0.1.0` to the repository and verify GitHub release appears with correct version, changelog, and MSI attachment

### Implementation for User Story 1

- [x] T008 [US1] Add tag trigger pattern in on.push.tags matching both 'v*.*.*' and '*.*.*' patterns in .github/workflows/release.yml
- [x] T009 [US1] Add PowerShell step to update version in src-tauri/tauri.conf.json using ConvertFrom-Json/ConvertTo-Json in .github/workflows/release.yml
- [x] T010 [US1] Add PowerShell step to update version in package.json using ConvertFrom-Json/ConvertTo-Json in .github/workflows/release.yml
- [x] T011 [US1] Add PowerShell step to update version in src-tauri/Cargo.toml using regex replace in .github/workflows/release.yml
- [x] T012 [US1] Add npm ci step to install frontend dependencies in .github/workflows/release.yml
- [x] T013 [US1] Add npm run build step to build frontend in .github/workflows/release.yml
- [x] T014 [US1] Add Tauri build step using 'npm run tauri build' to generate MSI installer in .github/workflows/release.yml
- [x] T015 [US1] Add GitHub release step using softprops/action-gh-release@v2 with generate_release_notes: true in .github/workflows/release.yml
- [x] T016 [US1] Configure release step to attach MSI from src-tauri/target/release/bundle/msi/*.msi in .github/workflows/release.yml
- [x] T017 [US1] Add pre-release detection using contains(github.ref_name, '-') expression in release step in .github/workflows/release.yml

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Release Verification (Priority: P2)

**Goal**: Ensure release contains correct version, organized changelog, and working MSI

**Independent Test**: Download MSI from created release and verify it installs with correct version displayed

### Implementation for User Story 2

- [x] T018 [US2] Configure release title to show version (using tag_name) in softprops/action-gh-release step in .github/workflows/release.yml

**Note**: Changelog categories and exclusion patterns are configured in T002 (Setup phase) since .github/release.yml is created once.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Build Failure Notification (Priority: P3)

**Goal**: Failed builds provide clear error messages and notifications via GitHub's standard system

**Independent Test**: Intentionally push a tag on broken code and verify workflow fails with useful error messages

### Implementation for User Story 3

- [x] T019 [US3] Add explicit step names for all workflow steps for clear failure identification in .github/workflows/release.yml
- [x] T020 [US3] Add continue-on-error: false (explicit) and fail-fast behavior to ensure clear failure points in .github/workflows/release.yml
- [x] T021 [US3] Add error output step using echo and workflow commands to surface build errors in .github/workflows/release.yml

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Add workflow comments explaining each section purpose in .github/workflows/release.yml
- [x] T023 [P] Add env section with CARGO_TERM_COLOR: always for consistent output in .github/workflows/release.yml
- [x] T024 Validate complete workflow YAML syntax using actionlint or GitHub Actions syntax checker
- [x] T025 Run quickstart.md validation by simulating first release process documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core workflow, no dependencies
- **User Story 2 (P2)**: Depends on US1 release step being implemented - Enhances release output
- **User Story 3 (P3)**: Can start after US1 - Adds error handling to existing steps

### Within Each User Story

- Version file updates (T009-T011) can run in parallel as a single combined step
- Build steps must be sequential: npm ci → npm build → tauri build
- Release step must come after build completion

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T022 and T023 can run in parallel (different sections of same file, no conflicts)
- Within US1: T009, T010, T011 can be combined into a single PowerShell step

---

## Parallel Example: User Story 1

```bash
# Version updates can be combined in single PowerShell block:
Task: "Update version in tauri.conf.json, package.json, and Cargo.toml"

# Build steps must be sequential:
Task: "npm ci" → Task: "npm run build" → Task: "npm run tauri build"

# Release step depends on build:
Task: "Create GitHub release with MSI attachment"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T007)
3. Complete Phase 3: User Story 1 (T008-T017)
4. **STOP and VALIDATE**: Push test tag to verify release creation
5. Merge if MVP ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test with tag push → MVP release workflow working!
3. Add User Story 2 → Test changelog formatting → Enhanced release notes
4. Add User Story 3 → Test failure handling → Production-ready workflow
5. Add Polish → Clean, well-documented workflow

### Single Developer Strategy

Since this is a single workflow file, recommended approach:
1. Complete all phases sequentially
2. Test with a lightweight tag (e.g., `0.0.1-test.1`) after US1
3. Delete test release and tag
4. Complete remaining user stories
5. Test with real release tag

---

## Notes

- [P] tasks = different files or non-conflicting sections
- [Story] label maps task to specific user story for traceability
- Workflow runs on `windows-latest` runner (required for MSI generation)
- GITHUB_TOKEN is automatically available in workflows with `contents: write` permission
- Pre-release detection uses hyphen check per semver spec
- Avoid: committing version changes back to repo (workflow-only updates)
