# Feature Specification: WebView Browser Architecture

**Feature Branch**: `040-webview-browser`
**Created**: 2025-12-30
**Status**: Draft
**Input**: User description: "Improve the Browser app windows by replacing iframe-based rendering with a Tauri WebView architecture to bypass X-Frame-Options restrictions. Implement a synchronized dual-window pattern where a React component controls the browser UI (URL bar, navigation, zoom) while a separate native WebView window renders the actual website content, positioned to appear as a seamless single window."

## Clarifications

### Session 2025-12-30

- Q: How should popup windows be handled? → A: Block all popups silently (no new windows opened, no user notification)
- Q: How should WebView focus/keyboard input be handled? → A: Overlay hotkeys always take priority (website typing may be blocked)
- Q: How should WebView errors be surfaced to users? → A: Show errors in URL bar area (icon + brief status text)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Any Website Without Restrictions (Priority: P1)

As a user, I want to browse any website in the overlay browser without encountering X-Frame-Options or Content-Security-Policy blocking errors, so that I can access all websites (like Google, YouTube, GitHub, Twitter) directly within the overlay without needing to open an external browser.

**Why this priority**: This is the core problem being solved. Currently, the iframe-based browser fails on most popular websites that use X-Frame-Options headers, making the browser feature largely unusable. Without this, the browser component provides minimal value.

**Independent Test**: Can be fully tested by navigating to websites like google.com, youtube.com, twitter.com, github.com, and reddit.com - sites that currently fail with iframe. Success means all sites load and display correctly.

**Acceptance Scenarios**:

1. **Given** the overlay is visible and a browser window is open, **When** the user navigates to google.com, **Then** the Google homepage loads and displays correctly without any frame-blocking errors
2. **Given** a browser window displaying a website, **When** the user clicks a link that navigates to a site with strict X-Frame-Options, **Then** the linked page loads successfully
3. **Given** the browser window is showing content, **When** the underlying website uses modern security headers (CSP, X-Frame-Options), **Then** the content still renders because it's in a native WebView rather than an iframe

---

### User Story 2 - Synchronized Window Controls (Priority: P1)

As a user, I want the browser controls (URL bar, back/forward, refresh, zoom) to remain in the React UI while the website content displays in a seamless content area, so that the browser feels like a single cohesive window despite the underlying dual-window architecture.

**Why this priority**: Equal priority with P1 because without synchronized controls, the WebView would be unusable. The user must be able to control navigation, zoom, and refresh from the familiar browser toolbar.

**Independent Test**: Can be tested by using the URL bar to navigate, clicking back/forward buttons, adjusting zoom, and verifying all actions affect the WebView content as expected.

**Acceptance Scenarios**:

1. **Given** a browser window is open, **When** the user types a URL in the address bar and presses Enter, **Then** the WebView navigates to that URL
2. **Given** the user has navigated through multiple pages, **When** the user clicks the back button, **Then** the WebView goes back to the previous page and the URL bar updates to reflect the previous URL
3. **Given** a page is loaded, **When** the user clicks the refresh button, **Then** the WebView reloads the current page
4. **Given** a page is loaded, **When** the user adjusts the zoom level using zoom controls, **Then** the WebView content scales accordingly

---

### User Story 3 - Seamless Window Positioning (Priority: P1)

As a user, I want the website content to appear exactly within the browser window's content area, perfectly aligned and sized, so that I perceive a single unified browser window rather than two separate overlapping windows.

**Why this priority**: The illusion of a single window is essential for usability. If the WebView doesn't track position and size precisely, the experience breaks down and becomes confusing.

**Independent Test**: Can be tested by moving the browser window around the screen, resizing it, and observing that the WebView content area follows exactly without visible gaps, overlaps, or lag.

**Acceptance Scenarios**:

1. **Given** a browser window is displayed, **When** the user drags the browser window to a new position, **Then** the WebView content area moves synchronously to maintain the same relative position within the window
2. **Given** a browser window is displayed, **When** the user resizes the browser window, **Then** the WebView content area resizes to fill exactly the content region below the toolbar
3. **Given** the browser window is moved or resized rapidly, **When** the movement stops, **Then** the WebView settles into the correct position within 100ms

---

### User Story 4 - URL Synchronization from WebView (Priority: P2)

As a user, I want the URL bar to update automatically when I click links within the website content, so that I always know what page I'm viewing and can copy/share the current URL.

