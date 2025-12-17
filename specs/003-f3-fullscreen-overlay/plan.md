# Implementation Plan: F3 Fullscreen Transparent Click-Through Overlay

**Branch**: `003-f3-fullscreen-overlay` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-f3-fullscreen-overlay/spec.md`

## Summary

Change the F3 toggle behavior from show/hide overlay to toggling between windowed mode and fullscreen transparent click-through mode. In fullscreen mode, the overlay covers the entire screen with 60% transparency (40% opacity), passes all mouse events to underlying applications, while the HeaderPanel remains visible at its original position but is also non-interactive (click-through).

## Technical Context

**Language/Version**: Rust 1.92 (Tauri backend), TypeScript 5.7 (React 19.2 frontend)
**Primary Dependencies**: Tauri 2.x, React 19.2, tailwindcss 4.x, shadcn/ui
**Storage**: N/A (in-memory state only)
**Testing**: vitest (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri - Rust backend + React frontend)
**Performance Goals**: <100ms toggle response, <50ms click-through delay
**Constraints**: All mouse events must pass through to background apps in fullscreen mode
**Scale/Scope**: Single-user desktop overlay application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Static analysis (ESLint, Clippy) in place; single responsibility functions |
| II. Testing Standards | ✅ PASS | Integration tests with vitest; will add tests for mode toggling |
| III. User Experience Consistency | ✅ PASS | Consistent F3 toggle pattern; clear visual feedback (transparency change) |
| IV. Performance Requirements | ✅ PASS | Targets defined: <100ms toggle, <50ms click-through |
| V. Research-First Development | ✅ PASS | Will research Tauri window APIs for fullscreen/click-through |

**Gate Status**: PASSED - All principles satisfied or addressed in plan

## Project Structure

### Documentation (this feature)

```text
specs/003-f3-fullscreen-overlay/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/                          # React frontend
├── components/
│   ├── ui/
│   │   └── card.tsx          # shadcn Card component
│   └── HeaderPanel.tsx       # Header panel component (to update)
├── types/
│   ├── overlay.ts            # Overlay state types (to extend)
│   └── ipc.ts                # IPC payload types
├── lib/
│   └── utils.ts              # Utility functions (cn helper)
├── App.tsx                   # Main app component (to update)
└── main.tsx                  # Entry point

src-tauri/                    # Rust backend
├── src/
│   ├── main.rs               # Entry point
│   ├── lib.rs                # Core app setup and commands (to update)
│   ├── hotkey.rs             # F3 hotkey handling (already implemented)
│   ├── window.rs             # Window positioning utilities (to extend)
│   ├── state.rs              # Overlay state management (to extend)
│   └── types.rs              # Type definitions (to extend)
└── tauri.conf.json           # Tauri configuration

tests/                        # Test files
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Existing Tauri desktop app structure with Rust backend and React frontend. New fullscreen mode logic will be added to existing modules.

## Complexity Tracking

No complexity violations detected. The implementation uses existing Tauri window APIs and follows the established patterns in the codebase.
