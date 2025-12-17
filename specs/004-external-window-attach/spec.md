# Feature Specification: External Window Attachment Mode

**Feature Branch**: `004-external-window-attach`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Change the current mode of the app for work over another app, with build-time env variable for target window, overlay attaches to target window with same size/position, auto-hides on focus loss, shows error modal if target app not running"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Overlay Activation with Target Window (Priority: P1)

The user wants to activate the overlay (F3) and have it automatically attach to a specific external application window. When the target application is running and in focus, the overlay appears perfectly aligned over that window, matching its exact size and position. This allows the user to see overlay information while using the target application.

**Why this priority**: This is the core functionality - without window attachment, the feature has no value. Users need the overlay to work seamlessly with their target application.

**Independent Test**: Can be fully tested by starting the target application, pressing F3, and verifying the overlay appears attached to the target window with matching dimensions.

**Acceptance Scenarios**:

1. **Given** the target application is running and focused, **When** the user presses F3, **Then** the overlay appears attached to the target window with matching size and position
2. **Given** the overlay is active and attached, **When** the target window is moved, **Then** the overlay follows and maintains alignment
3. **Given** the overlay is active and attached, **When** the target window is resized, **Then** the overlay resizes to match while maintaining component proportions

---

### User Story 2 - Automatic Hide on Focus Loss (Priority: P2)

The user is working with the target application and overlay visible. When the user switches to a different application (target loses focus), the overlay automatically hides. When the user returns to the target application, the overlay reappears. This prevents the overlay from obstructing other work.

**Why this priority**: Essential for usability - users need to use other applications without the overlay getting in the way, and automatic show/hide provides a seamless experience.

**Independent Test**: Can be tested by activating overlay, clicking on another application, verifying overlay hides, then clicking back on target application and verifying overlay reappears.

**Acceptance Scenarios**:

1. **Given** the overlay is active and target window is focused, **When** the user clicks on a different application, **Then** the overlay automatically hides
2. **Given** the overlay was auto-hidden due to focus loss, **When** the user clicks back on the target window, **Then** the overlay automatically reappears
3. **Given** the overlay is active, **When** the target window is minimized, **Then** the overlay hides until the target is restored

---

### User Story 3 - Error Handling for Missing Target Application (Priority: P3)

When the user attempts to activate the overlay (F3) but the target application is not running, the system displays a clear error message explaining that the target application must be running. The error message auto-dismisses after a short period so it does not require manual dismissal.

**Why this priority**: Important for user understanding - without clear error messaging, users would be confused about why the overlay does not appear.

**Independent Test**: Can be tested by ensuring target application is not running, pressing F3, and verifying the error modal appears with clear instructions and auto-hides.

**Acceptance Scenarios**:

1. **Given** the target application is NOT running, **When** the user presses F3, **Then** an error modal appears explaining the target application must be running
2. **Given** an error modal is displayed, **When** 5 seconds pass, **Then** the modal automatically dismisses
3. **Given** the target application window exists but is closed, **When** the user presses F3, **Then** the same error modal appears with instructions

---

### User Story 4 - Build-Time Target Configuration (Priority: P4)

Developers can configure which application the overlay targets by setting an environment variable at build time. This allows creating different builds for different target applications without code changes.

**Why this priority**: Configuration flexibility is important for distribution but not required for core functionality to work.

**Independent Test**: Can be tested by building with different target window names and verifying each build attaches to the correct application.

**Acceptance Scenarios**:

1. **Given** a build-time environment variable specifies "ApplicationX", **When** the overlay app starts, **Then** it monitors for "ApplicationX" window
2. **Given** the environment variable is set to a different value, **When** a new build is created, **Then** that build targets the newly specified application

---

### Edge Cases

