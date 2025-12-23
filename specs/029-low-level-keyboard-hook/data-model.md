# Data Model: Low-Level Keyboard Hook

**Feature**: 029-low-level-keyboard-hook
**Date**: 2025-12-23

## Entities

### KeyboardHookState

Represents the state of the low-level keyboard hook system.

| Field | Type | Description |
|-------|------|-------------|
| `is_active` | `AtomicBool` | Whether the hook is currently installed and running |
| `hook_handle` | `AtomicIsize` | The Windows hook handle (HHOOK), 0 if not installed |
| `thread_id` | `AtomicU32` | The thread ID running the message loop, 0 if not running |
| `use_fallback` | `AtomicBool` | Whether fallback to global shortcut is active |

**Lifecycle States**:
- `Stopped` → `Starting` → `Running` → `Stopping` → `Stopped`
- `Running` → `Failed` → `Fallback`

### HotkeyAction

Enum representing the action to take when a hotkey is detected.

| Variant | Description |
|---------|-------------|
| `ToggleVisibility` | F3 pressed - toggle overlay visibility |
| `ToggleMode` | F5 pressed - toggle overlay mode (click-through/interactive) |

### KeyboardMessage

Represents a keyboard event received by the hook callback.

| Field | Type | Description |
|-------|------|-------------|
| `vk_code` | `u32` | Virtual key code (e.g., 0x72 for F3) |
| `scan_code` | `u32` | Hardware scan code |
| `flags` | `u32` | Event flags |
| `timestamp` | `u32` | Event timestamp from Windows |
| `message_type` | `u32` | WM_KEYDOWN, WM_KEYUP, etc. |

## Relationships

```text
┌─────────────────────────────────────────────────────────────┐
│                      Application                              │
│                                                               │
│  ┌─────────────────┐         ┌─────────────────────────────┐ │
│  │   lib.rs        │ starts  │    keyboard_hook.rs         │ │
│  │   (main thread) │────────▶│    (hook thread)            │ │
│  │                 │         │                             │ │
│  │                 │◀────────│    KeyboardHookState        │ │
│  │                 │  events │    (global static)          │ │
│  └─────────────────┘         └─────────────────────────────┘ │
│          │                              │                     │
│          │ fallback                     │ installs            │
│          ▼                              ▼                     │
│  ┌─────────────────┐         ┌─────────────────────────────┐ │
│  │   hotkey.rs     │         │    Windows Kernel           │ │
│  │   (fallback)    │         │    WH_KEYBOARD_LL Hook      │ │
│  └─────────────────┘         └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## State Transitions

### Hook Lifecycle

```text
                 start_keyboard_hook()
    ┌──────────┐        │         ┌──────────┐
    │ Stopped  │────────┴────────▶│ Starting │
    └──────────┘                  └────┬─────┘
         ▲                             │
         │                             │ success
         │ stop                        ▼
         │              ┌──────────────────────┐
         │              │      Running         │
         │              │  (message loop)      │
         │              └──────────┬───────────┘
         │                         │
         │                         │ failure or stop
         │                         ▼
         │              ┌──────────────────────┐
         └──────────────│     Stopping         │
                        └──────────────────────┘
```

### Fallback Activation

```text
    Hook Installation
           │
           ▼
    ┌──────────────┐    success    ┌─────────────┐
    │   Attempt    │──────────────▶│ Hook Active │
    │   Hook       │               │ (preferred) │
    └──────────────┘               └─────────────┘
           │
           │ failure
           ▼
    ┌──────────────────────────────────────────┐
    │   Fallback to tauri-plugin-global-shortcut│
    │   (RegisterHotKey - may not work in game) │
    └──────────────────────────────────────────┘
```

## Constants

### Virtual Key Codes

| Constant | Value | Description |
|----------|-------|-------------|
| `VK_F3` | `0x72` | F3 key - toggle visibility |
| `VK_F5` | `0x74` | F5 key - toggle mode |

### Windows Messages

| Constant | Value | Description |
|----------|-------|-------------|
| `WM_KEYDOWN` | `0x0100` | Key pressed |
| `WM_KEYUP` | `0x0101` | Key released |
| `WM_SYSKEYDOWN` | `0x0104` | System key pressed (with Alt) |
| `WM_SYSKEYUP` | `0x0105` | System key released |

### Hook Types

| Constant | Value | Description |
|----------|-------|-------------|
| `WH_KEYBOARD_LL` | `13` | Low-level keyboard hook |

### Debounce

| Constant | Value | Description |
|----------|-------|-------------|
| `DEBOUNCE_MS` | `200` | Minimum time between hotkey triggers |

## Validation Rules

1. **Hook Handle Validity**: Hook handle must be non-zero when `is_active` is true
2. **Thread ID Validity**: Thread ID must be non-zero when hook is running
3. **Single Instance**: Only one keyboard hook instance should be active at a time
4. **Debounce Enforcement**: Same hotkey cannot trigger within 200ms of last trigger

## Thread Safety

All state fields use atomic types for safe cross-thread access:
- `AtomicBool` for flags
- `AtomicIsize` for hook handle (matches HHOOK size)
- `AtomicU32` for thread ID and timestamps

The `lazy_static` macro provides safe static initialization, following the same pattern as `PROCESS_MONITOR_STATE` in `process_monitor.rs`.
