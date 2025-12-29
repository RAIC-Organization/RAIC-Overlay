# Feature Specification: Fix Browser and File Viewer First-Session Persistence

**Feature Branch**: `034-fix-browser-persist`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Fix a bug with the browser app, when I add a new browser windows and change the url and the zoom this settings are not persisted, the windows json persist the default values, only if the app is restarted without closed the windows and then modified the url and the zoom then this values persist, so the bug is only the first session when the user add the browser windows, maybe for the file windows we have a same issue, check deeply how the persistance of this windows work the first time the user add windows and why only when the app is restarted the persistance start to work"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browser URL Persistence on First Session (Priority: P1)

As a user, when I create a new browser window during my first session and navigate to a different URL, I expect that URL to be saved and restored when I restart the application.

**Why this priority**: This is the core bug being fixed. URL persistence is the primary use case for browser windows - users expect their bookmarked/visited pages to persist across sessions.

**Independent Test**: Can be fully tested by creating a new browser window, navigating to a specific URL (e.g., "https://google.com"), closing and restarting the app, and verifying the URL is restored.

**Acceptance Scenarios**:

1. **Given** a fresh application start with no existing windows, **When** I click the "Browser" button in the menu to create a new browser window and navigate to "https://google.com", **Then** the URL should be saved to the window's persistence file within a few seconds.
2. **Given** I have created a new browser window and navigated to a URL, **When** I close and restart the application, **Then** the browser window should restore with the URL I navigated to (not the default "https://example.com").

---

### User Story 2 - Browser Zoom Persistence on First Session (Priority: P1)

As a user, when I create a new browser window during my first session and change the zoom level, I expect that zoom level to be saved and restored when I restart the application.

**Why this priority**: Zoom level is essential for accessibility and user preference. Users who need larger or smaller text should not have to readjust zoom every session.

**Independent Test**: Can be fully tested by creating a new browser window, adjusting zoom via the zoom controls, closing and restarting the app, and verifying the zoom level is restored.

**Acceptance Scenarios**:

1. **Given** a fresh application start with no existing windows, **When** I click the "Browser" button to create a new browser window and zoom in to 80%, **Then** the zoom level should be saved to the window's persistence file within a few seconds.
2. **Given** I have created a new browser window and changed the zoom level, **When** I close and restart the application, **Then** the browser window should restore with the zoom level I set (not the default 50%).

---

### User Story 3 - File Viewer Persistence on First Session (Priority: P1)

As a user, when I create a new file viewer window during my first session and open a file with a specific zoom level, I expect the file path, file type, and zoom level to be saved and restored when I restart the application.

**Why this priority**: File viewer has the same architectural issue as the browser window. Users expect to pick up where they left off with their documents.

**Independent Test**: Can be fully tested by creating a new file viewer window, opening a file, adjusting zoom, closing and restarting the app, and verifying the file and zoom are restored.

**Acceptance Scenarios**:

1. **Given** a fresh application start with no existing windows, **When** I click the "File Viewer" button to create a new window and open a PDF file, **Then** the file path, type, and zoom should be saved to the window's persistence file within a few seconds.
2. **Given** I have created a new file viewer window and opened a file with adjusted zoom, **When** I close and restart the application, **Then** the file viewer window should restore with the same file and zoom level.

---

### User Story 4 - Consistent Behavior with Notes and Draw Windows (Priority: P2)

As a user, I expect all window types (Notes, Draw, Browser, File Viewer) to behave consistently regarding persistence - changes made immediately after creation should persist without requiring an app restart.

**Why this priority**: Consistency reduces user confusion. If Notes and Draw windows persist correctly on first session, Browser and File Viewer should too.

**Independent Test**: Can be fully tested by creating windows of each type, making changes to all, and verifying all changes persist after restart.

**Acceptance Scenarios**:

1. **Given** I create new windows of each type (Notes, Draw, Browser, File Viewer), **When** I make changes to each window's content, **Then** all windows should persist their changes identically (within the same timeframe and reliability).

---

### Edge Cases

- What happens when the user rapidly creates multiple browser windows and navigates different URLs? All windows should persist their URLs independently without interference.
- How does the system handle creating a browser window, navigating, and immediately closing the app before persistence triggers? The debounced save should trigger within 500ms, and any pending saves should complete before app exit.
- What happens if the user changes URL and zoom in rapid succession? The debounced save should capture the final state after the debounce period.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist browser window URL changes immediately when the window is first created (not just after app restart).
- **FR-002**: System MUST persist browser window zoom changes immediately when the window is first created.
- **FR-003**: System MUST persist file viewer window file path, file type, and zoom changes immediately when the window is first created.
- **FR-004**: System MUST inject persistence callbacks for browser and file viewer windows at the same point in the window creation flow as notes and draw windows.
- **FR-005**: System MUST maintain backward compatibility with existing restored windows (windows that were already persisted and are being restored should continue to work).
- **FR-006**: System MUST ensure persistence callbacks are available before the user can interact with the window content.

### Key Entities

- **Window Instance**: Represents an open window with unique ID, content type, position, size, and content-specific state.
- **Browser Content State**: URL (string) and zoom level (number 10-200) for browser windows.
- **File Viewer Content State**: File path (string), file type (pdf/markdown/image/unknown), and zoom level (number 10-200) for file viewer windows.
- **Persistence Callback**: Function that triggers debounced save to window content file when content changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new browser window, navigate to a URL, close the app, and see the URL restored on restart 100% of the time.
- **SC-002**: Users can create a new browser window, change zoom, close the app, and see the zoom level restored on restart 100% of the time.
- **SC-003**: Users can create a new file viewer window, open a file, close the app, and see the file restored on restart 100% of the time (assuming file still exists at the path).
- **SC-004**: Persistence behavior is identical between newly created windows and restored windows for all window types.
- **SC-005**: Changes persist within the existing debounce timeframe (500ms) regardless of whether the window was just created or restored.

## Assumptions

- The existing persistence infrastructure (debounced saves, window content files, state file) is correct and only the callback injection is missing.
- The fallback mechanism in content components (checking persistence context directly) is a secondary safety net, not the primary persistence path.
- Window creation through the main menu event system is the primary way users create new windows.
- The fix should follow the same pattern already established for Notes and Draw window types.
