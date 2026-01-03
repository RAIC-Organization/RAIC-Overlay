# Research: Fix Windows Desktop Shortcut Creation

**Feature**: 050-desktop-shortcut
**Date**: 2026-01-03
**Status**: Complete

## Problem Analysis

The current WiX installer template (`src-tauri/windows/installer.wxs`) is not creating desktop shortcuts when users select the "Create a desktop shortcut" checkbox during installation.

### Current Implementation Review

The current implementation uses a **conditional component** approach:

```xml
<Component Id="ApplicationShortcutDesktop" Guid="*">
    <Condition>INSTALLDESKTOPSHORTCUT = "1"</Condition>
    <Shortcut Id="ApplicationDesktopShortcut" ... />
    <RemoveFolder Id="DesktopFolder" On="uninstall" />
    <RegistryValue ... KeyPath="yes" />
</Component>
```

The checkbox in the UI is defined as:
```xml
<Control Id="DesktopShortcutCheckBox" Type="CheckBox"
         Property="INSTALLDESKTOPSHORTCUT" CheckBoxValue="1"
         Text="Create a desktop shortcut" />
```

And the property defaults to "0":
```xml
<Property Id="INSTALLDESKTOPSHORTCUT" Value="0" Secure="yes" />
```

### Root Cause Analysis

After researching WiX conditional component patterns, the issue is likely one of the following:

1. **Condition Evaluation Timing**: The `<Condition>` element inside a component is evaluated during `CostFinalize` or `InstallValidate` sequences. If the UI checkbox is checked after these sequences run, the condition has already been evaluated as false.

2. **String vs Empty Comparison**: WiX conditions comparing to "1" can be problematic. The standard pattern is to check if the property is set (truthy) rather than comparing to a specific value.

3. **Transitive Property Issue**: Properties set in the UI may not be properly passed to the deferred execution sequence where components are actually installed.

### Tauri Default Template Comparison

The [Tauri default WiX template](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/msi/main.wxs) does **NOT** include conditional desktop shortcut creation - it always installs the desktop shortcut unconditionally.

## Research Findings

### Decision 1: Fix the Condition Syntax

**Decision**: Change the condition from `INSTALLDESKTOPSHORTCUT = "1"` to `INSTALLDESKTOPSHORTCUT`

**Rationale**:
- WiX conditions evaluate property values as truthy/falsy
- When a checkbox sets a property to "1", checking `PROPERTYNAME` (without comparison) evaluates to true
- Setting `Value="0"` as default and comparing with `= "1"` can cause issues because "0" is still a truthy string in some contexts

**Alternatives Considered**:
1. ~~Use Feature-based conditional installation~~ - Would require major restructuring of the installer
2. ~~Remove the condition entirely~~ - Would remove user choice, not aligned with requirements

### Decision 2: Ensure Property Propagation

**Decision**: Keep the `Secure="yes"` attribute on the property

**Rationale**:
- `Secure="yes"` ensures the property can be set via command line (msiexec INSTALLDESKTOPSHORTCUT=1)
- Needed for silent installation support (FR-005)

**Alternatives Considered**:
1. ~~Remove Secure attribute~~ - Would break command-line installation

### Decision 3: Verify Shortcut Target Reference

**Decision**: Keep the `Target="[!Path]"` reference

**Rationale**:
- `[!Path]` is WiX syntax for referencing the full path to a file with a specific Id
- The `Path` Id refers to the main executable file component
- This is the correct way to reference the installed executable

**Alternatives Considered**:
1. ~~Use `[INSTALLDIR]{{product_name}}.exe`~~ - Less robust, hardcodes filename

## Implementation Approach

### Primary Fix

Change the component condition from:
```xml
<Condition>INSTALLDESKTOPSHORTCUT = "1"</Condition>
```

To:
```xml
<Condition>INSTALLDESKTOPSHORTCUT</Condition>
```

This change evaluates whether `INSTALLDESKTOPSHORTCUT` has any truthy value, rather than specifically comparing to the string "1".

### Secondary Consideration: Default Property Value

Consider removing the default value `Value="0"` from the property definition:

**Current**:
```xml
<Property Id="INSTALLDESKTOPSHORTCUT" Value="0" Secure="yes" />
```

**Alternative**:
```xml
<Property Id="INSTALLDESKTOPSHORTCUT" Secure="yes" />
```

**Reasoning**: When the property has no default value, it is "unset" and evaluates to false. When the checkbox is checked, it sets the value to "1", making the condition `INSTALLDESKTOPSHORTCUT` evaluate to true.

However, setting `Value="0"` should still work with the simplified condition `INSTALLDESKTOPSHORTCUT` because:
- "0" as a string is falsy in WiX condition evaluation
- When checkbox is checked, it becomes "1" which is truthy

### Verification Steps

1. Build the installer with the fix
2. Run installation WITHOUT checking the desktop shortcut checkbox → No shortcut should be created
3. Run installation WITH the desktop shortcut checkbox checked → Shortcut should be created
4. Run silent installation with `INSTALLDESKTOPSHORTCUT=1` → Shortcut should be created
5. Uninstall → Shortcut should be removed

## Sources

- [WiX How To: Create a Start Menu Shortcut](https://wixtoolset.org/docs/v3/howtos/files_and_registry/create_start_menu_shortcut/)
- [Create Desktop Shortcut Using WiX](https://www.advancedinstaller.com/versus/wix-toolset/create-desktop-shortcut-using-wix.html)
- [Tauri WiX Template](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/msi/main.wxs)
- [WiX Users: How to Create an Optional Shortcut](https://wix-users.narkive.com/DR3AngIB/how-to-create-an-optional-shortcut)

## Conclusion

The fix requires a minimal change to the WiX template: simplify the condition expression from a string comparison to a property existence check. This aligns with WiX best practices for conditional component installation based on checkbox UI properties.
