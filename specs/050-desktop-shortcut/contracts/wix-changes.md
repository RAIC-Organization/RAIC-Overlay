# Contract: WiX Template Changes

**Feature**: 050-desktop-shortcut
**Date**: 2026-01-03
**File**: `src-tauri/windows/installer.wxs`

## Change Description

Fix the desktop shortcut component condition to properly evaluate the `INSTALLDESKTOPSHORTCUT` property.

## Before (Current - Broken)

```xml
<!-- Line ~191 in installer.wxs -->
<Component Id="ApplicationShortcutDesktop" Guid="*">
    <Condition>INSTALLDESKTOPSHORTCUT = "1"</Condition>
    <Shortcut Id="ApplicationDesktopShortcut"
              Name="{{product_name}}"
              Description="Runs {{product_name}}"
              Target="[!Path]"
              Icon="ProductIcon"
              WorkingDirectory="INSTALLDIR">
        <ShortcutProperty Key="System.AppUserModel.ID" Value="{{bundle_id}}"/>
    </Shortcut>
    <RemoveFolder Id="DesktopFolder" On="uninstall" />
    <RegistryValue Root="HKCU" Key="Software\\{{manufacturer}}\\{{product_name}}" Name="Desktop Shortcut" Type="integer" Value="1" KeyPath="yes" />
</Component>
```

## After (Fixed)

```xml
<!-- Line ~191 in installer.wxs -->
<Component Id="ApplicationShortcutDesktop" Guid="*">
    <Condition>INSTALLDESKTOPSHORTCUT</Condition>
    <Shortcut Id="ApplicationDesktopShortcut"
              Name="{{product_name}}"
              Description="Runs {{product_name}}"
              Target="[!Path]"
              Icon="ProductIcon"
              WorkingDirectory="INSTALLDIR">
        <ShortcutProperty Key="System.AppUserModel.ID" Value="{{bundle_id}}"/>
    </Shortcut>
    <RemoveFolder Id="DesktopFolder" On="uninstall" />
    <RegistryValue Root="HKCU" Key="Software\\{{manufacturer}}\\{{product_name}}" Name="Desktop Shortcut" Type="integer" Value="1" KeyPath="yes" />
</Component>
```

## Change Details

| Element | Before | After | Reason |
|---------|--------|-------|--------|
| `<Condition>` | `INSTALLDESKTOPSHORTCUT = "1"` | `INSTALLDESKTOPSHORTCUT` | String comparison was not evaluating correctly; truthy check is the standard WiX pattern |

## Verification Contract

### Test Case 1: Interactive Installation - Checkbox Unchecked (Default)

**Preconditions**:
- Clean Windows 11 system (no prior installation)

**Steps**:
1. Run MSI installer
2. Leave "Create a desktop shortcut" checkbox unchecked
3. Complete installation

**Expected Result**:
- No desktop shortcut is created
- Application installs successfully

### Test Case 2: Interactive Installation - Checkbox Checked

**Preconditions**:
- Clean Windows 11 system (no prior installation)

**Steps**:
1. Run MSI installer
2. Check "Create a desktop shortcut" checkbox
3. Complete installation

**Expected Result**:
- Desktop shortcut is created on current user's desktop
- Shortcut has correct icon (RAIC Overlay icon, not generic)
- Double-clicking shortcut launches RAIC Overlay
- Shortcut properties show correct target path

### Test Case 3: Silent Installation Without Parameter

**Preconditions**:
- Clean Windows 11 system (no prior installation)

**Command**:
```cmd
msiexec /i "RAIC Overlay.msi" /quiet
```

**Expected Result**:
- Application installs successfully
- No desktop shortcut is created

### Test Case 4: Silent Installation With Parameter

**Preconditions**:
- Clean Windows 11 system (no prior installation)

**Command**:
```cmd
msiexec /i "RAIC Overlay.msi" /quiet INSTALLDESKTOPSHORTCUT=1
```

**Expected Result**:
- Application installs successfully
- Desktop shortcut is created

### Test Case 5: Uninstallation Cleanup

**Preconditions**:
- RAIC Overlay installed with desktop shortcut

**Steps**:
1. Uninstall via Windows Settings or Control Panel

**Expected Result**:
- Desktop shortcut is removed
- Application is fully uninstalled

## Backward Compatibility

This change is backward compatible:
- Existing installations are not affected
- The installer UI remains unchanged
- Command-line parameters remain the same
- Uninstall behavior remains the same
