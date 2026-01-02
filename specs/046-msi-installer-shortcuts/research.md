# Research: MSI Installer Shortcuts

**Feature**: 046-msi-installer-shortcuts
**Date**: 2026-01-02

## Summary

Research into Tauri 2.x Windows installer configuration for Start Menu and desktop shortcuts.

## Key Findings

### 1. Tauri WiX vs NSIS Installer Approach

**Decision**: Use WiX (MSI) installer - default Tauri bundler for Windows

**Rationale**:
- WiX produces standard MSI packages recognized by Windows as proper installers
- MSI format supports enterprise deployment scenarios (Group Policy, SCCM)
- Built-in support for silent installation via standard `/quiet` and `/passive` flags
- Automatic cleanup on uninstallation is handled by Windows Installer service
- Already configured in project (`bundle.targets: "all"` includes MSI)

**Alternatives Considered**:
- NSIS: Cross-platform compilation possible, but MSI is preferred for Windows-native deployment

### 2. Shortcut Creation in Tauri WiX Template

**Decision**: Leverage default WiX template shortcuts with optional desktop shortcut via WiX fragment

**Rationale**:
- Tauri's default WiX template (`main.wxs`) already includes:
  - Start Menu shortcut (`ApplicationStartMenuShortcut`) - created automatically
  - Desktop shortcut component (`ApplicationShortcutDesktop`) - created automatically
- Desktop shortcut is included by default in the standard template
- Per spec requirement FR-004, desktop shortcut should default to unchecked (opt-in)
- To achieve opt-in desktop shortcut, a custom WiX fragment is needed

**Key WiX Elements from Default Template**:
```xml
<!-- Start Menu Shortcut - always created -->
<Shortcut Id="ApplicationStartMenuShortcut"
          Name="{{product_name}}"
          Description="Runs {{product_name}}"
          Target="[!Path]"
          Icon="ProductIcon"
          WorkingDirectory="INSTALLDIR">
  <ShortcutProperty Key="System.AppUserModel.ID" Value="{{bundle_id}}"/>
</Shortcut>

<!-- Desktop Shortcut Component -->
<Component Id="ApplicationShortcutDesktop" Guid="*">
  <Shortcut Id="ApplicationDesktopShortcut"
            Name="{{product_name}}"
            Description="Runs {{product_name}}"
            Target="[!Path]"
            WorkingDirectory="INSTALLDIR" />
</Component>
```

**Alternatives Considered**:
- WiX Fragment only: Cannot modify existing component conditions in default template; requires full custom template
- NSIS with MUI_FINISHPAGE: Offers checkbox but less enterprise-friendly than MSI

### 3. Desktop Shortcut Opt-In Implementation

**Decision**: Use custom WiX template to make desktop shortcut conditional on user checkbox

**Rationale**:
- Default Tauri WiX template creates desktop shortcut unconditionally
- Spec requirement FR-003/FR-004 requires optional checkbox defaulting to unchecked
- WiX supports conditional installation via Properties and Conditions
- Custom template can add a checkbox dialog and conditional logic

**Implementation Approach**:
1. Create custom WiX template based on Tauri's default
2. Add `INSTALLDESKTOPSHORTCUT` property (default: "0")
3. Add checkbox to installation UI bound to this property
4. Make desktop shortcut component conditional on property value
5. Reference via `bundle.windows.wix.template` in tauri.conf.json

**Alternative Considered**:
- WiX Fragment only: Cannot modify existing component conditions; requires full template

### 4. Start Menu Shortcut Placement

**Decision**: Use default placement (directly in Programs folder, not subfolder)

**Rationale**:
- Spec clarification confirmed: "Directly in Programs folder"
- Default Tauri WiX template places shortcut in `ProgramMenuFolder` (Programs root)
- No subfolder is created unless explicitly configured
- Single-application installers typically don't need subfolders

**Configuration**: No change needed - default behavior matches requirement

### 5. Silent Installation Support

**Decision**: No additional configuration needed - MSI standard parameters work by default

**Rationale**:
- MSI installers inherently support `/quiet` and `/passive` flags
- Silent installation respects property defaults (desktop shortcut = off)
- Command-line property override available: `msiexec /i app.msi INSTALLDESKTOPSHORTCUT=1 /quiet`

### 6. Uninstallation Cleanup

**Decision**: Rely on WiX automatic component tracking

**Rationale**:
- WiX tracks all installed components including shortcuts
- Uninstallation automatically removes all tracked components
- `RemoveShortcuts` action in template handles cleanup during upgrades
- No additional configuration needed

## Configuration Summary

```json
{
  "bundle": {
    "active": true,
    "targets": ["msi"],
    "windows": {
      "wix": {
        "template": "./windows/installer.wxs"
      }
    },
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

## Dependencies

- **WiX Toolset v3**: Already bundled with Tauri CLI for Windows builds
- **No new Rust/npm dependencies**: Configuration-only changes

## Sources

- [Tauri v2 Windows Installer Documentation](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri v2 Configuration Reference](https://v2.tauri.app/reference/config/)
- [Tauri WiX Template Source](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/msi/main.wxs)
- [Tauri Configuration Schema](https://schema.tauri.app/config/2)
