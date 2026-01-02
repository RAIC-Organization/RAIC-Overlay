# Implementation Plan: Auto-Update System

**Branch**: `049-auto-update` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/049-auto-update/spec.md`

## Summary

Implement an auto-update system that checks for new releases from the GitHub repository at startup and every 24 hours. When a new stable release is detected, display a notification popup with the new version number. Users can accept (triggering background download of the MSI installer, launching it, and exiting the app) or postpone (Ask Again Later). The system must be fault-tolerant and not interrupt normal app operation if GitHub is unreachable.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: Tauri 2.x, React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, reqwest (Rust HTTP client), semver (version comparison)
**Storage**: JSON file in Tauri app data directory (`update-state.json`)
**Testing**: vitest (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (Rust backend + React frontend)
**Performance Goals**: Update check < 3s, notification display < 5s after startup
**Constraints**: Silent failure on network errors, MSI installer execution, graceful app exit
**Scale/Scope**: Single user desktop app, GitHub API rate limit consideration (60 req/hour unauthenticated)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality
- [x] **Static analysis**: Rust (clippy) and TypeScript (eslint) will pass before merge
- [x] **Single responsibility**: Update checker, notification UI, download manager as separate modules
- [x] **No duplication**: Reuse existing persistence patterns from `persistence.rs` and `user_settings.rs`
- [x] **Self-documenting**: Clear naming for update-related types and functions
- [x] **Comments**: Document version comparison logic and GitHub API interaction

### II. Testing Standards
- [x] **Integration tests**: Test update check flow with mocked GitHub API responses
- [x] **Feature coverage**: Test notification display, user actions, download progress
- [x] **Deterministic**: Mock network calls and time intervals for reproducibility

### III. User Experience Consistency
- [x] **Consistent UI**: Update notification follows existing popup patterns (e.g., settings panel)
- [x] **Clear error messages**: User-friendly messages for download failures with retry option
- [x] **Loading indicators**: Progress bar during installer download
- [x] **Feedback**: Visual confirmation when starting download, clear state transitions

### IV. Performance Requirements
- [x] **Response targets**: Update check < 3s p95, notification display < 200ms
- [x] **Non-blocking**: Update check runs asynchronously, does not block app startup
- [x] **Timeouts**: GitHub API requests have 10s timeout, download has configurable timeout

### V. Research-First Development
- [x] **Context7**: Research tauri-plugin-updater, reqwest, semver crates
- [x] **Best practices**: Verify GitHub API usage patterns for releases endpoint
- [x] **Documentation**: Use official Tauri and GitHub API docs

**Gate Status**: PASS - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/049-auto-update/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/src/
├── lib.rs                    # Add update module registration
├── update/                   # New module directory
│   ├── mod.rs               # Module exports
│   ├── checker.rs           # GitHub release check logic
│   ├── downloader.rs        # MSI download with progress
│   ├── installer.rs         # MSI execution and app exit
│   ├── state.rs             # Update state persistence
│   └── types.rs             # Update-related types
└── ...

src/
├── components/
│   └── update/              # New component directory
│       ├── UpdateNotification.tsx  # Popup component
│       ├── DownloadProgress.tsx    # Progress indicator
│       └── index.ts                # Exports
├── hooks/
│   └── useUpdateChecker.ts  # Update check hook with interval
├── contexts/
│   └── UpdateContext.tsx    # Update state management (optional)
└── types/
    └── update.ts            # TypeScript update types

tests/
├── integration/
│   └── update/
│       └── update-flow.test.tsx  # Update flow integration tests
└── unit/
    └── update/
        └── version-compare.test.ts  # Version comparison tests
```

**Structure Decision**: Follows existing project patterns. Backend code in `src-tauri/src/` with module-based organization. Frontend components in `src/components/update/` following the existing component structure. Tests in `tests/` directory.

## Complexity Tracking

> No violations requiring justification. Design follows simplicity principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
