# Research: GitHub Release Workflow

**Feature**: 048-github-release-workflow
**Date**: 2026-01-02

## Research Questions

### 1. GitHub Actions Tag Trigger Pattern

**Decision**: Use `on: push: tags: ['v*.*.*', '*.*.*']` pattern to match both prefixed and non-prefixed semver tags

**Rationale**:
- GitHub Actions natively supports tag-based triggering via the `on.push.tags` pattern
- Using glob patterns allows matching semantic version formats including pre-releases
- Pattern `'v*.*.*'` catches `v0.1.0`, `v1.0.0-beta.1`, etc.
- Pattern `'*.*.*'` catches `0.1.0`, `1.0.0-rc.1`, etc.

**Alternatives Considered**:
- Using `on: release` trigger - rejected because it requires manual release creation first
- Using `workflow_dispatch` - rejected because we want automatic triggering on tag push

**Sources**: [This Dot Labs - Tag and Release with GitHub Actions](https://www.thisdot.co/blog/tag-and-release-your-project-with-github-actions), [GitHub Community Discussion #45144](https://github.com/orgs/community/discussions/45144)

### 2. Tauri Build for GitHub Actions

**Decision**: Use `tauri-apps/tauri-action@v0` for building and optionally creating releases, but with custom release handling for changelog

**Rationale**:
- Official Tauri action handles all build complexity including MSI generation
- Supports `tagName`, `releaseName`, `releaseBody`, `prerelease` options
- Built-in `__VERSION__` placeholder replacement from tauri.conf.json
- Includes Rust cache setup for faster builds
- However, we'll use `releaseDraft: true` or skip release creation to handle changelog separately

**Alternatives Considered**:
- Manual `npm run tauri build` - rejected because tauri-action handles cross-platform complexity
- Using `tauri-action` for full release - partially adopted; we may use separate release action for better changelog control

**Sources**: [Tauri Docs - GitHub Actions Pipeline](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/Pipelines/github.mdx)

### 3. Changelog Generation Approach

**Decision**: Use `softprops/action-gh-release@v2` with `generate_release_notes: true` for automatic changelog from commits

**Rationale**:
- Built-in GitHub release notes generation uses `.github/release.yml` for categorization
- Supports pre-release detection via `prerelease: ${{ contains(github.ref, '-') }}`
- Can attach files (MSI) as release assets
- Falls back gracefully when no previous tag exists (shows all commits up to limit)
- v2 uses modern `github.ref_type == 'tag'` pattern

**Alternatives Considered**:
- `marvinpinto/action-automatic-releases` - viable but less maintained than softprops
- `fregante/release-with-changelog` - good but softprops has better asset handling
- Custom changelog generation script - rejected for complexity; GitHub's built-in is sufficient

**Sources**: [softprops/action-gh-release](https://github.com/softprops/action-gh-release), [GH Release Marketplace](https://github.com/marketplace/actions/gh-release)

### 4. Version File Update Strategy

**Decision**: Use inline PowerShell script to update version in all three files before build

**Rationale**:
- Windows runner supports PowerShell natively
- Simple JSON/TOML manipulation with built-in cmdlets
- Version extracted from `${{ github.ref_name }}` with optional 'v' prefix stripping
- All changes made in workflow, not committed back (artifact-only)

**Implementation Pattern**:
```powershell
$version = "${{ github.ref_name }}" -replace '^v', ''

# Update tauri.conf.json
$tauri = Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json
$tauri.version = $version
$tauri | ConvertTo-Json -Depth 10 | Set-Content src-tauri/tauri.conf.json

# Update package.json
$pkg = Get-Content package.json | ConvertFrom-Json
$pkg.version = $version
$pkg | ConvertTo-Json -Depth 10 | Set-Content package.json

# Update Cargo.toml (regex replace for TOML)
(Get-Content src-tauri/Cargo.toml) -replace '^version = ".*"', "version = `"$version`"" | Set-Content src-tauri/Cargo.toml
```

**Alternatives Considered**:
- Committing version changes back to repo - rejected; complicates workflow and may cause loops
- Using separate version bump action - rejected for simplicity; inline script is sufficient
- Pre-tagging version update workflow - rejected; single workflow is simpler

### 5. Pre-release Detection

**Decision**: Detect pre-release by checking if tag contains hyphen (semver pre-release indicator)

**Rationale**:
- Semantic versioning defines pre-release as `MAJOR.MINOR.PATCH-IDENTIFIER`
- Simple string check: `contains(github.ref_name, '-')`
- Works for all pre-release formats: `-alpha`, `-beta`, `-rc.1`, `-dev.20260102`

**Implementation**:
```yaml
prerelease: ${{ contains(github.ref_name, '-') }}
```

**Alternatives Considered**:
- Regex matching specific pre-release keywords - rejected; hyphen check covers all cases
- Manual flag in workflow_dispatch - rejected; we want automatic detection

### 6. Caching Strategy

**Decision**: Use `actions/cache` for npm and `swatinem/rust-cache` for Cargo, matching existing CI workflow

**Rationale**:
- Existing `ci.yml` already uses cargo caching pattern
- Rust compilation is the slowest part; caching saves ~5-10 minutes
- npm cache via `actions/setup-node` with `cache: 'npm'`
- Rust cache via `swatinem/rust-cache` with workspace config

**Sources**: [Tauri Docs - Rust Cache](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/Pipelines/github.mdx)

## Workflow Architecture

```
Tag Push (v0.1.0 or 0.1.0)
    │
    ▼
┌─────────────────────────────┐
│  1. Checkout code           │
│  2. Extract version from tag│
│  3. Update version files    │
│     - tauri.conf.json       │
│     - package.json          │
│     - Cargo.toml            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. Setup Node.js + cache   │
│  5. Setup Rust + cache      │
│  6. Install npm deps        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  7. Build frontend          │
│  8. Build Tauri release     │
│     (generates MSI)         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  9. Create GitHub Release   │
│     - Auto changelog        │
│     - Pre-release detection │
│     - Attach MSI artifact   │
└─────────────────────────────┘
```

## Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| actions/checkout | v4 | Clone repository |
| actions/setup-node | v4 | Node.js environment |
| dtolnay/rust-toolchain | stable | Rust compiler |
| swatinem/rust-cache | v2 | Cargo build caching |
| tauri-apps/tauri-action | v0 | Tauri build (optional) |
| softprops/action-gh-release | v2 | Release creation |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Build timeout (>15 min target) | Aggressive caching; Windows runner has good specs |
| MSI generation failure | Tauri bundler handles WiX automatically; fail-fast enabled |
| Version update script failure | Validate version format before update; fail early |
| First release (no previous tag) | GitHub handles gracefully with "Initial release" notes |
| Concurrent tag pushes | GitHub Actions handles queue; each runs independently |
