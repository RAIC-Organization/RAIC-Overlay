# Implementation Plan: RAIC Overlay Project Initialization

**Branch**: `001-rust-overlay-init` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rust-overlay-init/spec.md`

## Summary

Initialize a Windows overlay application for Star Citizen using a hybrid Rust + React architecture. The Rust backend manages native Windows window creation, global hotkey registration (F12), and overlay positioning. A React-based UI renders the header panel with black background, border, and "RAIC Overlay" title. The overlay functions as a standalone application, toggling visibility via F12 with <100ms response time.

## Technical Context

**Language/Version**: Rust 1.92 (backend/native), TypeScript 5.x (React UI)
**Primary Dependencies**: Tauri 2.x (Rust-React bridge, native window management), React 19.2 (UI layer)
**Storage**: N/A (stateless overlay for this feature)
**Testing**: cargo test (Rust), Vitest (React components)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri hybrid)
**Performance Goals**: <100ms toggle response, <3s startup, <1% FPS impact on game
**Constraints**: Global hotkey must work regardless of window focus, click-through when hidden
**Scale/Scope**: Single-user desktop application, minimal resource footprint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality
- [x] Static analysis configured (Clippy for Rust, ESLint/TypeScript for React)
- [x] Single responsibility: Rust handles native, React handles UI
- [x] Self-documenting code required per constitution

### II. Testing Standards
- [x] Integration tests planned for hotkey toggle behavior
- [x] Component tests for React UI elements
- [x] Tests cover user outcomes (F12 toggle, panel visibility)
- [x] Performance benchmark included for toggle response time (<100ms)

### III. User Experience Consistency
- [x] Consistent UI pattern: single header panel with defined styling
- [x] Clear visual feedback on toggle (panel shows/hides)
- [x] Timely response (<100ms requirement)

### IV. Performance Requirements
- [x] Performance budgets defined: <100ms toggle, <3s startup
- [x] Resource constraints: minimal CPU/memory impact (<1% FPS)
- [x] Will implement startup time measurement

### V. Research-First Development
- [x] Context7 research required for: Tauri 2.x APIs, global hotkey registration
- [x] Web search for: Windows overlay best practices, click-through implementation
- [x] Findings will be documented in research.md

**Gate Status**: PASS - All constitution principles addressed

## Project Structure

### Documentation (this feature)

```text
specs/001-rust-overlay-init/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (IPC contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── src/
│   ├── main.rs          # Application entry point
│   ├── window.rs        # Overlay window management
│   ├── hotkey.rs        # Global hotkey registration (F12)
│   └── lib.rs           # Shared functionality
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration

src/
├── components/
│   └── HeaderPanel.tsx  # Main overlay panel component
├── App.tsx              # Root React component
├── main.tsx             # React entry point
└── styles/
    └── overlay.css      # Panel styling (black bg, border)

tests/
├── rust/
│   └── hotkey_test.rs   # Hotkey integration tests
└── react/
    └── HeaderPanel.test.tsx  # Component tests
```

**Structure Decision**: Tauri hybrid structure with `src-tauri/` for Rust backend and `src/` for React frontend. This follows Tauri's standard project layout and cleanly separates native window management from UI rendering.

## Complexity Tracking

No violations to track. Architecture uses minimal dependencies (Tauri + React) following the Simplicity Standard.
