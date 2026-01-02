# Feature Specification: GitHub Release Workflow

**Feature Branch**: `048-github-release-workflow`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Create a GitHub workflow for release builds triggered by tags, setting app version from tag, building release, and creating GitHub release with changelog and MSI installer"

## Clarifications

### Session 2026-01-02

- Q: How should pre-release tags (e.g., `0.1.0-beta`, `1.0.0-rc.1`) be handled? → A: Support pre-release tags and create GitHub releases marked as "pre-release"
- Q: What should the changelog show for the first release (no previous tag)? → A: Show all commits since repository creation, with a reasonable limit of 50 commits maximum

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tag-Triggered Release Build (Priority: P1)

A developer pushes a version tag (e.g., `0.1.0`, `1.0.0`) to the repository. The system automatically detects the tag, extracts the version number, updates all version references in the codebase, builds the release version, generates a changelog from commits since the last release, creates a GitHub release page, and uploads the MSI installer as a downloadable asset.

**Why this priority**: This is the core feature - without automatic tag-triggered builds, the entire workflow has no value. It automates the most time-consuming and error-prone part of the release process.

**Independent Test**: Can be fully tested by pushing a tag like `0.1.0` to the repository and verifying that a GitHub release appears with the correct version, changelog, and MSI attachment.

**Acceptance Scenarios**:

1. **Given** a repository with commits since the last release, **When** a developer pushes tag `0.2.0`, **Then** the workflow triggers and builds version 0.2.0 of the application
2. **Given** a tag matching semantic versioning format, **When** the workflow runs, **Then** the version in `tauri.conf.json`, `Cargo.toml`, and `package.json` are updated to match the tag
3. **Given** a successful build, **When** the MSI installer is created, **Then** it is uploaded to the GitHub release as a downloadable asset
4. **Given** commits exist since the previous release tag, **When** the release is created, **Then** a changelog listing all changes is included in the release notes

---

### User Story 2 - Release Verification (Priority: P2)

A developer reviews the created GitHub release to verify it contains the correct information: proper version number, accurate changelog reflecting all changes, and a working MSI installer that can be downloaded and verified.

**Why this priority**: Verification ensures the automated process works correctly. Users need confidence that releases are accurate before distributing to end users.

**Independent Test**: Can be tested by downloading the MSI from a created release and verifying it installs with the correct version displayed in the application.

**Acceptance Scenarios**:

1. **Given** a release was created from tag `0.2.0`, **When** viewing the GitHub release page, **Then** the release title shows "v0.2.0" or "0.2.0"
2. **Given** a release was created, **When** downloading the MSI installer, **Then** the installer runs successfully and shows the correct version
3. **Given** commits with conventional messages exist, **When** viewing the changelog, **Then** changes are organized by type (features, fixes, etc.)

---

### User Story 3 - Build Failure Notification (Priority: P3)

When a release build fails for any reason (compilation errors, test failures, missing dependencies), the developer is notified through GitHub's standard notification system and can view detailed logs to diagnose the issue.

**Why this priority**: Failure handling is essential for maintainability but is secondary to the core release functionality. GitHub Actions provides built-in notification and logging.

**Independent Test**: Can be tested by intentionally pushing a tag on a branch with broken code and verifying the workflow fails with useful error messages.

**Acceptance Scenarios**:

1. **Given** a tag is pushed on code that fails to compile, **When** the workflow runs, **Then** it fails with a clear error message indicating the compilation issue
2. **Given** a workflow fails, **When** viewing the GitHub Actions log, **Then** the specific step that failed is highlighted with detailed output

---

### Edge Cases

- What happens when a tag doesn't follow semantic versioning format (e.g., `release-candidate`, `latest`)? → Workflow does not trigger; only semver-compliant tags (including pre-release suffixes like `v0.1.0-beta`) are processed
- How does the system handle a tag pointing to a commit that has already been released? → softprops/action-gh-release updates the existing release if the tag already has one; otherwise creates new release. Each unique tag creates its own release regardless of commit history.
- What happens when the build succeeds but MSI creation fails? → MSI creation is part of `tauri build` command; if MSI bundling fails, the entire build step fails and the workflow stops before release creation. No partial releases are created.
- How does the changelog behave when there is no previous release tag to compare against? → Show all commits since repository creation, capped at 50 commits maximum
- What happens if a developer pushes multiple tags in quick succession? → Each tag triggers an independent workflow run. GitHub Actions queues concurrent runs; each completes independently, creating separate releases. No race conditions as each release is tied to its specific tag.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Workflow MUST trigger on tags matching semantic versioning pattern including pre-release suffixes (e.g., `0.1.0`, `1.2.3`, `v0.1.0`, `0.1.0-beta.1`, `1.0.0-rc.1`)
- **FR-002**: Workflow MUST extract version number from the tag and update `tauri.conf.json` version field
- **FR-003**: Workflow MUST update `Cargo.toml` package version to match the tag
- **FR-004**: Workflow MUST update `package.json` version to match the tag
- **FR-005**: Workflow MUST build the frontend using the existing `npm run build` command
- **FR-006**: Workflow MUST build the Tauri release using `tauri build` command
- **FR-007**: Workflow MUST generate a changelog comparing the current tag with the previous release tag; for the first release (no previous tag), include all commits since repository creation up to a maximum of 50 commits
- **FR-008**: Workflow MUST create a GitHub release with the tag version as the title
- **FR-008a**: Workflow MUST mark releases from pre-release tags (containing `-alpha`, `-beta`, `-rc`, etc.) as "pre-release" on GitHub
- **FR-009**: Workflow MUST attach the generated MSI installer file to the GitHub release
- **FR-010**: Workflow MUST run on Windows runner environment (required for MSI generation)
- **FR-011**: Workflow MUST fail gracefully if any build step fails, providing clear error messages
- **FR-012**: Workflow MUST support tags with optional "v" prefix (both `0.1.0` and `v0.1.0` should work)

### Key Entities

- **Version Tag**: The git tag that triggers the release (e.g., `0.1.0`, `v1.2.3`) - must follow semantic versioning
- **Release Artifact**: The MSI installer file generated by the Tauri build process
- **Changelog**: Auto-generated list of changes between the current and previous release tags
- **GitHub Release**: The release page on GitHub containing version info, changelog, and downloadable assets

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Release process completes in under 15 minutes from tag push to published release
- **SC-002**: 100% of tagged versions result in a corresponding GitHub release (when build succeeds)
- **SC-003**: All three version files (`tauri.conf.json`, `Cargo.toml`, `package.json`) are updated consistently
- **SC-004**: MSI installer is successfully attached to every release
- **SC-005**: Changelog accurately reflects all commits since the previous release
- **SC-006**: Zero manual intervention required for standard releases

## Assumptions

- The repository uses GitHub Actions for CI/CD (existing `ci.yml` workflow confirms this)
- The project already builds successfully using `npm run build` and `tauri build`
- WiX Toolset is available through Tauri's bundled tooling on Windows runners
- GitHub Actions runners have sufficient resources to build the Tauri application
- Tags will follow semantic versioning convention (MAJOR.MINOR.PATCH)
- The first release will include a changelog with all commits since repository creation (max 50 commits)
