# Feature Specification: Low-Level Keyboard Hook

**Feature Branch**: `029-low-level-keyboard-hook`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Implement the low-level keyboard hook solution like the ArkanisOverlay using your research and plan commented"

## Problem Statement

The current overlay uses `tauri-plugin-global-shortcut` which internally relies on the Windows `RegisterHotKey` API. This high-level hotkey mechanism fails when games like Star Citizen use DirectInput or Raw Input for keyboard handling, as the game consumes keyboard events before Windows can deliver them to the overlay application.

**Research Finding**: ArkanisOverlay successfully captures keyboard input while Star Citizen is running by using a low-level keyboard hook (`SetWindowsHookEx` with `WH_KEYBOARD_LL`) that intercepts ALL keyboard events at the OS kernel level before any application receives them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Hotkey Detection During Gameplay (Priority: P1)

As a Star Citizen player, I want the overlay hotkeys (F3/F5) to work reliably even when Star Citizen is in fullscreen mode and has captured keyboard input, so that I can toggle the overlay without alt-tabbing or leaving the game.

**Why this priority**: This is the core functionality that solves the primary user pain point - hotkeys not working with Star Citizen.

**Independent Test**: Launch Star Citizen in fullscreen mode, press F3, and verify the overlay appears/disappears reliably.

**Acceptance Scenarios**:

1. **Given** Star Citizen is running in fullscreen mode with game window focused, **When** user presses F3, **Then** the overlay visibility toggles within 100ms
2. **Given** Star Citizen is running in borderless windowed mode, **When** user presses F3, **Then** the overlay visibility toggles within 100ms
3. **Given** Star Citizen is running and using keyboard for in-game actions, **When** user presses F5, **Then** the overlay mode toggles between click-through and interactive
4. **Given** Star Citizen is running with RSI Launcher also open, **When** user presses F3, **Then** the overlay hotkey is captured regardless of which window has focus

---

### User Story 2 - Hotkey Registration Feedback (Priority: P2)

As an overlay user, I want to know when hotkeys are successfully registered at startup, so that I can troubleshoot issues if hotkeys stop working.

**Why this priority**: Provides diagnostic capability for users and developers to understand hotkey registration status.

**Independent Test**: Start the overlay and check logs for hotkey registration success/failure messages.

**Acceptance Scenarios**:

1. **Given** the overlay starts successfully, **When** the low-level keyboard hook is installed, **Then** a log message confirms "Low-level keyboard hook installed successfully"
2. **Given** the overlay starts but hook installation fails, **When** the system logs the failure, **Then** the log includes the specific Windows error code and a human-readable description
3. **Given** the overlay is shutting down, **When** the hook is uninstalled, **Then** a log message confirms "Low-level keyboard hook uninstalled"

---

### User Story 3 - Graceful Fallback (Priority: P3)

As an overlay user on a non-Windows system or when the hook fails, I want the overlay to fall back to the standard shortcut mechanism, so that basic functionality is preserved.

**Why this priority**: Ensures the application remains functional even when low-level hooks cannot be installed.

**Independent Test**: Simulate hook installation failure and verify standard shortcuts still work.

**Acceptance Scenarios**:

1. **Given** the low-level hook fails to install, **When** the fallback is triggered, **Then** the standard tauri-plugin-global-shortcut is used instead
2. **Given** the application is running on a non-Windows platform, **When** the hotkey system initializes, **Then** it uses the cross-platform shortcut mechanism without errors

---

### Edge Cases

- What happens when multiple RAIC Overlay instances try to install the keyboard hook?
  - Only one hook should be active; second instance should detect existing hook and not attempt installation (handled by single-instance plugin)
- How does the system handle hook installation failure due to antivirus blocking?
  - Log specific error, fall back to standard shortcuts, and continue operation
- What happens if the keyboard hook thread crashes?
  - Application should detect thread failure and attempt reinstallation or fallback
- How does the system behave when Windows denies hook installation due to UAC or security policies?
  - Log the security error, fall back gracefully, and notify user via log

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST install a low-level keyboard hook using `SetWindowsHookEx` with `WH_KEYBOARD_LL` at application startup
- **FR-002**: System MUST run the keyboard hook on a dedicated background thread with its own Windows message loop
- **FR-003**: System MUST detect F3 key press events and emit overlay toggle visibility events
- **FR-004**: System MUST detect F5 key press events and emit overlay toggle mode events
- **FR-005**: System MUST process key events using `GetAsyncKeyState` to detect currently pressed keys
- **FR-006**: System MUST uninstall the keyboard hook using `UnhookWindowsHookEx` during application shutdown
- **FR-007**: System MUST implement debouncing (200ms) to prevent duplicate hotkey triggers
- **FR-008**: System MUST log all hook installation, key detection, and uninstallation events
- **FR-009**: System MUST fall back to `tauri-plugin-global-shortcut` if hook installation fails
- **FR-010**: System MUST properly clean up the hook thread and message loop on application exit
- **FR-011**: System MUST use `CallNextHookEx` to pass events to other hooks in the chain (non-blocking behavior)

### Key Entities

- **KeyboardHook**: Represents the low-level keyboard hook state, including hook handle, thread handle, and registration status
- **HookThread**: The dedicated background thread running the Windows message loop for hook processing
- **HotkeyEvent**: Represents a detected hotkey press with key code, timestamp, and action type

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: F3 and F5 hotkeys work 100% of the time when Star Citizen is running in fullscreen mode
- **SC-002**: Hotkey response time is under 100ms from key press to overlay action
- **SC-003**: Hook installation succeeds on first attempt in 99% of normal Windows 10/11 environments
- **SC-004**: Application startup time increases by no more than 50ms due to hook installation
- **SC-005**: Memory overhead of the hook thread is less than 1MB
- **SC-006**: No keyboard input lag or interference is introduced for other applications
- **SC-007**: Graceful fallback activates within 500ms if hook installation fails

## Assumptions

- Windows 10 or Windows 11 is the target platform for low-level hook functionality
- The user has not configured antivirus or security software to block keyboard hooks
- The overlay application runs with standard user privileges (no admin required for `WH_KEYBOARD_LL`)
- Star Citizen uses DirectInput or Raw Input which bypasses `RegisterHotKey` but not `WH_KEYBOARD_LL`
- The existing `tauri-plugin-global-shortcut` will be retained as a fallback mechanism
- F3 and F5 remain the configured hotkeys (no runtime customization in this feature)

## Dependencies

- Windows `windows-rs` crate (already in use for window detection)
- Existing `process_monitor.rs` pattern for background thread management
- Existing `hotkey.rs` module for event emission patterns

## Out of Scope

- Custom hotkey configuration (future feature)
- macOS or Linux low-level keyboard capture
- Hotkey conflict detection with other applications
- Visual indicator of hook status in the UI