**Why this priority**: While the browser can function with one-way control (React → WebView), bidirectional sync is important for accurate URL display and user awareness. Slightly lower priority because the core browsing works without it.

**Independent Test**: Can be tested by clicking links within the WebView content and verifying the URL bar updates to show the new destination.

**Acceptance Scenarios**:

1. **Given** a browser window is showing a website, **When** the user clicks a link in the WebView content that navigates to a new page, **Then** the URL bar in the React UI updates to show the new URL
2. **Given** a website performs a JavaScript-based navigation, **When** the URL changes within the WebView, **Then** the React URL bar reflects the new URL
3. **Given** the user clicks multiple links in quick succession, **When** the navigation settles, **Then** the URL bar shows the final destination URL

---

### User Story 5 - Transparency Synchronization (Priority: P2)

As a user, I want the WebView content area to match the transparency/opacity settings of the browser window, so that when I adjust window opacity the entire browser (including web content) becomes more or less transparent uniformly.

**Why this priority**: Transparency is a core overlay feature, but the browser can be usable without perfect transparency sync initially. Important for consistency with other overlay windows.

**Independent Test**: Can be tested by adjusting the browser window's opacity slider and observing that both the UI chrome and the WebView content become more transparent together.

**Acceptance Scenarios**:

1. **Given** a browser window with the WebView showing content, **When** the user adjusts the window opacity to 50%, **Then** both the browser controls and the WebView content appear at approximately 50% opacity
2. **Given** a fully opaque browser window, **When** the user reduces opacity to make it semi-transparent, **Then** the underlying desktop or game becomes visible through the entire browser window including the web content

---

### User Story 6 - Persistence of Browser State (Priority: P2)

As a user, I want my current URL and zoom level to be saved automatically and restored when I reopen the overlay, so that I don't lose my browsing context between sessions.

**Why this priority**: Persistence is already implemented for the iframe-based browser. This story ensures the new architecture maintains feature parity.

**Independent Test**: Can be tested by navigating to a URL, adjusting zoom, closing the overlay, reopening it, and verifying the same URL and zoom are restored.

**Acceptance Scenarios**:

1. **Given** the user has navigated to a specific URL and set a zoom level, **When** the overlay is closed and reopened, **Then** the browser window shows the same URL and zoom level
2. **Given** the user navigates to multiple pages quickly, **When** navigation settles, **Then** the final URL is persisted (with debounce to avoid excessive writes)
3. **Given** the browser window is closed, **When** it is reopened from the menu, **Then** the previously viewed URL and zoom settings are restored

---

### User Story 7 - WebView Visibility with Overlay State (Priority: P2)

As a user, I want the WebView content window to hide when I hide the overlay (e.g., pressing the toggle hotkey) and reappear when I show the overlay, so that the browser behaves consistently with other overlay windows.

**Why this priority**: Essential for overlay integration but the core browsing mechanism works independently. The WebView must respond to overlay visibility toggles.

**Independent Test**: Can be tested by toggling the overlay visibility and confirming the WebView hides/shows in sync.

**Acceptance Scenarios**:

1. **Given** the overlay is visible with a browser window showing content, **When** the user presses the overlay toggle hotkey, **Then** both the overlay UI and the WebView content disappear
2. **Given** the overlay is hidden, **When** the user presses the toggle hotkey to show it, **Then** the browser window and its WebView content reappear in their previous positions
3. **Given** the browser window is minimized or closed within the overlay, **When** the WebView for that browser should be destroyed or hidden, **Then** no orphaned WebView windows remain visible

---

### Edge Cases

- What happens when the target website cannot be reached (network error, DNS failure, timeout)?
  - The WebView displays its native error page, the URL bar retains the attempted URL, and an error icon with brief status text appears in the URL bar area
- What happens when the user moves the browser window off-screen or to a secondary monitor?
  - The WebView should follow the browser window position even across monitor boundaries
- What happens when the browser window is minimized or closed while the WebView is still loading?
  - The WebView should be hidden/destroyed appropriately; no zombie windows should remain
- What happens if the user has multiple browser windows open simultaneously?
  - Each browser window should have its own independent WebView, with independent state synchronization
- What happens when the overlay is not attached to any game/process?
  - Browser windows and their WebViews should still function in standalone mode
