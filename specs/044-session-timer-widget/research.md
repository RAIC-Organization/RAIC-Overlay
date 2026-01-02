# Research: Session Timer Widget

**Feature**: 044-session-timer-widget
**Date**: 2026-01-02

## Research Tasks

### 1. Tauri Event API - Listening to Backend Events

**Decision**: Use `listen` from `@tauri-apps/api/event` with typed payloads and proper cleanup in useEffect.

**Rationale**:
- Already established pattern in the codebase (`app/page.tsx` lines 393-514)
- `listen()` returns a Promise that resolves to an unlisten function
- Cleanup pattern: store promise, call `.then((f) => f())` in useEffect return

**Code Pattern** (from existing codebase):
```typescript
import { listen } from "@tauri-apps/api/event";

useEffect(() => {
  const unlistenProcess = listen<ProcessEventPayload>("target-process-detected", (event) => {
    // Handle event
  });

  return () => {
    unlistenProcess.then((f) => f());
  };
}, []);
```

**Alternatives Considered**:
- WebSocket: Overkill for simple event passing
- Polling with `invoke`: Less efficient, existing pattern uses events

### 2. Widget Type Extension Pattern

**Decision**: Add `'timer'` to the `WidgetType` union type in `src/types/widgets.ts`.

**Rationale**:
- WidgetType is already designed as extensible union type: `export type WidgetType = 'clock';`
- Pattern used throughout: switch statements in WidgetsContainer, default dimensions in WidgetsContext
- Type-safe approach ensures all required switch cases are handled

**Code Pattern**:
```typescript
// src/types/widgets.ts
export type WidgetType = 'clock' | 'timer';
```

**Alternatives Considered**:
- String enum: Less flexible, existing pattern uses union type
- Separate type: Would break existing switch statements

### 3. Session Timer State Management

**Decision**: Create a custom React hook `useSessionTimer` to encapsulate timer logic and Tauri event subscription.

**Rationale**:
- Separates concerns: component handles rendering, hook handles state
- Can be reused if multiple session timer widgets exist (they share the same session)
- Follows existing hook patterns in the codebase (`useWidgetEvents`, `usePersistence`)
- Encapsulates interval management and cleanup

**State Structure**:
```typescript
interface SessionTimerState {
  isRunning: boolean;           // Whether target process is currently running
  sessionStartTime: number | null; // Timestamp when session started (Date.now())
  elapsedMs: number;            // Current elapsed milliseconds
  lastSessionMs: number;        // Elapsed time from last session (when stopped)
}
```

**Key Behaviors**:
1. On `target-process-detected`: Set `isRunning=true`, `sessionStartTime=Date.now()`, `elapsedMs=0`
2. On `target-process-terminated`: Set `isRunning=false`, store `elapsedMs` as `lastSessionMs`
3. While running: Update `elapsedMs` every 1000ms using `Date.now() - sessionStartTime`
4. Display: Show `elapsedMs` when running, `lastSessionMs` when stopped

**Alternatives Considered**:
- State in component: Less reusable, harder to test
- Context provider: Overkill for single-use state, existing widgets don't use it
- Zustand store: Would add new dependency, existing patterns use hooks

### 4. Time Formatting (HH:MM:SS)

**Decision**: Simple arithmetic formatting, no external library needed.

**Rationale**:
- Requirement specifies HH:MM:SS format
- Must support hours > 24 (e.g., "36:15:42")
- `toLocaleTimeString` would wrap at 24 hours, not suitable
- Simple calculation is sufficient and has no dependencies

**Code Pattern**:
```typescript
function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

**Alternatives Considered**:
- date-fns `formatDuration`: Would wrap at 24 hours, adds dependency
- `toLocaleTimeString`: Wraps at 24 hours
- Intl.DurationFormat: Not widely supported yet

### 5. Backend Event Payload

**Decision**: Use existing `ProcessEventPayload` type from backend.

**Rationale**:
- Events already emitted by `process_monitor.rs` (lines 111-116)
- Payload includes `process_name` and `detected` boolean
- No backend changes needed

**Existing Payload** (from `src-tauri/src/process_monitor.rs`):
```rust
#[derive(Clone, serde::Serialize)]
pub struct ProcessEventPayload {
    pub process_name: String,
    pub detected: bool,
}
```

**TypeScript Type**:
```typescript
interface ProcessEventPayload {
  process_name: string;
  detected: boolean;
}
```

### 6. Visual Styling Pattern

**Decision**: Reuse existing `liquid-glass-text` CSS class and Orbitron font from clock widget.

**Rationale**:
- Constitution III requires UI consistency
- Spec FR-006 requires same styling as clock widget
- Existing CSS in `app/globals.css` (lines 193-220)
- Font already loaded via `next/font/google`

**Key Classes**:
- `font-orbitron` - Orbitron font
- `liquid-glass-text` - Blue glow effect, frosted glass appearance

**Alternatives Considered**:
- New styling: Would violate Constitution III
- Inline styles: Less maintainable, breaks existing patterns

### 7. Initial State on Overlay Start

**Decision**: Start timer at 00:00:00 regardless of whether target process is already running.

**Rationale**:
- Spec explicitly states this behavior in Assumptions section
- Cannot determine actual process start time from overlay
- Consistent behavior on restart

**Implementation**:
- Check `PROCESS_MONITOR_STATE.is_target_found()` on mount via Tauri command
- If already running, start timer from 00:00:00 (not from actual process start)

### 8. Menu Integration Pattern

**Decision**: Add "Session Timer" button to MainMenu alongside existing widget options.

**Rationale**:
- Follows existing pattern for adding clock widget
- Uses `widgetEvents.emit('widget:open', payload)` pattern
- MainMenu already has widget section structure

**Alternatives Considered**:
- Separate menu: Breaks consistency with clock widget
- Auto-create on startup: User should choose to add widget

## Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| Event listening | `listen` from @tauri-apps/api/event | High (existing pattern) |
| Type extension | Add 'timer' to WidgetType union | High (existing pattern) |
| State management | Custom useSessionTimer hook | High (follows conventions) |
| Time formatting | Simple arithmetic, no library | High (requirement-driven) |
| Backend changes | None needed | High (events already exist) |
| Styling | Reuse liquid-glass-text | High (Constitution III) |
| Initial state | Start at 00:00:00 | High (spec-defined) |
| Menu integration | Add button to MainMenu | High (existing pattern) |

## Dependencies Verified

- `@tauri-apps/api/event` - Already in use (app/page.tsx)
- Orbitron font - Already loaded (next/font/google)
- liquid-glass-text CSS - Already defined (globals.css)
- ProcessEventPayload - Already emitted (process_monitor.rs)

## No New Dependencies Required

All functionality can be implemented using existing project dependencies and patterns.
