# Data Model: Session Timer Widget

**Feature**: 044-session-timer-widget
**Date**: 2026-01-02

## Entities

### 1. WidgetType (Extended)

**Location**: `src/types/widgets.ts`

**Current**:
```typescript
export type WidgetType = 'clock';
```

**Updated**:
```typescript
export type WidgetType = 'clock' | 'timer';
```

**Rationale**: Extends existing union type to support new widget type. All switch statements handling WidgetType must add a case for 'timer'.

---

### 2. SessionTimerState (New)

**Location**: `src/hooks/useSessionTimer.ts`

**Purpose**: Tracks the session timer state for display in the widget.

```typescript
interface SessionTimerState {
  /** Whether the target process is currently running */
  isRunning: boolean;

  /** Timestamp (Date.now()) when current session started, null if no session */
  sessionStartTime: number | null;

  /** Current elapsed time in milliseconds (updated every second while running) */
  elapsedMs: number;

  /** Elapsed time from the last completed session (displayed when stopped) */
  lastSessionMs: number;
}
```

**Initial State**:
```typescript
const initialState: SessionTimerState = {
  isRunning: false,
  sessionStartTime: null,
  elapsedMs: 0,
  lastSessionMs: 0,
};
```

**State Transitions**:

| Event | Condition | State Changes |
|-------|-----------|---------------|
| `target-process-detected` | Always | `isRunning=true`, `sessionStartTime=Date.now()`, `elapsedMs=0` |
| `target-process-terminated` | Always | `isRunning=false`, `lastSessionMs=elapsedMs`, `sessionStartTime=null` |
| Timer tick (1000ms) | `isRunning=true` | `elapsedMs=Date.now()-sessionStartTime` |
| Component mount | Process already running | `isRunning=true`, `sessionStartTime=Date.now()`, `elapsedMs=0` |
| Component mount | Process not running | No change (use initial state) |

---

### 3. ProcessEventPayload (Existing)

**Location**: `src-tauri/src/process_monitor.rs` (Rust), TypeScript interface needed

**Purpose**: Payload for `target-process-detected` and `target-process-terminated` events.

```typescript
// TypeScript definition for frontend
interface ProcessEventPayload {
  /** Name of the target process (e.g., "StarCitizen.exe") */
  process_name: string;

  /** Whether the process was detected (true) or terminated (false) */
  detected: boolean;
}
```

**Usage**: Subscribe to events via `listen<ProcessEventPayload>("target-process-detected", ...)`.

---

### 4. WidgetInstance (Existing - No Changes)

**Location**: `src/types/widgets.ts`

**Note**: The existing `WidgetInstance` interface already supports all needed fields. No modifications required.

```typescript
interface WidgetInstance {
  id: string;
  type: WidgetType;  // Will include 'timer' after type extension
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  isFlipped: boolean;  // Runtime only, not persisted
  createdAt: number;   // Runtime only, not persisted
}
```

---

### 5. WidgetStructure (Existing - No Changes)

**Location**: `src/types/persistence.ts`

**Note**: Persisted widget structure. Already supports the timer widget type through the `type: WidgetType` field.

```typescript
interface WidgetStructure {
  id: string;
  type: WidgetType;  // Will include 'timer' after type extension
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
}
```

---

## Relationships

```
┌─────────────────┐
│   WidgetType    │ ←── Extended with 'timer'
│  'clock'|'timer'│
└────────┬────────┘
         │ used by
         ▼
┌─────────────────┐      ┌────────────────────┐
│ WidgetInstance  │◄────►│  WidgetStructure   │
│   (runtime)     │      │   (persisted)      │
└────────┬────────┘      └────────────────────┘
         │ renders
         ▼
┌─────────────────────────────┐
│ SessionTimerWidgetContent   │
│   uses useSessionTimer hook │
└────────────────┬────────────┘
                 │ subscribes to
                 ▼
┌─────────────────────────────┐
│    Tauri Backend Events     │
│ - target-process-detected   │
│ - target-process-terminated │
└─────────────────────────────┘
         │ payload
         ▼
┌─────────────────────────────┐
│   ProcessEventPayload       │
│ { process_name, detected }  │
└─────────────────────────────┘
```

---

## Validation Rules

### SessionTimerState

| Field | Validation |
|-------|------------|
| `elapsedMs` | Must be >= 0 |
| `lastSessionMs` | Must be >= 0 |
| `sessionStartTime` | Must be null or valid timestamp (> 0) |
| `isRunning` | Boolean, determines which time to display |

### Display Logic

```typescript
function getDisplayTime(state: SessionTimerState): number {
  if (state.isRunning) {
    return state.elapsedMs;
  }
  // When not running, show last session time (or 0 if never run)
  return state.lastSessionMs;
}
```

---

## Default Values

### Timer Widget Defaults (add to WidgetsContext)

| Property | Value | Rationale |
|----------|-------|-----------|
| `width` | 200 | Match clock widget |
| `height` | 80 | Match clock widget |
| `opacity` | 0.8 | Match clock widget |

---

## Persistence Considerations

### Persisted
- Widget position (`x`, `y`)
- Widget dimensions (`width`, `height`)
- Widget opacity

### Not Persisted (Runtime Only)
- `SessionTimerState` - Timer resets on app restart
- `isFlipped` - UI state only
- `createdAt` - Used for z-ordering only

### Behavior on Restart
1. Widget position/size/opacity restored from `state.json`
2. Timer starts at 00:00:00
3. If target process is already running, timer begins counting from 00:00:00
4. Previous session time is lost (not persisted)
