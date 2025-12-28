# Implementation Plan: Webview Hotkey Capture

**Branch**: `031-webview-hotkey-capture` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-webview-hotkey-capture/spec.md`

## Summary

Fix F3/F5 hotkey behavior when the webview is focused in interactive mode. Currently, key events are captured by the webview and don't reach the Tauri low-level keyboard hook. The solution adds a document-level keyboard event listener in the React frontend that captures F3/F5, prevents default browser behavior, applies 200ms debouncing, and invokes the existing backend toggle commands.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, @tauri-apps/api 2.0.0, Tauri 2.x
**Storage**: N/A (stateless key event handling)
**Testing**: Manual testing (integration test with hotkey verification)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + React frontend)
**Performance Goals**: < 200ms response time for hotkey actions (matching existing low-level hook)
**Constraints**: Must not interfere with existing low-level keyboard hook; must prevent F5 page refresh
**Scale/Scope**: Single overlay application, single user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single-responsibility hook for hotkey capture; descriptive naming |
| II. Testing Standards | PASS | Manual integration testing for hotkey behavior; deterministic debounce logic can be unit tested |
| III. User Experience Consistency | PASS | Maintains consistent F3/F5 behavior regardless of focus state |
| IV. Performance Requirements | PASS | < 200ms target defined; matches existing hook performance |
| V. Research-First Development | PASS | Will research React keyboard event best practices and Tauri invoke API |

**Gate Status**: PASS - No violations. Proceed to Phase 0.

### Post-Phase 1 Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Single new file with clear responsibility; follows existing patterns |
| II. Testing Standards | PASS | Manual test cases defined in quickstart.md; debounce logic testable |
| III. User Experience Consistency | PASS | F3/F5 behavior will be identical regardless of webview focus |
| IV. Performance Requirements | PASS | Uses same 200ms debounce as backend; invoke is async/non-blocking |
| V. Research-First Development | PASS | React docs and Tauri v2 docs consulted; patterns documented in research.md |

**Post-Design Gate Status**: PASS - Design validated against all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/031-webview-hotkey-capture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - stateless feature)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - uses existing backend commands)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Tauri + React Desktop Application
src-tauri/
├── src/
│   ├── keyboard_hook.rs    # Existing low-level hook (unchanged)
│   ├── hotkey.rs           # Existing global shortcut fallback (unchanged)
│   └── lib.rs              # Backend commands (unchanged)

app/
└── page.tsx                # Main page - will add useHotkeyCapture hook

src/
├── hooks/
│   └── useHotkeyCapture.ts # NEW: Document-level hotkey capture hook
├── lib/
│   └── logger.ts           # Existing logging utilities
└── types/
    └── overlay.ts          # Existing overlay types
```

**Structure Decision**: Minimal change - add single new hook file `src/hooks/useHotkeyCapture.ts` and integrate into existing `app/page.tsx`. No backend changes required as existing `toggle_visibility` and `toggle_mode` commands are reused.

## Complexity Tracking

> No violations to justify - all Constitution gates passed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
