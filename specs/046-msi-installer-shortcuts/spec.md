# Feature Specification: MSI Installer Shortcuts

**Feature Branch**: `046-msi-installer-shortcuts`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "Configure the msi installer for make a default program access from windows start menu and optional desktop direct access"

## Clarifications

### Session 2026-01-02

- Q: Should the installer support silent/unattended installation mode for automated deployments? → A: Silent installation via standard MSI parameters (use built-in /quiet, /passive flags)
- Q: Where should the Start Menu shortcut be placed - directly in the Programs folder or in a dedicated application subfolder? → A: Directly in Programs folder (Start Menu > Programs > RAIC Overlay.lnk)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Menu Access (Priority: P1)

As a user who has just installed RAIC Overlay, I want to find and launch the application from the Windows Start Menu so I can quickly access it like any other installed program.

**Why this priority**: Start Menu integration is the primary way Windows users discover and launch installed applications. Without this, users would need to navigate to the installation folder manually, which creates a poor user experience and makes the application feel unfinished.

**Independent Test**: Can be fully tested by installing the application and verifying a Start Menu shortcut appears under the application name, and clicking it successfully launches RAIC Overlay.

**Acceptance Scenarios**:

1. **Given** the user has completed the MSI installation, **When** they open the Windows Start Menu and search for "RAIC Overlay", **Then** the application appears in search results with its branded icon
2. **Given** the user has completed the MSI installation, **When** they navigate to Start Menu > All Programs, **Then** they find "RAIC Overlay" entry that launches the application
3. **Given** the user clicks the Start Menu shortcut, **When** the application launches, **Then** it starts with the same behavior as launching from the executable directly

---

### User Story 2 - Desktop Shortcut Option (Priority: P2)

As a user installing RAIC Overlay, I want the option to create a desktop shortcut during installation so I can have quick one-click access to the application from my desktop.

**Why this priority**: Desktop shortcuts provide convenient access for users who prefer desktop-based launching. Making this optional respects user preferences and keeps desktops clean for those who don't want additional icons.

**Independent Test**: Can be fully tested by running the installer, selecting the desktop shortcut option, and verifying a functional shortcut appears on the desktop after installation completes.

**Acceptance Scenarios**:

1. **Given** the user is running the MSI installer, **When** they reach the installation options, **Then** they see a checkbox option to create a desktop shortcut (default: unchecked)
2. **Given** the user selects the desktop shortcut option and completes installation, **When** they view their desktop, **Then** a "RAIC Overlay" shortcut with the application icon is present
3. **Given** the user does NOT select the desktop shortcut option, **When** installation completes, **Then** no desktop shortcut is created
4. **Given** a desktop shortcut exists, **When** the user double-clicks it, **Then** RAIC Overlay launches successfully

---

### User Story 3 - Uninstallation Cleanup (Priority: P3)

As a user who is uninstalling RAIC Overlay, I want all shortcuts to be automatically removed so my system stays clean without leftover icons or entries.

**Why this priority**: Clean uninstallation is essential for a professional application. Orphaned shortcuts create confusion and clutter, negatively impacting user perception of the application quality.

**Independent Test**: Can be fully tested by installing with all shortcut options, then uninstalling via Windows Settings or Control Panel, and verifying no shortcuts remain.

**Acceptance Scenarios**:

1. **Given** the user has RAIC Overlay installed with Start Menu shortcut, **When** they uninstall via Windows Settings or Control Panel, **Then** the Start Menu entry is removed
2. **Given** the user has RAIC Overlay installed with desktop shortcut, **When** they uninstall the application, **Then** the desktop shortcut is removed
3. **Given** the user uninstalls RAIC Overlay, **When** they search for "RAIC Overlay" in Start Menu, **Then** no results appear

---

### Edge Cases

- What happens when the user has restricted permissions and cannot create desktop shortcuts? (Installer should gracefully skip with no error, or inform user if Start Menu fails)
- How does system handle installation to non-default paths? (Shortcuts should correctly point to actual installation location)
- What happens if user reinstalls without uninstalling first? (Shortcuts should be updated, not duplicated)
- What happens on upgrade installations? (Existing shortcuts should be preserved and updated)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Installer MUST create a Start Menu shortcut for RAIC Overlay upon successful installation
- **FR-002**: Installer MUST display the application's branded icon on the Start Menu shortcut
- **FR-003**: Installer MUST provide an optional checkbox during installation to create a desktop shortcut
- **FR-004**: Desktop shortcut option MUST default to unchecked (user must opt-in)
- **FR-005**: If desktop shortcut is selected, installer MUST create a shortcut on the current user's desktop
- **FR-006**: Desktop shortcut MUST display the application's branded icon
- **FR-007**: All shortcuts MUST launch the correct executable from the installation directory
- **FR-008**: Uninstaller MUST remove the Start Menu shortcut
- **FR-009**: Uninstaller MUST remove the desktop shortcut if it was created during installation
- **FR-010**: Installer MUST handle permission issues gracefully without failing the entire installation
- **FR-011**: Installer MUST support silent/unattended installation via standard MSI parameters (/quiet, /passive flags)

### Key Entities

- **Start Menu Shortcut**: A Windows shortcut file placed directly in the Start Menu Programs folder (not in a subfolder), containing the application name, icon, and path to executable
- **Desktop Shortcut**: An optional Windows shortcut file placed on the user's desktop, containing the same target information as Start Menu shortcut
- **Installation Directory**: The folder where RAIC Overlay executable and resources are installed (default: Program Files)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful installations result in a functional Start Menu shortcut
- **SC-002**: Users can launch the application from Start Menu search within 5 seconds of typing the application name
- **SC-003**: Desktop shortcut creation, when selected, completes without errors on standard Windows 11 installations
- **SC-004**: 100% of uninstallations remove all created shortcuts with no orphaned entries
- **SC-005**: Application icon is correctly displayed on all shortcuts (not showing generic executable icon)

## Assumptions

- Windows 11 is the target platform (as stated in project guidelines)
- The application already has proper icon files configured in the bundle configuration
- MSI installer format is the target (standard Windows installer technology)
- Standard user permissions are available for Start Menu and desktop shortcut creation
- The existing bundle configuration will be extended (not replaced)
