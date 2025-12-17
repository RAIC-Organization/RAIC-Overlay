# Implementation Plan: External Window Attachment Mode

**Branch**: `004-external-window-attach` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-external-window-attach/spec.md`

## Summary

Enable the overlay to attach to a specific external application window (configured via build-time environment variable) instead of operating as a standalone fullscreen overlay. The overlay will match the target window's position and size, automatically hide when the target loses focus, and show an error modal if the target application is not running.

**Technical Approach**: Extend Tauri's Rust backend with Windows API calls to enumerate windows, find the target by title pattern matching, monitor focus changes, and synchronize overlay position/size with the target window using polling or event-driven updates.

## Technical Context

**Language/Version**: Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend)
**Primary Dependencies**: Tauri 2.x, React 19.0.0, tauri-plugin-global-shortcut 2.x, Windows API (windows-rs crate)
**Storage**: N/A (in-memory state only)
**Testing**: cargo test (Rust), vitest (TypeScript)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri - Rust backend + React frontend)
**Performance Goals**: <50ms position update latency, <100ms focus change response, 60fps visual tracking
**Constraints**: Must not interfere with target application performance, minimal CPU usage during polling
**Scale/Scope**: Single user, single target window binding

**Existing Architecture**:
- F3 toggles visibility (click-through mode, 60% transparent in fullscreen)
- F5 toggles interaction mode (windowed=interactive vs fullscreen=click-through)
- Window state managed in `src-tauri/src/state.rs` via atomic operations
- Window positioning in `src-tauri/src/window.rs`
- Hotkey handling in `src-tauri/src/hotkey.rs`

**New Dependencies Required**:
- `windows-rs` crate for Windows API access (FindWindow, GetWindowRect, SetWindowPos, GetForegroundWindow)
- Build-time environment variable via Cargo build script or tauri.conf.json

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Extends existing clean architecture; new module for window binding |
| II. Testing Standards | PASS | Integration tests for window tracking; unit tests for pattern matching |
| III. User Experience Consistency | PASS | Maintains F3/F5 behavior; error modal follows existing UI patterns |
| IV. Performance Requirements | PASS | 50ms/100ms targets defined in spec; polling interval must be tuned |
| V. Research-First Development | PASS | Research completed in research.md |

### Post-Design Check (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Data model uses established patterns; contracts follow existing IPC conventions |
| II. Testing Standards | PASS | Testable interfaces defined; error handling documented |
| III. User Experience Consistency | PASS | ErrorModal follows shadcn/ui patterns; auto-dismiss matches spec |
| IV. Performance Requirements | PASS | Event-driven approach (SetWinEventHook) meets <50ms target |
| V. Research-First Development | PASS | All decisions documented with rationale in research.md |

**Research Completed** (see [research.md](./research.md)):
- windows-rs crate v0.69 for Windows API access
- Build-time config via env!() macro + build.rs validation
- Event-driven position tracking via win_event_hook crate
- Tauri set_position/set_size APIs for overlay positioning

## Project Structure

### Documentation (this feature)

```text
specs/004-external-window-attach/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Tauri commands)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── lib.rs           # Tauri app setup, commands (extend)
│   ├── main.rs          # Entry point
│   ├── hotkey.rs        # F3/F5 handlers (extend for target validation)
│   ├── window.rs        # Window positioning (extend for target tracking)
│   ├── state.rs         # Overlay state (extend with target binding)
│   ├── types.rs         # Type definitions (extend)
│   └── target_window.rs # NEW: Target window detection and tracking
├── build.rs             # NEW: Build-time env var validation
├── Cargo.toml           # Add windows-rs dependency
└── tauri.conf.json      # Configuration

src/
├── App.tsx              # Event listeners (extend for error modal)
├── components/
│   ├── HeaderPanel.tsx  # Overlay UI (extend for scale factor)
│   └── ErrorModal.tsx   # NEW: Target app missing error modal
├── types/
│   ├── overlay.ts       # State types (extend)
│   └── ipc.ts           # IPC payload types (extend)
└── styles/
    └── globals.css      # Styles (extend for error modal)
```

**Structure Decision**: Tauri desktop application with Rust backend and React frontend. New functionality extends existing modules; one new Rust module (`target_window.rs`) and one new React component (`ErrorModal.tsx`).

## Complexity Tracking

> No constitution violations identified. Design follows existing patterns.
