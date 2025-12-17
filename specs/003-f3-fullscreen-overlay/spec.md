# Feature Specification: F3 Fullscreen Transparent Click-Through Overlay

**Feature Branch**: `003-f3-fullscreen-overlay`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "change the actual behavior, when the user tap on F3 use a fullscreen transparent container with a 60% of transparent and no click, all the user interaction pass to the background program, maintain the header panel inside the new container in the same position and size"

## Clarifications

### Session 2025-12-17

- Q: Should the header panel be interactive (clickable) or click-through in fullscreen transparent mode? → A: Header panel is also click-through (completely non-interactive in fullscreen mode)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Fullscreen Overlay Mode (Priority: P1)

As a user, I want to press F3 to toggle the overlay into a fullscreen transparent mode so that I can see both the overlay information and interact with applications behind it simultaneously.

**Why this priority**: This is the core functionality requested - the primary interaction model change that enables the user to work with background applications while viewing overlay content.

**Independent Test**: Can be fully tested by pressing F3 and verifying the overlay expands to fullscreen with transparency, then clicking through to interact with a background application.

**Acceptance Scenarios**:

1. **Given** the overlay is in normal windowed mode, **When** the user presses F3, **Then** the overlay transforms into a fullscreen transparent container covering the entire screen with 60% transparency (40% opacity).

2. **Given** the overlay is in fullscreen transparent mode, **When** the user presses F3 again, **Then** the overlay returns to its previous windowed state.

3. **Given** the overlay is in fullscreen transparent mode, **When** the user clicks anywhere on the screen, **Then** the click passes through to the application behind the overlay.

---

### User Story 2 - Preserved Header Panel in Fullscreen Mode (Priority: P1)

As a user, I want the header panel to remain visible (but non-interactive) in the same position and size when I activate fullscreen mode so that I can continue to see important overlay information while all clicks pass through to background applications.

**Why this priority**: Equal priority to the fullscreen toggle because without the header panel, the overlay provides no value in fullscreen mode.

**Independent Test**: Can be tested by activating fullscreen mode and verifying the header panel appears at the same screen position with the same dimensions as in windowed mode, and that clicks on the header panel pass through to background applications.

**Acceptance Scenarios**:

1. **Given** the header panel is visible in windowed mode at position (X, Y) with size (W, H), **When** the user presses F3 to enter fullscreen mode, **Then** the header panel remains at position (X, Y) with size (W, H) within the fullscreen container.

2. **Given** the overlay is in fullscreen transparent mode, **When** the user views the header panel, **Then** the header panel content and styling remain unchanged from windowed mode.

3. **Given** the overlay is in fullscreen transparent mode, **When** the user clicks on the header panel area, **Then** the click passes through to the application behind the overlay (header panel is non-interactive).

---

### User Story 3 - Click-Through Behavior (Priority: P1)

As a user, I want all my mouse interactions to pass through to the background application when the overlay is in fullscreen transparent mode so that I can use other programs without the overlay interfering.

**Why this priority**: Essential for the overlay to be non-intrusive - without click-through, the fullscreen mode would block all user interaction with the system.

**Independent Test**: Can be tested by activating fullscreen mode and performing various interactions (clicks, drags, scrolls) that should reach the background application.

**Acceptance Scenarios**:

1. **Given** the overlay is in fullscreen transparent mode, **When** the user left-clicks anywhere on the transparent area, **Then** the click is received by the application behind the overlay.

2. **Given** the overlay is in fullscreen transparent mode, **When** the user right-clicks anywhere on the transparent area, **Then** the context menu of the background application appears.

3. **Given** the overlay is in fullscreen transparent mode, **When** the user scrolls the mouse wheel over the transparent area, **Then** the scroll event is received by the application behind the overlay.

4. **Given** the overlay is in fullscreen transparent mode, **When** the user drags items in the background application, **Then** the drag operation completes successfully through the overlay.

---

### Edge Cases

- What happens when the user presses F3 while the overlay is minimized or not focused?
  - The overlay should activate and enter fullscreen transparent mode.

- What happens when the user presses F3 on a multi-monitor setup?
  - The overlay should expand to cover the primary monitor where the overlay window was located.

- How does the system handle rapid F3 toggling?
  - The system should debounce rapid key presses (within 200ms) to prevent flickering.

- What happens if the header panel was positioned near the edge in windowed mode?
  - The header panel maintains its absolute screen position; if it was at the edge, it remains at the edge.

- What happens when the background application is fullscreen (e.g., a game)?
  - The overlay should display above the fullscreen application while maintaining click-through behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect F3 key press as the trigger to toggle fullscreen transparent mode.
- **FR-002**: System MUST expand the overlay to cover the entire screen when fullscreen mode is activated.
- **FR-003**: System MUST apply 60% transparency (40% opacity) to the fullscreen container background.
- **FR-004**: System MUST enable click-through behavior for the entire overlay (including the header panel area) so all mouse events pass to underlying applications.
- **FR-005**: System MUST maintain the header panel at its original screen position when entering fullscreen mode.
- **FR-006**: System MUST maintain the header panel at its original size when entering fullscreen mode.
- **FR-007**: System MUST allow toggling back to windowed mode by pressing F3 again.
- **FR-008**: System MUST restore the original window state (position, size) when exiting fullscreen mode.
- **FR-009**: System MUST keep the overlay window always on top in fullscreen transparent mode.
- **FR-010**: System MUST pass through all mouse interaction types (left-click, right-click, scroll, drag) to background applications.

### Key Entities

- **Overlay Window**: The main application window that can exist in two states: windowed mode and fullscreen transparent mode.
- **Header Panel**: The UI component containing overlay information that must remain visible and positioned consistently in both modes.
- **Window State**: Stores the position, size, and mode of the overlay for state restoration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle fullscreen mode in under 100ms response time after pressing F3.
- **SC-002**: Click-through interactions reach background applications with no perceptible delay (under 50ms).
- **SC-003**: Header panel position variance is zero pixels when transitioning between modes (exact position preservation).
- **SC-004**: 100% of mouse event types (click, right-click, scroll, drag) successfully pass through to background applications.
- **SC-005**: Users can toggle between modes at least 100 times without memory leaks or performance degradation.
- **SC-006**: The overlay remains visible above fullscreen applications (games, video players).
