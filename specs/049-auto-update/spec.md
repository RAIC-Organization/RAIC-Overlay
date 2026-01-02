# Feature Specification: Auto-Update System

**Feature Branch**: `049-auto-update`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Add an update system, this need to verify a new release against the github repo release page, if there a new stable release show a popup to the user with the info about there is a new version with a button for accept and other for ask again later, if the user click on accept then the app perform an auto update, in background download the new installer, then execute the installer and exit to the current app for the user install the new version, if the user click in ask again later then do nothing, the next time the app check a new version the process is repeated, check the update at app startup and every 24 hours for then"

## Clarifications

### Session 2026-01-02

- Q: What release information should be displayed in the update notification? → A: Only the new version number
- Q: What happens to the downloaded installer file after update? → A: Delete previous installer on next app launch

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Version Check Notification (Priority: P1)

As a user, I want to be notified when a new version of the application is available so that I can keep my software up to date with the latest features and fixes.

**Why this priority**: This is the core functionality - without version checking and notification, no other update features can work. Users need to know when updates are available before they can act on them.

**Independent Test**: Can be fully tested by releasing a new version on GitHub and verifying the app displays an update notification popup with version information.

**Acceptance Scenarios**:

1. **Given** the app is starting up, **When** a newer stable release exists on the GitHub repository, **Then** the system displays an update notification popup showing only the new version number
2. **Given** the app has been running for 24 hours since the last check, **When** a newer stable release exists on the GitHub repository, **Then** the system displays an update notification popup
3. **Given** the app is starting up, **When** the current version matches the latest stable release on GitHub, **Then** no notification is shown and the app continues normally
4. **Given** the app is starting up, **When** the GitHub repository is unreachable, **Then** the app continues normally without showing any error to the user (silent failure)

---

### User Story 2 - Accept Update and Auto-Install (Priority: P2)

As a user, when I see an update notification, I want to click "Accept" to have the application automatically download and install the new version so that I can update with minimal effort.

**Why this priority**: This delivers the main value proposition - frictionless updates. Without this, users would need to manually download and install updates.

**Independent Test**: Can be fully tested by triggering an update notification, clicking Accept, and verifying the installer downloads, launches, and the current app closes gracefully.

**Acceptance Scenarios**:

1. **Given** the update notification popup is displayed, **When** the user clicks the "Accept" button, **Then** the system begins downloading the new installer in the background
2. **Given** the installer download is in progress, **When** the download completes successfully, **Then** the system launches the downloaded installer
3. **Given** the installer has been launched, **When** the installer is running, **Then** the current application exits gracefully to allow the installation to proceed
4. **Given** the update notification popup is displayed, **When** the user clicks "Accept" and the download fails, **Then** the system displays an error message and allows the user to retry or cancel

---

### User Story 3 - Postpone Update (Priority: P3)

As a user, when I see an update notification, I want to click "Ask Again Later" to dismiss the notification and continue using the current version so that I can update at a more convenient time.

**Why this priority**: This provides user control and prevents forced interruptions. Users may be in the middle of important work and need to defer updates.

**Independent Test**: Can be fully tested by triggering an update notification, clicking "Ask Again Later", verifying the popup closes, and confirming the notification reappears at the next check interval.

**Acceptance Scenarios**:

1. **Given** the update notification popup is displayed, **When** the user clicks the "Ask Again Later" button, **Then** the popup closes and the app continues running normally
2. **Given** the user previously clicked "Ask Again Later", **When** 24 hours pass while the app is running, **Then** the update notification is displayed again
3. **Given** the user previously clicked "Ask Again Later", **When** the app is restarted before 24 hours pass, **Then** the update notification is displayed again at startup

---

### User Story 4 - Background Download with Progress (Priority: P4)

As a user, I want to see download progress after accepting an update so that I know the download is working and can estimate when it will complete.

