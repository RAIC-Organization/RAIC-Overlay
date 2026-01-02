# Feature Specification: Session Timer Widget

**Feature Branch**: `044-session-timer-widget`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Create a new widget for session time, taking the time from the target process start to the target process stop and showing in the same format that the current clock widget, reset the time when the target process starts"

## Clarifications

### Session 2026-01-02

- Q: When the target process is not running, what should the session timer widget display? → A: Show last elapsed time from previous session (frozen)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track Active Gaming Session Duration (Priority: P1)

As a user, I want to see how long my current gaming session has been running so that I can manage my playtime and take breaks when needed.

**Why this priority**: This is the core functionality of the widget - displaying elapsed time since the target process (game) started. Without this, the widget has no purpose.

**Independent Test**: Can be fully tested by starting the target process and observing the timer counting up from 00:00:00, delivering immediate value for session awareness.

**Acceptance Scenarios**:

1. **Given** the overlay is running and no target process is detected, **When** the target process starts, **Then** the session timer widget displays "00:00:00" and begins counting up
2. **Given** the session timer is counting, **When** 1 hour, 23 minutes, and 45 seconds have elapsed, **Then** the widget displays "01:23:45"
3. **Given** the session timer is running, **When** the user views the widget, **Then** the time updates every second in real-time

---

### User Story 2 - Reset Timer on New Session (Priority: P1)

As a user, I want the session timer to automatically reset when I start a new gaming session so that each session is tracked independently.

**Why this priority**: Equal to P1 because the reset behavior is fundamental to the "session" concept. Without reset, the timer would accumulate across sessions, making it useless for tracking individual play sessions.

**Independent Test**: Can be tested by starting the target process, waiting for the timer to accumulate time, stopping the process, then starting it again - the timer should reset to 00:00:00.

**Acceptance Scenarios**:

1. **Given** the target process was previously running and the timer shows "02:15:30", **When** the target process stops and starts again, **Then** the timer resets to "00:00:00" and begins counting from zero
2. **Given** the overlay application is restarted while the target process is already running, **When** the overlay initializes, **Then** the session timer starts from "00:00:00" (not from the actual process start time)

---

### User Story 3 - Open Session Timer Widget from Menu (Priority: P2)

As a user, I want to add a session timer widget to my overlay from the main menu so that I can choose to display it when desired.

**Why this priority**: Users need a way to add the widget to their overlay. This follows the existing pattern for widget management.

**Independent Test**: Can be tested by opening the main menu, selecting the session timer widget option, and confirming the widget appears on the overlay.

**Acceptance Scenarios**:

1. **Given** the main menu is open, **When** the user selects "Session Timer" from the widgets section, **Then** a new session timer widget appears on the overlay
2. **Given** the user has added a session timer widget, **When** they open the menu again, **Then** they can add additional session timer widgets if desired

---

### User Story 4 - Customize Session Timer Widget (Priority: P3)

As a user, I want to resize, move, and adjust the opacity of the session timer widget so that it fits my preferred overlay layout.

**Why this priority**: Customization follows core functionality. Users expect the same controls available on other widgets.

**Independent Test**: Can be tested by dragging the widget to reposition, using corner handles to resize, and double-clicking to access opacity settings.

**Acceptance Scenarios**:

1. **Given** a session timer widget is displayed, **When** the user drags the widget, **Then** the widget moves to the new position
2. **Given** a session timer widget is displayed, **When** the user drags a corner handle, **Then** the widget resizes and the time text scales proportionally
3. **Given** a session timer widget is displayed, **When** the user double-clicks to open settings, **Then** they can adjust opacity from 10% to 100%

---

### Edge Cases

- What happens when the target process starts before the overlay application? The timer starts from 00:00:00 when the overlay detects the running process (not from actual process start time).
- What happens when the target process crashes unexpectedly? The timer stops and displays the frozen last elapsed time; it resets to 00:00:00 when the process starts again.
- What happens on first launch before any session has occurred? The timer displays "00:00:00" until the first target process detection.
- What happens when the session exceeds 24 hours? The timer continues counting beyond 24:00:00, displaying as "25:30:15" etc.
- What happens when the overlay is hidden (F3)? The timer continues counting in the background.
- What happens when no target process is configured? The timer displays "00:00:00" and remains static until a target process is detected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a session timer widget that shows elapsed time in HH:MM:SS format
- **FR-002**: System MUST start the timer at 00:00:00 when the target process is detected as running
- **FR-003**: System MUST reset the timer to 00:00:00 each time the target process starts (new session)
- **FR-004**: System MUST update the displayed time every second while the target process is running
- **FR-005**: System MUST stop the timer when the target process terminates and display the frozen last elapsed time until a new session begins
- **FR-006**: System MUST use the same visual styling as the existing clock widget (Orbitron font, liquid glass effect, blue glow)
- **FR-007**: System MUST support responsive text scaling based on widget dimensions (matching clock widget behavior)
- **FR-008**: Users MUST be able to add the session timer widget from the main menu
- **FR-009**: Users MUST be able to move, resize, and adjust opacity of the session timer widget
- **FR-010**: Users MUST be able to remove the session timer widget via the settings panel
- **FR-011**: System MUST persist session timer widget position, size, and opacity across overlay restarts
- **FR-012**: System MUST continue counting time while the overlay is hidden (F3 toggle)
- **FR-013**: System MUST support displaying hours beyond 24 (e.g., "36:15:42" for extended sessions)

### Key Entities

- **Session Timer Widget**: A widget instance displaying elapsed session time; has position (x, y), dimensions (width, height), opacity, and tracks session start timestamp
- **Session State**: Tracks whether a session is active (target process running), the session start timestamp, and current elapsed duration

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Session timer displays accurate elapsed time within 1 second of actual duration
- **SC-002**: Timer resets to 00:00:00 within 2 seconds of target process detection
- **SC-003**: Timer updates are visually smooth with no perceptible stuttering or jumps
- **SC-004**: Widget visually matches the clock widget styling (same font, colors, effects)
- **SC-005**: Users can add, position, resize, and remove the widget using the same interactions as existing widgets
- **SC-006**: Widget state persists correctly across application restarts

## Assumptions

- The existing widget system infrastructure (WidgetsContext, Widget component, WidgetSettings) will be extended rather than replaced
- The existing `target-process-detected` and `target-process-terminated` events provide reliable signals for session start/stop
- Time format uses 24-hour style without AM/PM indicators, matching the clock widget
- Multiple session timer widgets can be added simultaneously (each showing the same session time)
- If the overlay starts while the target process is already running, the session timer starts from 00:00:00 at overlay initialization (we cannot determine when the process actually started)
