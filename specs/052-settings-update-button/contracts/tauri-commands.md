# Tauri Command Contracts

**Feature**: 052-settings-update-button
**Date**: 2026-01-03

## Overview

This feature uses existing Tauri commands only. No new commands are required.

---

## Commands Used

### check_for_updates

**Location**: `src-tauri/src/update/checker.rs`

**Signature**:
```rust
#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateCheckResult, String>
```

**Frontend Invocation**:
```typescript
const result = await invoke<UpdateCheckResult>('check_for_updates');
```

**Response Type**:
```typescript
interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}

interface UpdateInfo {
  version: string;
  currentVersion: string;
  downloadUrl: string;
  downloadSize: number;
  releaseUrl: string;
}
```

**Behavior**:
- Fetches latest release from GitHub API
- Compares with current app version
- If update available: populates `UpdateWindowState` and spawns async task to open update window
- Returns result indicating whether update was found

**Error Cases**:
- Network failure → Returns `Err("Failed to fetch releases: ...")`
- Parse error → Returns `Err("Failed to parse release: ...")`
- No valid releases → Returns `Ok({updateAvailable: false, updateInfo: null})`

---

### getVersion (Tauri API)

**Location**: `@tauri-apps/api/app`

**Signature**:
```typescript
function getVersion(): Promise<string>
```

**Frontend Invocation**:
```typescript
import { getVersion } from '@tauri-apps/api/app';
const version = await getVersion();
```

**Response**: Version string from `tauri.conf.json` (e.g., "0.2.0")

**Error Cases**:
- Should not fail in normal operation
- Catch with fallback: `"Unknown"`

---

## No New Commands Required

The existing `check_for_updates` command already:
1. Checks GitHub for updates
2. Opens the update window automatically if found
3. Returns result for UI feedback

The `UpdatesSection` component only needs to:
1. Call `check_for_updates`
2. Handle the response for inline status messages
3. Let the backend manage the update window
