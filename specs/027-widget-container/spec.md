# Feature Specification: Widget Container System

**Feature Branch**: `027-widget-container`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Create a new system like the windows container system but for widgets, the main idea is an agnostic container with background transparency without header or borders but with the ability for the user to change the size and position in the main windows container, so in interactive mode the widget has the corner accent like the windows for resize and the user can drag by the entire area of the widget for positioning, when the user makes a click in the widget in interactive mode this shows an interface for settings, in this setting the user has the slider for the opacity and a button to close the settings, the effect between the content and the setting view is a backflip like the macOS widgets, when the user changes the size of the widget the content adapts its size to always be full container size, this new widget system needs to persist in the global state like the windows, with the position, the size and the opacity, so be sure the state interface exists in the front and backend app for correct persist state, the first widget is a clock widget that adds a 24 hours clock with format HH:mm:ss, so remove the current clock windows app and button that will be replaced by this new clock widget"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display Clock Widget (Priority: P1)

A user wants to see a persistent clock on their overlay display. They access the main menu and create a clock widget, which appears as a transparent container showing the current time in 24-hour format (HH:mm:ss). The widget has no visible borders or header, displaying only the time with a clean, minimalist appearance.

**Why this priority**: This is the core MVP functionality - displaying a working clock widget demonstrates the entire widget system works end-to-end.

**Independent Test**: Can be fully tested by creating a clock widget from the main menu and verifying the time displays correctly in 24-hour format with transparent background and no header/borders.

**Acceptance Scenarios**:

1. **Given** the overlay is active, **When** I create a clock widget from the main menu, **Then** a transparent widget appears showing the current time in HH:mm:ss format
2. **Given** a clock widget is displayed, **When** one second passes, **Then** the time automatically updates to show the current time
3. **Given** a clock widget is visible, **When** I view the widget, **Then** there is no visible header, border, or window chrome - only the time content

---

### User Story 2 - Resize and Position Widget (Priority: P2)

A user wants to customize where the clock widget appears and how large it is. In interaction mode (F5), the user sees corner resize accents on the widget. They can drag from the entire widget area to reposition it, and drag the corners to resize. When resized, the clock content scales to fill the container.

**Why this priority**: Widget positioning and resizing are essential for user customization but depend on the widget existing first (P1).

**Independent Test**: Can be tested by entering interaction mode, dragging the widget to a new position, and resizing via corner accents, verifying the content scales appropriately.

**Acceptance Scenarios**:

1. **Given** a widget is displayed and interaction mode is active (F5), **When** I view the widget, **Then** I see corner accent indicators for resizing
2. **Given** a widget is displayed and interaction mode is active, **When** I drag anywhere on the widget area, **Then** the widget moves to follow my cursor
3. **Given** a widget is displayed and interaction mode is active, **When** I drag a corner accent, **Then** the widget resizes accordingly
4. **Given** a widget has been resized, **When** I view the widget content, **Then** the clock content scales to fill the entire container area

---

### User Story 3 - Access Widget Settings via Backflip (Priority: P2)

A user wants to adjust the opacity of a widget. In interaction mode, they click on the widget, triggering a backflip animation that reveals a settings panel on the reverse side. This settings panel contains an opacity slider and a button to close settings (flip back).

**Why this priority**: The settings backflip is a distinctive UX feature that provides widget customization capabilities.

**Independent Test**: Can be tested by clicking a widget in interaction mode and verifying the backflip animation reveals settings with opacity slider and close button.

**Acceptance Scenarios**:

1. **Given** a widget is displayed and interaction mode is active, **When** I click on the widget, **Then** a 3D backflip animation reveals the settings panel
2. **Given** the settings panel is visible, **When** I view the panel, **Then** I see an opacity slider and a close/back button
3. **Given** the settings panel is visible, **When** I click the close button, **Then** a backflip animation returns to the widget content view
4. **Given** the settings panel is visible, **When** I adjust the opacity slider, **Then** the widget opacity changes in real-time

---

### User Story 4 - Widget State Persistence (Priority: P3)

A user positions and configures a widget, then closes and reopens the application. When the application restarts, the widget reappears in the same position, at the same size, and with the same opacity setting.

**Why this priority**: Persistence is important for user experience but the core widget functionality works without it initially.

**Independent Test**: Can be tested by positioning a widget, adjusting opacity, closing the app, reopening, and verifying all settings are restored.

**Acceptance Scenarios**:

1. **Given** a widget with custom position, size, and opacity, **When** I close and reopen the application, **Then** the widget reappears with the same position
2. **Given** a widget with custom position, size, and opacity, **When** I close and reopen the application, **Then** the widget reappears with the same size
3. **Given** a widget with custom position, size, and opacity, **When** I close and reopen the application, **Then** the widget reappears with the same opacity

