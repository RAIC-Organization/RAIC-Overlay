# Feature Specification: Chronometer Widget with Configurable Hotkeys

**Feature Branch**: `045-chronometer-widget`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Create a new widget app for have a Chronometer, this need to have associate two hotkeys, the default hotkeys are Ctrl+t for start and pause the chronometer and Ctrl+y to reseter the chronometer, the user can change this hotkeys from the setting panel of the widget"

## Clarifications

### Session 2026-01-02

- Q: What happens to a running chronometer when the widget is closed? → A: Pause when closed - time freezes at close, resumes from saved value when reopened.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start/Pause Chronometer via Hotkey (Priority: P1)

As a user, I want to start and pause a chronometer using a keyboard hotkey so that I can time activities without clicking UI elements or switching focus from my current task.

**Why this priority**: The core value of a chronometer is timing activities. Hotkey-based start/pause is the primary interaction that enables hands-free operation during focused work sessions (gaming, studying, etc.).

**Independent Test**: Can be tested by pressing Ctrl+T when the chronometer widget is visible and verifying the time display starts counting. Pressing Ctrl+T again should pause the count. Delivers immediate value by allowing timed activities.

**Acceptance Scenarios**:

1. **Given** the chronometer widget is visible and stopped at 00:00:00, **When** I press Ctrl+T, **Then** the chronometer starts counting upward in real-time displaying hours:minutes:seconds.
2. **Given** the chronometer is running (e.g., at 00:02:34), **When** I press Ctrl+T, **Then** the chronometer pauses at the current time and stops counting.
3. **Given** the chronometer is paused at 00:02:34, **When** I press Ctrl+T, **Then** the chronometer resumes counting from where it was paused.
4. **Given** the overlay is in non-interactive mode (click-through), **When** I press Ctrl+T, **Then** the hotkey is captured by the low-level keyboard hook and toggles the chronometer state.
5. **Given** the overlay is in interactive mode with focus, **When** I press Ctrl+T, **Then** the hotkey is captured by the webview and toggles the chronometer state.

---

### User Story 2 - Reset Chronometer via Hotkey (Priority: P1)

As a user, I want to reset the chronometer to zero using a keyboard hotkey so that I can quickly restart timing without navigating to the widget.

**Why this priority**: Reset is equally essential for practical use - users need to clear the timer between timing sessions without interrupting their workflow.

**Independent Test**: Can be tested by running the chronometer to any time value, then pressing Ctrl+Y and verifying the display resets to 00:00:00. Delivers value by enabling quick restart of timing sessions.

**Acceptance Scenarios**:

1. **Given** the chronometer is running at 00:05:23, **When** I press Ctrl+Y, **Then** the chronometer resets to 00:00:00 and stops.
2. **Given** the chronometer is paused at 00:03:15, **When** I press Ctrl+Y, **Then** the chronometer resets to 00:00:00.
3. **Given** the chronometer is already at 00:00:00, **When** I press Ctrl+Y, **Then** the chronometer remains at 00:00:00 (no error).
4. **Given** the overlay is in non-interactive mode, **When** I press Ctrl+Y, **Then** the reset is captured by the low-level keyboard hook.
5. **Given** the overlay is in interactive mode, **When** I press Ctrl+Y, **Then** the reset is captured by the webview.

---

### User Story 3 - Configure Chronometer Hotkeys (Priority: P2)

As a user, I want to customize the chronometer hotkeys from the widget's settings panel so that I can avoid conflicts with other applications or match my preferences.

**Why this priority**: While defaults work for most users, customization is essential for users who have conflicting keybindings in their workflow. Lower priority than core functionality but necessary for broader usability.

**Independent Test**: Can be tested by opening the widget settings, changing the start/pause hotkey to a different combination (e.g., Ctrl+Shift+T), saving, and verifying the new hotkey works while the old one doesn't.

**Acceptance Scenarios**:

1. **Given** I am viewing the chronometer widget, **When** I click the settings button on the widget header, **Then** a settings panel opens showing the current hotkey bindings.
2. **Given** the settings panel is open, **When** I click on the start/pause hotkey field and press a new key combination (e.g., Ctrl+Shift+P), **Then** the field updates to show the new combination.
3. **Given** I have entered a new hotkey combination, **When** I click Save, **Then** the new hotkey becomes active immediately without requiring a restart.
4. **Given** the chronometer has custom hotkeys saved, **When** I restart the application, **Then** the custom hotkeys are preserved and work correctly.
5. **Given** I try to set a hotkey that conflicts with existing system hotkeys (F3 for toggle visibility), **When** I attempt to save, **Then** I see a warning about the conflict and can choose to proceed or pick a different hotkey.

---

### User Story 4 - Visual Chronometer Display (Priority: P2)

As a user, I want to see the chronometer time displayed clearly in the widget so that I can read the elapsed time at a glance.

**Why this priority**: The display is essential for the user to know the current time, but the widget system already has established patterns for visual display. This story defines the specific format requirements.

**Independent Test**: Can be tested by viewing the chronometer widget and verifying the time is displayed in HH:MM:SS format with clear, readable typography consistent with the application's theme.

**Acceptance Scenarios**:

