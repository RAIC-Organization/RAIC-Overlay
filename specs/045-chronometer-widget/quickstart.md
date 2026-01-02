# Quickstart: Chronometer Widget Implementation

**Feature**: 045-chronometer-widget
**Date**: 2026-01-02

This guide provides the implementation order and key code snippets for each file.

---

## Implementation Order

### Phase 1: Type Definitions (Foundation)

1. **src/types/widgets.ts** - Add 'chronometer' to WidgetType
2. **src/types/user-settings.ts** - Add chronometer hotkey bindings
3. **src-tauri/src/user_settings_types.rs** - Mirror TypeScript changes

### Phase 2: Backend Hotkey System

4. **src-tauri/src/keyboard_hook.rs** - Add HotkeyAction variants + callbacks
5. **src-tauri/src/user_settings.rs** - Add defaults + cache functions
6. **src-tauri/src/lib.rs** - Register new commands

### Phase 3: Frontend Hotkey Capture

7. **src/hooks/useHotkeyCapture.ts** - Add chronometer hotkey matching

### Phase 4: Chronometer Core

8. **src/lib/chronometerEvents.ts** - Event emitter for actions
9. **src/hooks/useChronometer.ts** - State management hook

### Phase 5: Widget Components

10. **src/components/widgets/ChronometerWidgetContent.tsx** - Display component
11. **src/components/widgets/ChronometerWidgetSettings.tsx** - Settings UI
12. **src/components/widgets/WidgetsContainer.tsx** - Add render case
13. **src/components/widgets/index.ts** - Export new components

### Phase 6: Integration & Testing

14. **src/contexts/WidgetsContext.tsx** - Add chronometer defaults
15. Manual testing in both overlay modes

---

## Key Implementation Snippets

### 1. Widget Type Extension

```typescript
// src/types/widgets.ts
export type WidgetType = 'clock' | 'timer' | 'chronometer';
```

### 2. User Settings Types

```typescript
// src/types/user-settings.ts
export interface HotkeySettings {
  toggleVisibility: HotkeyBinding;
  toggleMode: HotkeyBinding;
  chronometerStartPause: HotkeyBinding;  // ADD
  chronometerReset: HotkeyBinding;       // ADD
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  // ... existing defaults
  hotkeys: {
    // ... existing
    chronometerStartPause: {
      key: 'T',
      keyCode: 0x54,
      ctrl: true,
      shift: false,
      alt: false,
    },
    chronometerReset: {
      key: 'Y',
      keyCode: 0x59,
      ctrl: true,
      shift: false,
      alt: false,
    },
  },
};
```

### 3. Rust HotkeyAction Enum

```rust
// src-tauri/src/keyboard_hook.rs
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum HotkeyAction {
    ToggleVisibility,
    ToggleMode,
    ChronometerStartPause,  // ADD
    ChronometerReset,       // ADD
}
```

### 4. Keyboard Hook Callback (add after existing checks)

```rust
// src-tauri/src/keyboard_hook.rs (in keyboard_hook_callback)
let chrono_toggle = &hotkeys.chronometer_start_pause;
if vk_code == chrono_toggle.key_code
    && ctrl == chrono_toggle.ctrl
    && shift == chrono_toggle.shift
    && alt == chrono_toggle.alt
{
    let now = current_time_ms();
    let last = KEYBOARD_HOOK_STATE.last_chrono_toggle.load(Ordering::Relaxed);
    if now.saturating_sub(last) >= DEBOUNCE_MS {
        KEYBOARD_HOOK_STATE.last_chrono_toggle.store(now, Ordering::Relaxed);
        log::debug!("Ctrl+T pressed: chronometer toggle");
        KEYBOARD_HOOK_STATE.emit_action(HotkeyAction::ChronometerStartPause);
    }
}

let chrono_reset = &hotkeys.chronometer_reset;
if vk_code == chrono_reset.key_code
    && ctrl == chrono_reset.ctrl
    && shift == chrono_reset.shift
    && alt == chrono_reset.alt
{
    let now = current_time_ms();
    let last = KEYBOARD_HOOK_STATE.last_chrono_reset.load(Ordering::Relaxed);
    if now.saturating_sub(last) >= DEBOUNCE_MS {
        KEYBOARD_HOOK_STATE.last_chrono_reset.store(now, Ordering::Relaxed);
        log::debug!("Ctrl+Y pressed: chronometer reset");
        KEYBOARD_HOOK_STATE.emit_action(HotkeyAction::ChronometerReset);
    }
}
```

### 5. Event Emission

```rust
// src-tauri/src/keyboard_hook.rs (in start_keyboard_hook event emitter)
let event_name = match action {
    HotkeyAction::ToggleVisibility => "toggle-visibility",
    HotkeyAction::ToggleMode => "toggle-mode",
    HotkeyAction::ChronometerStartPause => "chronometer-start-pause",
    HotkeyAction::ChronometerReset => "chronometer-reset",
};
```

### 6. useHotkeyCapture Extension

