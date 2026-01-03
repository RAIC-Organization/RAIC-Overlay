# Implementation Plan: Fix Update Popup Not Appearing

**Branch**: `051-fix-update-popup` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/051-fix-update-popup/spec.md`

## Summary

The update notification popup is not visible to users because it renders inside the main overlay window which starts hidden. The fix requires creating a dedicated update window (similar to the settings panel) that appears in the taskbar and operates independently of the overlay state. This follows the established pattern used by `settings_window.rs`.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: Tauri 2.x, React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, motion 12.x, shadcn/ui
**Storage**: JSON files in Tauri app data directory (existing update-state.json)
**Testing**: cargo test (Rust), integration tests (React)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + Next.js)
**Performance Goals**: Update window appears within 5 seconds of app launch
**Constraints**: Window must appear in Windows taskbar, operate independently of overlay
**Scale/Scope**: Single-user desktop application, single update window instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Follows established patterns (settings_window.rs), single responsibility |
| II. Testing Standards | ✅ PASS | Integration tests for update window behavior |
| III. User Experience Consistency | ✅ PASS | Matches settings panel visual styling |
| IV. Performance Requirements | ✅ PASS | 5-second appearance target is achievable |
| V. Research-First Development | ✅ PASS | Existing codebase provides proven patterns |

**All gates passed. No violations require justification.**

## Project Structure

### Documentation (this feature)

```text
specs/051-fix-update-popup/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (Tauri commands)
```

### Source Code (repository root)

```text
# Backend (Rust/Tauri)
src-tauri/src/
├── update/
│   ├── mod.rs           # Module exports (add window module)
│   ├── checker.rs       # Existing - triggers window creation
│   ├── window.rs        # NEW: Update window management
│   ├── downloader.rs    # Existing - unchanged
│   ├── installer.rs     # Existing - unchanged
│   ├── state.rs         # Existing - unchanged
│   └── types.rs         # Existing - add window types
├── lib.rs               # Register new command
└── ...

# Frontend (React/Next.js)
app/
├── update/
│   └── page.tsx         # NEW: Update window page route
└── ...

src/
├── components/
│   └── update/
│       ├── UpdateNotification.tsx  # Existing - adapt for window
│       ├── UpdatePage.tsx          # NEW: Page wrapper with hooks
│       ├── DownloadProgress.tsx    # Existing - unchanged
│       └── index.ts                # Update exports
├── hooks/
│   └── useUpdateChecker.ts         # MODIFY: Add window awareness
└── types/
    └── update.ts                   # Existing - unchanged

tests/
└── integration/
    └── update/
        └── update-window.test.tsx  # NEW: Window integration tests
```

**Structure Decision**: Web application pattern (Tauri backend + Next.js frontend). New files follow existing conventions. The update window follows the settings_window.rs pattern exactly.

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Single-responsibility modules, follows established patterns |
| II. Testing Standards | ✅ PASS | Integration tests defined for window lifecycle |
| III. User Experience Consistency | ✅ PASS | Matches settings panel styling exactly |
| IV. Performance Requirements | ✅ PASS | Immediate window open after update detection |
| V. Research-First Development | ✅ PASS | Research documented in research.md, patterns verified |

**All gates passed. Design is ready for task generation.**

## Testing Exception

Per Constitution II (Testing Standards), integration tests are mandated. For this bug fix:

**Justification**: Manual integration tests (T030-T033 in tasks.md) cover all critical user journeys:
- T030: Window appears on launch with update available
- T031: "Update Now" initiates download
- T032: "Ask Again Later" closes window
- T033: Overlay toggle doesn't affect update window

**Rationale**: This is a UI visibility fix with no complex logic requiring automated regression testing. The existing `check_for_updates` logic has unit tests in place. Adding automated window integration tests would require Tauri test infrastructure not currently in the project.

**Future Work**: If update window behavior becomes more complex, add automated tests using Tauri's webdriver integration.

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data Model | [data-model.md](./data-model.md) | ✅ Complete |
| Contracts | [contracts/tauri-commands.md](./contracts/tauri-commands.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |

## Next Steps

Run `/speckit.tasks` to generate the implementation task list.