- What happens when multiple windows of the target application are open? The overlay attaches to the most recently focused/active window of the target application.
- What happens when the target window is on a different monitor? The overlay follows and positions itself on the same monitor as the target window.
- What happens when the target application crashes while overlay is active? The overlay detects the window is gone and hides, showing the error modal if user tries to reactivate.
- How does the system handle borderless vs bordered windows? The overlay works with both modes, detecting and matching the actual visible window area.
- What happens if the target window name changes between versions? The build-time configuration supports partial/pattern matching for window titles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow configuration of target window name via build-time environment variable; build MUST fail if this variable is not set
- **FR-002**: System MUST detect if the target application window is currently running
- **FR-003**: System MUST attach the overlay to the target window, matching its exact position on screen
- **FR-004**: System MUST match the overlay size to the target window size
- **FR-005**: System MUST continuously track target window position and resize the overlay to follow any changes
- **FR-006**: System MUST apply a scale factor to overlay components to maintain readable/usable component sizes regardless of target window dimensions
- **FR-007**: System MUST automatically hide the overlay when focus moves to a different application (clicking overlay in F5 mode does not trigger hide)
- **FR-008**: System MUST automatically show the overlay when the target window regains focus (if overlay was previously active)
- **FR-009**: System MUST display an error modal when user attempts to activate overlay (F3) without target application running
- **FR-010**: Error modal MUST auto-dismiss after 5 seconds without requiring user interaction
- **FR-011**: System MUST work with both bordered and borderless window modes of the target application
- **FR-012**: System MUST remember overlay active state to restore visibility when target regains focus
- **FR-013**: System MUST support window title pattern matching to handle version variations in target application names
- **FR-014**: System MUST maintain existing F3/F5 interaction modes: F3 activates overlay with 60% transparent containers and click-through enabled
- **FR-015**: System MUST allow F5 to toggle containers to 0% transparency with direct user interaction (click-through disabled)

### Key Entities

- **Target Window**: The external application window that the overlay attaches to. Identified by window title/name configured at build time.
- **Overlay State**: Tracks whether overlay is logically active (user toggled on) vs. visually visible (depends on target focus).
- **Scale Factor**: A multiplier applied to overlay components to maintain appropriate visual proportions at different window sizes.
- **Window Binding**: The relationship between overlay and target window, including synchronized position, size, and visibility.
- **Interaction Mode**: The current overlay interaction state - either click-through mode (F3, 60% transparent) or interactive mode (F5, 0% transparent).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Overlay position updates within 50ms of target window movement, providing smooth visual tracking
- **SC-002**: Users can activate overlay on target application in under 2 seconds (single F3 press)
- **SC-003**: Overlay components remain usable and readable at target window sizes from 800x600 to 4K resolution
- **SC-004**: Focus-based auto-hide/show transitions complete within 100ms of focus change
- **SC-005**: Error modal successfully communicates the issue - users understand they need to start the target application
- **SC-006**: 100% of overlay activation attempts with target running succeed on first try
- **SC-007**: Zero cases of overlay persisting visually when target application loses focus

## Clarifications

### Session 2025-12-17

- Q: What happens if build-time env var for target window is not set? → A: Fail build if env var not set (compile-time error)
- Q: How should clicks on overlay be handled? → A: Maintain existing F3/F5 toggle: F3 shows overlay with 60% transparent containers and click-through; F5 toggles to 0% transparent containers with direct interaction
- Q: How should focus/auto-hide behave in F5 interactive mode? → A: Maintain current behavior - clicking overlay in F5 mode does not trigger auto-hide; only switching to other applications triggers hide

## Assumptions

- The target application uses standard Windows window management (HWND-based windows)
- The build-time environment variable approach is acceptable (no runtime configuration needed)
- A 5-second auto-dismiss for error modals provides sufficient time to read the message
- Pattern matching for window titles uses substring matching (e.g., "MyApp" matches "MyApp v1.2.3")
- The overlay should track the most recently focused instance if multiple windows of the target exist
- Scale factor will be calculated automatically based on target window size relative to a reference size
