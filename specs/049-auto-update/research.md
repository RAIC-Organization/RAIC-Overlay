# Research: Auto-Update System

**Feature Branch**: `049-auto-update`
**Date**: 2026-01-02

## Overview

This document captures research findings for implementing the auto-update system. All technology decisions are documented with rationale and alternatives considered.

---

## 1. GitHub Releases API

### Decision
Use GitHub REST API `GET /repos/{owner}/{repo}/releases/latest` endpoint for checking new versions.

### Rationale
- Returns the most recent non-prerelease, non-draft release automatically
- No authentication required for public repositories
- Includes all necessary data: version tag, release assets (MSI download URLs), prerelease flag
- Simple single endpoint call instead of listing all releases and filtering

### API Details

**Endpoint**: `https://api.github.com/repos/{owner}/{repo}/releases/latest`

**Request Headers**:
```
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

**Key Response Fields**:
- `tag_name`: Version string (e.g., "v1.2.3" or "1.2.3")
- `prerelease`: Boolean - filter out if true
- `draft`: Boolean - filter out if true
- `assets`: Array of release assets with `name`, `browser_download_url`, `size`
- `published_at`: Timestamp for display/logging

**Rate Limits**: 60 requests/hour for unauthenticated requests (sufficient for startup + 24h interval)

**Error Handling**:
- 404: No releases exist yet - treat as "up to date"
- Network errors: Silent failure, continue normal operation

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| List all releases and filter | Unnecessary complexity, extra parsing |
| RSS/Atom feed | Less structured, harder to parse asset URLs |
| Custom update server | Over-engineering for a public GitHub repo |

### Sources
- [GitHub REST API - Releases](https://docs.github.com/en/rest/releases/releases)

---

## 2. HTTP Client (Rust)

### Decision
Use `reqwest` crate with async support for GitHub API calls and file downloads.

### Rationale
- De facto standard HTTP client for Rust async applications
- Built-in JSON deserialization with serde
- Streaming response support for large file downloads with progress
- Configurable timeouts (connect and request)
- TLS support out of the box

### Implementation Pattern

**GitHub API Request**:
```rust
use reqwest::Client;
use std::time::Duration;

let client = Client::builder()
    .timeout(Duration::from_secs(10))
    .connect_timeout(Duration::from_secs(5))
    .user_agent("RAIC-Overlay-Updater")
    .build()?;

let response = client
    .get("https://api.github.com/repos/owner/repo/releases/latest")
    .header("Accept", "application/vnd.github+json")
    .header("X-GitHub-Api-Version", "2022-11-28")
    .send()
    .await?;

if response.status().is_success() {
    let release: GitHubRelease = response.json().await?;
}
```

**File Download with Progress**:
```rust
let response = client.get(&download_url).send().await?;
let total_size = response.content_length();
let mut stream = response.bytes_stream();

while let Some(chunk) = stream.next().await {
    let chunk = chunk?;
    downloaded += chunk.len();
    // Report progress via Tauri channel
}
```

### Cargo.toml Addition
```toml
reqwest = { version = "0.12", features = ["json", "stream"] }
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| ureq (blocking) | Blocks Tauri async runtime, no streaming |
| hyper (low-level) | Too low-level, requires more boilerplate |
| surf | Less mature, smaller ecosystem |

