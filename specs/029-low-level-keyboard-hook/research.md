# Research: Low-Level Keyboard Hook Implementation

**Feature**: 029-low-level-keyboard-hook
**Date**: 2025-12-23

## Problem Context

The current overlay uses `tauri-plugin-global-shortcut` which internally relies on Windows `RegisterHotKey` API. This fails with Star Citizen because:

1. `RegisterHotKey` registers hotkeys at the Windows shell level
2. Games using DirectInput or Raw Input capture keyboard events at a lower level
3. Star Citizen consumes F3/F5 before Windows can deliver the hotkey message

## Research Findings

### 1. ArkanisOverlay Implementation Analysis

**Source**: [ArkanisOverlay GitHub Repository](https://github.com/ArkanisCorporation/ArkanisOverlay)

ArkanisOverlay successfully captures keyboard input with Star Citizen using:

- **Low-level keyboard hook**: `SetWindowsHookEx` with `WH_KEYBOARD_LL`
- **Dedicated thread**: Runs message loop on a background thread
- **Key detection**: Uses `GetAsyncKeyState` to detect pressed keys
- **Event-based**: Fires events on key-up to detect complete shortcut combinations

Key file: `src/Arkanis.Overlay.Host.Desktop/Workers/GlobalKeyboardShortcutListener.cs`

```csharp
// Hook installation
SetWindowsHookEx(WINDOWS_HOOK_ID.WH_KEYBOARD_LL, _proc, HINSTANCE.Null, 0)

// Message loop
while (PInvoke.GetMessage(out var msg, HWND.Null, 0, 0)) {
    PInvoke.TranslateMessage(in msg);
    PInvoke.DispatchMessage(in msg);
}

// Key detection
PInvoke.GetAsyncKeyState((int)vkCode) & 0x8000
```

**Decision**: Implement the same pattern in Rust using `windows-rs` crate.

### 2. Windows-rs API Requirements

**Sources**:
- [SetWindowsHookExW Documentation](https://microsoft.github.io/windows-docs-rs/doc/windows/Win32/UI/WindowsAndMessaging/fn.SetWindowsHookExW.html)
- [windows-rs Features Tool](https://microsoft.github.io/windows-rs/features/)

Required Windows API functions:
- `SetWindowsHookExW` - Install the hook
- `UnhookWindowsHookEx` - Remove the hook
- `CallNextHookEx` - Pass events to next hook in chain
- `GetMessageW` - Retrieve messages from queue
- `TranslateMessage` - Translate virtual-key messages
- `DispatchMessageW` - Dispatch message to window procedure
- `GetAsyncKeyState` - Check current key state
- `PostQuitMessage` - Signal thread to exit

**Cargo.toml Features Required**:
```toml
windows = { version = "0.62", features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
    "Win32_UI_Input_KeyboardAndMouse",
    "Win32_System_Threading",
    "Win32_System_ProcessStatus",
    "Win32_System_LibraryLoader"
] }
```

**Decision**: Add `Win32_UI_Input_KeyboardAndMouse` and `Win32_System_LibraryLoader` features.

### 3. Existing Rust Implementations

**Sources**:
- [keyboardhook-rs](https://github.com/kmgb/keyboardhook-rs) - Example low-level keyboard hook in Rust
- [win-hotkeys crate](https://lib.rs/crates/win-hotkeys) - Rust library using WH_KEYBOARD_LL

The `keyboardhook-rs` example shows the pattern:

1. Spawn dedicated thread for message loop
2. Install hook with `SetWindowsHookExA`
3. Run message loop with `GetMessageA`/`TranslateMessage`/`DispatchMessageA`
4. Callback processes `WM_KEYDOWN`, `WM_KEYUP`, `WM_SYSKEYDOWN`, `WM_SYSKEYUP`
5. Use `CallNextHookEx` to pass events to other hooks

**Decision**: Follow this pattern, adapted for our use case.

### 4. Hook Callback Design

**Source**: [LowLevelKeyboardProc Documentation](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/legacy/ms644985(v=vs.85))

The callback receives:
- `nCode` - If `HC_ACTION`, process the event
- `wParam` - Message type (`WM_KEYDOWN`, `WM_KEYUP`, etc.)
- `lParam` - Pointer to `KBDLLHOOKSTRUCT` containing:
  - `vkCode` - Virtual key code
  - `scanCode` - Hardware scan code
  - `flags` - Event flags
  - `time` - Timestamp
  - `dwExtraInfo` - Extra info

**Decision**:
- Process only `WM_KEYDOWN` events (not key-up) for immediate response
- Check for `VK_F3` (0x72) and `VK_F5` (0x74)
- Always call `CallNextHookEx` to allow other applications to receive the key

### 5. Thread Safety Considerations

**Key Points**:
- Hook callback runs in the context of the thread that installed it
- Thread must have a message loop for the hook to receive events
- Use atomic operations for cross-thread state management
- Use channels or events for communicating hotkey presses to main thread

**Decision**:
- Use `std::sync::atomic` for hook state (same as `process_monitor.rs`)
- Use Tauri events to emit hotkey presses (same as current `hotkey.rs`)
- Store `AppHandle` clone in thread-local or global state

### 6. Fallback Strategy

If hook installation fails:
1. Log the error with Windows error code
2. Fall back to `tauri-plugin-global-shortcut`
3. Continue normal operation

**Decision**: Keep the existing `hotkey.rs` code as fallback, conditionally used if hook fails.

## Summary of Decisions

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Use `SetWindowsHookEx` with `WH_KEYBOARD_LL` | Intercepts all keyboard events at kernel level, works with games | `RegisterHotKey` (bypassed by games), Raw Input (more complex) |
| Dedicated background thread | Required for message loop | Main thread (would block), async (hooks need sync message loop) |
| Process `WM_KEYDOWN` only | Faster response than waiting for key-up | Key-up (adds latency), both (could cause double triggers) |
| Always call `CallNextHookEx` | Non-blocking, allows other apps to receive key | Blocking (would break other applications) |
| Use Tauri events for emission | Reuses existing pattern from current hotkey.rs | Direct function calls (tighter coupling), channels (more complex) |
| Fallback to global shortcut | Graceful degradation if hook fails | No fallback (would break on failure) |

## Implementation Notes

### Virtual Key Codes
- `VK_F3` = 0x72 (114 decimal)
- `VK_F5` = 0x74 (116 decimal)

### Message Types
- `WM_KEYDOWN` = 0x0100
- `WM_KEYUP` = 0x0101
- `WM_SYSKEYDOWN` = 0x0104
- `WM_SYSKEYUP` = 0x0105

### Hook Installation
```rust
SetWindowsHookExW(
    WH_KEYBOARD_LL,
    Some(keyboard_hook_callback),
    HINSTANCE::default(),  // No module handle needed for WH_KEYBOARD_LL
    0                      // Thread ID 0 = all threads (global hook)
)
```

### Thread Lifecycle
1. Spawn thread
2. Install hook
3. Enter message loop
4. On stop signal: `PostQuitMessage(0)`
5. Message loop exits
6. Uninstall hook
7. Thread exits
