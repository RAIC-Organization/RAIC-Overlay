# Feature Specification: Fix Update Popup Not Appearing

**Feature Branch**: `051-fix-update-popup`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Fix the update system, the current system is detecting a new version but is not presenting the popup for the user update or ask for later"

## Clarifications

### Session 2026-01-03

- Q: What architectural approach should be used to display the update notification when the main window is hidden? → A: Use a separate dedicated window (like the settings panel) that appears in the taskbar. This ensures the update notification is always visible and accessible to the user regardless of the overlay state.

## Problem Analysis

The current update system correctly:
1. Detects new versions from GitHub releases
2. Logs the detection in the application log
3. Sets the internal update state to "available"

However, the update notification popup is not visible to users because:
- The main Tauri window starts hidden (configured with `visible: false`)
- The update notification component is rendered inside this hidden window
- Users only see the window when they manually toggle visibility (F3 hotkey)
- By this time, the update notification may have been dismissed or the state reset

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Update Notification on App Launch (Priority: P1)

When a user launches the RAIC Overlay application and a new version is available, they should see an update notification popup in a separate window that appears in the taskbar, allowing them to either download the update or dismiss it for later.

**Why this priority**: This is the core issue - users cannot discover available updates, which means they miss important bug fixes and features.

**Independent Test**: Can be fully tested by launching the app with a newer version available on GitHub and verifying a popup window appears in the taskbar within 5 seconds of app launch.

**Acceptance Scenarios**:

1. **Given** a new version is available on GitHub, **When** the user launches the application, **Then** an update notification popup window appears within 5 seconds, visible in the taskbar, showing the version upgrade path (e.g., "0.1.0 → 0.2.0").

2. **Given** the update notification window is displayed, **When** the user clicks "Update Now", **Then** the download begins and progress is shown in the same window.

3. **Given** the update notification window is displayed, **When** the user clicks "Ask Again Later", **Then** the window closes and the user can continue using the app.

4. **Given** the update notification window is displayed, **When** the user clicks the window close button (X), **Then** the window closes (behaves like "Ask Again Later").

---

### User Story 2 - Update Window Visible in Taskbar (Priority: P1)

The update notification window must appear in the Windows taskbar, similar to the settings panel, so users can easily locate and interact with it even if it gets covered by other windows.

**Why this priority**: Taskbar visibility ensures users can always find and access the update notification, improving discoverability and usability.

**Independent Test**: Can be tested by launching the app with an update available, then clicking on the update window in the taskbar to bring it to focus.

**Acceptance Scenarios**:

1. **Given** an update is available, **When** the update notification window opens, **Then** it appears as a separate entry in the Windows taskbar.

2. **Given** the update notification window is open but covered by other windows, **When** the user clicks its taskbar icon, **Then** the window comes to the foreground.

---

### User Story 3 - Update Notification Independent of Overlay State (Priority: P2)

The update notification window operates independently of the main overlay window, so users see the update regardless of whether the overlay is visible, hidden, or in click-through mode.

**Why this priority**: Users may not have the overlay visible when they launch the app; the update notification should still be accessible.

**Independent Test**: Can be tested by keeping the overlay hidden while launching the app with an update available, and verifying the update window still appears.

**Acceptance Scenarios**:

1. **Given** the overlay is hidden (not visible), **When** an update is detected, **Then** the update notification window appears independently.

2. **Given** the update notification window is open, **When** the user toggles the overlay visibility (F3), **Then** the update notification window remains unaffected.

---

### Edge Cases

- What happens when the network is unavailable during update check? (Check fails silently, no window opens)
- What happens when the user dismisses the window and restarts the app? (Should show again based on check interval logic)
- What happens if the user closes the update window during download? (Download continues in background; user can reopen from tray menu if needed)
- What happens if the GitHub API rate limit is exceeded? (Update check fails silently, no window shown)
- What happens if the update window is already open and another update check runs? (Reuse existing window, update info if version changed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the update notification in a separate, dedicated window when a new version is detected.
- **FR-002**: The update notification window MUST be visible in the Windows taskbar (not skip taskbar).
- **FR-003**: The update notification window MUST appear within 5 seconds of app launch when an update is available.
- **FR-004**: The update notification window MUST operate independently of the main overlay window's visibility state.
- **FR-005**: System MUST allow users to interact with the update notification buttons ("Update Now", "Ask Again Later") at any time while the window is open.
- **FR-006**: System MUST log all update notification window open/close events and user interactions for debugging purposes.
- **FR-007**: The update notification window MUST follow the same visual styling as the settings panel (transparent background, custom titlebar, centered on screen).
- **FR-008**: Closing the update notification window (via X button or "Ask Again Later") MUST dismiss the notification for the current session.

### Architectural Constraint

The update notification window MUST follow the existing settings panel window pattern:
1. Backend detects the condition (update available)
2. Backend creates a new dedicated window (similar to `open_settings_window`)
3. Window is configured with `skip_taskbar(false)` to appear in taskbar
4. Window loads the update notification UI component
5. Window operates independently of the main overlay window

This ensures consistency with the settings panel pattern and provides reliable visibility to users.

### Key Entities

- **UpdateWindow**: A dedicated window for displaying update notifications. Appears in the taskbar, styled like the settings panel.
- **UpdateNotification**: The UI component showing version info, download button, and dismiss button. Rendered inside the UpdateWindow.
- **UpdateState**: Tracks whether an update is available, the pending version, and whether the notification has been dismissed for the current session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of users with available updates see the notification window within 5 seconds of app launch.
- **SC-002**: The update notification window appears in the taskbar in 100% of test scenarios.
- **SC-003**: Users can successfully initiate an update download from the notification in 100% of attempts when network is available.
- **SC-004**: The update notification window opens correctly in 100% of scenarios where the overlay is hidden.

## Assumptions

- The GitHub API and releases infrastructure remain available and functional.
- The existing update detection logic (version comparison, MSI asset finding) is working correctly.
- The existing update notification UI component can be reused in the new dedicated window with minimal changes.
- The settings panel window pattern provides a proven, reliable approach for creating taskbar-visible windows.
- Windows is the target platform (taskbar behavior is Windows-specific).
