# Research: Timer Menu Button Rename and Reorder

**Feature**: 058-timer-menu-rename
**Date**: 2026-01-03

## Summary

No research required for this feature. The implementation involves:
- Changing two string literals (button labels)
- Reordering two JSX elements

## Technical Findings

### Codebase Analysis

**File**: `src/components/MainMenu.tsx`
**Lines**: 153-163

The widget buttons are rendered in a ButtonGroup component. Each button has:
- A variant ("secondary")
- An onClick handler
- A text label (children)

The handlers are already correctly named and implemented:
- `handleOpenClockWidget` → opens "clock" widget
- `handleOpenTimerWidget` → opens "timer" widget (session timer)
- `handleOpenChronometerWidget` → opens "chronometer" widget

### No External Dependencies

This change:
- Does not require any new libraries
- Does not involve external APIs
- Does not affect persistence or state
- Does not require configuration changes

## Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Keep handler names unchanged | Names already reflect widget types accurately | Renaming handlers would require more changes with no benefit |
| Change only button labels | Minimal change meets requirements | Could update log messages too, but unnecessary |

## Conclusion

Implementation can proceed directly to tasks. No unknowns or clarifications needed.
