# Implementation Plan: Low-Level Keyboard Hook

**Branch**: `029-low-level-keyboard-hook` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/029-low-level-keyboard-hook/spec.md`

## Summary

Replace the current `tauri-plugin-global-shortcut` (which uses `RegisterHotKey`) with a low-level keyboard hook (`SetWindowsHookEx` with `WH_KEYBOARD_LL`) that intercepts keyboard events at the OS kernel level before any application (including Star Citizen) can consume them. The hook runs on a dedicated background thread with its own Windows message loop, similar to the existing `process_monitor.rs` pattern.

## Technical Context

**Language/Version**: Rust 2021 Edition (Tauri backend), TypeScript 5.7.2 (React 19.0.0 frontend - unchanged)
**Primary Dependencies**: `windows-rs` 0.62 (already in use), `tauri` 2.x, `lazy_static` 1.4
**Storage**: N/A (in-memory state only)
**Testing**: `cargo test`, `cargo clippy`, manual integration testing with Star Citizen
**Target Platform**: Windows 10/11 (64-bit) - low-level hooks are Windows-specific
**Project Type**: Tauri desktop application (Rust backend + React frontend)
**Performance Goals**: <100ms hotkey response time, <50ms startup overhead
**Constraints**: <1MB memory for hook thread, no keyboard lag for other applications
**Scale/Scope**: Single user, single process, 2 hotkeys (F3, F5)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | New module follows existing patterns (process_monitor.rs), clean separation of concerns |
| II. Testing Standards | PASS | Unit tests for debounce logic, integration tests via manual validation with Star Citizen |
| III. User Experience Consistency | PASS | Same F3/F5 hotkeys, same behavior, graceful fallback |
| IV. Performance Requirements | PASS | <100ms response target defined, memory budget <1MB |
| V. Research-First Development | PASS | Research conducted on ArkanisOverlay and windows-rs documentation |

## Project Structure

### Documentation (this feature)

```text
specs/029-low-level-keyboard-hook/
├── plan.md              # This file
├── research.md          # Phase 0 output - Windows API research
├── data-model.md        # Phase 1 output - Hook state types
├── quickstart.md        # Phase 1 output - Manual testing guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src-tauri/
├── Cargo.toml           # Add Win32_UI_Input_KeyboardAndMouse feature, lazy_static
└── src/
    ├── lib.rs           # Modify to start/stop keyboard hook, conditional fallback
    └── keyboard_hook.rs # NEW: Low-level keyboard hook implementation (includes KeyboardHookState)
```

**Structure Decision**: Minimal changes to existing structure. New `keyboard_hook.rs` module contains all hook-related types and logic, following the same pattern as `process_monitor.rs` (dedicated thread, global state, start/stop functions). Existing `hotkey.rs` remains unchanged; fallback logic is conditional in `lib.rs`.

## Complexity Tracking

No constitution violations. The solution uses the simplest approach:
- Single new module (`keyboard_hook.rs`)
- Follows existing patterns (process_monitor.rs)
- Reuses existing event emission mechanism (Tauri events)
- Graceful fallback to existing plugin if hook fails

## Implementation Approach

### Phase 1: Core Hook Implementation (P1 - MVP)

1. Add required Windows features to Cargo.toml
2. Create `keyboard_hook.rs` with:
   - `KeyboardHookState` struct (hook handle, thread handle, active flag)
   - `start_keyboard_hook()` function that spawns dedicated thread
   - Message loop with `GetMessage`/`TranslateMessage`/`DispatchMessage`
   - Hook callback that detects F3/F5 and emits Tauri events
   - `stop_keyboard_hook()` function for cleanup
3. Modify `lib.rs` to start keyboard hook instead of registering global shortcuts
4. Test with Star Citizen

### Phase 2: Fallback and Logging (P2)

1. Add detailed logging for hook installation/uninstallation
2. Implement fallback to `tauri-plugin-global-shortcut` if hook fails
3. Add success/failure logging

### Phase 3: Polish (P3)

1. Run clippy and fix warnings
2. Add unit tests for debounce logic
3. Manual validation with Star Citizen