### Sources
- [reqwest crate documentation](https://docs.rs/reqwest)
- [Reqwest GitHub repository](https://github.com/seanmonstar/reqwest)

---

## 3. Semantic Version Comparison

### Decision
Use `semver` crate (v1.x) for parsing and comparing version strings.

### Rationale
- Official Cargo-compatible semver implementation
- Handles version prefixes (strips "v" from "v1.2.3")
- Standard comparison operators via `PartialOrd`/`Ord` traits
- Handles pre-release versions correctly (1.0.0-beta < 1.0.0)

### Implementation Pattern

```rust
use semver::Version;

fn is_newer_version(current: &str, latest: &str) -> bool {
    // Strip 'v' prefix if present
    let current = current.trim_start_matches('v');
    let latest = latest.trim_start_matches('v');

    match (Version::parse(current), Version::parse(latest)) {
        (Ok(current_ver), Ok(latest_ver)) => latest_ver > current_ver,
        _ => false, // Parse error = treat as not newer
    }
}
```

### Cargo.toml Addition
```toml
semver = "1"
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| version-compare | More flexible but less strict semver adherence |
| Manual string parsing | Error-prone, doesn't handle edge cases |
| versions crate | Overkill for simple semver comparison |

### Sources
- [semver crate on crates.io](https://crates.io/crates/semver)
- [Rust Cookbook - Versioning](https://rust-lang-nursery.github.io/rust-cookbook/development_tools/versioning.html)

---

## 4. Download Progress Reporting

### Decision
Use Tauri IPC Channel for streaming download progress events to frontend.

### Rationale
- Native Tauri pattern for streaming data from Rust to JavaScript
- Type-safe event payloads with serde serialization
- Doesn't require global event listeners (scoped to invocation)
- Supports multiple concurrent operations with unique channels

### Implementation Pattern

**Rust Backend**:
```rust
use tauri::ipc::Channel;
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started { content_length: Option<u64> },
    #[serde(rename_all = "camelCase")]
    Progress { bytes_downloaded: u64, total_bytes: u64 },
    Finished,
    #[serde(rename_all = "camelCase")]
    Error { message: String },
}

#[tauri::command]
async fn download_update(
    url: String,
    on_event: Channel<DownloadEvent>,
) -> Result<String, String> {
    on_event.send(DownloadEvent::Started {
        content_length: Some(total_size)
    })?;

    // ... download loop ...
    on_event.send(DownloadEvent::Progress {
        bytes_downloaded,
        total_bytes
    })?;

    on_event.send(DownloadEvent::Finished)?;
    Ok(download_path)
}
```

**TypeScript Frontend**:
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

type DownloadEvent =
  | { event: 'started'; data: { contentLength: number | null } }
  | { event: 'progress'; data: { bytesDownloaded: number; totalBytes: number } }
  | { event: 'finished' }
  | { event: 'error'; data: { message: string } };

const onEvent = new Channel<DownloadEvent>();
onEvent.onmessage = (event) => {
  if (event.event === 'progress') {
    const percent = (event.data.bytesDownloaded / event.data.totalBytes) * 100;
    setProgress(percent);
  }
};

await invoke('download_update', { url, onEvent });
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Global events (app.emit) | No per-download scoping, requires manual cleanup |
| Polling from frontend | Inefficient, doesn't provide real-time updates |
| WebSocket | Overkill for single-direction streaming |

### Sources
- [Tauri Docs - Calling Frontend](https://tauri.app/develop/calling-frontend/)

---

## 5. MSI Installer Execution

### Decision
Use Rust `std::process::Command` to launch the MSI installer, then exit the application.

### Rationale
- Standard library - no additional dependencies
- Simple spawn-and-forget pattern for installer
- Process plugin provides `app.exit()` for clean shutdown

### Implementation Pattern

```rust
use std::process::Command;
use tauri::Manager;

#[tauri::command]
async fn launch_installer_and_exit(
    app: tauri::AppHandle,
    installer_path: String,
) -> Result<(), String> {
    // Spawn installer process (detached)
    Command::new("msiexec")
        .args(["/i", &installer_path])
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {}", e))?;

    // Give installer time to start
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    // Exit application
    app.exit(0);

    Ok(())
}
```

### Windows MSI Options
- `/i` - Install
- `/passive` - Unattended mode with progress bar (no user interaction)
- `/quiet` - Silent install (no UI at all)

For user visibility, we'll use default `/i` so users see the installer UI.

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Shell plugin execute | More complex, requires additional permissions |
| Direct Windows API | Unnecessary complexity for simple process spawn |
| tauri-plugin-shell | Requires additional capability configuration |

### Sources
- [Tauri Docs - Process Plugin](https://tauri.app/plugin/process/)
- [Microsoft MSI Documentation](https://docs.microsoft.com/en-us/windows/win32/msi/command-line-options)

---

## 6. Update State Persistence

### Decision
Use JSON file in Tauri app data directory, following existing persistence patterns.

### Rationale
- Consistent with existing `state.json` and `user-settings.json` patterns
- Simple atomic write pattern already implemented in codebase
- Human-readable for debugging

### Implementation Pattern

**File**: `{app_data_dir}/update-state.json`

```json
{
  "last_check_timestamp": "2026-01-02T10:30:00Z",
  "last_notified_version": "1.2.0",
  "pending_installer_path": null
}
```

**Rust Types**:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateState {
    pub last_check_timestamp: Option<String>,
    pub last_notified_version: Option<String>,
    pub pending_installer_path: Option<String>,
}
```

### Cleanup Logic
- On app startup, check `pending_installer_path`
- If exists, delete the file (FR-015: cleanup old installers)
- Clear `pending_installer_path` from state

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| SQLite | Overkill for 3 fields |
| Windows Registry | Platform-specific, harder to debug |
| User settings file | Separate concerns - update state != user preferences |

---

## 7. 24-Hour Check Interval

### Decision
Use JavaScript `setInterval` on frontend with backend check call.

### Rationale
- Frontend already handles app lifecycle
- Simple to implement with existing hook patterns
- Can be paused/resumed based on app state

### Implementation Pattern

```typescript
// useUpdateChecker.ts
useEffect(() => {
  // Check on mount
  checkForUpdates();

  // Check every 24 hours (86400000 ms)
  const interval = setInterval(checkForUpdates, 24 * 60 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Rust background thread | Harder to manage with Tauri lifecycle |
| System scheduler | External dependency, platform-specific |
| On-demand only | Misses updates for long-running sessions |

---

## Summary of Dependencies

### Rust (Cargo.toml additions)
```toml
reqwest = { version = "0.12", features = ["json", "stream"] }
semver = "1"
tokio-stream = "0.1"  # For bytes_stream()
```

### TypeScript (package.json additions)
```json
{
  "@tauri-apps/plugin-process": "^2.0.0"
}
```

### Tauri Plugins
```rust
// lib.rs - add to plugin chain
.plugin(tauri_plugin_process::init())
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| GitHub API rate limiting | 60 req/hr is sufficient; fallback to cached state |
| Network failures | Silent failure, continue with current version |
| Corrupted download | Verify file size matches Content-Length header |
| Installer launch failure | Show error message with manual download link |
| Version parse failure | Treat as "not newer", log warning |