1. **Given** the chronometer is at rest, **When** I view the widget, **Then** I see "00:00:00" displayed in a clear, readable format.
2. **Given** the chronometer is running, **When** I view the widget, **Then** I see the time updating in real-time (approximately every second).
3. **Given** the chronometer reaches 59 minutes and 59 seconds, **When** it ticks to the next second, **Then** it displays 01:00:00 (hours roll over correctly).
4. **Given** the chronometer has been running for extended periods, **When** viewing the display, **Then** the format remains HH:MM:SS and supports at least 99:59:59 (100 hours).

---

### User Story 5 - Chronometer Widget Lifecycle (Priority: P3)

As a user, I want the chronometer widget to persist its state when I close and reopen it so that I don't lose my timing data.

**Why this priority**: State persistence is important for a good user experience but is a secondary concern after the core timing functionality works correctly.

**Independent Test**: Can be tested by starting the chronometer, closing the widget, reopening it, and verifying the time value and running/paused state are preserved.

**Acceptance Scenarios**:

1. **Given** the chronometer is running at 00:10:30, **When** I close the widget window, **Then** the chronometer pauses and its state (00:10:30, paused) is saved.
2. **Given** the chronometer was running when closed at 00:10:30, **When** I reopen the widget, **Then** the chronometer shows 00:10:30 and remains paused (time does not continue while widget is closed).
3. **Given** the chronometer was paused at 00:05:00 when closed, **When** I reopen the widget, **Then** the chronometer shows 00:05:00 and remains paused.

---

### Edge Cases

- What happens when the user presses the hotkey extremely rapidly? (Debouncing should prevent multiple triggers within 200ms)
- What happens when both start/pause and reset are pressed simultaneously? (Start/pause should take precedence, or both should be processed in order received)
- What happens when the chronometer widget is not visible but hotkeys are pressed? (Hotkeys should only affect the chronometer when it exists/is visible)
- What happens when the overlay is hidden (F3 toggled off)? (Chronometer hotkeys should not trigger when overlay is not visible)
- What happens when the user tries to set a blank or invalid hotkey? (Validation should prevent saving invalid configurations)
- What happens if the chronometer runs for more than 99:59:59? (Display should handle or cap gracefully)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a chronometer widget type that can be added to the overlay like other widgets (Timer, Notes, Draw, etc.).
- **FR-002**: System MUST display elapsed time in HH:MM:SS format updating in real-time when running.
- **FR-003**: System MUST support a start/pause hotkey that toggles the chronometer between running and paused states.
- **FR-004**: System MUST support a reset hotkey that stops the chronometer and sets the time to 00:00:00.
- **FR-005**: System MUST use Ctrl+T as the default hotkey for start/pause.
- **FR-006**: System MUST use Ctrl+Y as the default hotkey for reset.
- **FR-007**: System MUST capture chronometer hotkeys via the low-level keyboard hook when the overlay is in non-interactive mode (following the F3/F5 pattern).
- **FR-008**: System MUST capture chronometer hotkeys via webview event handlers when the overlay is in interactive mode (following the F3/F5 pattern).
- **FR-009**: System MUST apply debouncing (200ms minimum between triggers) to prevent accidental rapid activation.
- **FR-010**: System MUST provide a settings panel accessible from the widget header for configuring hotkeys.
- **FR-011**: System MUST allow users to customize the start/pause and reset hotkey combinations including key and modifiers (Ctrl, Shift, Alt).
- **FR-012**: System MUST persist hotkey customizations so they survive application restarts.
- **FR-013**: System MUST validate hotkey inputs to prevent invalid or conflicting configurations.
- **FR-014**: System MUST emit events that synchronize hotkey configuration between backend and frontend in real-time.
- **FR-015**: System MUST persist chronometer state (elapsed time, running/paused) with the widget data.
- **FR-016**: System MUST only process chronometer hotkeys when the chronometer widget exists and the overlay is visible.

### Key Entities

- **Chronometer Widget State**: Represents the widget instance containing elapsed time (in milliseconds), running status (boolean), and last tick timestamp for accurate time tracking.
- **Chronometer Hotkey Settings**: Represents the user-configurable hotkey bindings for start/pause and reset actions, including key name, virtual key code, and modifier flags.
- **HotkeyAction (Extended)**: The existing hotkey action enum extended to include ChronometerStartPause and ChronometerReset actions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start, pause, and reset the chronometer using keyboard hotkeys without clicking any UI elements.
- **SC-002**: Hotkey actions are triggered within 200ms of the keypress (accounting for debouncing).
- **SC-003**: Chronometer time display updates at least once per second when running, with no visible lag or jitter.
- **SC-004**: Custom hotkey configurations persist across application restarts with 100% reliability.
- **SC-005**: Hotkeys work identically in both interactive and non-interactive overlay modes.
- **SC-006**: Chronometer time accuracy is within 1 second per hour of continuous operation.
- **SC-007**: Users can successfully change hotkeys from the settings panel and have them take effect immediately without restarting.

## Assumptions

- The existing widget system and infrastructure will be reused (WidgetContainer, window management, persistence patterns).
- The existing user settings persistence system will be extended to include chronometer hotkey settings.
- The existing low-level keyboard hook infrastructure supports adding new hotkey actions without architectural changes.
- The Ctrl+T and Ctrl+Y key combinations do not conflict with critical browser or system shortcuts in the typical use case.
- Time tracking precision at the second level is sufficient (sub-second precision is not required for the display).