---

### User Story 5 - Remove Clock Window (Priority: P1)

The existing clock window (feature 023) is replaced by the new clock widget. Users should use the widget system for clock functionality instead of the previous window implementation.

**Why this priority**: Removing duplicate functionality is essential for a clean user experience and avoiding confusion.

**Independent Test**: Can be tested by verifying the clock window button is removed from the main menu and the clock window type is deprecated.

**Acceptance Scenarios**:

1. **Given** the main menu is displayed, **When** I view the menu options, **Then** I do not see the old "Clock" window button
2. **Given** the widget system is implemented, **When** I want a clock display, **Then** I use the clock widget instead of a clock window

---

### Edge Cases

- What happens when a widget is resized to an extremely small size? The content scales down but maintains minimum legibility (minimum widget size enforced).
- What happens when a widget is dragged outside the visible container area? Widgets are constrained to remain at least partially visible within the container bounds.
- What happens when the backflip animation is triggered while widget is at container edge? The animation plays within available space without clipping.
- What happens if the user clicks rapidly during the backflip animation? Input is ignored until the current animation completes.
- How does the widget behave when not in interaction mode? The widget displays content only, with no visible resize accents or interactive capabilities.
- How does click vs drag intent detection work? Release before 150-200ms threshold triggers settings flip; holding beyond threshold enables drag repositioning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a widget container with fully transparent background
- **FR-002**: System MUST display widgets without visible headers, borders, or window chrome
- **FR-003**: System MUST display corner accent indicators on widgets in interaction mode only
- **FR-004**: System MUST allow widgets to be repositioned by dragging anywhere on the widget area (interaction mode only); drag activates after 150-200ms hold threshold
- **FR-005**: System MUST allow widgets to be resized by dragging corner accents (interaction mode only)
- **FR-006**: System MUST trigger a 3D backflip animation when clicking a widget in interaction mode (click = release before hold threshold)
- **FR-007**: System MUST display a settings panel on the widget reverse side containing an opacity slider
- **FR-008**: System MUST display a close/back button on the settings panel
- **FR-009**: System MUST update widget opacity in real-time when the slider is adjusted (valid range: 10-100%)
- **FR-010**: System MUST trigger a backflip animation back to content view when close button is clicked
- **FR-011**: System MUST scale widget content to fill the entire container area when resized
- **FR-012**: System MUST persist widget state (position, size, opacity) to storage
- **FR-013**: System MUST restore widget state from storage on application startup
- **FR-014**: System MUST provide state interfaces in both frontend (TypeScript) and backend (Rust) for widget persistence
- **FR-015**: System MUST implement a clock widget displaying time in 24-hour format (HH:mm:ss)
- **FR-016**: System MUST update the clock widget time display every second
- **FR-017**: System MUST remove the existing clock window type and its main menu button
- **FR-018**: System MUST add a clock widget button to the main menu
- **FR-019**: System MUST enforce minimum widget dimensions to maintain usability
- **FR-020**: System MUST constrain widget positioning to keep widgets at least partially visible

### Key Entities

- **Widget**: A transparent, borderless container for content with properties: position (x, y), size (width, height), opacity (10-100%), content component reference, and flipped state (content/settings)
- **WidgetState**: Persisted state for a widget including id, type, position, size, and opacity
- **WidgetSettings**: The reverse-side panel containing configuration controls (opacity slider, close button)
- **ClockWidget**: The first widget implementation displaying 24-hour time (HH:mm:ss) with automatic updates

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and position a widget within 3 seconds of triggering the menu action
- **SC-002**: Widget drag operations respond with no perceptible lag (immediate visual feedback)
- **SC-003**: Widget resize operations scale content smoothly with no visible stuttering
- **SC-004**: Backflip animation between content and settings completes within 500ms
- **SC-005**: Widget state is restored accurately 100% of the time on application restart
- **SC-006**: Clock widget time updates accurately every second with no visible drift or skipping
- **SC-007**: 100% of users can access widget settings via single click in interaction mode
- **SC-008**: Opacity changes are reflected in real-time as the slider is adjusted

## Clarifications

### Session 2025-12-23

- Q: What is the valid opacity range for widgets? → A: 10-100% (matches existing window opacity range)
- Q: How to differentiate click (settings) vs drag (reposition)? → A: Hold threshold (150-200ms) before drag activates; immediate release is click

## Assumptions

- The interaction mode toggle (F5) already exists and exposes its state to components
- The main menu exists and can have the old clock button removed and a new widget button added
- The existing state persistence system can be extended to support widget data structures
- The backflip animation will use CSS 3D transforms available in modern browsers
- Widgets exist in the same visual layer as windows but operate as a separate system
- The Orbitron font (feature 021) is available for clock widget styling
- Widget z-order is independent from window z-order
