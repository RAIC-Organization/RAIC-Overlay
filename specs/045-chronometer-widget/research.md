# Research: Chronometer Widget with Configurable Hotkeys

**Feature**: 045-chronometer-widget
**Date**: 2026-01-02
**Status**: Complete

## Research Summary

This research documents the existing patterns in RAICOverlay that will be followed for implementing the Chronometer widget. All "NEEDS CLARIFICATION" items from the specification have been resolved through codebase analysis.

---

## 1. Widget Architecture Pattern

### Decision
Follow the established Widget + Content component pattern used by Clock and Timer widgets.

### Rationale
- Existing pattern provides consistent UX (flip animation, opacity, drag/resize)
- Widget.tsx container handles all common functionality
- Only need to implement ChronometerWidgetContent.tsx for display logic

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Standalone window | Would lose widget system benefits (persistence, opacity, positioning) |
| Extend Timer widget | Chronometer has different behavior (no countdown, manual control) |

### Key Implementation Files
- `src/components/widgets/Widget.tsx` - Base container (unchanged)
- `src/components/widgets/SessionTimerWidgetContent.tsx` - Reference implementation
- `src/components/widgets/WidgetsContainer.tsx` - Add case for 'chronometer'

---

## 2. Dual-Layer Hotkey System

### Decision
Extend the existing HotkeyAction enum and useHotkeyCapture hook to support chronometer hotkeys.

### Rationale
- F3/F5 pattern is proven and well-tested
- Low-level hook covers non-interactive mode
- Webview capture covers interactive mode
- Event synchronization already implemented

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Non-Interactive Mode                      │
│  User presses Ctrl+T/Y                                       │
│         ↓                                                    │
│  keyboard_hook.rs (WH_KEYBOARD_LL)                          │
│         ↓                                                    │
│  Check hotkeys cache (user_settings.rs)                     │
│         ↓                                                    │
│  Debounce (200ms)                                           │
│         ↓                                                    │
│  emit("chronometer-start-pause" / "chronometer-reset")      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Interactive Mode                          │
│  User presses Ctrl+T/Y (webview focused)                    │
│         ↓                                                    │
│  useHotkeyCapture.ts (document keydown, capture phase)      │
│         ↓                                                    │
│  matchesHotkey(event, config.chronometerStartPause)         │
│         ↓                                                    │
│  Debounce (200ms)                                           │
│         ↓                                                    │
│  invoke('chronometer_start_pause' / 'chronometer_reset')    │
└─────────────────────────────────────────────────────────────┘
```

### Key Implementation Files
- `src-tauri/src/keyboard_hook.rs` - Add HotkeyAction variants
- `src/hooks/useHotkeyCapture.ts` - Add matching logic
- `src-tauri/src/user_settings_types.rs` - Add HotkeyBinding fields

---

## 3. Hotkey Configuration Storage

### Decision
Extend HotkeySettings struct to include chronometer_start_pause and chronometer_reset bindings.

### Rationale
- Follows existing pattern for toggle_visibility and toggle_mode
- Leverages existing persistence and cache mechanisms
- Real-time sync via "hotkeys-updated" event already works

### Default Values
```rust
chronometer_start_pause: HotkeyBinding {
    key: "T".to_string(),
    key_code: 0x54,  // VK_T
    ctrl: true,
    shift: false,
    alt: false,
}