- What happens if a website opens a popup window?
  - All popups are blocked silently; no new windows are opened and no user notification is shown
- What happens when the user tries to type in a website form or text field?
  - Overlay hotkeys take priority; typing in website forms is limited to characters that don't conflict with overlay shortcuts. Mouse interactions (clicking, scrolling) remain fully functional

## Requirements *(mandatory)*

### Functional Requirements

#### Core WebView Architecture
- **FR-001**: System MUST replace iframe-based content rendering with native WebView windows for browser components
- **FR-002**: System MUST create a new native WebView window when a browser window is opened and destroy it when the browser window is closed
- **FR-003**: System MUST position the WebView window to align precisely with the browser window's content area (below the toolbar)
- **FR-004**: System MUST update the WebView position whenever the browser window moves
- **FR-005**: System MUST update the WebView size whenever the browser window is resized
- **FR-006**: System MUST hide the WebView when the browser window is hidden and show it when the browser window is shown

#### Popup Handling
- **FR-007**: System MUST block all popup window requests silently (no new windows, no notifications)

#### Input Handling
- **FR-008**: System MUST ensure overlay hotkeys always take priority over WebView keyboard input

#### Navigation Controls
- **FR-009**: System MUST navigate the WebView to the URL entered in the React address bar when the user presses Enter
- **FR-010**: System MUST support back navigation in the WebView when the user clicks the back button
- **FR-011**: System MUST support forward navigation in the WebView when the user clicks the forward button
- **FR-012**: System MUST reload the current page in the WebView when the user clicks the refresh button
- **FR-013**: System MUST apply zoom transformations to the WebView content when the user adjusts zoom controls

#### Bidirectional URL Synchronization
- **FR-014**: System MUST detect URL changes in the WebView (from link clicks, JavaScript navigation, redirects)
- **FR-015**: System MUST update the React URL bar to reflect the current WebView URL when it changes
- **FR-016**: System MUST update the navigation state (can go back/forward) based on WebView history

#### Error Handling
- **FR-017**: System MUST display WebView errors (navigation failures, page crashes, certificate issues) in the URL bar area with an icon and brief status text

#### Visual Integration
- **FR-018**: System MUST synchronize the WebView window's transparency/opacity with the browser window's opacity setting
- **FR-019**: System MUST ensure the WebView window appears directly above the main overlay window in z-order
- **FR-020**: System MUST handle the WebView layering correctly when multiple browser windows exist

#### Persistence Integration
- **FR-021**: System MUST persist the current URL when it changes (with debounce to avoid excessive writes)
- **FR-022**: System MUST persist the current zoom level when it changes
- **FR-023**: System MUST restore the URL and zoom level from persisted state when a browser window is opened

#### Overlay Integration
- **FR-024**: System MUST hide all browser WebViews when the overlay is hidden
- **FR-025**: System MUST show browser WebViews (for visible browser windows) when the overlay is shown
- **FR-026**: System MUST clean up WebView windows when the application exits

### Key Entities

- **Browser Window**: The React-based window component containing the toolbar (URL bar, navigation buttons, zoom controls) and defining the content area where the WebView should appear
- **Browser WebView**: A native Tauri WebView window that renders the actual website content, synchronized in position/size/visibility with its parent Browser Window
- **WebView Controller**: Logic layer that manages the lifecycle and synchronization between Browser Windows and their corresponding WebViews
- **Browser State**: The persisted state including current URL, zoom level, and window position/size

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully load 100% of websites that previously failed due to X-Frame-Options or CSP restrictions (specifically: google.com, youtube.com, github.com, twitter.com, reddit.com, and similar sites)
- **SC-002**: WebView position synchronization maintains alignment within 2 pixels of the browser window content area during and after movement/resize operations
- **SC-003**: WebView position updates complete within 100ms of the browser window position change completing
- **SC-004**: URL bar updates reflect WebView navigation changes within 500ms of the navigation completing
- **SC-005**: Users perceive the browser as a single cohesive window (no visible seams, gaps, or misalignment during normal use)
- **SC-006**: Browser state (URL, zoom) persists correctly across application restarts with 100% reliability
- **SC-007**: No orphaned WebView windows remain after browser windows are closed or the overlay is hidden
- **SC-008**: All existing browser functionality (back, forward, refresh, zoom, URL entry) works identically to the previous iframe-based implementation
