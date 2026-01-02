# Quickstart: GitHub Release Workflow

**Feature**: 048-github-release-workflow
**Date**: 2026-01-02

## Overview

This guide explains how to use the automated release workflow for RAIC Overlay.

## Creating a Release

### Step 1: Ensure Code is Ready

Before creating a release:
1. All tests pass on `main` branch
2. All desired features are merged
3. Documentation is updated

### Step 2: Create and Push a Tag

```bash
# For a stable release
git tag 0.1.0
git push origin 0.1.0

# OR with 'v' prefix (both work)
git tag v0.1.0
git push origin v0.1.0

# For a pre-release (beta, RC, etc.)
git tag 0.2.0-beta.1
git push origin 0.2.0-beta.1
```

### Step 3: Monitor the Workflow

1. Go to **Actions** tab in GitHub
2. Find the running "Release" workflow
3. Wait for completion (~10-15 minutes)

### Step 4: Verify the Release

1. Go to **Releases** page
2. Find the new release with:
   - Correct version number
   - Auto-generated changelog
   - MSI installer attached
   - Pre-release badge (if applicable)

## Tag Naming Convention

| Format | Example | Result |
|--------|---------|--------|
| `MAJOR.MINOR.PATCH` | `0.1.0` | Stable release |
| `vMAJOR.MINOR.PATCH` | `v0.1.0` | Stable release |
| `*-alpha.*` | `0.2.0-alpha.1` | Pre-release |
| `*-beta.*` | `0.2.0-beta.1` | Pre-release |
| `*-rc.*` | `1.0.0-rc.1` | Pre-release |

## What the Workflow Does

1. **Extracts version** from the tag (strips `v` prefix if present)
2. **Updates version files**:
   - `tauri.conf.json`
   - `package.json`
   - `Cargo.toml`
3. **Builds the application**:
   - Frontend (Next.js)
   - Backend (Tauri/Rust)
   - MSI installer
4. **Creates GitHub release**:
   - Auto-generates changelog from commits
   - Marks as pre-release if tag contains hyphen
   - Uploads MSI as downloadable asset

## Troubleshooting

### Workflow Didn't Trigger

- Verify tag follows semver format (e.g., `1.0.0`, not `release-1`)
- Check tag was pushed to remote: `git ls-remote --tags origin`

### Build Failed

1. Check workflow logs in Actions tab
2. Common issues:
   - Rust compilation errors
   - Missing npm dependencies
   - Frontend build errors

### MSI Not Attached

1. Verify build step completed successfully
2. Check for errors in "Create Release" step
3. MSI path: `src-tauri/target/release/bundle/msi/*.msi`

### Wrong Version in Release

- Version is extracted from tag, not from files
- Ensure tag name matches desired version
- Leading `v` is automatically stripped

## Testing Locally

To test the build process locally before tagging:

```bash
# Build frontend
npm run build

# Build Tauri release
npm run tauri:build
```

The MSI will be generated at `src-tauri/target/release/bundle/msi/`.

## Deleting a Release

If you need to redo a release:

```bash
# Delete the remote tag
git push origin :refs/tags/0.1.0

# Delete local tag
git tag -d 0.1.0

# Delete the GitHub release via web UI

# Create new tag and push
git tag 0.1.0
git push origin 0.1.0
```
