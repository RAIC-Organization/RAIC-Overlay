# Quickstart: MSI Installer Shortcuts

**Feature**: 046-msi-installer-shortcuts
**Date**: 2026-01-02

## Overview

This feature configures the Windows MSI installer to create Start Menu shortcuts and optionally create desktop shortcuts based on user preference.

## Implementation Summary

1. Create custom WiX template with desktop shortcut checkbox
2. Configure `tauri.conf.json` to use custom template
3. Build and test MSI installer

## File Structure

```
src-tauri/
├── tauri.conf.json          # Updated bundle configuration
└── windows/
    └── installer.wxs        # Custom WiX template (new)
```

## Key Configuration

### tauri.conf.json Changes

```json
{
  "bundle": {
    "windows": {
      "wix": {
        "template": "./windows/installer.wxs"
      }
    }
  }
}
```

## Building the Installer

```bash
# Build MSI installer
npm run tauri build -- --target x86_64-pc-windows-msvc

# Output location
# src-tauri/target/release/bundle/msi/RAIC Overlay_0.1.0_x64.msi
```

## Testing Checklist

### Start Menu Shortcut
- [ ] Install application
- [ ] Search "RAIC Overlay" in Start Menu - appears with icon
- [ ] Click shortcut - application launches
- [ ] Uninstall - shortcut removed

### Desktop Shortcut (Opt-in)
- [ ] Install without selecting checkbox - no desktop shortcut
- [ ] Install with checkbox selected - desktop shortcut appears
- [ ] Click desktop shortcut - application launches
- [ ] Uninstall - desktop shortcut removed

### Silent Installation
- [ ] `msiexec /i app.msi /quiet` - installs without desktop shortcut
- [ ] `msiexec /i app.msi INSTALLDESKTOPSHORTCUT=1 /quiet` - installs with desktop shortcut
- [ ] `msiexec /x app.msi /quiet` - uninstalls cleanly

## Verification Commands

```powershell
# Check Start Menu shortcut exists
Test-Path "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\RAIC Overlay.lnk"

# Check Desktop shortcut (if created)
Test-Path "$env:USERPROFILE\Desktop\RAIC Overlay.lnk"

# Verify installation in registry
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" |
  Where-Object DisplayName -like "*RAIC Overlay*"
```

## Troubleshooting

### Shortcut not appearing in Start Menu search
- Windows Search indexing may take a few seconds
- Try: `Start-Process "ms-settings:search"` → Rebuild index

### Icon showing generic executable
- Verify `icons/icon.ico` exists in `src-tauri/icons/`
- Ensure icon is properly embedded in executable

### Silent install still shows UI
- Use `/quiet` not `/silent` (MSI standard)
- Check for UAC elevation prompts
