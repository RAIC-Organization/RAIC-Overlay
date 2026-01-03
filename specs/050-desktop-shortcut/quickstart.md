# Quickstart: Fix Windows Desktop Shortcut Creation

**Feature**: 050-desktop-shortcut
**Estimated Effort**: 15 minutes

## Overview

This is a simple bug fix that requires changing one line in the WiX installer template. The desktop shortcut is not being created because the condition expression is using a string comparison that doesn't evaluate correctly.

## Prerequisites

- Windows 11 development machine
- Rust toolchain installed
- Node.js installed
- Tauri CLI installed (`npm install -g @tauri-apps/cli`)

## The Fix

### File to Modify

`src-tauri/windows/installer.wxs`

### Change Required

Locate line ~191 (inside the `ApplicationShortcutDesktop` component):

**Find**:
```xml
<Condition>INSTALLDESKTOPSHORTCUT = "1"</Condition>
```

**Replace with**:
```xml
<Condition>INSTALLDESKTOPSHORTCUT</Condition>
```

## Testing the Fix

### Build the Installer

```bash
npm run tauri build
```

The MSI installer will be created at:
`src-tauri/target/release/bundle/msi/RAIC Overlay_x.y.z_x64_en-US.msi`

### Test Scenarios

1. **Interactive Install (checkbox checked)**
   - Run the MSI
   - Check "Create a desktop shortcut"
   - Complete installation
   - Verify: Desktop shortcut appears

2. **Interactive Install (checkbox unchecked)**
   - Run the MSI
   - Leave checkbox unchecked
   - Complete installation
   - Verify: No desktop shortcut

3. **Silent Install with shortcut**
   ```cmd
   msiexec /i "RAIC Overlay_x.y.z_x64_en-US.msi" /quiet INSTALLDESKTOPSHORTCUT=1
   ```
   - Verify: Desktop shortcut appears

4. **Uninstall**
   - Uninstall via Windows Settings
   - Verify: Desktop shortcut is removed

## Why This Works

WiX evaluates conditions using truthiness:
- When the checkbox is unchecked, `INSTALLDESKTOPSHORTCUT` is "0" or empty → falsy → component skipped
- When the checkbox is checked, `INSTALLDESKTOPSHORTCUT` is "1" → truthy → component installed

The original `= "1"` string comparison had issues with how WiX evaluates the property during the installation sequence.

## Success Criteria

- [ ] Desktop shortcut created when checkbox is checked
- [ ] No desktop shortcut when checkbox is unchecked
- [ ] Silent install with `INSTALLDESKTOPSHORTCUT=1` creates shortcut
- [ ] Uninstall removes the desktop shortcut
- [ ] Shortcut displays correct icon
- [ ] Shortcut launches the application correctly
