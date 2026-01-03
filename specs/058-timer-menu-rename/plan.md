# Implementation Plan: Timer Menu Button Rename and Reorder

**Branch**: `058-timer-menu-rename` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/058-timer-menu-rename/spec.md`

## Summary

Rename the main menu widget buttons and reorder them: change "Stopwatch" to "Timer" (for chronometer widget), change "Timer" to "Session Timer" (for session timer widget), and swap their positions so Timer appears before Session Timer.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0
**Primary Dependencies**: Next.js 16.x, motion 12.x, shadcn/ui (Button, ButtonGroup)
**Storage**: N/A (UI-only change)
**Testing**: Manual visual verification
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Web (Next.js frontend in Tauri shell)
**Performance Goals**: N/A (static UI labels)
**Constraints**: None
**Scale/Scope**: Single file change (MainMenu.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Simple string and order change; no complexity added |
| II. Testing Standards | ✅ PASS | Visual verification sufficient for label changes |
| III. User Experience Consistency | ✅ PASS | Improves clarity; buttons remain consistent with existing patterns |
| IV. Performance Requirements | ✅ PASS | No performance impact (static labels) |
| V. Research-First Development | ✅ PASS | No external libraries or APIs involved |

**Gate Result**: PASS - All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/058-timer-menu-rename/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no research needed)
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── components/
    └── MainMenu.tsx     # Single file to modify (lines 154-162)
```

**Structure Decision**: Single file modification. The MainMenu component contains the widget buttons in a ButtonGroup at lines 153-163. Only the button labels and order need to change.

## Complexity Tracking

No violations - table not needed.

---

## Implementation Details

### Current State (MainMenu.tsx lines 153-163)

```tsx
<ButtonGroup>
  <Button variant="secondary" onClick={handleOpenClockWidget}>
    Clock
  </Button>
  <Button variant="secondary" onClick={handleOpenTimerWidget}>
    Timer
  </Button>
  <Button variant="secondary" onClick={handleOpenChronometerWidget}>
    Stopwatch
  </Button>
</ButtonGroup>
```

### Target State

```tsx
<ButtonGroup>
  <Button variant="secondary" onClick={handleOpenClockWidget}>
    Clock
  </Button>
  <Button variant="secondary" onClick={handleOpenChronometerWidget}>
    Timer
  </Button>
  <Button variant="secondary" onClick={handleOpenTimerWidget}>
    Session Timer
  </Button>
</ButtonGroup>
```

### Changes Required

1. **Line 158**: Change label from "Timer" to "Session Timer"
2. **Line 161**: Change label from "Stopwatch" to "Timer"
3. **Swap lines 157-159 with lines 160-162**: Move Chronometer button before Session Timer button

### Handler Mapping (unchanged)

| Button Label | Handler | Widget Type |
|--------------|---------|-------------|
| Clock | handleOpenClockWidget | clock |
| Timer | handleOpenChronometerWidget | chronometer |
| Session Timer | handleOpenTimerWidget | timer |

## Verification

After implementation:
1. Open the overlay in windowed mode
2. Verify button order: Clock, Timer, Session Timer
3. Click "Timer" → Chronometer widget opens
4. Click "Session Timer" → Session Timer widget opens
