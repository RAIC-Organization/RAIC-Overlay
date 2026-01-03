# Feature Specification: Fix Windows Desktop Shortcut Creation

**Feature Branch**: `050-desktop-shortcut`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "The current instalator is not creating the desktop direct access in windows 11 for the instalator user, check the correct tauri patter for this and fix"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop Shortcut Created When Selected (Priority: P1)

As a user installing RAIC Overlay on Windows 11, when I select the "Create a desktop shortcut" option during installation, I expect a working desktop shortcut to be created on my desktop.

**Why this priority**: This is the core functionality that is currently broken. The installer's desktop shortcut checkbox exists but does not successfully create the shortcut, rendering the feature non-functional.

**Independent Test**: Run the MSI installer, check the "Create a desktop shortcut" checkbox, complete installation, and verify a shortcut appears on the current user's desktop.

**Acceptance Scenarios**:

1. **Given** the user runs the MSI installer, **When** they check the "Create a desktop shortcut" checkbox and complete installation, **Then** a "RAIC Overlay" shortcut appears on their desktop
2. **Given** the desktop shortcut exists, **When** the user double-clicks it, **Then** RAIC Overlay launches successfully
3. **Given** the desktop shortcut exists, **When** the user views its properties, **Then** it points to the correct executable in the installation directory
4. **Given** the desktop shortcut exists, **When** the user views it, **Then** it displays the correct RAIC Overlay application icon (not a generic icon)

---

### User Story 2 - Silent Installation Desktop Shortcut (Priority: P2)

As a system administrator deploying RAIC Overlay via automated scripts, I want to be able to specify that a desktop shortcut should be created using command-line parameters.

**Why this priority**: Enterprise and power users need the ability to automate installations with consistent settings, including desktop shortcut creation.

**Independent Test**: Run the MSI installer silently with the desktop shortcut parameter and verify the shortcut is created without user interaction.

**Acceptance Scenarios**:

1. **Given** the user runs `msiexec /i RAIC_Overlay.msi /quiet INSTALLDESKTOPSHORTCUT=1`, **When** installation completes, **Then** a desktop shortcut is created
2. **Given** the user runs `msiexec /i RAIC_Overlay.msi /quiet` (without the parameter), **When** installation completes, **Then** no desktop shortcut is created (respects default of unchecked)

---

### Edge Cases

- What happens when the user's Desktop folder is in a non-standard location (redirected via Group Policy)? (Shortcut should be created in the user's actual Desktop folder)
- What happens if the desktop folder doesn't exist or is read-only? (Installation should complete successfully even if shortcut creation fails)
- What happens during upgrade installations where desktop shortcut was previously created? (Existing shortcut should be updated, not duplicated or orphaned)
- What happens when multiple users are on the same machine? (Shortcut should be created only for the installing user, not all users)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Installer MUST create a desktop shortcut when the user selects the checkbox option during installation
- **FR-002**: Desktop shortcut MUST be created in the current user's Desktop folder (not All Users Desktop)
- **FR-003**: Desktop shortcut MUST correctly target the installed RAIC Overlay executable
- **FR-004**: Desktop shortcut MUST display the application's branded icon
- **FR-005**: Silent installation MUST support `INSTALLDESKTOPSHORTCUT=1` parameter to create desktop shortcut
- **FR-006**: Uninstaller MUST remove the desktop shortcut if it was created
- **FR-007**: The desktop shortcut checkbox MUST remain unchecked by default (opt-in behavior)

### Key Entities

- **Desktop Shortcut**: A Windows shortcut (.lnk) file placed on the installing user's desktop, containing the target path to RAIC Overlay executable, the application icon, and working directory
- **INSTALLDESKTOPSHORTCUT Property**: WiX/MSI property that controls whether the desktop shortcut is created (value "1" = create, "0" = skip)
- **CustomInstallDirDlg**: The installer dialog containing the checkbox for desktop shortcut selection

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the desktop shortcut checkbox is selected during installation, a shortcut is created on the user's desktop 100% of the time
- **SC-002**: The created desktop shortcut successfully launches RAIC Overlay when double-clicked
- **SC-003**: Desktop shortcut displays the correct application icon (not a generic Windows executable icon)
- **SC-004**: Silent installation with `INSTALLDESKTOPSHORTCUT=1` creates the desktop shortcut
- **SC-005**: Uninstalling the application removes the desktop shortcut completely

## Assumptions

- Windows 11 is the target platform
- The existing WiX installer template (installer.wxs) is the file to be fixed
- The application icon files are correctly configured and accessible
- The issue is in the WiX template configuration, not in Tauri's bundler
- Standard user permissions allow desktop shortcut creation
