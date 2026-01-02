# Data Model: Auto-Update System

**Feature Branch**: `049-auto-update`
**Date**: 2026-01-02

## Overview

This document defines the data structures for the auto-update system, including both Rust backend types and TypeScript frontend types.

---

## Entities

### 1. UpdateState (Persisted)

Tracks update check state across application sessions.

**Storage**: `{app_data_dir}/update-state.json`

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `last_check_timestamp` | `Option<String>` | ISO 8601 timestamp of last successful check | Valid ISO 8601 format |
| `last_notified_version` | `Option<String>` | Version string last shown to user | Semver format (with optional 'v' prefix) |
| `pending_installer_path` | `Option<String>` | Path to downloaded installer awaiting cleanup | Valid file path |

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateState {
    pub last_check_timestamp: Option<String>,
    pub last_notified_version: Option<String>,
    pub pending_installer_path: Option<String>,
}
```

**TypeScript Type**:
```typescript
interface UpdateState {
  lastCheckTimestamp: string | null;
  lastNotifiedVersion: string | null;
  pendingInstallerPath: string | null;
}
```

---

### 2. GitHubRelease (API Response)

Parsed response from GitHub Releases API.

**Source**: `GET /repos/{owner}/{repo}/releases/latest`

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `tag_name` | `String` | Version tag (e.g., "v1.2.3") | Non-empty, parseable as semver |
| `name` | `Option<String>` | Release title | Optional |
| `prerelease` | `bool` | Whether this is a pre-release | Must be false for stable |
| `draft` | `bool` | Whether this is a draft | Must be false for published |
| `published_at` | `String` | ISO 8601 publication timestamp | Valid ISO 8601 |
| `assets` | `Vec<ReleaseAsset>` | Attached files | At least one MSI asset |
| `html_url` | `String` | Link to release page | Valid URL |

**Rust Type**:
```rust
#[derive(Debug, Clone, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: Option<String>,
    pub prerelease: bool,
    pub draft: bool,
    pub published_at: String,
    pub assets: Vec<ReleaseAsset>,
    pub html_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ReleaseAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
    pub content_type: String,
}
```

---

### 3. UpdateInfo (Frontend State)

Information about an available update, passed to frontend for display.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `version` | `String` | New version number (without 'v' prefix) | Semver format |
| `current_version` | `String` | Currently installed version | Semver format |
| `download_url` | `String` | Direct URL to MSI installer | Valid HTTPS URL |
| `download_size` | `u64` | File size in bytes | > 0 |
| `release_url` | `String` | Link to GitHub release page | Valid HTTPS URL |

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub download_url: String,
    pub download_size: u64,
    pub release_url: String,
}
```

**TypeScript Type**:
```typescript
interface UpdateInfo {
  version: string;
  currentVersion: string;
  downloadUrl: string;
  downloadSize: number;
  releaseUrl: string;
}
```

---

### 4. DownloadProgress (Event Stream)

Progress events emitted during installer download.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `event` | `String` | Event type discriminator | One of: "started", "progress", "finished", "error" |
| `data` | `Object` | Event-specific payload | Varies by event type |

**Event Variants**:

1. **Started**
   - `content_length`: `Option<u64>` - Total bytes to download (null if unknown)

2. **Progress**
   - `bytes_downloaded`: `u64` - Bytes downloaded so far
   - `total_bytes`: `u64` - Total bytes expected

3. **Finished**
   - `installer_path`: `String` - Path to downloaded file

4. **Error**
   - `message`: `String` - Human-readable error message

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "camelCase")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        bytes_downloaded: u64,
        total_bytes: u64,
    },
    #[serde(rename_all = "camelCase")]
    Finished {
        installer_path: String,
    },
    #[serde(rename_all = "camelCase")]
    Error {
        message: String,
    },
}
```

**TypeScript Type**:
```typescript
type DownloadEvent =
  | { event: 'started'; data: { contentLength: number | null } }
  | { event: 'progress'; data: { bytesDownloaded: number; totalBytes: number } }
  | { event: 'finished'; data: { installerPath: string } }
  | { event: 'error'; data: { message: string } };
```

---

### 5. UpdateCheckResult (Command Response)

Result of checking for updates.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `update_available` | `bool` | Whether a newer version exists | - |
| `update_info` | `Option<UpdateInfo>` | Details if update available | Present if update_available is true |

**Rust Type**:
```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub update_available: bool,
    pub update_info: Option<UpdateInfo>,
}
```

**TypeScript Type**:
```typescript
interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}
```

---

## State Transitions

### Update Flow State Machine

```
                    ┌─────────────┐
                    │    Idle     │
                    └──────┬──────┘
                           │ check_for_updates()
                           ▼
                    ┌─────────────┐
                    │  Checking   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌──────────┐  ┌───────────┐  ┌──────────┐
      │ No Update│  │  Error    │  │ Update   │
      │ (Idle)   │  │ (Idle)    │  │ Available│
      └──────────┘  └───────────┘  └────┬─────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
             ┌───────────┐       ┌───────────┐       ┌───────────┐
             │  Accept   │       │  Later    │       │  Dismiss  │
             └─────┬─────┘       │  (Idle)   │       │  (Idle)   │
                   │             └───────────┘       └───────────┘
                   ▼
            ┌─────────────┐
            │ Downloading │──────┐
            └──────┬──────┘      │ Error
                   │             ▼
                   │      ┌───────────┐
                   │      │   Retry   │
                   │      │  Dialog   │
                   │      └───────────┘
                   ▼
            ┌─────────────┐
            │  Installing │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │  App Exit   │
            └─────────────┘
```

---

## File Storage

### Directory Structure

```
{app_data_dir}/
├── update-state.json      # Update check state
└── downloads/             # Temporary download directory
    └── RAIC-Overlay-{version}.msi  # Downloaded installer
```

### Cleanup Rules

1. On app startup:
   - Read `pending_installer_path` from `update-state.json`
   - If file exists, delete it
   - Clear `pending_installer_path` from state
   - Save updated state

2. On successful download:
   - Set `pending_installer_path` to downloaded file path
   - Save state before launching installer

---

## Validation Rules

### Version String
- Must be valid semver (major.minor.patch)
- Optional 'v' prefix is stripped before comparison
- Pre-release suffixes handled by semver crate

### MSI Asset Detection
- Asset `name` must end with `.msi`
- Asset `content_type` should be `application/x-msi` or `application/octet-stream`
- Prefer asset containing app name (e.g., "RAIC-Overlay")

### Timestamp Handling
- All timestamps in ISO 8601 format
- Use UTC timezone for consistency
- Compare as strings for 24-hour interval check
