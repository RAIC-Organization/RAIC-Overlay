# Data Model: Fix Windows Desktop Shortcut Creation

**Feature**: 050-desktop-shortcut
**Date**: 2026-01-03

## Overview

This feature is a bug fix for the WiX installer template. It does not introduce new data entities or modify existing application data. The changes are confined to the MSI installer configuration.

## Installer Configuration Entities

### WiX Property: INSTALLDESKTOPSHORTCUT

| Attribute | Value |
|-----------|-------|
| Type | MSI Public Property |
| Default Value | `0` (or unset) |
| Valid Values | Empty/unset (no shortcut), `1` (create shortcut) |
| Scope | Per-installation |
| Persistence | Not persisted beyond installation |

**Usage**:
- Set by UI checkbox during interactive installation
- Can be passed via command line: `msiexec /i app.msi INSTALLDESKTOPSHORTCUT=1`
- Controls whether the desktop shortcut component is installed

### WiX Component: ApplicationShortcutDesktop

| Attribute | Value |
|-----------|-------|
| Id | `ApplicationShortcutDesktop` |
| Guid | Auto-generated (`*`) |
| Directory | `DesktopFolder` |
| Condition | `INSTALLDESKTOPSHORTCUT` (truthy check) |

**Contains**:
- `Shortcut` element targeting the main executable
- `RemoveFolder` element for uninstall cleanup
- `RegistryValue` element as KeyPath for component tracking

### Registry Key: Desktop Shortcut Marker

| Attribute | Value |
|-----------|-------|
| Root | HKCU |
| Key | `Software\{manufacturer}\{product_name}` |
| Name | `Desktop Shortcut` |
| Type | integer |
| Value | `1` |

**Purpose**: Required by WiX as the KeyPath for the desktop shortcut component. Used for component tracking and repair scenarios.

## State Transitions

```
Installation Flow:
┌─────────────────┐
│ Installer Start │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ INSTALLDESKTOPSHORTCUT = 0  │ (default)
└────────────┬────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌───────────┐   ┌──────────────────────┐
│ Checkbox  │   │ Silent Install with  │
│ Unchecked │   │ INSTALLDESKTOPSHORTCUT=1
└─────┬─────┘   └──────────┬───────────┘
      │                    │
      │                    ▼
      │         ┌──────────────────────┐
      │         │ INSTALLDESKTOPSHORTCUT = 1
      │         └──────────┬───────────┘
      │                    │
      ▼                    ▼
┌─────────────┐   ┌─────────────────────┐
│ No Shortcut │   │ Desktop Shortcut    │
│ Component   │   │ Component Installed │
│ Installed   │   └─────────────────────┘
└─────────────┘
```

## No Application Data Changes

This feature does not modify:
- Application state files
- User settings
- Persisted data
- Configuration files

All changes are confined to the MSI installer behavior.
