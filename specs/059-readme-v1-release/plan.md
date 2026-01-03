# Implementation Plan: README v1.0.0 Release Refactor

**Branch**: `059-readme-v1-release` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/059-readme-v1-release/spec.md`

## Summary

Refactor the README.md to be user-friendly for end-users (not developers), featuring the app logo header, Ko-fi donation button, in-game aUEC tip link to "braindaamage", short overlay description, installation link to GitHub releases, controls documentation (F3/F5), windows and widgets descriptions, screenshots section, and MIT license. Also update version numbers to 1.0.0 across package.json, Cargo.toml, and tauri.conf.json.

## Technical Context

**Language/Version**: Markdown (README), JSON (package.json, tauri.conf.json), TOML (Cargo.toml)
**Primary Dependencies**: N/A (documentation and configuration files only)
**Storage**: N/A
**Testing**: Manual visual inspection on GitHub; link validation
**Target Platform**: GitHub web interface (Markdown rendering)
**Project Type**: Documentation update (no source code changes)
**Performance Goals**: N/A (static documentation)
**Constraints**: GitHub Markdown flavor; relative image paths; embedded HTML for Ko-fi button
**Scale/Scope**: 4 files modified (README.md, package.json, Cargo.toml, tauri.conf.json)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | N/A | No code changes; Markdown/config files only |
| II. Testing Standards | N/A | Documentation; manual visual verification sufficient |
| III. User Experience Consistency | PASS | README will follow consistent formatting; clear sections |
| IV. Performance Requirements | N/A | Static documentation |
| V. Research-First Development | PASS | No external libraries; standard Markdown patterns |
| Simplicity Standard | PASS | Straightforward documentation; no abstractions |

**Gate Status**: PASS - All applicable principles satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/059-readme-v1-release/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal for docs feature)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files to modify)

```text
RAICOverlay/
├── README.md                    # Primary deliverable - complete rewrite
├── package.json                 # Version update: 0.1.0 → 1.0.0
├── src-tauri/
│   ├── Cargo.toml              # Version update: 0.1.0 → 1.0.0
│   └── tauri.conf.json         # Version update: 0.1.0 → 1.0.0
│   └── icons/
│       └── icon.png            # Logo source for README header
└── screenshots/
    ├── overlay.png             # In-game screenshot
    └── settings.png            # Settings panel screenshot
```

**Structure Decision**: No new files or directories. Modifying existing README.md and version fields in 3 config files. Logo will be referenced from `src-tauri/icons/icon.png`.

## Complexity Tracking

> No violations to justify. This is a straightforward documentation update.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |
