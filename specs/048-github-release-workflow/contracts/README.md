# Contracts: GitHub Release Workflow

**Feature**: 048-github-release-workflow
**Date**: 2026-01-02

## Overview

This feature is a GitHub Actions workflow with no API contracts. The workflow interacts with:
1. GitHub Actions runtime environment
2. GitHub Releases API (via actions)
3. Local filesystem (version files)

## GitHub Actions Interface

### Trigger Contract

```yaml
on:
  push:
    tags:
      - 'v*.*.*'    # Matches v0.1.0, v1.2.3-beta.1, etc.
      - '*.*.*'     # Matches 0.1.0, 1.2.3-rc.1, etc.
```

### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `GITHUB_TOKEN` | `secrets.GITHUB_TOKEN` | Auto-provided; used for release creation |
| `GITHUB_REF_NAME` | GitHub context | The tag name (e.g., `v0.1.0`) |
| `GITHUB_REF_TYPE` | GitHub context | Always `tag` for this workflow |

### Workflow Outputs

The workflow produces the following outputs for potential downstream use:

| Output | Type | Description |
|--------|------|-------------|
| `version` | string | Extracted version number |
| `release_url` | string | URL to the created release |
| `upload_url` | string | URL for uploading additional assets |

## File Modification Contract

### Input Files (Read/Write)

| File | Operation | Field Modified |
|------|-----------|----------------|
| `src-tauri/tauri.conf.json` | Update | `version` |
| `package.json` | Update | `version` |
| `src-tauri/Cargo.toml` | Update | `[package].version` |

### Output Files (Generated)

| File | Location | Format |
|------|----------|--------|
| MSI Installer | `src-tauri/target/release/bundle/msi/*.msi` | Windows Installer |

## Release Asset Contract

### Asset Upload Specification

```yaml
files: |
  src-tauri/target/release/bundle/msi/*.msi
```

### Expected Asset Structure

| Attribute | Value |
|-----------|-------|
| Name | `RAIC_Overlay_{version}_x64_en-US.msi` |
| Content-Type | `application/x-msi` |
| Label | (optional) `Windows Installer` |

## No External API Contracts

This workflow uses standard GitHub Actions and does not require:
- External REST APIs
- GraphQL schemas
- WebSocket connections
- Custom authentication

All interactions are through official GitHub Actions which handle API communication internally.
