# Feature Specification: Timer Menu Button Rename and Reorder

**Feature Branch**: `058-timer-menu-rename`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Change the name of the main menu button for the chronometer widget to Timer and change the name of the main menu button for the widget session timer from Timer to Session Timer and invert the position of both buttons"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear Timer Button Labels (Priority: P1)

As a user looking at the main menu, I want the timer-related button labels to clearly indicate their function so I can quickly identify and open the widget I need.

**Why this priority**: The button labels directly affect usability and user comprehension. "Stopwatch" for a chronometer-style timer is less intuitive than "Timer", and the session timer needs disambiguation from the general timer concept.

**Independent Test**: Can be fully tested by opening the overlay and visually inspecting the main menu button labels. Delivers immediate clarity on widget purpose.

**Acceptance Scenarios**:

1. **Given** the overlay is visible in windowed mode, **When** the user views the widgets section of the main menu, **Then** the button for the chronometer widget displays "Timer"
2. **Given** the overlay is visible in windowed mode, **When** the user views the widgets section of the main menu, **Then** the button for the session timer widget displays "Session Timer"

---

### User Story 2 - Logical Button Order (Priority: P1)

As a user, I want the Timer button to appear before Session Timer in the button group so that the simpler, more commonly used timer functionality is more prominent.

**Why this priority**: Button order affects discoverability and muscle memory. The general-purpose timer (chronometer) is likely used more frequently than the session-specific timer, so it should appear first.

**Independent Test**: Can be fully tested by opening the overlay and checking the visual order of buttons in the widgets section.

**Acceptance Scenarios**:

1. **Given** the overlay is visible in windowed mode, **When** the user views the widgets button group, **Then** the buttons appear in order: Clock, Timer, Session Timer
2. **Given** a user has muscle memory for the old button positions, **When** they click the second button in the widgets group, **Then** the Timer (chronometer) widget opens instead of the previous session timer

---

### Edge Cases

- What happens when clicking the renamed buttons? The underlying widget functionality remains unchanged; only the button labels and order change.
- How does this affect existing users? Users may need to adjust to the new button positions, but the labels will be clearer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The main menu button that opens the chronometer widget MUST display the label "Timer" instead of "Stopwatch"
- **FR-002**: The main menu button that opens the session timer widget MUST display the label "Session Timer" instead of "Timer"
- **FR-003**: In the widgets button group, the Timer button (chronometer) MUST appear before the Session Timer button
- **FR-004**: The button click handlers MUST remain unchanged - the Timer button opens chronometer widget, Session Timer button opens session timer widget
- **FR-005**: The Clock button MUST remain in its current first position in the widgets button group

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can distinguish between the two timer widgets by reading their button labels without confusion
- **SC-002**: The widgets button group displays exactly three buttons in the order: Clock, Timer, Session Timer
- **SC-003**: All three widget buttons continue to open their respective widgets correctly after the rename and reorder

## Assumptions

- The current button labeled "Stopwatch" corresponds to the chronometer widget (verified in code)
- The current button labeled "Timer" corresponds to the session timer widget (verified in code)
- No other UI elements reference these button labels (no tooltips, help text, or external documentation affected)
- The underlying widget types ("chronometer" and "timer") and their functionality remain unchanged
