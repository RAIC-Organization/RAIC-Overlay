# Tauri Commands Contract: Auto-Update System

**Feature Branch**: `049-auto-update`
**Date**: 2026-01-02

## Overview

This document defines the Tauri IPC command contracts between the Rust backend and TypeScript frontend for the auto-update system.

---

## Commands

### 1. `check_for_updates`

Check GitHub for new releases and return update information if available.

**Invocation**:
```typescript
invoke<UpdateCheckResult>('check_for_updates')
```

**Parameters**: None

**Returns**: `UpdateCheckResult`
```typescript
interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
}

interface UpdateInfo {
  version: string;           // "1.2.3" (no 'v' prefix)
  currentVersion: string;    // "1.1.0" (no 'v' prefix)
  downloadUrl: string;       // Direct MSI download URL
  downloadSize: number;      // Bytes
  releaseUrl: string;        // GitHub release page URL
}
```

**Error Cases**:
| Error | Description | Frontend Action |
|-------|-------------|-----------------|
| Network error | GitHub unreachable | Silent failure, return no update |
| Parse error | Invalid JSON response | Log warning, return no update |
| No releases | Repository has no releases | Return no update |

**Behavior**:
1. Fetch latest release from GitHub API
2. Skip if `prerelease` or `draft` is true
3. Compare `tag_name` with current version
4. Find MSI asset in `assets` array
5. Update `last_check_timestamp` in state
6. Return result

**Example**:
```typescript
const result = await invoke<UpdateCheckResult>('check_for_updates');
if (result.updateAvailable && result.updateInfo) {
  showUpdateNotification(result.updateInfo);
}
```

---

### 2. `download_update`

Download the MSI installer with progress reporting.

**Invocation**:
```typescript
invoke<string>('download_update', { url, onEvent })
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | MSI download URL from `UpdateInfo.downloadUrl` |
| `onEvent` | `Channel<DownloadEvent>` | Progress event channel |

**Returns**: `string` - Path to downloaded installer file

**Progress Events**:
```typescript
type DownloadEvent =
  | { event: 'started'; data: { contentLength: number | null } }
  | { event: 'progress'; data: { bytesDownloaded: number; totalBytes: number } }
  | { event: 'finished'; data: { installerPath: string } }
  | { event: 'error'; data: { message: string } };
```

**Error Cases**:
| Error | Description | Frontend Action |
|-------|-------------|-----------------|
| Network error | Download failed | Show retry dialog |
| Disk full | Cannot write file | Show error message |
| Invalid URL | Malformed download URL | Show error message |

**Behavior**:
1. Create downloads directory if needed
2. Send `started` event with content length
3. Stream download with `progress` events
4. Save to `{app_data}/downloads/RAIC-Overlay-{version}.msi`
5. Update `pending_installer_path` in state
6. Send `finished` event with path
7. Return path

**Example**:
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onEvent = new Channel<DownloadEvent>();
onEvent.onmessage = (event) => {
  switch (event.event) {
    case 'started':
      setTotalBytes(event.data.contentLength);
      break;
    case 'progress':
      setProgress(event.data.bytesDownloaded / event.data.totalBytes * 100);
      break;
    case 'finished':
      setInstallerPath(event.data.installerPath);
      break;
    case 'error':
      setError(event.data.message);
      break;
  }
};

const path = await invoke<string>('download_update', {
  url: updateInfo.downloadUrl,
  onEvent
});
```

---

### 3. `launch_installer_and_exit`

Launch the MSI installer and exit the application.

**Invocation**:
```typescript
invoke('launch_installer_and_exit', { installerPath })
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `installerPath` | `string` | Path from `download_update` result |

**Returns**: `void` (never returns - app exits)

**Error Cases**:
| Error | Description | Frontend Action |
|-------|-------------|-----------------|
| File not found | Installer deleted | Show error, offer re-download |
| Spawn failed | Cannot start msiexec | Show error message |

**Behavior**:
1. Spawn `msiexec /i {installerPath}` process
2. Wait 500ms for installer to start
3. Call `app.exit(0)`

**Example**:
```typescript
try {
  await invoke('launch_installer_and_exit', { installerPath });
  // This line is never reached - app exits
} catch (error) {
  // Handle spawn failure
  setError('Failed to launch installer');
}
```

---

### 4. `cleanup_old_installers`

Delete previously downloaded installer files.

**Invocation**:
```typescript
invoke('cleanup_old_installers')
```

**Parameters**: None

**Returns**: `void`

**Behavior**:
1. Read `pending_installer_path` from state
2. If file exists, delete it
3. Clear `pending_installer_path` in state
4. Delete any other `.msi` files in downloads directory

**Notes**:
- Called automatically on app startup
- Can be called manually to free disk space

---

### 5. `get_update_state`

Get current update state for debugging/display.

**Invocation**:
```typescript
invoke<UpdateState>('get_update_state')
```

**Parameters**: None

**Returns**: `UpdateState`
```typescript
interface UpdateState {
  lastCheckTimestamp: string | null;
  lastNotifiedVersion: string | null;
  pendingInstallerPath: string | null;
}
```

---

### 6. `dismiss_update`

Mark update as dismissed (Ask Again Later).

**Invocation**:
```typescript
invoke('dismiss_update', { version })
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `version` | `string` | Version being dismissed |

**Returns**: `void`

**Behavior**:
1. Update `last_notified_version` in state to the dismissed version
2. Save state

**Notes**:
- User will be re-prompted on next check (startup or 24h interval)
- Does not prevent checking - just closes the notification

---

## Command Registration

**lib.rs**:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    update::check_for_updates,
    update::download_update,
    update::launch_installer_and_exit,
    update::cleanup_old_installers,
    update::get_update_state,
    update::dismiss_update,
])
```

---

## Security Considerations

1. **URL Validation**: Only accept URLs from `api.github.com` or `github.com`
2. **Path Validation**: Installer path must be within app data directory
3. **No Arbitrary Execution**: Only execute `.msi` files via `msiexec`
