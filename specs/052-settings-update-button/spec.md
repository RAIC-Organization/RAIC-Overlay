# Feature Specification: Check for Update Button in Settings Panel

**Feature Branch**: `052-settings-update-button`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Add and check for update button in the main setting panel that trigger the check update process"

## Clarifications

### Session 2026-01-03

- Q: How should the "up to date" and error messages be displayed to the user? → A: Inline text below the button (status message appears directly in the Updates section)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Update Check from Settings (Priority: P1)

A user wants to check if there are any updates available without waiting for the automatic 24-hour check cycle. They open the Settings panel and click a "Check for Updates" button. The system immediately checks for updates and either shows the update notification window (if an update is available) or displays a confirmation that the current version is up to date.

**Why this priority**: This is the core functionality requested. Users need on-demand control over update checking rather than relying solely on automatic intervals.

**Independent Test**: Can be fully tested by opening the Settings panel, clicking the "Check for Updates" button, and verifying either an update notification appears (if update available) or a "you're up to date" message displays.

**Acceptance Scenarios**:

1. **Given** the Settings panel is open, **When** the user looks at the Settings panel, **Then** a "Check for Updates" button is visible in an Updates section.

2. **Given** the Settings panel is open with the "Check for Updates" button visible, **When** the user clicks the button, **Then** the system initiates an update check against the GitHub releases.

3. **Given** the user has clicked "Check for Updates", **When** a newer version is available on GitHub, **Then** the existing update notification window opens showing the available update with "Update Now" and "Ask Again Later" options.

4. **Given** the user has clicked "Check for Updates", **When** the current version is already the latest, **Then** an inline confirmation message appears below the button indicating the user is on the latest version.

---

### User Story 2 - Feedback During Update Check (Priority: P2)

A user wants visual feedback that the update check is in progress after clicking the button. They see a loading state on the button while the check is being performed, then see the result (update available or up to date).

**Why this priority**: Without visual feedback, users may think the button click didn't register and click multiple times, or assume the app is frozen.

**Independent Test**: Can be tested by clicking "Check for Updates" and observing that the button shows a loading indicator until the check completes.

**Acceptance Scenarios**:

1. **Given** the user clicks "Check for Updates", **When** the check is in progress, **Then** the button displays a loading indicator and is disabled to prevent multiple clicks.

2. **Given** the update check is in progress, **When** the check completes (success or failure), **Then** the button returns to its normal interactive state.

---

### User Story 3 - Handle Check Failure Gracefully (Priority: P3)

A user clicks "Check for Updates" but there is no network connection or GitHub is unreachable. The system displays an appropriate error message rather than silently failing or appearing frozen.

**Why this priority**: Unlike automatic checks (which should fail silently), manual checks should provide clear feedback since the user explicitly requested the action.

**Independent Test**: Can be tested by disconnecting from the network, clicking "Check for Updates", and verifying an error message is displayed.

**Acceptance Scenarios**:

1. **Given** the user clicks "Check for Updates", **When** the network is unavailable or GitHub is unreachable, **Then** an inline error message is displayed below the button indicating the check could not be completed.

2. **Given** an error occurred during update check, **When** the inline error message is displayed, **Then** the user can retry by clicking "Check for Updates" again.

---

### Edge Cases

- What happens when the user clicks "Check for Updates" while an update notification is already open?
  - The existing update notification window should be brought to focus rather than opening a duplicate.

- What happens when the update check is already in progress and the user closes the Settings panel?
  - The check continues in the background and the update notification window opens if an update is found.

- What happens when the GitHub API rate limit is exceeded?
  - Display an error message indicating the check could not be completed; suggest trying again later.

- What happens when the user rapidly clicks the button multiple times?
  - The button should be disabled during the check to prevent duplicate requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Settings panel MUST display a "Check for Updates" button in a dedicated Updates section.
- **FR-002**: The Updates section MUST be positioned logically within the Settings panel (after existing settings sections like Hotkeys and Startup).
- **FR-003**: System MUST trigger an update check against the GitHub releases when the user clicks the "Check for Updates" button.
- **FR-004**: System MUST display a loading indicator on the button while the update check is in progress.
- **FR-005**: The "Check for Updates" button MUST be disabled while an update check is in progress to prevent duplicate requests.
- **FR-006**: When an update is available, System MUST open the existing update notification window (reusing the 051-fix-update-popup implementation).
- **FR-007**: When no update is available, System MUST display an inline confirmation message below the button indicating the current version is up to date.
- **FR-008**: When the update check fails (network error, GitHub unreachable), System MUST display an inline error message below the button.
- **FR-009**: If an update notification window is already open when "Check for Updates" is clicked, System MUST bring the existing window to focus.
- **FR-010**: The update check triggered by the button MUST use the same logic as the automatic startup and 24-hour interval checks.
- **FR-011**: System MUST display the current version number in the Updates section for user reference.

### Key Entities

- **UpdatesSection**: A new UI section within the Settings panel containing the version display and "Check for Updates" button.
- **CheckForUpdatesButton**: Interactive button that triggers manual update checks with loading and disabled states.
- **UpdateCheckResult**: The outcome of a manual update check - either "update available", "up to date", or "error".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate a manual update check within 2 seconds of opening the Settings panel (button is immediately visible and accessible).
- **SC-002**: Update check completes and provides feedback within 5 seconds under normal network conditions.
- **SC-003**: 100% of manual update checks that detect a new version result in the update notification window opening.
- **SC-004**: 100% of manual update checks that find no update display an "up to date" confirmation.
- **SC-005**: 100% of failed update checks display an appropriate error message (no silent failures for manual checks).
- **SC-006**: Button loading state is visible within 100ms of clicking to provide immediate feedback.

## Assumptions

- The existing update check logic from 049-auto-update is functional and can be triggered on demand.
- The update notification window from 051-fix-update-popup is implemented and can be opened programmatically.
- The Settings panel from 038-settings-panel exists and supports adding new sections.
- The current application version is accessible for display in the Updates section.
- The update check reuses the same GitHub release API call as automatic checks.
