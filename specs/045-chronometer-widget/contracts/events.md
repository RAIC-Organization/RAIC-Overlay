# Event Contracts: Chronometer Widget

**Feature**: 045-chronometer-widget
**Date**: 2026-01-02

## Tauri Backend Events

Events emitted from Rust backend to frontend via `app_handle.emit()`.

### chronometer-start-pause

Emitted when the start/pause hotkey is triggered via low-level keyboard hook.

```typescript
// Event name
"chronometer-start-pause"

// Payload
void  // No payload

// Usage
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('chronometer-start-pause', () => {
  // Toggle chronometer running state
});
```

**Trigger Conditions**:
- Low-level keyboard hook detects configured hotkey (default: Ctrl+T)
- Overlay is visible
- Chronometer widget exists
- 200ms debounce passed since last trigger

---

### chronometer-reset

Emitted when the reset hotkey is triggered via low-level keyboard hook.

```typescript
// Event name
"chronometer-reset"

// Payload
void  // No payload

// Usage
const unlisten = await listen('chronometer-reset', () => {
  // Reset chronometer to 00:00:00
});
```

**Trigger Conditions**:
- Low-level keyboard hook detects configured hotkey (default: Ctrl+Y)
- Overlay is visible
- Chronometer widget exists
- 200ms debounce passed since last trigger

---

### hotkeys-updated

Existing event - extended to include chronometer hotkey changes.

```typescript
// Event name
"hotkeys-updated"

// Payload
interface HotkeySettings {
  toggleVisibility: HotkeyBinding;
  toggleMode: HotkeyBinding;
  chronometerStartPause: HotkeyBinding;  // NEW
  chronometerReset: HotkeyBinding;       // NEW
}

// Usage
const unlisten = await listen<HotkeySettings>('hotkeys-updated', (event) => {
  setHotkeyConfig(event.payload);
});
```

---

## Tauri Commands

Commands invoked from frontend via `invoke()`.

### chronometer_start_pause

Toggles chronometer running state. Called from webview hotkey capture.

```typescript
// Command name
"chronometer_start_pause"

// Parameters
void  // No parameters

// Return
interface ChronometerStateResponse {
  success: boolean;
  isRunning: boolean;
  elapsedMs: number;
}

// Usage
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ChronometerStateResponse>('chronometer_start_pause');
```

---

### chronometer_reset

Resets chronometer to zero. Called from webview hotkey capture.

```typescript
// Command name
"chronometer_reset"

// Parameters
void  // No parameters

// Return
interface ChronometerStateResponse {
  success: boolean;
  isRunning: boolean;  // Always false after reset
  elapsedMs: number;   // Always 0 after reset
}

// Usage
const result = await invoke<ChronometerStateResponse>('chronometer_reset');
```

---

### update_chronometer_hotkeys

Updates chronometer hotkey configuration.

```typescript
// Command name
"update_chronometer_hotkeys"

// Parameters
interface UpdateChronometerHotkeysParams {
  startPause: HotkeyBinding;
  reset: HotkeyBinding;
}

// Return
interface UpdateHotkeysResult {
  success: boolean;
  error?: string;
}

// Usage
const result = await invoke<UpdateHotkeysResult>('update_chronometer_hotkeys', {
  startPause: { key: 'T', keyCode: 0x54, ctrl: true, shift: true, alt: false },
  reset: { key: 'Y', keyCode: 0x59, ctrl: true, shift: false, alt: false },
});
```

---

## Frontend Internal Events

Events within the frontend event system (widgetEvents pattern).

### chronometerEvents

```typescript
// src/lib/chronometerEvents.ts
import { createEventEmitter } from './eventEmitter';

type ChronometerEventMap = {
  'chronometer:toggle': void;  // Trigger start/pause
  'chronometer:reset': void;   // Trigger reset
  'chronometer:state-changed': {
    isRunning: boolean;
    elapsedMs: number;
  };
};

export const chronometerEvents = createEventEmitter<ChronometerEventMap>();

// Usage
chronometerEvents.emit('chronometer:toggle');
chronometerEvents.on('chronometer:state-changed', ({ isRunning, elapsedMs }) => {
  console.log(`Chronometer: ${isRunning ? 'running' : 'paused'} at ${elapsedMs}ms`);
});
```

---

## Event Flow Diagrams

### Start/Pause via Backend Hook (Non-Interactive Mode)

```
[User presses Ctrl+T]
        ↓
[Windows WH_KEYBOARD_LL hook]
        ↓
[keyboard_hook.rs::keyboard_hook_callback]
        ↓
[Check: vk_code == 0x54 && ctrl == true]
        ↓
[Check: debounce (200ms)]
        ↓
[KEYBOARD_HOOK_STATE.emit_action(ChronometerStartPause)]
        ↓
[app_handle.emit("chronometer-start-pause", ())]
        ↓
[useChronometer.ts receives event]
        ↓
[Toggle isRunning state]
        ↓
[chronometerEvents.emit('chronometer:state-changed', ...)]
```

### Start/Pause via Webview (Interactive Mode)

```
[User presses Ctrl+T in webview]
        ↓
[document.addEventListener('keydown', ..., { capture: true })]
        ↓
[useHotkeyCapture.ts::handleKeyDown]
        ↓
[matchesHotkey(event, config.chronometerStartPause)]
        ↓
[e.preventDefault() + e.stopImmediatePropagation()]
        ↓
[Check: debounce (200ms)]
        ↓
[invoke('chronometer_start_pause')]
        ↓
[lib.rs::chronometer_start_pause command]
        ↓
[Return ChronometerStateResponse]
        ↓
[useChronometer.ts updates state]
```

### Hotkey Configuration Update

```
[User modifies hotkey in settings]
        ↓
[ChronometerWidgetSettings.tsx]
        ↓
[invoke('update_chronometer_hotkeys', { startPause, reset })]
        ↓
[user_settings.rs::update_chronometer_hotkeys]
        ↓
[Update USER_SETTINGS cache]
        ↓
[Save to user-settings.json]
        ↓
[app.emit("hotkeys-updated", hotkeySettings)]
        ↓
[useHotkeyCapture.ts receives event]
        ↓
[Update local hotkeyConfig state]
        ↓
[New hotkeys active immediately]
```
