# Feature Specification: Ko-fi Button Replacement

**Feature Branch**: `056-kofi-button`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Replace the current buy me a coffee button on the settings panel for the new Ko-fi button from ko-fi.com"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Support Developer via Ko-fi (Priority: P1)

As a user who wants to support the developer, I can click the Ko-fi button in the settings panel to be directed to the Ko-fi donation page.

**Why this priority**: This is the core functionality - replacing the existing Buy Me A Coffee link with Ko-fi is the entire purpose of this feature.

**Independent Test**: Can be fully tested by clicking the Ko-fi button and verifying it opens the correct Ko-fi page (https://ko-fi.com/Y8Y01QVRYF) in the system default browser.

**Acceptance Scenarios**:

1. **Given** the settings panel is open, **When** the user clicks the Ko-fi button, **Then** the Ko-fi donation page (https://ko-fi.com/Y8Y01QVRYF) opens in the user's default browser
2. **Given** the settings panel is open, **When** the user views the support button area, **Then** they see the Ko-fi branded button image instead of the Buy Me A Coffee button
3. **Given** the settings panel is open, **When** the user hovers over the Ko-fi button, **Then** the button displays a visual hover effect indicating it is clickable

---

### Edge Cases

- What happens when the external URL fails to open? Display no visible error to user (silent failure with console logging, matching existing behavior)
- What happens if the Ko-fi image CDN is unavailable? The button shows alt text "Buy Me a Coffee at ko-fi.com" as fallback
- What happens on systems without a default browser configured? The tauri-plugin-opener handles this gracefully

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the existing Buy Me A Coffee button with a Ko-fi button in the settings panel footer
- **FR-002**: System MUST open the Ko-fi donation page (https://ko-fi.com/Y8Y01QVRYF) when the button is clicked
- **FR-003**: System MUST display the Ko-fi branded image from the official Ko-fi CDN (https://storage.ko-fi.com/cdn/kofi3.png?v=6)
- **FR-004**: Button MUST maintain the same visual placement and styling behavior as the previous Buy Me A Coffee button (centered, full width container, hover opacity effect)
- **FR-005**: System MUST use the existing tauri-plugin-opener for opening external URLs (no new dependencies)
- **FR-006**: Button image MUST have a height of 36 pixels to match the Ko-fi provided specifications

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking the Ko-fi button successfully opens the Ko-fi donation page in the user's default browser 100% of the time when a browser is available
- **SC-002**: The Ko-fi button is visually identifiable and correctly branded in the settings panel
- **SC-003**: The button interaction (click, hover) feels responsive and matches the existing UI interaction patterns
- **SC-004**: No regression in settings panel functionality - all other settings features continue to work correctly

## Assumptions

- The Ko-fi CDN URL (https://storage.ko-fi.com/cdn/kofi3.png?v=6) is stable and reliable for production use
- The Ko-fi profile URL (https://ko-fi.com/Y8Y01QVRYF) will remain active and valid
- The existing tauri-plugin-opener already installed in the project is sufficient for this feature (no new dependencies required)
- The current button container styling (full-width, centered, mt-3 margin) is acceptable for the new button
