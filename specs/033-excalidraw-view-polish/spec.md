# Feature Specification: Excalidraw View Mode Polish

**Feature Branch**: `033-excalidraw-view-polish`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Implement the recommended solution for both issues: hide Excalidraw UI controls in non-interactive mode and enable transparent background integration with window system"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Drawing View in Passive Mode (Priority: P1)

As a user viewing my drawings in passive (non-interactive/fullscreen) mode, I want the Excalidraw UI controls (menu button, zoom controls, help button) to be hidden so that only my actual drawings are visible without distracting interface elements.

**Why this priority**: This is the primary visual issue. Users currently see unwanted UI controls that clutter the drawing view and distract from the overlay purpose. Fixing this delivers immediate visual improvement.

**Independent Test**: Can be fully tested by toggling between interactive and passive mode and verifying UI controls visibility. Delivers a clean, distraction-free drawing overlay.

**Acceptance Scenarios**:

1. **Given** a Draw window with content in interactive mode, **When** the user switches to passive mode (fullscreen overlay), **Then** the menu button (hamburger icon), zoom controls (-, percentage, +), and help button (?) are not visible
2. **Given** a Draw window in passive mode, **When** the user switches back to interactive mode, **Then** all Excalidraw UI controls become visible again for editing
3. **Given** a Draw window in passive mode with hidden controls, **When** the user views the window, **Then** only the actual drawing content is displayed

---

### User Story 2 - Transparent Background in Passive Mode (Priority: P2)

As a user using the Draw window as an overlay, I want the Excalidraw background to become transparent when I toggle the window's background transparency setting, so my drawings can float over the underlying content (game, application) without a solid background blocking the view.

**Why this priority**: This enables the overlay use case where drawings should float over other content. It depends on the existing window system's background toggle control and enhances the existing transparency feature to work with Excalidraw.

**Independent Test**: Can be fully tested by toggling the background transparency control in the window header while in interactive mode, then switching to passive mode to verify transparency. Delivers true overlay capability for drawings.

**Acceptance Scenarios**:

1. **Given** a Draw window in interactive mode with the background toggle set to "transparent", **When** the user switches to passive mode, **Then** the Excalidraw canvas background becomes transparent and underlying content shows through
2. **Given** a Draw window in passive mode with transparent background, **When** the user toggles background back to "solid", **Then** the Excalidraw canvas background returns to its default color
3. **Given** a Draw window with transparent background in passive mode, **When** viewing drawings, **Then** only the drawn elements (lines, shapes, text) are visible while the background is fully transparent

---

### Edge Cases

- What happens when the user has set a custom Excalidraw background color before enabling transparency? The transparency setting overrides the custom color in passive mode, but preserves the color setting for when transparency is disabled.
- How does the system handle drawings that use white or light-colored strokes on a transparent background? The strokes remain visible; users are responsible for choosing appropriate colors for their overlay use case.
- What happens if CSS hiding fails due to Excalidraw library updates? The UI controls may become visible; the implementation should use CSS selectors that target stable class names where possible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hide Excalidraw menu button (hamburger icon) when the Draw window is in non-interactive (view) mode
- **FR-002**: System MUST hide Excalidraw zoom controls (decrease, percentage, increase buttons) when the Draw window is in non-interactive mode
- **FR-003**: System MUST hide Excalidraw help button when the Draw window is in non-interactive mode
- **FR-004**: System MUST show all Excalidraw UI controls when the Draw window is in interactive mode
- **FR-005**: System MUST apply transparent background to Excalidraw canvas when window's `backgroundTransparent` setting is enabled AND the window is in non-interactive mode
- **FR-006**: System MUST display Excalidraw's default or user-set background color when `backgroundTransparent` is disabled
- **FR-007**: System MUST preserve the user's Excalidraw background color preference when toggling transparency on/off
- **FR-008**: System MUST ensure drawn elements (lines, shapes, text, images) remain fully visible regardless of background transparency setting

### Key Entities

- **DrawContent Component**: The component that wraps Excalidraw; needs to accept `backgroundTransparent` prop and conditionally set `viewBackgroundColor`
- **Window System**: Existing window management that provides `backgroundTransparent` state to child components
- **Excalidraw AppState**: Internal state object that includes `viewBackgroundColor` property

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In non-interactive mode, 0% of Excalidraw UI controls (menu, zoom, help) are visible on screen
- **SC-002**: In interactive mode, 100% of Excalidraw UI controls are visible and functional
- **SC-003**: When background transparency is enabled in passive mode, users can see content behind the Draw window through all non-drawn areas
- **SC-004**: Switching between interactive/passive modes and toggling background transparency completes within 200ms with no visual glitches
- **SC-005**: All existing Draw window functionality (drawing, editing, persistence) continues to work unchanged

## Assumptions

- Excalidraw automatically applies a CSS class (like `.view-mode`) when `viewModeEnabled={true}`, making it a reliable selector for conditional styling
- Excalidraw's `viewBackgroundColor` property accepts "transparent" as a valid value
- The window system already passes `backgroundTransparent` state to window content components via props
- CSS-based hiding of UI controls is acceptable as Excalidraw does not provide native props for this functionality
