# Quickstart: Low-Level Keyboard Hook Testing

**Feature**: 029-low-level-keyboard-hook
**Date**: 2025-12-23

## Prerequisites

1. Windows 10 or Windows 11 (64-bit)
2. Star Citizen installed and ready to launch
3. RSI Launcher installed
4. RAIC Overlay built with the new keyboard hook feature

## Build Instructions

```bash
cd src-tauri
cargo build --release
```

## Test Scenarios

### Scenario 1: Hook Installation Verification

**Purpose**: Verify the low-level keyboard hook installs successfully at startup.

**Steps**:
1. Start the RAIC Overlay application
2. Open the log file at `%LOCALAPPDATA%\com.raicoverlay.app\logs\RAIC Overlay.log`
3. Search for "keyboard hook" in the log

**Expected Results**:
- Log contains: `"Low-level keyboard hook installed successfully"`
- No error messages related to hook installation

**Failure Indicators**:
- Log contains error message with Windows error code
- Log shows fallback activation: `"Falling back to global shortcut plugin"`

---

### Scenario 2: F3 Hotkey with Star Citizen (Primary Test)

**Purpose**: Verify F3 works to toggle overlay visibility while Star Citizen is running.

**Steps**:
1. Launch Star Citizen through RSI Launcher
2. Wait for the game to fully load (main menu or in-game)
3. Start RAIC Overlay (or ensure it's already running)
4. With Star Citizen in focus (fullscreen), press F3
5. Observe overlay behavior
6. Press F3 again

**Expected Results**:
- First F3 press: Overlay appears over Star Citizen
- Second F3 press: Overlay hides
- Response time is under 100ms (feels instant)
- No interference with Star Citizen gameplay

**Log Verification**:
- Log contains: `"Ctrl+Shift+F3 pressed"` or `"F3 pressed"` entries
- Log shows toggle actions occurring

---

### Scenario 3: F5 Hotkey Mode Toggle

**Purpose**: Verify F5 works to toggle overlay mode while Star Citizen is running.

**Steps**:
1. With Star Citizen running and overlay visible (F3)
2. Press F5
3. Observe overlay mode change
4. Press F5 again

**Expected Results**:
- First F5 press: Overlay becomes interactive (can click on it)
- Second F5 press: Overlay returns to click-through mode
- Mode change is immediate

---

### Scenario 4: Borderless Windowed Mode

**Purpose**: Verify hotkeys work in borderless windowed mode.

**Steps**:
1. Configure Star Citizen for borderless windowed mode
2. Launch the game
3. Test F3 and F5 hotkeys

**Expected Results**:
- Same behavior as fullscreen mode
- Hotkeys respond correctly

---

### Scenario 5: Alt-Tab Behavior

**Purpose**: Verify hotkeys work after alt-tabbing away from Star Citizen.

**Steps**:
1. With Star Citizen running
2. Alt-Tab to another application (e.g., desktop)
3. Press F3
4. Alt-Tab back to Star Citizen
5. Press F3 again

**Expected Results**:
- F3 while away from Star Citizen: Overlay not shown (game not focused)
- F3 after returning to Star Citizen: Overlay shown correctly
- Log shows focus detection working

---

### Scenario 6: RSI Launcher vs Game Window

**Purpose**: Verify overlay distinguishes between RSI Launcher and game window.

**Steps**:
1. Start RSI Launcher
2. Start RAIC Overlay
3. Press F3 while RSI Launcher is focused
4. Launch Star Citizen from the launcher
5. Once game loads, press F3 with game focused

**Expected Results**:
- F3 with launcher focused: Overlay not shown (not the game window)
- F3 with game focused: Overlay shown correctly
- Log shows proper window detection

---

### Scenario 7: Fallback Mechanism

**Purpose**: Verify graceful fallback when hook installation fails.

**Steps** (requires modifying code or simulating failure):
1. Modify code to force hook installation failure
2. Start RAIC Overlay
3. Check logs for fallback activation
4. Test F3 with a non-game application

**Expected Results**:
- Log shows fallback activation
- F3 works with non-game applications (via RegisterHotKey)
- Application continues to function

---

### Scenario 8: Application Shutdown

**Purpose**: Verify clean hook uninstallation on exit.

**Steps**:
1. Start RAIC Overlay
2. Verify hook is installed (check logs)
3. Close the overlay (via system tray or window close)
4. Check final log entries

**Expected Results**:
- Log contains: `"Low-level keyboard hook uninstalled"`
- No errors during shutdown
- Application exits cleanly

---

## Log Analysis

### Key Log Messages to Look For

| Message | Meaning |
|---------|---------|
| `Low-level keyboard hook installed successfully` | Hook active |
| `Low-level keyboard hook uninstalled` | Clean shutdown |
| `F3 pressed: toggle visibility requested` | Hotkey detected |
| `F5 pressed: toggle mode requested` | Mode hotkey detected |
| `Falling back to global shortcut plugin` | Hook failed, using fallback |
| `Hook installation failed: [error code]` | Hook failed to install |

### Log File Location

```
%LOCALAPPDATA%\com.raicoverlay.app\logs\RAIC Overlay.log
```

Full path example:
```
C:\Users\<username>\AppData\Local\com.raicoverlay.app\logs\RAIC Overlay.log
```

## Troubleshooting

### Hotkeys Not Working

1. Check if hook is installed (search log for "hook installed")
2. Verify Star Citizen is the focused window (check focus logs)
3. Check for antivirus interference
4. Try running as Administrator (shouldn't be needed, but worth trying)

### Overlay Not Appearing

1. Verify window detection works (check "valid=true" in logs)
2. Ensure Star Citizen window class is `CryENGINE`
3. Check for focus detection issues

### Performance Issues

1. Check if keyboard input feels laggy
2. Review log timestamps for response time
3. Verify no excessive logging is enabled (DEBUG level)
