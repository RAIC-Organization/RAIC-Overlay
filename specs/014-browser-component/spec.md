# Feature Specification: Browser Component

**Feature Branch**: `014-browser-component`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "Create a new app like the Notes and Draw but for browser on internet, this new component uses an iframe to present the web, and has controls for managing the web to view, the URL, refresh and history control and a zoom control, the default web of the app is google.com and the default zoom is 50%, the zoom controls are not a slider but + and - buttons plus a label with the percent of the zoom, the toolbar with these controls is present only in interactive mode and hidden in non-interactive mode"

## Clarifications

### Session 2025-12-20

- Q: What is the toolbar layout arrangement for navigation and zoom controls? → A: Standard browser layout: [Back][Forward][Refresh][Address Bar][Zoom-][%][Zoom+]
- Q: Should the Browser display a loading indicator while pages are loading? → A: Subtle loading indicator in address bar (spinner icon or progress bar within the address bar area)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Browser Window from Menu (Priority: P1)

As a user, I want to click a "Browser" button in the main menu to open a new Browser window, so that I can quickly access web content within the overlay using an embedded web viewer.

**Why this priority**: This is the foundational capability that enables the entire Browser feature. Without the ability to create Browser windows via the menu, no other functionality can be accessed.

**Independent Test**: Can be fully tested by clicking the "Browser" button in the main menu (while in interaction mode) and verifying a new window appears containing an iframe displaying google.com at 50% zoom.

**Acceptance Scenarios**:

1. **Given** the overlay is in interaction mode (F5 active), **When** I click the "Browser" button in the main menu, **Then** a new window opens centered on screen with the title "Browser" containing an iframe displaying google.com at 50% zoom
2. **Given** I have one Browser window open, **When** I click the "Browser" button again, **Then** a second independent Browser window opens with its own iframe displaying google.com
3. **Given** multiple Browser windows are open, **When** I navigate to a different URL in one window, **Then** only that specific window shows the new content (other Browser windows remain unchanged)

---

### User Story 2 - Navigate to URLs Using the Address Bar (Priority: P2)

As a user in interaction mode, I want to enter and submit URLs in an address bar, so that I can navigate to any website I choose within the Browser window.

**Why this priority**: URL navigation is the core functionality of a browser but depends on the window being created first (P1).

**Independent Test**: Can be tested by opening a Browser window, typing a URL in the address bar, pressing Enter, and verifying the iframe loads the specified website.

**Acceptance Scenarios**:

1. **Given** a Browser window is open and interaction mode is active, **When** I view the toolbar, **Then** I see an address bar displaying the current URL (initially "https://www.google.com")
2. **Given** the address bar is visible, **When** I clear it, type a new URL (e.g., "https://example.com"), and press Enter, **Then** the iframe navigates to the specified URL
3. **Given** I enter a URL without the protocol prefix, **When** I submit the URL (e.g., "example.com"), **Then** the system prepends "https://" and navigates to "https://example.com"
4. **Given** the iframe is loading a page, **When** the page finishes loading, **Then** the address bar reflects the current loaded URL

---

### User Story 3 - Use History Navigation Controls (Priority: P2)

As a user in interaction mode, I want to use back and forward buttons to navigate through my browsing history, so that I can easily return to previously visited pages within a Browser session.

**Why this priority**: History navigation is a core browser feature on par with URL entry, enabling efficient browsing.

**Independent Test**: Can be tested by opening a Browser window, navigating to multiple URLs, then clicking back and forward buttons to move through history.

**Acceptance Scenarios**:

1. **Given** a Browser window is open with the toolbar visible, **When** I view the toolbar, **Then** I see back and forward navigation buttons
2. **Given** I have navigated to multiple pages within a session, **When** I click the back button, **Then** the iframe navigates to the previous page in history
3. **Given** I have used the back button to go to a previous page, **When** I click the forward button, **Then** the iframe navigates to the next page in history
4. **Given** I am on the first page with no history behind, **When** I view the back button, **Then** the back button appears disabled or non-functional
5. **Given** I am on the latest page with no forward history, **When** I view the forward button, **Then** the forward button appears disabled or non-functional

---

### User Story 4 - Refresh the Current Page (Priority: P3)

As a user in interaction mode, I want to click a refresh button to reload the current page, so that I can see updated content or retry loading a page.

**Why this priority**: Refresh functionality is useful but less critical than navigation features.

**Independent Test**: Can be tested by opening a Browser window, loading a page, clicking the refresh button, and observing the page reload.

**Acceptance Scenarios**:

1. **Given** a Browser window is open with the toolbar visible, **When** I view the toolbar, **Then** I see a refresh button
2. **Given** a page is loaded in the iframe, **When** I click the refresh button, **Then** the current page reloads
3. **Given** I click the refresh button, **When** the page reloads, **Then** the current URL remains the same in the address bar

