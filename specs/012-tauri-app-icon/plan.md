# Implementation Plan: Tauri App Icon Update

**Branch**: `012-tauri-app-icon` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-tauri-app-icon/spec.md`

## Summary

Update the Tauri application icons to use the branded RAIC icon already present in the Next.js app (`src/assets/icon.png`). The Tauri CLI `icon` command will generate all required icon formats and sizes from this single 1024x1024 PNG source, replacing the default Tauri icons in `src-tauri/icons/`.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (frontend), Rust 2021 Edition (Tauri backend)
**Primary Dependencies**: Tauri CLI 2.x (`@tauri-apps/cli`), Next.js 16.x, React 19.0.0
**Storage**: N/A (static asset generation only)
**Testing**: Visual verification (no automated tests required for static assets)
**Target Platform**: Windows 11 (64-bit) primary, macOS/Linux cross-platform compatibility
**Project Type**: Desktop application (Tauri + Next.js)
**Performance Goals**: N/A (build-time asset generation)
**Constraints**: Source icon must be square PNG with transparency, minimum 512x512 (current: 1024x1024)
**Scale/Scope**: Single command execution, ~17 output files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | No code changes required; CLI tool usage only |
| II. Testing Standards | PASS | Visual verification sufficient for static assets |
| III. User Experience Consistency | PASS | Unifies app branding across system UI and in-app display |
| IV. Performance Requirements | N/A | Build-time operation, no runtime impact |
| V. Research-First Development | PASS | Tauri documentation researched via Context7 |
| Simplicity Standard | PASS | Single CLI command, no custom tooling |

**All gates passed. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/012-tauri-app-icon/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── assets/
    └── icon.png         # Source icon (1024x1024 PNG with alpha) - DO NOT MODIFY

src-tauri/
├── icons/               # Target directory for generated icons
│   ├── 32x32.png
│   ├── 64x64.png
│   ├── 128x128.png
│   ├── 128x128@2x.png
│   ├── icon.png
│   ├── icon.ico         # Windows executable icon
│   ├── icon.icns        # macOS app bundle icon
│   ├── Square30x30Logo.png
│   ├── Square44x44Logo.png
│   ├── Square71x71Logo.png
│   ├── Square89x89Logo.png
│   ├── Square107x107Logo.png
│   ├── Square142x142Logo.png
│   ├── Square150x150Logo.png
│   ├── Square284x284Logo.png
│   ├── Square310x310Logo.png
│   └── StoreLogo.png
└── tauri.conf.json      # References icons via bundle.icon (no changes needed)
```

**Structure Decision**: Existing project structure maintained. Only the contents of `src-tauri/icons/` will be replaced by the Tauri CLI icon command.

## Complexity Tracking

> No violations to justify. Feature is a single CLI command execution.
