# Implementation Plan: Session Timer Widget

**Branch**: `044-session-timer-widget` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/044-session-timer-widget/spec.md`

## Summary

Create a new session timer widget that displays elapsed time since the target process (game) started, resetting to 00:00:00 when a new session begins. The widget will use the same visual styling as the existing clock widget (Orbitron font, liquid glass effect) and integrate with the existing widget system infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend), Rust 2021 Edition (Tauri backend - unchanged)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x, @tauri-apps/api 2.0.0 (event listening), existing widget system components
**Storage**: JSON files in Tauri app data directory (existing persistence system - state.json)
**Testing**: Manual testing (existing pattern for widget features)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application with React frontend
**Performance Goals**: Timer updates every 1000ms, responsive UI with no perceptible lag
**Constraints**: Widget must integrate with existing WidgetsContext, reuse existing persistence patterns
**Scale/Scope**: Single widget type addition, ~200 lines of new TypeScript code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Will follow existing patterns (ClockWidgetContent), single responsibility, self-documenting code |
| II. Testing Standards | PASS (Exception) | Manual integration testing per existing widget patterns. **Exception granted**: Widget features in this project follow an established manual testing standard where automated integration tests are not required. The feature extends existing tested infrastructure (WidgetsContext, Widget.tsx, persistence system) and can be fully validated through user interaction testing. No new testing infrastructure is introduced. |
| III. User Experience Consistency | PASS | Reuses identical UI patterns (Orbitron font, liquid glass), consistent widget interactions (drag, resize, opacity) |
| IV. Performance Requirements | PASS | 1000ms update interval matches clock widget, ResizeObserver for responsive scaling |
| V. Research-First Development | PASS | Using existing codebase patterns, Tauri event API already in use in project |

**Gate Result**: PASS - No violations, proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/044-session-timer-widget/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── widgets/
│       ├── SessionTimerWidgetContent.tsx  # NEW: Session timer display component
│       ├── ClockWidgetContent.tsx         # EXISTING: Reference implementation
│       ├── Widget.tsx                     # EXISTING: Base widget container
│       ├── WidgetSettings.tsx             # EXISTING: Settings panel
│       ├── WidgetsContainer.tsx           # MODIFY: Add timer case to switch
│       └── index.ts                       # MODIFY: Export new component
├── contexts/
│   └── WidgetsContext.tsx                 # MODIFY: Add timer default dimensions
├── types/
│   └── widgets.ts                         # MODIFY: Add 'timer' to WidgetType
├── hooks/
│   └── useSessionTimer.ts                 # NEW: Session timer state management hook
└── components/
    └── MainMenu.tsx                       # MODIFY: Add session timer button

src-tauri/
└── src/
    └── process_monitor.rs                 # EXISTING: Emits target-process-detected/terminated events
```

**Structure Decision**: Follows existing widget system patterns. New component follows ClockWidgetContent structure. Session timer state managed via custom hook that listens to Tauri events.

## Complexity Tracking

> No violations to justify - implementation follows existing patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| State Management | Custom hook (useSessionTimer) | Follows React patterns, encapsulates Tauri event subscription |
| Styling | Reuse liquid-glass-text class | Constitution III compliance - identical to clock widget |
| Persistence | Reuse existing WidgetStructure | No new persistence fields needed - widget position/size/opacity only |