---

### User Story 5 - Control Zoom Level (Priority: P3)

As a user in interaction mode, I want to increase or decrease the zoom level using + and - buttons and see the current zoom percentage, so that I can make web content easier to view.

**Why this priority**: Zoom control enhances usability for content viewing but is not essential for basic browsing.

**Independent Test**: Can be tested by opening a Browser window, clicking the + and - zoom buttons, and observing the content scale and percentage label update.

**Acceptance Scenarios**:

1. **Given** a Browser window is open with the toolbar visible, **When** I view the zoom controls, **Then** I see a "-" button, a label showing "50%", and a "+" button
2. **Given** the zoom is at 50%, **When** I click the "+" button, **Then** the zoom increases by a fixed increment (e.g., 10%) and the label updates to "60%"
3. **Given** the zoom is at 50%, **When** I click the "-" button, **Then** the zoom decreases by a fixed increment (e.g., 10%) and the label updates to "40%"
4. **Given** the zoom level changes, **When** I view the iframe content, **Then** the web content is scaled according to the zoom percentage
5. **Given** the zoom is at the minimum level (10%), **When** I click the "-" button, **Then** the zoom does not decrease further (minimum bound enforced)
6. **Given** the zoom is at the maximum level (200%), **When** I click the "+" button, **Then** the zoom does not increase further (maximum bound enforced)

---

### User Story 6 - View Browser in Non-Interaction Mode (Priority: P4)

As a user in non-interaction mode, I want the toolbar to be hidden so that the web content is displayed cleanly without controls, allowing me to view websites without visual clutter.

**Why this priority**: Clean display mode enhances usability but the core Browser functionality works without it.

**Independent Test**: Can be tested by creating a Browser window with a loaded page, then pressing F5 to exit interaction mode and observing that the toolbar disappears while the iframe content remains visible.

**Acceptance Scenarios**:

1. **Given** a Browser window is open with the toolbar visible, **When** I press F5 to exit interaction mode, **Then** the toolbar hides automatically and only the iframe content is displayed
2. **Given** a Browser window is in non-interaction mode without toolbar, **When** I press F5 to enter interaction mode, **Then** the toolbar appears automatically for navigation and controls
3. **Given** I am in non-interaction mode viewing a webpage, **When** I observe the window, **Then** the web content remains fully visible and the zoom level is preserved

---

### User Story 7 - Browser State Lost on Window Close (Priority: P5)

As a user, I understand that when I close a Browser window, all browsing history and state in that window is permanently lost, so that each Browser session is treated as temporary/ephemeral.

**Why this priority**: This is intentional behavior per requirements - browser sessions are session-only. Lower priority as it's the default behavior when closing windows.

**Independent Test**: Can be tested by creating a Browser window, navigating to several pages, closing the window, and verifying the history cannot be recovered.

**Acceptance Scenarios**:

1. **Given** a Browser window has navigated to multiple pages, **When** I close the window using the close button, **Then** all browsing history and state in that window is permanently lost
2. **Given** I closed a Browser window, **When** I open a new Browser window, **Then** it starts at google.com with 50% zoom and no browsing history
3. **Given** multiple Browser windows are open, **When** I close one window, **Then** the other windows retain their independent URLs, history, and zoom levels

---

### Edge Cases

