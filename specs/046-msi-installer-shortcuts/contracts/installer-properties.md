# Installer Properties Contract

**Feature**: 046-msi-installer-shortcuts
**Date**: 2026-01-02

## Overview

This document defines the MSI installer properties that can be set via command-line for silent/automated installations.

## Public MSI Properties

### INSTALLDESKTOPSHORTCUT

Controls whether a desktop shortcut is created during installation.

| Attribute | Value |
|-----------|-------|
| Property Name | `INSTALLDESKTOPSHORTCUT` |
| Type | Integer |
| Default | `0` (no shortcut) |
| Valid Values | `0` = Do not create, `1` = Create |

**Usage Examples**:

```bash
# Silent install without desktop shortcut (default)
msiexec /i "RAIC Overlay_0.1.0_x64.msi" /quiet

# Silent install with desktop shortcut
msiexec /i "RAIC Overlay_0.1.0_x64.msi" INSTALLDESKTOPSHORTCUT=1 /quiet

# Passive install (shows progress) with desktop shortcut
msiexec /i "RAIC Overlay_0.1.0_x64.msi" INSTALLDESKTOPSHORTCUT=1 /passive
```

### INSTALLDIR

Controls the installation target directory.

| Attribute | Value |
|-----------|-------|
| Property Name | `INSTALLDIR` |
| Type | Directory Path |
| Default | `C:\Program Files\RAIC Overlay\` |

**Usage Examples**:

```bash
# Install to custom directory
msiexec /i "RAIC Overlay_0.1.0_x64.msi" INSTALLDIR="D:\Apps\RAICOverlay" /quiet
```

## Standard MSI Flags

The installer supports all standard Windows Installer command-line options:

| Flag | Description |
|------|-------------|
| `/quiet` | Silent installation (no UI) |
| `/passive` | Unattended installation (progress bar only) |
| `/norestart` | Suppress restart prompts |
| `/log <file>` | Write installation log to file |

## Uninstallation

```bash
# Silent uninstall
msiexec /x "RAIC Overlay_0.1.0_x64.msi" /quiet

# Or via product code (from registry)
msiexec /x {PRODUCT-GUID} /quiet
```

## Upgrade Behavior

- Upgrades preserve existing shortcut state
- If desktop shortcut existed, it will be updated
- If desktop shortcut did not exist, it will not be created (unless INSTALLDESKTOPSHORTCUT=1)
