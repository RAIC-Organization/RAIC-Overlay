# Feature Specification: App Icon Branding

**Feature Branch**: `011-app-icon-branding`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Implement this Icon for the app there is a PDF and a PNG version then remove the RAIC header component completely and put this Icon in the top left corner with 50px of margin to the edges, this Icon is 50x50px and is always visible in interactive and non interactive mode with 60% transparency in non interactive mode"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Icon Always Visible as App Identifier (Priority: P1)

As a user, I want to see the RAIC Overlay app icon in the top left corner of the overlay at all times, so that I can always identify when the overlay is active regardless of the current interaction mode.

**Why this priority**: The icon serves as the primary visual identifier for the application. Without it, users cannot tell the overlay is running. This is the core deliverable of the feature.

**Independent Test**: Can be fully tested by launching the overlay and observing the icon appears in the top left corner with correct positioning. Delivers immediate visual branding value.

**Acceptance Scenarios**:

1. **Given** the overlay is running in interactive (windowed) mode, **When** I look at the top left corner, **Then** I see the RAIC Overlay icon at full opacity (100%), positioned 50px from the left edge and 50px from the top edge
2. **Given** the overlay is running in non-interactive (fullscreen) mode, **When** I look at the top left corner, **Then** I see the RAIC Overlay icon at 40% opacity (60% transparent), positioned 50px from the left edge and 50px from the top edge
3. **Given** the overlay is visible, **When** I measure the icon dimensions, **Then** the icon displays at exactly 50x50 pixels

---

### User Story 2 - Header Panel Removal (Priority: P1)

As a user, I no longer need to see the "RAIC Overlay" text header panel, so that the overlay has a cleaner appearance and relies solely on the icon for branding.

**Why this priority**: This is essential to complete the branding redesign. The old header must be removed to avoid redundancy and visual clutter. Tied equally to US1 as they are parts of the same change.

**Independent Test**: Can be tested by verifying the old header component no longer renders in any mode.

**Acceptance Scenarios**:

1. **Given** the overlay is running, **When** I view the overlay, **Then** there is no "RAIC Overlay" text header panel visible
2. **Given** the overlay transitions between modes, **When** the mode changes, **Then** only the icon is shown (no header panel appears)

---

### User Story 3 - Icon Transparency Mode Transitions (Priority: P2)

As a user, when I switch between interactive and non-interactive modes, I want the icon to smoothly transition between opacity levels so the experience feels polished.

**Why this priority**: Smooth transitions enhance user experience but are not strictly required for functionality. The icon being visible is more important than how it animates.

**Independent Test**: Can be tested by toggling between overlay modes and observing the opacity transition animation.

**Acceptance Scenarios**:

1. **Given** the overlay is in interactive mode (icon at 100% opacity), **When** I switch to non-interactive mode, **Then** the icon opacity animates smoothly to 40%
2. **Given** the overlay is in non-interactive mode (icon at 40% opacity), **When** I switch to interactive mode, **Then** the icon opacity animates smoothly to 100%
3. **Given** the user has system reduced motion preferences enabled, **When** the mode changes, **Then** the opacity changes instantly without animation

---

### User Story 4 - Icon Click-Through Behavior (Priority: P2)

As a user in non-interactive mode, I want the icon to be click-through (non-blocking) so that it doesn't interfere with my ability to interact with underlying windows.

**Why this priority**: Maintains consistency with existing overlay click-through behavior. Important for usability but relies on existing infrastructure.

**Independent Test**: Can be tested by attempting to click through the icon area in non-interactive mode.

**Acceptance Scenarios**:

1. **Given** the overlay is in non-interactive (fullscreen) mode, **When** I click on the area where the icon is displayed, **Then** the click passes through to the underlying window
2. **Given** the overlay is in interactive (windowed) mode, **When** I click on the icon, **Then** the click is captured by the overlay (not passed through)

---

### Edge Cases

- What happens when the window is smaller than 100px width or height? The icon maintains its position (50px margin) but may be partially or fully off-screen if the window is too small.
- How does the system handle the icon file not being found? The system MUST hide the icon element entirely without crashing (no placeholder). This maintains a clean UI and avoids displaying broken image indicators.
- What happens during the overlay show/hide animation? The icon should participate in the same show/hide animation as the rest of the overlay.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the app icon in the top left corner of the overlay at all times when the overlay is visible
- **FR-002**: System MUST position the icon with exactly 50 pixels of margin from the left edge and 50 pixels of margin from the top edge
- **FR-003**: System MUST render the icon at exactly 50x50 pixels dimensions
- **FR-004**: System MUST display the icon at 100% opacity (fully visible) in interactive (windowed) mode
- **FR-005**: System MUST display the icon at 40% opacity (60% transparent) in non-interactive (fullscreen) mode
- **FR-006**: System MUST remove the existing HeaderPanel component that displays "RAIC Overlay" text
- **FR-007**: System MUST use the provided icon asset (source: `temp/Icon.png`, relocated to `src/assets/icon.png` during implementation) for the icon display
- **FR-008**: System MUST apply click-through behavior to the icon in non-interactive mode (same as other overlay elements)
- **FR-009**: System MUST animate the opacity transition between modes unless user has reduced motion preferences enabled
- **FR-010**: System MUST include the icon in the overlay's show/hide animations

### Key Entities

- **App Icon**: The visual branding element - a 50x50px image displayed in the fixed top-left position, with opacity varying by overlay mode
- **Overlay Mode**: The existing system state (interactive/windowed vs non-interactive/fullscreen) that determines icon opacity and click-through behavior

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Icon is visible in the correct position (50px from top-left edges) within 100ms of overlay becoming visible
- **SC-002**: Icon maintains exact 50x50 pixel dimensions across all display scenarios
- **SC-003**: Icon opacity correctly reflects the current mode (100% for interactive, 40% for non-interactive) at all times
- **SC-004**: No "RAIC Overlay" text header is visible anywhere in the overlay UI
- **SC-005**: Mode transitions complete smoothly without visual glitches or jarring opacity changes
- **SC-006**: Click-through behavior in non-interactive mode works correctly over the icon area (clicks reach underlying windows)

## Assumptions

- The existing overlay mode system (fullscreen/windowed) will continue to work as currently implemented
- The PNG format icon asset is suitable for web rendering at 50x50px
- The icon asset will be moved from `temp/` to an appropriate assets directory during implementation
- The existing animation system (motion library) will be used for opacity transitions
- Reduced motion preferences are already being respected elsewhere in the app and the same pattern will be followed
