# Feature Specification: Settings Panel Window

**Feature Branch**: `038-settings-panel`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Create a new Settings panel using a Tauri window that can be moved over the OS desktop by dragging its header, visible in Windows taskbar, styled like the error modal, opened from tray icon menu, with close button that hides the window, hotkey configuration section for F3 show/hide overlay and F5 passthrough/interactive mode, user settings persisted alongside state.json, and Windows startup auto-launch option"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Hotkeys (Priority: P1)

A user wants to customize the keyboard shortcuts used to control the overlay because the default F3/F5 keys conflict with other applications they use. They open the Settings panel, locate the hotkey configuration section, and reassign the toggle visibility hotkey from F3 to Ctrl+Shift+O and the toggle mode hotkey from F5 to Ctrl+Shift+M. After saving, the new hotkeys work immediately.

**Why this priority**: Hotkey customization is the primary reason users need a settings panel. Conflicting hotkeys prevent core functionality from working properly.

**Independent Test**: Can be fully tested by opening the Settings panel, changing a hotkey binding, pressing the new key combination, and verifying the overlay responds correctly.

**Acceptance Scenarios**:

1. **Given** the Settings panel is open and showing the Hotkeys section, **When** the user clicks on the "Toggle Visibility" hotkey field and presses Ctrl+Shift+O, **Then** the field displays "Ctrl+Shift+O" and the new binding is active
2. **Given** a user has set a custom hotkey, **When** they restart the application, **Then** the custom hotkey is still configured and functional
3. **Given** the user presses a key combination already in use by the other hotkey, **When** they try to save, **Then** a visual warning indicates the conflict and prevents duplicate bindings

---

### User Story 2 - Access Settings via Tray Icon (Priority: P2)

A user wants to quickly access application settings while the overlay is running. They right-click on the system tray icon and select "Settings" from the context menu. The Settings panel opens as a standalone window that appears in the Windows taskbar and can be moved around the desktop.

**Why this priority**: Easy access to settings is essential for usability. Users expect to find settings in the system tray menu.

**Independent Test**: Can be fully tested by right-clicking the tray icon, clicking "Settings", and verifying the window opens and appears in the taskbar.

**Acceptance Scenarios**:

1. **Given** the application is running with its tray icon visible, **When** the user right-clicks the tray icon, **Then** a context menu appears with "Settings" as an option above "Exit"
2. **Given** the Settings context menu item is visible, **When** the user clicks "Settings", **Then** a new window opens with the Settings panel content
3. **Given** the Settings panel is open, **When** the user looks at the Windows taskbar, **Then** the Settings window has its own taskbar entry

---

### User Story 3 - Enable Auto-Start on Windows Startup (Priority: P2)

A user wants the overlay application to start automatically when Windows boots so they don't have to manually launch it each time. They open the Settings panel, find the "Start with Windows" toggle, and enable it. The next time they restart their computer, the application launches automatically.

**Why this priority**: Auto-start is a common user expectation for overlay applications and significantly improves user experience.

**Independent Test**: Can be fully tested by enabling the auto-start toggle, restarting Windows, and verifying the application launches automatically.

**Acceptance Scenarios**:

1. **Given** the Settings panel is open and showing the Startup section, **When** the user enables "Start with Windows", **Then** the toggle reflects the enabled state and the setting is saved
2. **Given** auto-start is enabled, **When** Windows starts up, **Then** the overlay application launches automatically
3. **Given** auto-start is enabled, **When** the user disables it and restarts Windows, **Then** the application does not launch automatically

---

### User Story 4 - Close Settings Without Exiting App (Priority: P3)

A user has finished adjusting their settings and wants to close the Settings panel while keeping the overlay running. They click the X button in the Settings window header. The Settings panel closes but the overlay and system tray icon remain active.

**Why this priority**: Standard window behavior that users expect. Prevents accidental application termination.

**Independent Test**: Can be fully tested by opening Settings, clicking the X button, and verifying the overlay remains active.

**Acceptance Scenarios**:

1. **Given** the Settings panel is open, **When** the user clicks the X button in the header, **Then** the Settings window closes
2. **Given** the Settings panel was closed via X button, **When** the user checks the system tray, **Then** the application tray icon is still present and the overlay is still functional

---

### Edge Cases

- What happens when the user presses an invalid key combination (single modifier key like just "Ctrl")?
  - The system should reject single modifier keys and require at least one non-modifier key
- What happens when the user tries to set a system-reserved key combination (e.g., Ctrl+Alt+Delete)?
  - The system should reject known reserved combinations with an informative message
- What happens when the Settings window is already open and the user selects "Settings" from tray again?
  - The existing window should be brought to focus instead of opening a duplicate
- What happens when auto-start registry entry is manually deleted by the user?
  - The toggle should reflect the actual system state when Settings is opened
- What happens when hotkey settings file is corrupted or missing?
  - The application should fall back to default hotkeys (F3/F5) and recreate the settings file

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Settings window accessible from the system tray menu
- **FR-002**: The Settings window MUST be visible in the Windows taskbar as a separate entry
- **FR-003**: The Settings window MUST be draggable by its header to any position on the desktop
- **FR-004**: The Settings window MUST have an X button in the header that closes only the Settings window (not the application)
- **FR-005**: The Settings window MUST use the same visual styling as the error modal (liquid glass effect, SC theme)
- **FR-006**: System MUST display a Hotkeys configuration section showing current bindings for:
  - Toggle Visibility (default: F3)
  - Toggle Mode/Passthrough (default: F5)
- **FR-007**: Users MUST be able to change hotkeys by clicking the binding field and pressing desired key/combination
- **FR-008**: System MUST support single keys (e.g., F3) and modifier combinations (e.g., Ctrl+Shift+O) for hotkeys
- **FR-009**: System MUST validate that hotkey bindings are not duplicated within the application
- **FR-010**: System MUST reject single modifier keys (Ctrl, Alt, Shift alone) as valid hotkey bindings
- **FR-011**: System MUST persist hotkey settings to a configuration file in the same directory as state.json
- **FR-012**: System MUST load and apply saved hotkey settings on application startup
- **FR-013**: System MUST display a Startup section with a toggle for "Start with Windows"
- **FR-014**: When auto-start is enabled, System MUST register the application in Windows startup (via Windows Registry)
- **FR-015**: When auto-start is disabled, System MUST remove the application from Windows startup
- **FR-016**: The auto-start toggle MUST reflect the actual Windows startup registration state when Settings is opened
- **FR-017**: If the Settings window is already open, selecting "Settings" from tray MUST focus the existing window
- **FR-018**: System MUST apply new hotkey bindings immediately without requiring application restart

### Key Entities

- **UserSettings**: Contains user preferences including hotkey bindings and auto-start preference; stored as a file alongside state.json
- **HotkeyBinding**: Represents a key or key combination (modifiers + key code) mapped to an action
- **SettingsWindow**: A separate Tauri window instance for displaying and editing settings

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the Settings panel within 1 second of clicking "Settings" in the tray menu
- **SC-002**: Changed hotkey bindings take effect immediately without requiring application restart
- **SC-003**: Settings persist across application restarts with 100% reliability
- **SC-004**: 100% of users can successfully configure custom hotkeys on first attempt (intuitive UI)
- **SC-005**: Auto-start configuration correctly registers/unregisters from Windows startup
- **SC-006**: Settings window correctly appears in Windows taskbar when open
- **SC-007**: Closing Settings via X button never closes the main application
