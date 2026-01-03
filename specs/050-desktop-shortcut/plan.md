# Implementation Plan: Fix Windows Desktop Shortcut Creation

**Branch**: `050-desktop-shortcut` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/050-desktop-shortcut/spec.md`

## Summary

Fix the MSI installer to properly create desktop shortcuts when users select the checkbox option. The issue is a WiX condition expression that uses string comparison instead of truthy evaluation. The fix requires changing one line in the WiX template: from `INSTALLDESKTOPSHORTCUT = "1"` to `INSTALLDESKTOPSHORTCUT`.

## Technical Context

**Language/Version**: WiX XML 3.x (Windows Installer XML)
**Primary Dependencies**: Tauri 2.x bundler, WiX Toolset (bundled with Tauri CLI)
**Storage**: N/A (installer configuration only)
**Testing**: Manual MSI installation testing on Windows 11
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Tauri desktop application
**Performance Goals**: N/A (installer fix, no runtime impact)
**Constraints**: Must maintain backward compatibility with existing installations
**Scale/Scope**: Single file change (1 line modification)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Single-line fix is clear and maintainable |
| II. Testing Standards | ⚠️ EXCEPTION | Manual tests only - MSI installers cannot be automated in CI. 5 test cases defined in contracts/wix-changes.md. |
| III. User Experience Consistency | ✅ PASS | Restores expected installer behavior |
| IV. Performance Requirements | ✅ PASS | N/A - no runtime impact |
| V. Research-First Development | ✅ PASS | WiX patterns researched via Context7 and web search |

### Post-Design Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Fix follows WiX best practices |
| II. Testing Standards | ⚠️ EXCEPTION | Manual tests only - MSI installers require real Windows install/uninstall cycles. 5 test cases in contracts/wix-changes.md cover all acceptance scenarios. |
| III. User Experience Consistency | ✅ PASS | Checkbox behavior matches user expectations |
| IV. Performance Requirements | ✅ PASS | N/A |
| V. Research-First Development | ✅ PASS | Solution validated against official documentation |

## Project Structure

### Documentation (this feature)

```text
specs/050-desktop-shortcut/
├── plan.md              # This file
├── research.md          # WiX condition patterns research
├── data-model.md        # Installer entities documentation
├── quickstart.md        # Quick implementation guide
├── contracts/
│   └── wix-changes.md   # Before/after and test cases
└── tasks.md             # (Created by /speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/
└── windows/
    └── installer.wxs    # WiX template to be modified (line ~191)
```

**Structure Decision**: This feature only modifies the existing WiX installer template. No new files or directories are created.

## Implementation Overview

### Phase 1: Apply Fix

1. Open `src-tauri/windows/installer.wxs`
2. Locate the `ApplicationShortcutDesktop` component (~line 191)
3. Change the condition from `INSTALLDESKTOPSHORTCUT = "1"` to `INSTALLDESKTOPSHORTCUT`
4. Save the file

### Phase 2: Build and Test

1. Build the installer: `npm run tauri build`
2. Execute test cases defined in `contracts/wix-changes.md`
3. Verify all 5 test scenarios pass

### Phase 3: Documentation

1. Update any relevant documentation
2. Commit with clear message describing the fix

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Fix doesn't work | Low | Medium | Multiple WiX sources confirm the pattern |
| Breaks existing behavior | Very Low | High | Change is minimal and isolated |
| Build fails | Very Low | Low | WiX syntax is well-known and validated |

## Complexity Tracking

No constitution violations. This is a minimal, targeted fix with clear rationale.

## Artifacts Generated

- [research.md](./research.md) - WiX condition evaluation research
- [data-model.md](./data-model.md) - Installer entity documentation
- [quickstart.md](./quickstart.md) - Quick implementation guide
- [contracts/wix-changes.md](./contracts/wix-changes.md) - Before/after code and test cases
