# Feature Specification: Per-Window Opacity Control

**Feature Branch**: `013-window-opacity-control`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Change the windows system, now each windows can change his own opacity, this persist in the windows setting, the defautl value is 60% and is present in interactive and non interactive mode (dont auto change for the apps windows), now the user have a slider in the header windows (present only in interactive mode) for change the opacity of the window"

## Clarifications

### Session 2025-12-20

- Q: What visual presentation should the opacity slider have? → A: Slider with percentage label (e.g., "60%")

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adjust Window Opacity via Slider (Priority: P1)

As a user in interaction mode, I want to adjust the opacity of an individual window using a slider in the window header, so that I can control how transparent each window appears based on my preference for that specific window.

**Why this priority**: This is the core user interaction that enables the feature. Users need a direct, intuitive control to adjust window transparency. Without this control mechanism, the feature has no value.

**Independent Test**: Can be fully tested by entering interaction mode (F5), opening a window, dragging the opacity slider in the header, and observing the window transparency change in real-time.

**Acceptance Scenarios**:

1. **Given** a window is open and interaction mode is active (F5), **When** I view the window header, **Then** I see an opacity slider control alongside other header elements
2. **Given** a window is open and interaction mode is active, **When** I drag the opacity slider to the left (toward 0%), **Then** the window becomes more transparent in real-time
3. **Given** a window is open and interaction mode is active, **When** I drag the opacity slider to the right (toward 100%), **Then** the window becomes more opaque in real-time
4. **Given** a window is open and interaction mode is inactive, **When** I view the window, **Then** the opacity slider is not visible (header is hidden)

---

### User Story 2 - Persist Window Opacity Setting (Priority: P2)

As a user, I want my opacity setting for each window to be saved, so that when I restart the application, each window retains its customized transparency level exactly as I configured it.

**Why this priority**: Persistence ensures the user customization effort is preserved across sessions. Without persistence, users would need to reconfigure opacity every time they launch the application, making the feature frustrating to use.

**Independent Test**: Can be tested by adjusting a window opacity, closing the application, reopening it, and verifying the window appears with the previously set opacity level.

**Acceptance Scenarios**:

1. **Given** I have adjusted a window opacity to 40%, **When** the adjustment is complete, **Then** the opacity setting is automatically persisted
2. **Given** I have configured multiple windows with different opacity levels, **When** I restart the application, **Then** each window restores with its individually configured opacity
3. **Given** a window opacity was changed, **When** the application crashes unexpectedly, **Then** the opacity setting made more than 2 seconds before the crash is preserved

---

### User Story 3 - Consistent Opacity Across Modes (Priority: P3)

As a user, I want my window to maintain its configured opacity whether I am in interaction mode or non-interaction mode, so that the visual appearance remains consistent and predictable as I toggle between modes.

**Why this priority**: Visual consistency is important for user experience but depends on the opacity control (P1) and persistence (P2) being implemented first. The current system changes opacity to 60% in non-interaction mode; this story removes that automatic behavior.

**Independent Test**: Can be tested by setting a window opacity to a specific value (e.g., 80%), toggling between interaction and non-interaction modes, and verifying the opacity remains at 80% in both modes.

**Acceptance Scenarios**:

1. **Given** a window has opacity set to 80% in interaction mode, **When** I press F5 to exit interaction mode, **Then** the window remains at 80% opacity
2. **Given** a window has opacity set to 30% in non-interaction mode, **When** I press F5 to enter interaction mode, **Then** the window remains at 30% opacity
3. **Given** I have never adjusted a window opacity, **When** the window is created, **Then** it uses the default opacity of 60% in both modes

---

### Edge Cases

- What happens when a window is created? The window uses the default opacity of 60%.
- What is the valid opacity range? Opacity ranges from 10% to 100% (minimum 10% ensures the window remains visible enough to interact with).
- What happens during rapid slider adjustments? The visual opacity updates in real-time, but persistence is debounced to avoid excessive saves.
- What happens if persisted opacity is outside valid range (corrupted data)? The system clamps the value to the valid range (10%-100%) or uses the default 60%.
- How does opacity interact with the header visibility? The header shares the window opacity in non-interaction mode; in interaction mode, the header remains fully visible for usability while the content area uses the configured opacity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an opacity slider control with a percentage label (e.g., "60%") in the window header when in interaction mode
- **FR-002**: System MUST hide the opacity slider when not in interaction mode (header is hidden)
- **FR-003**: System MUST update window opacity in real-time as the user adjusts the slider
- **FR-004**: System MUST store opacity as a per-window setting (each window can have a different opacity)
- **FR-005**: System MUST persist window opacity as part of the window state
- **FR-006**: System MUST restore window opacity from persisted state on application startup
- **FR-007**: System MUST use a default opacity of 60% for newly created windows
- **FR-008**: System MUST maintain consistent opacity across interaction and non-interaction modes (no automatic opacity change on mode toggle)
- **FR-009**: System MUST enforce an opacity range of 10% to 100% (minimum ensures visibility)
- **FR-010**: System MUST debounce opacity persistence to avoid excessive save operations during slider adjustment
- **FR-011**: System MUST clamp out-of-range opacity values to the valid range when loading from persisted state
- **FR-012**: System MUST NOT automatically change window opacity based on interaction mode (removing the previous 60% transparency behavior for non-interaction mode)

### Key Entities

- **Window**: Extended to include an opacity property (0.1 to 1.0) that is persisted as part of window state
- **OpacitySlider**: A UI component in the window header that allows users to adjust the window opacity; includes a percentage label displaying the current value (e.g., "60%"); visible only in interaction mode
- **WindowState**: Extended to include opacity value in persisted data structure

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can adjust window opacity within 1 second of interacting with the slider
- **SC-002**: Opacity changes are visually reflected in less than 50ms (immediate feedback)
- **SC-003**: Opacity setting is persisted within 500ms after the user finishes adjusting the slider
- **SC-004**: 100% of windows restore with correct opacity on application restart
- **SC-005**: Opacity remains consistent when toggling interaction mode (no visible change)
- **SC-006**: Default opacity of 60% is applied to all newly created windows

## Assumptions

- The existing window system from feature 007 is implemented and functional
- The state persistence system from feature 010 is implemented and supports extending window state
- The window header is visible in interaction mode and can accommodate additional UI controls
- Opacity is applied at the window container level, affecting both the header (in non-interaction mode) and content area
- The minimum opacity of 10% is acceptable for maintaining window visibility and interactivity
- The opacity slider uses the existing UI component library (shadcn/ui) for consistency
