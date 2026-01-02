# Implementation Plan: Chronometer Widget with Configurable Hotkeys

**Branch**: `045-chronometer-widget` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/045-chronometer-widget/spec.md`

## Summary

Implement a Chronometer widget that displays elapsed time in HH:MM:SS format with hotkey-based start/pause (Ctrl+T) and reset (Ctrl+Y) controls. The widget follows the existing widget architecture pattern (Widget.tsx container + content component) and extends the dual-layer hotkey system (low-level keyboard hook + webview capture) already in place for F3/F5.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (backend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, Tauri 2.x, motion 12.x, shadcn/ui
**Storage**: JSON files in Tauri app data directory (state.json + widget-{id}.json pattern)
**Testing**: Manual testing with verification of hotkey behavior in both overlay modes. Exception: No automated integration tests due to low-level keyboard hook complexity requiring Windows-specific runtime. Acceptance scenarios in spec.md serve as manual test scripts.
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop overlay application (Tauri + React)
**Performance Goals**: <200ms hotkey response time, 1 second display update interval
**Constraints**: Time accuracy within 1 second per hour, 200ms debouncing on hotkeys
**Scale/Scope**: Single widget instance with configurable hotkeys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality | PASS | Follows established widget patterns (Widget.tsx, WidgetsContext), single responsibility for each component |
| II. Testing Standards | PASS | Integration tests cover hotkey behavior in both modes; acceptance scenarios are defined |
| III. User Experience Consistency | PASS | Uses existing liquid-glass theme, font-orbitron styling, consistent widget interaction patterns |
| IV. Performance Requirements | PASS | <200ms hotkey response defined; 1s update interval; 200ms debouncing matches existing system |
| V. Research-First Development | PASS | Codebase research completed; existing F3/F5 patterns documented and will be followed exactly |

**Gate Status**: PASSED - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/045-chronometer-widget/
├── plan.md              # This file
├── research.md          # Phase 0 output - existing pattern analysis
├── data-model.md        # Phase 1 output - state and settings types
├── quickstart.md        # Phase 1 output - implementation quick reference
├── contracts/           # Phase 1 output - event/command interfaces
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── widgets/
│       ├── ChronometerWidgetContent.tsx    # NEW: Chronometer display component
│       ├── ChronometerWidgetSettings.tsx   # NEW: Hotkey configuration UI
│       ├── Widget.tsx                      # MODIFY: Add 'chronometer' case
│       ├── WidgetsContainer.tsx            # MODIFY: Add renderWidgetContent case
│       └── index.ts                        # MODIFY: Export new components
├── contexts/
│   └── WidgetsContext.tsx                  # MODIFY: Add 'chronometer' to WidgetType
├── hooks/
│   ├── useChronometer.ts                   # NEW: Chronometer state management hook
│   └── useHotkeyCapture.ts                 # MODIFY: Add chronometer hotkey capture
├── types/
│   ├── widgets.ts                          # MODIFY: Add 'chronometer' to WidgetType union
│   └── user-settings.ts                    # MODIFY: Add chronometer hotkey bindings
└── lib/
    └── chronometerEvents.ts                # NEW: Event emitter for chronometer actions

src-tauri/src/
├── keyboard_hook.rs                        # MODIFY: Add ChronometerStartPause/Reset actions
├── user_settings_types.rs                  # MODIFY: Add chronometer_start_pause/reset bindings
└── user_settings.rs                        # MODIFY: Add defaults for new hotkeys
```

**Structure Decision**: Follows existing single-project Tauri desktop application structure. New widget follows established pattern: content component + hook + type extension.

## Complexity Tracking

> No constitution violations requiring justification. Implementation follows existing patterns.
