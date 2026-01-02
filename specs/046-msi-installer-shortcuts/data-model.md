# Data Model: MSI Installer Shortcuts

**Feature**: 046-msi-installer-shortcuts
**Date**: 2026-01-02

## Overview

This feature is configuration-only and does not introduce new application data models. The "entities" are Windows Installer artifacts managed by WiX during build time.

## Installer Artifacts (Build-Time)

### Start Menu Shortcut

| Attribute | Value | Description |
|-----------|-------|-------------|
| Location | `%ProgramData%\Microsoft\Windows\Start Menu\Programs\` | System-wide Programs folder |
| Filename | `RAIC Overlay.lnk` | Shortcut file |
| Target | `[INSTALLDIR]\RAIC Overlay.exe` | Application executable |
| Icon | `[INSTALLDIR]\RAIC Overlay.exe,0` | Embedded application icon |
| Working Directory | `[INSTALLDIR]` | Installation directory |
| AppUserModel.ID | `com.raicoverlay.app` | Windows taskbar grouping ID |

**Lifecycle**:
- Created: On MSI installation (always)
- Updated: On MSI upgrade/repair
- Removed: On MSI uninstallation

### Desktop Shortcut (Optional)

| Attribute | Value | Description |
|-----------|-------|-------------|
| Location | `%USERPROFILE%\Desktop\` | Current user's desktop |
| Filename | `RAIC Overlay.lnk` | Shortcut file |
| Target | `[INSTALLDIR]\RAIC Overlay.exe` | Application executable |
| Icon | `[INSTALLDIR]\RAIC Overlay.exe,0` | Embedded application icon |
| Working Directory | `[INSTALLDIR]` | Installation directory |

**Lifecycle**:
- Created: On MSI installation (only if user selects option)
- Updated: On MSI upgrade/repair (if exists)
- Removed: On MSI uninstallation (if was created)

## WiX Properties (Installer State)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `INSTALLDESKTOPSHORTCUT` | Integer | `0` | Controls desktop shortcut creation (0=no, 1=yes) |
| `INSTALLDIR` | Directory | `[ProgramFilesFolder]\RAIC Overlay\` | Installation target directory |

## No Runtime Data

This feature does not:
- Store any data in application state files
- Modify `state.json` or `user-settings.json`
- Add any runtime entities or persistence

All artifacts are managed by Windows Installer service and tracked in the Windows Installer database.