- What happens when the user opens many Browser windows simultaneously? Each window operates independently; system supports at least 10 concurrent Browser windows.
- What happens when the iframe cannot load a website (e.g., network error, blocked by CORS)? The iframe displays an error state or blank page; the address bar retains the attempted URL. User can retry with refresh button.
- What happens when interaction mode toggles rapidly? Toolbar visibility transitions smoothly without flickering or loss of iframe content/zoom state.
- What happens when the window is resized very small? The iframe adapts to available space; toolbar controls may wrap or truncate at very small sizes.
- What happens if the user tries to interact with the iframe in non-interaction mode? The iframe is view-only; clicks and scrolling do not work in non-interaction mode.
- What happens when entering an invalid URL? The system attempts to load it; if invalid, the iframe shows an error or the browser's default error page.
- What happens with URLs that require authentication or have popups? Authentication pages display within the iframe if allowed; popups are blocked by default browser behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add a "Browser" button to the main menu button group positioned after Draw (order: Notes, Draw, Browser, Test Windows)
- **FR-002**: System MUST create a new Browser window via the existing window event system when the Browser button is clicked
- **FR-003**: Browser window MUST contain an iframe as its main content component to display web pages
- **FR-004**: Each Browser window MUST maintain its own independent state (current URL, navigation history, zoom level)
- **FR-005**: Browser window MUST display google.com as the default website when first opened
- **FR-006**: Browser window MUST use 50% as the default zoom level when first opened
- **FR-007**: Browser window MUST display a toolbar containing navigation controls when in interaction mode
- **FR-008**: Browser window MUST hide the toolbar when in non-interaction mode
- **FR-009**: Toolbar visibility MUST automatically synchronize with the system's interaction mode state
- **FR-010**: Toolbar MUST contain a back button for navigating to the previous page in history
- **FR-011**: Toolbar MUST contain a forward button for navigating to the next page in history
- **FR-012**: Back and forward buttons MUST be disabled when no history exists in that direction
- **FR-013**: Toolbar MUST contain a refresh button to reload the current page
- **FR-014**: Toolbar MUST contain an address bar for viewing and entering URLs
- **FR-015**: Address bar MUST display the current loaded URL
- **FR-016**: Submitting a URL in the address bar MUST navigate the iframe to that URL
- **FR-017**: URLs entered without protocol MUST have "https://" prepended automatically
- **FR-018**: Address bar MUST display a subtle loading indicator (spinner icon or progress bar) while a page is loading
- **FR-019**: Loading indicator MUST disappear when the page finishes loading or fails to load
- **FR-020**: Toolbar MUST contain zoom controls: a "-" button, a percentage label, and a "+" button
- **FR-021**: Toolbar controls MUST be arranged in standard browser layout order from left to right: Back button, Forward button, Refresh button, Address bar, Zoom "-" button, Zoom percentage label, Zoom "+" button
- **FR-022**: Zoom controls MUST NOT be implemented as a slider
- **FR-023**: Clicking the "+" button MUST increase zoom by a fixed increment (10%)
- **FR-024**: Clicking the "-" button MUST decrease zoom by a fixed increment (10%)
- **FR-025**: Zoom percentage label MUST display the current zoom level (e.g., "50%", "60%")
- **FR-026**: Zoom level MUST have a minimum bound of 10%
- **FR-027**: Zoom level MUST have a maximum bound of 200%
- **FR-028**: Zoom changes MUST scale the iframe content appropriately
- **FR-029**: When a Browser window is closed, all state (URL, history, zoom) MUST be permanently discarded (no persistence)
- **FR-030**: Iframe MUST be interactive (clickable, scrollable) only when in interaction mode
- **FR-031**: Iframe MUST be view-only when in non-interaction mode
- **FR-032**: Browser windows MUST use the existing windows system for display, positioning, and management
- **FR-033**: Multiple Browser windows MUST be openable simultaneously, each as an independent instance

### Key Entities

- **BrowserComponent**: A React component wrapping the iframe, managing toolbar visibility based on interaction mode, and containing the browser state (URL, history, zoom)
- **Iframe**: The embedded web viewer displaying external web content within each Browser window
- **Toolbar**: The control bar containing back, forward, refresh, address bar, and zoom controls, conditionally visible based on interaction mode
- **NavigationHistory**: An in-memory list of visited URLs per Browser window instance enabling back/forward navigation
- **ZoomState**: The current zoom level percentage for each Browser window instance
- **Browser Menu Button**: A button in the main menu that emits a window open event for creating Browser windows

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a new Browser window within 1 second of clicking the Browser menu button
- **SC-002**: Toolbar visibility changes within 100ms of interaction mode toggle
- **SC-003**: URL navigation initiates within 100ms of user submitting a URL in the address bar
- **SC-004**: Zoom level changes and content scaling occur within 100ms of clicking + or - buttons
- **SC-005**: System supports at least 10 concurrent Browser windows without performance degradation
- **SC-006**: 100% of Browser window close actions result in complete state loss (no persistence)
- **SC-007**: 100% of Browser windows start at google.com with 50% zoom and visible toolbar (in interaction mode)
- **SC-008**: Users can successfully navigate back and forward through history on first attempt
- **SC-009**: Zoom controls display accurate percentage (10% to 200% range) matching actual content scale
- **SC-010**: Loading indicator appears within 100ms of navigation start and disappears within 100ms of page load completion

## Assumptions

- The windows system (007-windows-system) is fully implemented and functional, providing window creation, management, and the event-based opening mechanism
- The main menu component (006-main-menu-component) exists with the button group containing Notes and Draw from features 008 and 009
- The interaction mode state (F5 toggle) is accessible to components for conditional rendering
- Iframes can load external websites within the Tauri application (subject to web security policies)
- The existing overlay container provides sufficient space for Browser windows with toolbars
- No data persistence is required - browser sessions are intentionally ephemeral per user request
- CSS transform: scale() can be used to implement zoom functionality on the iframe
- Some websites may not load in iframes due to X-Frame-Options or Content-Security-Policy headers; this is expected browser behavior
