# Feature Specification: Browser Window Persistence

**Feature Branch**: `015-browser-persistence`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Persist the browser windows instance like Notes and Draw, this need to persist the windows size, opacity and position, the current url and the current zoom"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browser State Restoration on Application Launch (Priority: P1)

A user opens the RAICOverlay application after having previously used it with Browser windows positioned across the screen viewing different websites. Upon launch, the application automatically reconstructs the exact Browser state from their last session - all Browser windows appear in their previous positions, sizes, opacity levels, and z-order, with each Browser window displaying the same URL and zoom level they had when the user last closed the application.

**Why this priority**: This is the core value proposition. Without session restoration, users lose their Browser configurations every time they close the application, making it frustrating to maintain a persistent workspace with web references.

**Independent Test**: Can be fully tested by opening Browser windows, navigating to various URLs, adjusting zoom levels and opacity, closing the application, reopening it, and verifying all Browser windows are restored with their exact states.

**Acceptance Scenarios**:

1. **Given** a user has previously used the application with 2 Browser windows at different positions, **When** the user launches the application, **Then** both Browser windows appear in their exact previous positions and sizes within 2 seconds of launch.
2. **Given** a Browser window was displaying "https://github.com" at 70% zoom, **When** the application starts, **Then** that Browser window loads "https://github.com" and displays at 70% zoom.
3. **Given** a Browser window had 80% opacity, **When** the application starts, **Then** that Browser window is restored with 80% opacity.
4. **Given** a user has never created any Browser windows (no persisted Browser state exists), **When** the user launches the application, **Then** no Browser windows appear (consistent with existing behavior for Notes/Draw).

---

### User Story 2 - Automatic State Persistence During Use (Priority: P2)

While a user works with Browser windows, the system automatically saves their state at appropriate moments - when they navigate to a new URL, adjust zoom level, change opacity, or finish repositioning/resizing the window. The user never needs to manually save; their Browser configuration is protected automatically.

**Why this priority**: Automatic persistence ensures no configuration loss during normal use. Without this, users could lose their Browser setup if the application crashes or is closed unexpectedly.

**Independent Test**: Can be tested by making various changes to Browser windows (navigate URLs, change zoom, adjust opacity, move/resize), then forcefully terminating the application and reopening to verify all changes were saved.

**Acceptance Scenarios**:

1. **Given** a user navigates to a new URL in a Browser window, **When** the page finishes loading, **Then** the new URL is persisted within 1 second.
2. **Given** a user changes the zoom level using + or - buttons, **When** the zoom changes, **Then** the new zoom level is persisted within 500ms.
3. **Given** a user adjusts the opacity slider, **When** the slider is released, **Then** the new opacity is persisted within 500ms.
4. **Given** a user is actively dragging a Browser window, **When** the drag is in progress, **Then** the system does NOT persist state (avoids unnecessary saves).
5. **Given** a user finishes dragging or resizing a Browser window, **When** the interaction ends, **Then** the new position/size is persisted within 500ms.

---

### User Story 3 - Permanent Browser Window Closure (Priority: P2)

When a user closes a Browser window, that window and all its associated persisted data are completely removed from both memory and disk storage. This is consistent with how Notes and Draw windows handle closure.

**Why this priority**: Equal to P2 as it's the counterpart to automatic persistence. Users must be able to remove Browser windows permanently; otherwise storage would grow indefinitely.

**Independent Test**: Can be tested by creating a Browser window, configuring it (URL, zoom, position), closing it, restarting the application, and verifying the window does not reappear.

**Acceptance Scenarios**:

1. **Given** a user has a Browser window with custom configuration, **When** the user closes the window, **Then** the window is immediately removed from the in-memory state.
2. **Given** a Browser window has been closed, **When** the state is persisted, **Then** no data for that Browser window exists in persisted state.
3. **Given** a Browser window had associated persisted data, **When** the window is closed, **Then** all associated data is deleted from disk within 1 second.
4. **Given** a Browser window was closed, **When** the application is restarted, **Then** the window does not reappear.

---

### Edge Cases

- What happens when the persisted URL is no longer accessible (e.g., 404, site down)?
  - The Browser window opens and attempts to load the URL; the iframe displays the appropriate error page from the browser. The user can navigate to a different URL.
- What happens when the persisted zoom level is outside valid bounds (due to manual file editing)?
  - The system clamps the zoom to the valid range (10%-200%) and uses the clamped value.
- What happens when the persisted opacity level is invalid?
  - The system clamps the opacity to the valid range (30%-100%) and uses the clamped value.
- What happens when a Browser window's content file is missing but listed in state.json?
  - The Browser window is restored with structural data (position, size, opacity) but uses defaults for content (example.com, 50% zoom).
- What happens when multiple Browser windows have the same URL?
  - Each Browser window maintains independent state; multiple windows can display the same URL with different zoom levels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist Browser window structural state (position, size, z-order) using the existing persistence system
- **FR-002**: System MUST persist Browser window opacity using the existing persistence system
- **FR-003**: System MUST persist the current URL displayed in each Browser window
- **FR-004**: System MUST persist the current zoom level for each Browser window
- **FR-005**: System MUST trigger persistence when a Browser window navigates to a new URL
- **FR-006**: System MUST trigger persistence when a Browser window's zoom level changes
- **FR-007**: System MUST trigger persistence when a Browser window's opacity changes
- **FR-008**: System MUST apply debounce to URL changes during redirects to avoid excessive saves
- **FR-009**: System MUST restore all persisted Browser windows on application startup
- **FR-010**: System MUST load the persisted URL and apply the persisted zoom level when restoring a Browser window
- **FR-011**: System MUST delete all persisted data for a Browser window when that window is closed
- **FR-012**: System MUST handle invalid or out-of-range persisted values by clamping to valid ranges
- **FR-013**: System MUST use the same file structure as existing persistence (`window-{id}.json` for Browser window content)
- **FR-014**: Browser window navigation history is NOT persisted (only the final URL is saved)

### Key Entities

- **BrowserWindowState**: Extension of window state containing Browser-specific persistent data (current URL, zoom level)
- **BrowserContentFile**: A `window-{id}.json` file containing the Browser window's persisted content (URL and zoom)
- **WindowStructuralState**: Existing window data (position, size, z-order, opacity) already persisted by 010-state-persistence-system
- **BrowserDefaults**: Default values used when no persisted state exists (URL: example.com, zoom: 50%)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application restores all Browser windows with correct URLs and zoom levels within 2 seconds of launch
- **SC-002**: URL persistence occurs within 1 second of navigation completion
- **SC-003**: Zoom level persistence occurs within 500ms of change
- **SC-004**: Opacity persistence occurs within 500ms of change
- **SC-005**: Zero orphaned Browser window data files remain on disk after windows are closed
- **SC-006**: 100% of Browser windows are restored with correct position, size, and opacity on restart
- **SC-007**: Browser windows with invalid persisted values fall back to defaults without crashing

## Assumptions

- The state persistence system (010-state-persistence-system) is fully implemented and functional
- The Browser component (014-browser-component) is fully implemented with URL navigation and zoom controls
- The opacity control system (013-window-opacity-control) is implemented and integrated with persistence
- The existing persistence infrastructure supports adding new window types with custom content
- Browser window IDs remain stable across sessions
- The iframe's current URL can be read programmatically for persistence
- Navigation history is intentionally not persisted to keep the persistence simple and storage efficient