chronometer_reset: HotkeyBinding {
    key: "Y".to_string(),
    key_code: 0x59,  // VK_Y
    ctrl: true,
    shift: false,
    alt: false,
}
```

### Virtual Key Codes Reference
- VK_T = 0x54 (84)
- VK_Y = 0x59 (89)
- VK_CONTROL = 0x11 (17) - checked via GetKeyState

---

## 4. Chronometer State Management

### Decision
Create useChronometer.ts hook with singleton pattern (similar to useSessionTimer.ts).

### Rationale
- Timer widget already uses this pattern successfully
- Allows multiple widget instances to share same timer state
- Clean separation between display and state logic

### State Shape
```typescript
interface ChronometerState {
  isRunning: boolean;
  elapsedMs: number;
  lastTickTimestamp: number | null;
}
```

### Key Behaviors
1. **Start**: Set isRunning=true, record lastTickTimestamp
2. **Pause**: Set isRunning=false, update elapsedMs, clear lastTickTimestamp
3. **Reset**: Set isRunning=false, elapsedMs=0, clear lastTickTimestamp
4. **Close Widget**: Pause (freeze time), persist state

---

## 5. Widget Settings UI

### Decision
Add ChronometerWidgetSettings.tsx component accessible via widget flip (double-click).

### Rationale
- Follows existing widget settings pattern
- User can access via double-click to flip widget
- Settings appear on back face of widget

### UI Components
- HotkeyInput field for start/pause binding
- HotkeyInput field for reset binding
- Save button (triggers hotkey update + backend sync)
- Conflict warning display

### Key Implementation Files
- `src/components/windows/SettingsPanel.tsx` - Reference for hotkey input pattern
- `src/utils/hotkey-validation.ts` - Conflict detection logic

---

## 6. Event Emission Pattern

### Decision
Create chronometerEvents.ts for internal widget event handling.

### Rationale
- Decouples hotkey actions from widget state
- Allows multiple event sources (backend hook, webview capture)
- Follows widgetEvents.ts pattern

### Events
```typescript
type ChronometerEventMap = {
  'chronometer:toggle': void;  // Start or pause
  'chronometer:reset': void;   // Reset to zero
};
```

---

## 7. Persistence Integration

### Decision
Persist chronometer state in widget data following existing pattern.

### Rationale
- state.json already stores widget instances
- Each widget can have custom data
- On close: freeze time and save elapsedMs

### Persisted Fields
```typescript
interface ChronometerWidgetData {
  elapsedMs: number;  // Time when paused/closed
  // isRunning is NOT persisted - always starts paused
}
```

---

## 8. Display Format

### Decision
Use HH:MM:SS format with font-orbitron and liquid-glass-text styling.

### Rationale
- Matches existing Clock and Timer widget styling
- formatElapsedTime utility already exists in codebase
- Auto-scaling text via ResizeObserver pattern

### Implementation Reference
```typescript
// From useSessionTimer.ts
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

---

## 9. Debouncing Strategy

### Decision
200ms debounce on both backend and frontend hotkey handlers.

### Rationale
- Matches existing F3/F5 debouncing
- Prevents rapid toggle issues
- Separate timestamps per action (start/pause vs reset)

### Implementation
```rust
// Backend
static LAST_CHRONO_TOGGLE: AtomicU64 = AtomicU64::new(0);
static LAST_CHRONO_RESET: AtomicU64 = AtomicU64::new(0);

// Frontend
const lastTogglePressRef = useRef<number>(0);
const lastResetPressRef = useRef<number>(0);
```

---

## 10. Hotkey Conflict Handling

### Decision
Show warning when user attempts to set hotkey that conflicts with F3/F5 or other chronometer hotkeys.

### Rationale
- Existing validation logic in hotkey-validation.ts
- User can override with confirmation
- Prevents accidental conflicts

### Conflict Detection
```typescript
function findConflictingHotkey(
  proposed: HotkeyBinding,
  existing: HotkeySettings
): string | null {
  if (bindingsEqual(proposed, existing.toggleVisibility)) return 'Toggle Visibility (F3)';
  if (bindingsEqual(proposed, existing.toggleMode)) return 'Toggle Mode (F5)';
  // ... check chronometer bindings
}
```

---

## Research Conclusion

All technical decisions are resolved. The implementation follows established patterns:

1. **Widget**: Widget.tsx + ChronometerWidgetContent.tsx
2. **Hotkeys**: Extend HotkeyAction enum + useHotkeyCapture hook
3. **Settings**: Extend HotkeySettings struct + widget settings UI
4. **State**: useChronometer.ts singleton hook
5. **Persistence**: widget-{id}.json with elapsedMs field

No external dependencies required. All functionality uses existing Tauri/React infrastructure.
