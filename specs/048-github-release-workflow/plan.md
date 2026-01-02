# Implementation Plan: GitHub Release Workflow

**Branch**: `048-github-release-workflow` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/048-github-release-workflow/spec.md`

## Summary

Create a GitHub Actions workflow that triggers on semantic version tags (including pre-releases), automatically updates version numbers across `tauri.conf.json`, `Cargo.toml`, and `package.json`, builds the Tauri application for Windows, generates a changelog from commits since the previous release, and publishes a GitHub release with the MSI installer attached.

## Technical Context

**Language/Version**: YAML (GitHub Actions), PowerShell/Bash (scripts)
**Primary Dependencies**: GitHub Actions (actions/checkout, actions/setup-node, dtolnay/rust-action, softprops/action-gh-release), Tauri CLI 2.x
**Storage**: N/A (workflow artifacts only)
**Testing**: Manual testing via tag push; workflow syntax validation
**Target Platform**: GitHub Actions windows-latest runner
**Project Type**: CI/CD workflow configuration
**Performance Goals**: Complete release process in under 15 minutes
**Constraints**: Windows runner required for MSI generation; WiX Toolset via Tauri bundler
**Scale/Scope**: Single workflow file, minimal scripting for version updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | PASS | Workflow YAML will be clean, well-commented, with clear step names |
| II. Testing Standards | PASS | Workflow can be tested via tag push; existing CI tests run before build |
| III. User Experience Consistency | PASS | Release page format consistent; changelog organized by commit type |
| IV. Performance Requirements | PASS | 15-minute target defined in spec; caching configured for dependencies |
| V. Research-First Development | PASS | Will research GitHub Actions best practices and Tauri build patterns |

**Quality Gates:**
- Pre-commit: YAML lint validation
- Pre-merge: Workflow syntax check via `actionlint` or manual review
- Pre-deploy: First tag push tests the complete workflow

## Project Structure

### Documentation (this feature)

```text
specs/048-github-release-workflow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - workflow config)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for workflow)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml           # Existing CI workflow
    └── release.yml      # NEW: Release workflow (this feature)
```

**Structure Decision**: Single workflow file at `.github/workflows/release.yml`. Version update logic will be inline PowerShell/Bash steps within the workflow, keeping all release logic self-contained and easy to audit.

## Complexity Tracking

> No violations requiring justification. This is a straightforward CI/CD workflow addition.