```typescript
// src/hooks/useHotkeyCapture.ts
const lastChronoToggleRef = useRef<number>(0);
const lastChronoResetRef = useRef<number>(0);

// In handleKeyDown:
if (matchesHotkey(e, config.chronometerStartPause)) {
  e.preventDefault();
  e.stopImmediatePropagation();
  const now = Date.now();
  if (now - lastChronoToggleRef.current >= DEBOUNCE_MS) {
    lastChronoToggleRef.current = now;
    info('Chronometer toggle hotkey (webview)');
    invoke('chronometer_start_pause').catch(debug);
  }
  return;
}

if (matchesHotkey(e, config.chronometerReset)) {
  e.preventDefault();
  e.stopImmediatePropagation();
  const now = Date.now();
  if (now - lastChronoResetRef.current >= DEBOUNCE_MS) {
    lastChronoResetRef.current = now;
    info('Chronometer reset hotkey (webview)');
    invoke('chronometer_reset').catch(debug);
  }
  return;
}
```

### 7. useChronometer Hook

```typescript
// src/hooks/useChronometer.ts
import { useState, useEffect, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

interface ChronometerState {
  isRunning: boolean;
  elapsedMs: number;
  lastTickTimestamp: number | null;
}

// Singleton state
let globalState: ChronometerState = {
  isRunning: false,
  elapsedMs: 0,
  lastTickTimestamp: null,
};

const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function startInterval() {
  if (intervalId) return;
  globalState.lastTickTimestamp = Date.now();
  intervalId = setInterval(() => {
    if (globalState.isRunning && globalState.lastTickTimestamp) {
      const now = Date.now();
      globalState.elapsedMs += now - globalState.lastTickTimestamp;
      globalState.lastTickTimestamp = now;
      notifyListeners();
    }
  }, 1000);
}

function stopInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  globalState.lastTickTimestamp = null;
}

export function useChronometer() {
  const [, forceUpdate] = useState({});
  const isFirstMount = useRef(true);

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);

    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Setup event listeners for backend events
      let unlistenToggle: UnlistenFn;
      let unlistenReset: UnlistenFn;

      (async () => {
        unlistenToggle = await listen('chronometer-start-pause', () => {
          toggle();
        });
        unlistenReset = await listen('chronometer-reset', () => {
          reset();
        });
      })();
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stopInterval();
      }
    };
  }, []);

  const toggle = () => {
    if (globalState.isRunning) {
      globalState.isRunning = false;
      stopInterval();
    } else {
      globalState.isRunning = true;
      startInterval();
    }
    notifyListeners();
  };

  const reset = () => {
    globalState.isRunning = false;
    globalState.elapsedMs = 0;
    stopInterval();
    notifyListeners();
  };

  return {
    isRunning: globalState.isRunning,
    elapsedMs: globalState.elapsedMs,
    formattedTime: formatElapsedTime(globalState.elapsedMs),
    toggle,
    reset,
  };
}

function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

### 8. ChronometerWidgetContent

```typescript
// src/components/widgets/ChronometerWidgetContent.tsx
import { useRef, useState, useEffect } from 'react';
import { useChronometer } from '@/hooks/useChronometer';

const MIN_FONT_SIZE = 16;

interface Props {
  isInteractive: boolean;
  widgetId?: string;
}

export function ChronometerWidgetContent({ isInteractive }: Props) {
  const { formattedTime, isRunning } = useChronometer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(48);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const newSize = Math.min(width * 0.15, height * 0.7);
      setFontSize(Math.max(MIN_FONT_SIZE, newSize));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center pointer-events-none"
    >
      <span
        className="pointer-events-auto cursor-move select-none font-orbitron liquid-glass-text"
        style={{ fontSize }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
```

### 9. WidgetsContainer Case

```typescript
// src/components/widgets/WidgetsContainer.tsx (in renderWidgetContent)
case 'chronometer':
  return <ChronometerWidgetContent isInteractive={isInteractive} widgetId={widget.id} />;
```

---

## Testing Checklist

- [ ] Ctrl+T starts chronometer when paused
- [ ] Ctrl+T pauses chronometer when running
- [ ] Ctrl+Y resets chronometer to 00:00:00
- [ ] Hotkeys work in non-interactive mode (F5 toggled)
- [ ] Hotkeys work in interactive mode (webview focused)
- [ ] Time display updates every second
- [ ] Widget persists time on close
- [ ] Widget restores time on reopen (paused)
- [ ] Custom hotkeys can be configured
- [ ] Custom hotkeys persist after restart
- [ ] Conflict warning shown for F3/F5 conflicts

---

## Files Modified/Created Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/widgets.ts` | MODIFY | Add 'chronometer' type |
| `src/types/user-settings.ts` | MODIFY | Add hotkey bindings |
| `src-tauri/src/user_settings_types.rs` | MODIFY | Mirror TS changes |
| `src-tauri/src/keyboard_hook.rs` | MODIFY | Add HotkeyAction + callbacks |
| `src-tauri/src/user_settings.rs` | MODIFY | Add defaults |
| `src-tauri/src/lib.rs` | MODIFY | Register commands |
| `src/hooks/useHotkeyCapture.ts` | MODIFY | Add chrono matching |
| `src/lib/chronometerEvents.ts` | CREATE | Event emitter |
| `src/hooks/useChronometer.ts` | CREATE | State hook |
| `src/components/widgets/ChronometerWidgetContent.tsx` | CREATE | Display |
| `src/components/widgets/ChronometerWidgetSettings.tsx` | CREATE | Settings UI |
| `src/components/widgets/WidgetsContainer.tsx` | MODIFY | Add render case |
| `src/components/widgets/index.ts` | MODIFY | Exports |
| `src/contexts/WidgetsContext.tsx` | MODIFY | Widget defaults |
