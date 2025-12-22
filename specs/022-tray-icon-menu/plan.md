# Implementation Plan: Windows System Tray Icon

**Branch**: `022-tray-icon-menu` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-tray-icon-menu/spec.md`

## Summary

Add a Windows system tray icon to the RAICOverlay application that provides visual presence when running as a background process and a context menu with an "Exit" option for graceful application termination. Uses Tauri 2.x built-in tray icon support with menu event handling.

## Technical Context

**Language/Version**: Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend - unchanged)
**Primary Dependencies**: Tauri 2.x with `tray-icon` feature, existing tauri dependencies
**Storage**: N/A (uses existing state persistence system for exit cleanup)
**Testing**: Manual testing (tray icon behavior), cargo test for Rust unit tests
**Target Platform**: Windows 10/11 (64-bit)
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: Tray icon visible within 2 seconds of launch, menu response < 500ms
**Constraints**: Must integrate with existing state persistence before exit
**Scale/Scope**: Single tray icon, single menu item ("Exit")

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Single responsibility (tray icon management), uses Tauri's built-in patterns |
| II. Testing Standards | ✅ PASS | Feature can be manually tested; exit behavior integrates with existing persistence |
| III. User Experience Consistency | ✅ PASS | Standard Windows tray icon behavior, consistent tooltip with app name |
| IV. Performance Requirements | ✅ PASS | Tray icon < 2s startup, menu < 500ms response - well within Tauri capabilities |
| V. Research-First Development | ✅ PASS | Context7 research completed for Tauri 2.x tray icon API |

**Gate Result**: PASS - All principles satisfied. Proceeding with implementation.

**Testing Exception (Principle II)**: This feature uses manual testing only. OS-level system tray icons cannot be reliably automated in CI environments due to:
- Platform-specific window manager dependencies
- No headless mode for tray icon rendering
- Tauri test harness limitations for native OS features

Manual verification tasks (T019-T023) validate all success criteria. This exception is documented per constitution governance requirements.

## Project Structure

### Documentation (this feature)

```text
specs/022-tray-icon-menu/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no new data entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── lib.rs           # MODIFY: Add tray icon setup in run() function
│   └── tray.rs          # NEW: Tray icon module with menu handling
├── Cargo.toml           # MODIFY: Add tray-icon feature to tauri dependency
└── icons/
    └── icon.ico         # EXISTING: Reuse for tray icon

src/
└── contexts/
    └── PersistenceContext.tsx  # MODIFY: Add app-exit-requested event listener (T017)
```

**Structure Decision**: Minimal changes to existing structure. New `tray.rs` module encapsulates tray functionality, integrated via `lib.rs` setup function. One frontend file (PersistenceContext.tsx) requires a small addition to handle the exit event for state persistence.

## Complexity Tracking

> No violations. Feature uses simplest approach with Tauri's built-in tray icon support.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Single module | `tray.rs` only | Encapsulates all tray logic, no abstraction needed |
| Minimal frontend change | Event listener only | One listener in PersistenceContext.tsx for exit event |
| Existing icon reuse | `icon.ico` | Already branded, no new assets needed |
