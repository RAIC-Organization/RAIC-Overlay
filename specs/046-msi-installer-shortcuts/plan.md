# Implementation Plan: MSI Installer Shortcuts

**Branch**: `046-msi-installer-shortcuts` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/046-msi-installer-shortcuts/spec.md`

## Summary

Configure the Windows MSI installer to create a Start Menu shortcut (always) and provide an optional desktop shortcut checkbox (default: unchecked) during installation. This is achieved through a custom WiX template that extends Tauri's default installer with a user preference dialog.

## Technical Context

**Language/Version**: WiX XML 3.x (installer definition), JSON (Tauri config)
**Primary Dependencies**: Tauri 2.x bundler, WiX Toolset v3 (bundled with Tauri CLI)
**Storage**: N/A (installer artifacts only)
**Testing**: Manual MSI installation testing on Windows 11
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application (existing)
**Performance Goals**: N/A (one-time installation)
**Constraints**: MSI must support silent installation via standard flags
**Scale/Scope**: Single MSI installer file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅
- [x] WiX XML follows standard conventions and is well-documented
- [x] Configuration changes are minimal and focused
- [x] No code duplication - custom template based on Tauri defaults

### II. Testing Standards ✅
- [x] Feature is testable via manual installation verification
- [x] Clear acceptance scenarios defined in spec
- [x] Test checklist provided in quickstart.md

> **Exception Note**: This feature uses manual testing rather than automated integration tests. This is justified because:
> 1. The feature is configuration-only (no runtime application code)
> 2. MSI installer behavior requires Windows Installer service and cannot be unit/integration tested programmatically
> 3. Comprehensive manual test checklist is provided in quickstart.md covering all acceptance scenarios

### III. User Experience Consistency ✅
- [x] Follows Windows installer conventions
- [x] Desktop shortcut opt-in matches industry standard
- [x] Icons consistent with application branding

### IV. Performance Requirements ✅
- [x] N/A - Installation is one-time operation
- [x] No runtime performance impact

### V. Research-First Development ✅
- [x] Tauri WiX documentation consulted via Context7
- [x] Default WiX template analyzed for shortcut handling
- [x] Research findings documented in research.md

## Project Structure

### Documentation (this feature)

```text
specs/046-msi-installer-shortcuts/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Installer artifacts documentation
├── quickstart.md        # Implementation quickstart guide
├── contracts/           # Installer properties contract
│   └── installer-properties.md
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code Changes

```text
src-tauri/
├── tauri.conf.json      # MODIFY: Add wix.template reference
└── windows/             # NEW: Directory for installer customization
    └── installer.wxs    # NEW: Custom WiX template with desktop shortcut option
```

**Structure Decision**: This is a configuration-only feature that adds a single WiX template file and modifies the existing Tauri bundle configuration. No application source code changes required.

## Implementation Approach

### Phase 1: Create Custom WiX Template

1. **Obtain Tauri's default WiX template** from the bundler source
2. **Add installer property**: `INSTALLDESKTOPSHORTCUT` (default: 0)
3. **Add UI checkbox** to installation dialog bound to property
4. **Make desktop shortcut conditional** on property value
5. **Preserve all other default behavior** (Start Menu shortcut, uninstall cleanup)

### Phase 2: Configure Tauri Bundle

1. **Update tauri.conf.json** to reference custom template
2. **Optionally restrict bundle targets** to MSI only for faster builds during testing

### Phase 3: Build and Test

1. **Build MSI**: `npm run tauri build`
2. **Test interactive installation** with/without checkbox
3. **Test silent installation** with/without property override
4. **Verify uninstallation cleanup**

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Installer format | WiX (MSI) | Enterprise-friendly, standard Windows format |
| Desktop shortcut control | WiX Property + Condition | Standard WiX pattern for optional components |
| Start Menu placement | Programs root | Per clarification; simpler for single-app installer |
| Template approach | Custom full template | Fragments cannot modify existing component conditions |

## Complexity Tracking

No constitution violations - this is a minimal configuration change.

## Dependencies

- **Build-time only**: WiX Toolset v3 (already bundled with Tauri CLI)
- **No new npm/cargo dependencies**
- **No runtime dependencies**

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Custom template diverges from Tauri updates | Medium | Document template source version; periodically sync |
| WiX syntax errors | Low | Test build immediately after template creation |
| Silent install ignores property | Low | Test with explicit property override |

## Success Verification

Per spec success criteria:
- SC-001: Start Menu shortcut created on all installations
- SC-002: Application searchable in Start Menu
- SC-003: Desktop shortcut works when selected
- SC-004: Uninstallation removes all shortcuts
- SC-005: Application icon displayed (not generic)