**Why this priority**: Provides user feedback during the download process. Without this, users might think the app froze or not know if the download is progressing.

**Independent Test**: Can be fully tested by accepting an update and verifying a progress indicator shows download percentage or status.

**Acceptance Scenarios**:

1. **Given** the user has accepted an update, **When** the download is in progress, **Then** the system displays a progress indicator showing download status
2. **Given** the download is in progress, **When** the download completes, **Then** the progress indicator shows completion before launching the installer

---

### Edge Cases

- What happens when the user closes the notification popup without clicking either button? The popup closes and behaves like "Ask Again Later"
- How does the system handle network disconnection during download? Display an error message with retry option
- What happens if the installer file is corrupted or fails integrity check? Display an error message and prompt user to try again
- How does the system handle the user manually closing the installer after it launches? The current app has already exited; user must restart the app manually
- What happens if multiple stable releases have been published since last check? Show notification for the latest stable release only
- How does the system differentiate stable releases from pre-releases? Only stable releases (no pre-release tag) trigger notifications

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST check for updates from the GitHub repository's releases page at application startup
- **FR-002**: System MUST check for updates every 24 hours while the application is running
- **FR-003**: System MUST only notify users about stable releases (excluding pre-releases, drafts, or release candidates)
- **FR-004**: System MUST display an update notification popup when a newer stable version is available
- **FR-005**: System MUST display only the new version number in the update notification (no release notes or additional metadata)
- **FR-006**: System MUST provide an "Accept" button in the notification that initiates the update process
- **FR-007**: System MUST provide an "Ask Again Later" button in the notification that dismisses the popup
- **FR-008**: System MUST download the MSI installer asset from the GitHub release when user accepts update
- **FR-009**: System MUST execute the downloaded installer after successful download completion
- **FR-010**: System MUST exit the current application after launching the installer to prevent conflicts
- **FR-011**: System MUST continue normal operation without errors if update check fails (network issues, GitHub unreachable)
- **FR-012**: System MUST show download progress to the user during the installer download
- **FR-013**: System MUST handle download failures gracefully with user notification and retry option
- **FR-014**: System MUST persist the timestamp of the last update check to calculate the 24-hour interval
- **FR-015**: System MUST delete any previously downloaded installer files on application launch to prevent disk space accumulation

### Key Entities

- **Release Version**: Represents a software version, contains version string (e.g., "1.2.3") and download URL for installer asset
- **Update Check State**: Tracks last check timestamp, last notified version (to avoid repeated notifications for same version), and user's postponement status
- **Download Progress**: Tracks download status (pending, in-progress, completed, failed), bytes downloaded, total bytes, and percentage complete

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users are notified of available updates within 5 seconds of the main window becoming visible (when update exists and network is available)
- **SC-002**: Update check completes in under 3 seconds under normal network conditions
- **SC-003**: Installer download begins within 2 seconds of user clicking Accept
- **SC-004**: 100% of stable releases on GitHub trigger user notifications (no stable releases missed)
- **SC-005**: Application continues to function normally when GitHub is unreachable (zero crashes from update check failures)
- **SC-006**: Users can complete the full update flow (notification to installer launch) in under 2 minutes for typical installer sizes (under 50MB)
- **SC-007**: Users who click "Ask Again Later" are re-prompted at the next check interval (startup or 24 hours)

## Assumptions

- The GitHub repository is configured with a releases page and follows semantic versioning for release tags
- Stable releases do not have pre-release tags (e.g., "v1.0.0" is stable, "v1.0.0-beta" is not)
- The MSI installer is attached as a release asset with filename ending in `.msi` (e.g., `RAIC-Overlay-1.2.3-x64.msi`). The system selects the first `.msi` asset found if multiple exist.
- The target system has Windows Installer (msiexec) available for executing MSI files
- Network connectivity is generally available but may be intermittent
- Users have sufficient disk space to download the installer
- The application has permission to download files and execute installers on the user's system
